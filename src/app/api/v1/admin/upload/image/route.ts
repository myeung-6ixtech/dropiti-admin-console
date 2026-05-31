import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BFF_MISSING_ACCESS_TOKEN_CODE, getFunctionsBaseUrl } from "@/lib/nhost-functions";

const ACCESS_TOKEN_COOKIE = "nhost_access_token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin proxy upload: multipart form → raw bytes → Nhost POST /v1/admin/upload/image.
 * Avoids browser PUT to S3 (no bucket CORS for files ≤ PROXY_UPLOAD_MAX_BYTES).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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
            hint: "Sign in on the same origin (localhost vs 127.0.0.1) before uploading.",
          }),
        },
      },
      { status: 401 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid multipart body" }, { status: 400 });
  }

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await fileEntry.arrayBuffer());
  const mimeType = fileEntry.type || "application/octet-stream";

  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": mimeType,
    "X-Filename": encodeURIComponent(fileEntry.name),
  };

  const width = formData.get("width");
  const height = formData.get("height");
  const sha256 = formData.get("sha256");
  if (typeof width === "string" && width.trim()) headers["X-Width"] = width.trim();
  if (typeof height === "string" && height.trim()) headers["X-Height"] = height.trim();
  if (typeof sha256 === "string" && sha256.trim()) headers["X-Sha256"] = sha256.trim();

  const upstream = await fetch(`${base}/v1/admin/upload/image`, {
    method: "POST",
    headers,
    body: buffer,
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}
