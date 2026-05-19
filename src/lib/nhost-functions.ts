/**
 * Nhost Functions client helpers.
 * Browser code uses the same-origin BFF (`/api/v1/bff/functions/...`) because
 * `nhost_access_token` is httpOnly. Server code can call Functions directly.
 */

export type FunctionsOk<T> = {
  ok: true;
  data: T;
};

export type FunctionsFail = {
  ok: false;
  error: string;
  details?: unknown;
};

export type FunctionsEnvelope<T> = FunctionsOk<T> | FunctionsFail;

export function getFunctionsBaseUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_FUNCTIONS_URL?.replace(/\/$/, "");
  return url && url.length > 0 ? url : null;
}

/** Same-origin BFF prefix for client components (forwards Bearer from httpOnly cookie). */
export const FUNCTIONS_BFF_PREFIX = "/api/v1/bff/functions";

/**
 * Build path under `/v1/admin/...` or `/v1/client/...` for the BFF proxy.
 */
export function functionsBffUrl(adminPath: string, search?: URLSearchParams): string {
  const path = adminPath.replace(/^\//, "");
  const qs = search?.toString();
  return `${FUNCTIONS_BFF_PREFIX}/${path}${qs ? `?${qs}` : ""}`;
}

const MAX_BODY_SNIPPET = 500;

function snippetForError(text: string, status: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return `Non-JSON response (HTTP ${status})`;
  if (t.length <= MAX_BODY_SNIPPET) return t;
  return `${t.slice(0, MAX_BODY_SNIPPET)}…`;
}

/**
 * Parse BFF / Nhost Functions JSON envelope, or surface plain-text / HTML error bodies
 * without throwing (e.g. upstream returns `item not found` instead of `{ ok: false, error }`).
 */
export async function parseFunctionsEnvelope<T>(
  res: Response
): Promise<{ data: T | null; error: string | null; status: number }> {
  const text = await res.text();
  const status = res.status;

  if (!text.trim()) {
    return {
      data: null,
      error: res.ok ? null : `Empty response (HTTP ${status})`,
      status,
    };
  }

  let json: unknown;
  try {
    json = JSON.parse(text) as unknown;
  } catch {
    return {
      data: null,
      error: snippetForError(text, status),
      status,
    };
  }

  const body = json as FunctionsEnvelope<T> | {
    success?: boolean;
    data?: T;
    error?: string;
    pagination?: unknown;
  };

  if (body && typeof body === "object" && "ok" in body && body.ok === true) {
    return { data: body.data as T, error: null, status };
  }

  if (body && typeof body === "object" && "ok" in body && body.ok === false) {
    return {
      data: null,
      error: typeof body.error === "string" ? body.error : "Request failed",
      status,
    };
  }

  // Legacy Next API shape during migration
  if (body && typeof body === "object" && "success" in body && body.success === true) {
    return { data: body.data as T, error: null, status };
  }

  const err =
    (body && typeof body === "object" && "error" in body && typeof body.error === "string"
      ? body.error
      : null) ?? "Request failed";
  return { data: null, error: err, status };
}
