/**
 * Same-origin upload proxy — v2 direct-to-storage architecture.
 *
 * Instead of forwarding raw bytes through the Nhost Function (which introduced
 * a readRawBody corruption layer), this route handles the full upload pipeline:
 *
 *   Browser → POST /api/v1/admin/upload/image (this route)
 *     1. Parse the browser multipart — reliable arrayBuffer() in Next.js App Router.
 *     2. SHA-256 dedup check via Hasura (admin secret).
 *     3. If new / repaired / migrated → POST raw multipart directly to Nhost Storage.
 *     4. Persist catalog row in real_estate_media_assets via Hasura.
 *     5. Return the same JSON envelope shape as the legacy Nhost Function.
 *
 * Why raw multipart instead of Web FormData + Blob?
 *   Explicit boundary construction guarantees the Content-Type header for the
 *   file part is on the wire.  hasura-storage ≥ 0.12.0 ignores it and detects
 *   MIME from file content anyway, but the raw approach also sidesteps any
 *   undici-version quirks around Blob.type forwarding.
 */
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getNhostStorageBaseUrl } from "@/lib/media-url";
import { readHasuraAdminSecret } from "@/lib/nhost-storage-server";
import { BFF_MISSING_ACCESS_TOKEN_CODE } from "@/lib/nhost-functions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Utilities ────────────────────────────────────────────────────────────────

function extensionFromMime(mimeType: string): string {
  const part = mimeType.split("/")[1]?.split(";")[0]?.trim();
  if (!part || part === "octet-stream") return "bin";
  return part.replace(/[^a-z0-9]/gi, "") || "bin";
}

function guessMimeFromFilename(filename: string): string | null {
  const l = filename.toLowerCase();
  if (l.endsWith(".jpg") || l.endsWith(".jpeg")) return "image/jpeg";
  if (l.endsWith(".png")) return "image/png";
  if (l.endsWith(".webp")) return "image/webp";
  if (l.endsWith(".gif")) return "image/gif";
  return null;
}

/** Server-side bucket for Nhost Storage uploads. Falls back to "default". */
function getNhostStorageBucket(): string {
  return process.env.NHOST_STORAGE_BUCKET?.trim() || "default";
}

function getHasuraEndpoint(): string | null {
  const explicit = process.env.HASURA_ENDPOINT?.trim();
  if (explicit) return explicit;
  const sub = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN?.trim();
  const region = process.env.NEXT_PUBLIC_NHOST_REGION?.trim();
  return sub && region ? `https://${sub}.hasura.${region}.nhost.run/v1/graphql` : null;
}

// ─── Thin Hasura client ───────────────────────────────────────────────────────

async function hasuraFetch<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<{ data?: T; errors?: { message: string }[] } | null> {
  const endpoint = getHasuraEndpoint();
  const secret = readHasuraAdminSecret();
  if (!endpoint || !secret) return null;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": secret,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<{ data?: T; errors?: { message: string }[] }>;
  } catch {
    return null;
  }
}

// ─── Dedup ────────────────────────────────────────────────────────────────────

type ExistingAsset = {
  id: string;
  public_url: string;
  s3_key: string;
  etag: string | null;
};

async function findBySha256(sha256: string): Promise<ExistingAsset | null> {
  const r = await hasuraFetch<{ real_estate_media_assets?: ExistingAsset[] }>(
    `query FindBySha256($sha256: String!) {
      real_estate_media_assets(
        where: { sha256: { _eq: $sha256 }, deleted_at: { _is_null: true } }
        limit: 1
      ) { id public_url s3_key etag }
    }`,
    { sha256 }
  );
  return r?.data?.real_estate_media_assets?.[0] ?? null;
}

// ─── Nhost Storage helpers ────────────────────────────────────────────────────

const NHOST_UUID_RE = /\/v1\/files\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
const NHOST_STORAGE_HOST_RE = /\.storage\.[^/]+\.nhost\.run\//i;

function extractNhostFileId(url: string): string | null {
  return url.match(NHOST_UUID_RE)?.[1] ?? null;
}

function isNhostStorageUrl(url: string): boolean {
  return NHOST_STORAGE_HOST_RE.test(url);
}

async function checkNhostFileExists(fileId: string, storageBase: string, adminSecret: string): Promise<boolean> {
  try {
    const res = await fetch(`${storageBase}/files/${fileId}`, {
      method: "HEAD",
      headers: { "x-hasura-admin-secret": adminSecret },
    });
    if (res.ok) return true;
    if (res.status === 404) return false;
    // Some storage versions return 200 only on GET
    const get = await fetch(`${storageBase}/files/${fileId}`, {
      method: "GET",
      headers: { "x-hasura-admin-secret": adminSecret },
    });
    return get.ok;
  } catch {
    return false;
  }
}

// ─── Storage upload ───────────────────────────────────────────────────────────

type StorageUploadResult = {
  fileId: string;
  etag?: string;
  mimeType: string;
  size: number;
};

/**
 * POST file bytes directly from this Next.js server to Nhost Storage.
 *
 * Uses manual multipart construction (same technique as the Nhost Function
 * `postMultipartToNhostStorage`) so the boundary, headers, and binary payload
 * are on the wire exactly as specified — no undici FormData serialisation quirks.
 *
 * hasura-storage ≥ 0.12.0 detects MIME type from the file content bytes
 * (CVE-2026-33221 patch), so the `Content-Type` on the file part is a hint
 * only.  What matters is that the bytes arriving here are uncorrupted, which
 * is guaranteed because they come from `fileEntry.arrayBuffer()` on the
 * Next.js App Router side — no Express `readRawBody` serialisation hop.
 */
async function uploadToNhostStorage(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  sha256: string,
  logicalPath: string,
  bucketId: string,
  storageBase: string,
  adminSecret: string,
): Promise<StorageUploadResult | null> {
  const metadata = JSON.stringify({
    name: logicalPath,
    metadata: { sha256, originalFilename: filename },
  });

  const ext = extensionFromMime(mimeType);
  const partFilename = /\.[a-z0-9]+$/i.test(filename)
    ? filename
    : `${filename}.${ext}`;

  // Raw multipart — avoids any undici Blob.type forwarding uncertainty.
  const boundary = `DropitiBoundary${createHash("sha256").update(sha256).digest("hex").slice(0, 24)}`;
  const CRLF = "\r\n";

  const preamble = Buffer.from(
    [
      `--${boundary}`,
      `Content-Disposition: form-data; name="bucket-id"`,
      ``,
      bucketId,
      `--${boundary}`,
      `Content-Disposition: form-data; name="metadata[]"`,
      ``,
      metadata,
      `--${boundary}`,
      `Content-Disposition: form-data; name="file[]"; filename="${partFilename}"`,
      `Content-Type: ${mimeType}`,
      ``,
      ``,
    ].join(CRLF),
    "utf8"
  );

  const epilogue = Buffer.from(`${CRLF}--${boundary}--${CRLF}`, "utf8");
  const rawBody = Buffer.concat([preamble, buffer, epilogue]);

  try {
    const res = await fetch(`${storageBase}/files`, {
      method: "POST",
      headers: {
        "x-hasura-admin-secret": adminSecret,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": String(rawBody.byteLength),
      },
      body: rawBody,
    });

    const text = await res.text();
    let json: {
      processedFiles?: Array<{
        id: string;
        etag?: string;
        mimeType?: string;
        size?: number;
      }>;
      error?: { message?: string };
    };
    try {
      json = JSON.parse(text) as typeof json;
    } catch {
      console.error("[upload/image] Storage response not JSON:", res.status, text.slice(0, 300));
      return null;
    }

    if (!res.ok) {
      console.error("[upload/image] Storage POST failed:", res.status, json.error?.message ?? text.slice(0, 200));
      return null;
    }

    const file = json.processedFiles?.[0];
    if (!file?.id) {
      console.error("[upload/image] Storage returned no processedFiles:", text.slice(0, 200));
      return null;
    }

    return {
      fileId: file.id,
      etag: file.etag,
      mimeType: file.mimeType ?? "application/octet-stream",
      size: file.size ?? buffer.byteLength,
    };
  } catch (err) {
    console.error("[upload/image] Storage fetch error:", err);
    return null;
  }
}

// ─── Catalog persistence ──────────────────────────────────────────────────────

type CatalogInput = {
  s3Bucket: string;
  s3Key: string;
  publicUrl: string;
  sha256: string;
  mimeType: string;
  sizeBytes: number;
  etag?: string | null;
  filename: string;
};

async function persistCatalog(
  existingId: string | undefined,
  data: CatalogInput
): Promise<{ id: string; publicUrl: string; s3Key: string } | null> {
  const vars: Record<string, unknown> = {
    s3_bucket: data.s3Bucket,
    s3_key: data.s3Key.trim(),
    public_url: data.publicUrl.trim(),
    sha256: data.sha256.trim(),
    etag: data.etag ?? null,
    content_type: data.mimeType,
    size_bytes: data.sizeBytes,
    width: null,
    height: null,
    original_filename: data.filename?.trim() || null,
  };

  if (existingId) {
    const r = await hasuraFetch<{
      update_real_estate_media_assets_by_pk?: {
        id: string;
        public_url: string;
        s3_key: string;
      } | null;
    }>(
      `mutation UpdateMedia(
        $id: uuid!, $s3_bucket: String!, $s3_key: String!, $public_url: String!,
        $sha256: String!, $etag: String, $content_type: String!, $size_bytes: Int!,
        $width: Int, $height: Int, $original_filename: String
      ) {
        update_real_estate_media_assets_by_pk(
          pk_columns: { id: $id }
          _set: {
            s3_bucket: $s3_bucket, s3_key: $s3_key, public_url: $public_url,
            sha256: $sha256, etag: $etag, content_type: $content_type,
            size_bytes: $size_bytes, width: $width, height: $height,
            original_filename: $original_filename
          }
        ) { id public_url s3_key }
      }`,
      { id: existingId, ...vars }
    );
    const row = r?.data?.update_real_estate_media_assets_by_pk;
    return row?.id ? { id: row.id, publicUrl: row.public_url, s3Key: row.s3_key } : null;
  }

  const r = await hasuraFetch<{
    insert_real_estate_media_assets_one?: {
      id: string;
      public_url: string;
      s3_key: string;
    } | null;
  }>(
    `mutation InsertMedia(
      $s3_bucket: String!, $s3_key: String!, $public_url: String!,
      $sha256: String!, $etag: String, $content_type: String!, $size_bytes: Int!,
      $width: Int, $height: Int, $original_filename: String
    ) {
      insert_real_estate_media_assets_one(
        object: {
          s3_bucket: $s3_bucket, s3_key: $s3_key, public_url: $public_url,
          sha256: $sha256, etag: $etag, content_type: $content_type,
          size_bytes: $size_bytes, width: $width, height: $height,
          original_filename: $original_filename
        }
      ) { id public_url s3_key }
    }`,
    vars
  );
  const row = r?.data?.insert_real_estate_media_assets_one;
  return row?.id ? { id: row.id, publicUrl: row.public_url, s3Key: row.s3_key } : null;
}

// ─── Route handler ────────────────────────────────────────────────────────────

const ACCESS_TOKEN_COOKIE = "nhost_access_token";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Session guard.
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json(
      {
        ok: false,
        error: "Session required",
        details: {
          code: BFF_MISSING_ACCESS_TOKEN_CODE,
          ...(process.env.NODE_ENV !== "production" && {
            hint: "Sign in on the same origin before uploading.",
          }),
        },
      },
      { status: 401 }
    );
  }

  // 2. Verify server-side Nhost Storage is configured.
  const storageBase = getNhostStorageBaseUrl();
  const adminSecret = readHasuraAdminSecret();
  if (!storageBase || !adminSecret) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Nhost Storage is not configured — set NEXT_PUBLIC_NHOST_SUBDOMAIN, NEXT_PUBLIC_NHOST_REGION, and HASURA_GRAPHQL_ADMIN_SECRET",
      },
      { status: 503 }
    );
  }

  // 3. Parse multipart sent by the browser.
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
  if (buffer.length === 0) {
    return NextResponse.json({ ok: false, error: "Empty file" }, { status: 400 });
  }

  const filename = fileEntry.name?.trim() || "upload";
  const mimeType =
    fileEntry.type?.trim() ||
    guessMimeFromFilename(filename) ||
    "application/octet-stream";

  // sha256 is pre-computed in the browser by adminUploadImageProxy; fall back
  // to computing it server-side so dedup always has a hash to work with.
  const clientSha256 =
    typeof formData.get("sha256") === "string"
      ? (formData.get("sha256") as string).trim()
      : "";
  const sha256 = clientSha256 || createHash("sha256").update(buffer).digest("hex");

  const bucketId = getNhostStorageBucket();
  const ext = extensionFromMime(mimeType);
  const logicalPath = `uploads/by-hash/${sha256}.${ext}`;

  // 4. SHA-256 deduplication check.
  const existing = await findBySha256(sha256);

  if (existing) {
    const nhostFileId = isNhostStorageUrl(existing.public_url)
      ? extractNhostFileId(existing.public_url)
      : null;

    if (nhostFileId) {
      const exists = await checkNhostFileExists(nhostFileId, storageBase, adminSecret);
      if (exists) {
        return NextResponse.json({
          ok: true,
          data: {
            filename,
            publicUrl: existing.public_url,
            s3Key: existing.s3_key,
            fileId: nhostFileId,
            storageFileId: nhostFileId,
            sha256,
            mediaId: existing.id,
            deduped: true,
            repaired: false,
            migrated: false,
            storageBackend: "nhost",
          },
        });
      }
      // Nhost URL in DB but Storage file gone → re-upload (repaired).
    }
    // Legacy S3 URL in DB → upload to Nhost (migrated).
  }

  // 5. Upload directly from this server to Nhost Storage.
  const uploaded = await uploadToNhostStorage(
    buffer,
    filename,
    mimeType,
    sha256,
    logicalPath,
    bucketId,
    storageBase,
    adminSecret
  );

  if (!uploaded) {
    return NextResponse.json({ ok: false, error: "Storage upload failed" }, { status: 502 });
  }

  const publicUrl = `${storageBase}/files/${uploaded.fileId}`;
  const wasRepaired = existing !== null && isNhostStorageUrl(existing.public_url);
  const wasMigrated = existing !== null && !isNhostStorageUrl(existing.public_url);

  // 6. Persist / update catalog entry in real_estate_media_assets.
  //    Use the mimeType detected by hasura-storage from file content — this is
  //    authoritative (≥ v0.12.0) and will be image/jpeg for valid JPEG bytes.
  const catalog = await persistCatalog(existing?.id, {
    s3Bucket: bucketId,
    s3Key: logicalPath,
    publicUrl,
    sha256,
    mimeType: uploaded.mimeType,
    sizeBytes: uploaded.size,
    etag: uploaded.etag,
    filename,
  });

  if (!catalog) {
    return NextResponse.json(
      { ok: false, error: "Failed to save media catalog" },
      { status: 502 }
    );
  }

  // 7. Return the same response envelope as the legacy Nhost Function.
  return NextResponse.json({
    ok: true,
    data: {
      filename,
      publicUrl: catalog.publicUrl,
      s3Key: catalog.s3Key,
      fileId: uploaded.fileId,
      storageFileId: uploaded.fileId,
      sha256,
      mediaId: catalog.id,
      deduped: false,
      repaired: wasRepaired,
      migrated: wasMigrated,
      storageBackend: "nhost",
    },
  });
}
