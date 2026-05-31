import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BFF_MISSING_ACCESS_TOKEN_CODE, getFunctionsBaseUrl } from "@/lib/nhost-functions";
import { isValidNhostFileId } from "@/lib/media-url";

const ACCESS_TOKEN_COOKIE = "nhost_access_token";

/** Nhost image transform query params — forwarded to Storage via Functions. */
const TRANSFORM_PARAMS = new Set(["w", "h", "f", "q", "blur"]);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy for Nhost Storage file download.
 * Forwards to Nhost Functions (admin JWT + server-side Storage admin secret).
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

  const base = getFunctionsBaseUrl();
  if (!base) {
    return NextResponse.json(
      { ok: false, error: "NEXT_PUBLIC_FUNCTIONS_URL is not configured" },
      { status: 503 }
    );
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    const isDev = process.env.NODE_ENV !== "production";
    return NextResponse.json(
      {
        ok: false,
        error: "Session required",
        details: {
          code: BFF_MISSING_ACCESS_TOKEN_CODE,
          ...(isDev && {
            hint: "Sign in on the same origin before viewing media.",
          }),
        },
      },
      { status: 401 }
    );
  }

  const transform = new URLSearchParams({ id });
  for (const [key, value] of request.nextUrl.searchParams.entries()) {
    if (TRANSFORM_PARAMS.has(key) && value.trim()) {
      transform.set(key, value.trim());
    }
  }

  const upstreamUrl = `${base}/v1/admin/media/file?${transform.toString()}`;
  const upstream = await fetch(upstreamUrl, {
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
      /* plain body */
    }
    return NextResponse.json(
      { ok: false, error: message },
      { status: upstream.status === 401 || upstream.status === 403 ? 403 : upstream.status }
    );
  }

  const body = await upstream.arrayBuffer();
  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const etag = upstream.headers.get("etag");
  if (etag) headers.set("ETag", etag);
  headers.set("Cache-Control", upstream.headers.get("cache-control") ?? "private, max-age=3600");

  return new NextResponse(body, { status: 200, headers });
}
