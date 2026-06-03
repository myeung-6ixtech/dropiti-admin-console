import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BFF_MISSING_ACCESS_TOKEN_CODE, getFunctionsBaseUrl } from "@/lib/nhost-functions";
import { isValidNhostFileId } from "@/lib/media-url";
import {
  fetchNhostStorageFileDirect,
  lookupMediaContentType,
  pickStorageTransformParams,
} from "@/lib/nhost-storage-server";

const ACCESS_TOKEN_COOKIE = "nhost_access_token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function storageResponseToNext(
  upstream: Response,
  meta?: { mode?: "direct" | "functions"; overrideContentType?: string }
): Promise<NextResponse> {
  const body = await upstream.arrayBuffer();
  const headers = new Headers();
  const contentType = meta?.overrideContentType ?? upstream.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const etag = upstream.headers.get("etag");
  if (etag) headers.set("ETag", etag);
  headers.set("Cache-Control", upstream.headers.get("cache-control") ?? "private, max-age=3600");
  if (meta?.mode) headers.set("X-Dropiti-Media-Proxy-Mode", meta.mode);
  return new NextResponse(body, { status: 200, headers });
}

/**
 * When storage returns `application/octet-stream`, fall back to the content_type
 * stored in real_estate_media_assets so the browser can render the image correctly.
 * This covers uploads made before the raw-multipart mime_type fix was deployed to cloud.
 */
async function resolveContentType(
  storageContentType: string | null,
  fileId: string
): Promise<string | undefined> {
  if (storageContentType && !storageContentType.includes("octet-stream")) {
    return undefined; // storage has a real type already — no override needed
  }
  const catalogType = await lookupMediaContentType(fileId);
  return catalogType ?? undefined;
}

async function fetchViaFunctions(
  fileId: string,
  transform: URLSearchParams,
  accessToken: string
): Promise<NextResponse> {
  const base = getFunctionsBaseUrl();
  if (!base) {
    return NextResponse.json(
      { ok: false, error: "NEXT_PUBLIC_FUNCTIONS_URL is not configured" },
      { status: 503 }
    );
  }

  const params = new URLSearchParams({ id: fileId });
  transform.forEach((value, key) => params.set(key, value));

  const upstream = await fetch(`${base}/v1/admin/media/get-file?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    let message = `Media download failed (HTTP ${upstream.status})`;
    try {
      const json = JSON.parse(text) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      /* binary or plain text */
    }
    return NextResponse.json(
      {
        ok: false,
        error: message,
        details: {
          mode: "functions",
          upstreamStatus: upstream.status,
        },
      },
      { status: upstream.status === 401 || upstream.status === 403 ? 403 : upstream.status }
    );
  }

  const overrideContentType = await resolveContentType(
    upstream.headers.get("content-type"),
    fileId
  );
  return storageResponseToNext(upstream, { mode: "functions", overrideContentType });
}

function sessionRequiredResponse(isDev: boolean): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: "Session required",
      details: {
        code: BFF_MISSING_ACCESS_TOKEN_CODE,
        ...(isDev && {
          hint: "Sign in, or set HASURA_GRAPHQL_ADMIN_SECRET (quoted) for direct Storage access.",
        }),
      },
    },
    { status: 401 }
  );
}

/**
 * Same-origin proxy for Nhost Storage thumbnails.
 * Tries direct Storage (admin secret) first, then Nhost Functions get-file with session JWT.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> }
): Promise<NextResponse> {
  const { fileId } = await context.params;
  const id = fileId?.trim();

  if (!id || !isValidNhostFileId(id)) {
    return NextResponse.json({ ok: false, error: "Invalid file id" }, { status: 400 });
  }

  const transform = pickStorageTransformParams(request.nextUrl.searchParams);
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const isDev = process.env.NODE_ENV !== "production";

  const direct = await fetchNhostStorageFileDirect(id, transform);
  if (direct.ok) {
    const overrideContentType = await resolveContentType(
      direct.response.headers.get("content-type"),
      id
    );
    return storageResponseToNext(direct.response, { mode: "direct", overrideContentType });
  }

  if (accessToken) {
    return fetchViaFunctions(id, transform, accessToken);
  }

  if (direct.status === 503) {
    return sessionRequiredResponse(isDev);
  }

  return NextResponse.json(
    {
      ok: false,
      error: direct.message,
      details: {
        mode: "direct",
        upstreamStatus: direct.status,
      },
    },
    { status: direct.status === 401 || direct.status === 403 ? 403 : direct.status }
  );
}
