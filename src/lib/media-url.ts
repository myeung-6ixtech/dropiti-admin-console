/** Nhost Storage file UUID in `/v1/files/{id}` URLs. */
const NHOST_FILE_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NHOST_STORAGE_URL_RE = /\.storage\.[^/]+\.nhost\.run\/v1\/files\//i;

const S3_PUBLIC_URL_RE =
  /(?:https?:\/\/)?(?:[^/]+\.)?(?:s3[.-][^/]+\.amazonaws\.com|[^/]+\.s3[^/]*\.amazonaws\.com)\//i;

/** Same-origin proxy — streams Nhost Storage with the admin session cookie. */
export const ADMIN_MEDIA_FILE_PROXY_PREFIX = "/api/v1/admin/media/file";

export type MediaAssetUrlFields = {
  public_url: string;
  s3_key?: string;
};

export function normalizeMediaUrl(url: string): string {
  return url.trim();
}

export function getNhostStorageBaseUrl(): string | null {
  const sub = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN?.trim();
  const region = process.env.NEXT_PUBLIC_NHOST_REGION?.trim();
  if (sub && region) {
    return `https://${sub}.storage.${region}.nhost.run/v1`;
  }
  return null;
}

export function isNhostStorageUrl(url: string): boolean {
  return NHOST_STORAGE_URL_RE.test(normalizeMediaUrl(url));
}

/** Legacy S3 / Lightsail public object URLs (hash path in URL). */
export function isS3MediaUrl(url: string): boolean {
  const normalized = normalizeMediaUrl(url);
  if (S3_PUBLIC_URL_RE.test(normalized)) return true;
  const domain = process.env.S3_BUCKET_DOMAIN_URL?.trim().replace(/\/$/, "");
  if (domain && normalized.startsWith(`${domain}/`)) return true;
  return false;
}

export function extractNhostFileId(publicUrl: string): string | null {
  const trimmed = normalizeMediaUrl(publicUrl);
  const match = trimmed.match(/\/v1\/files\/([^/?#]+)/i);
  const id = match?.[1]?.trim();
  if (!id || !NHOST_FILE_ID_RE.test(id)) return null;
  return id;
}

export function isValidNhostFileId(fileId: string): boolean {
  return NHOST_FILE_ID_RE.test(fileId.trim());
}

/** Trim stored URL fields when loading from Hasura (handles legacy trailing spaces). */
export function normalizeMediaAssetFields<T extends MediaAssetUrlFields>(asset: T): T {
  return {
    ...asset,
    public_url: normalizeMediaUrl(asset.public_url),
    ...(asset.s3_key !== undefined ? { s3_key: asset.s3_key.trim() } : {}),
  };
}

/**
 * URL for `<Image src>` in the admin app.
 *
 * | Stored URL                                  | Display URL                          |
 * |---------------------------------------------|--------------------------------------|
 * | Nhost `…/v1/files/{uuid}`                   | `/api/v1/admin/media/file/{uuid}`    |
 * | Legacy S3 public-read URL                   | same stored URL (direct)             |
 *
 * The hash path lives in `s3_key` for Nhost rows — never use `s3_key` as img src.
 * Use {@link getMediaCanonicalUrl} when persisting to Hasura or property galleries.
 */
export function getMediaDisplayUrl(input: string | MediaAssetUrlFields): string {
  const publicUrl = normalizeMediaUrl(
    typeof input === "string" ? input : input.public_url
  );

  if (isNhostStorageUrl(publicUrl)) {
    const fileId = extractNhostFileId(publicUrl);
    if (fileId) {
      return buildAdminMediaFileProxyUrl(fileId);
    }
    return publicUrl;
  }

  if (isS3MediaUrl(publicUrl)) {
    return publicUrl;
  }

  if (publicUrl.startsWith("https://") || publicUrl.startsWith("http://")) {
    return publicUrl;
  }

  return publicUrl;
}

/** Canonical URL stored in Hasura — use when saving to property galleries (not admin proxy). */
export function getMediaCanonicalUrl(input: string | MediaAssetUrlFields): string {
  return normalizeMediaUrl(typeof input === "string" ? input : input.public_url);
}

export function buildAdminMediaFileProxyUrl(fileId: string): string {
  return `${ADMIN_MEDIA_FILE_PROXY_PREFIX}/${fileId}`;
}
