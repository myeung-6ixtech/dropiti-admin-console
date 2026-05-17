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

export async function parseFunctionsEnvelope<T>(
  res: Response
): Promise<{ data: T | null; error: string | null; status: number }> {
  const json = (await res.json()) as FunctionsEnvelope<T> | {
    success?: boolean;
    data?: T;
    error?: string;
    pagination?: unknown;
  };

  if (json && typeof json === "object" && "ok" in json && json.ok === true) {
    return { data: json.data, error: null, status: res.status };
  }

  if (json && typeof json === "object" && "ok" in json && json.ok === false) {
    return { data: null, error: json.error, status: res.status };
  }

  // Legacy Next API shape during migration
  if (json && typeof json === "object" && "success" in json && json.success === true) {
    return { data: json.data as T, error: null, status: res.status };
  }

  const err =
    (json && typeof json === "object" && "error" in json && typeof json.error === "string"
      ? json.error
      : null) ?? "Request failed";
  return { data: null, error: err, status: res.status };
}
