import { isNhostMediaBackend } from "@/lib/upload-policy";

/** Nhost Storage file UUID in `/v1/files/{id}` URLs. */
const NHOST_FILE_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NHOST_STORAGE_URL_RE = /\.storage\.[^/]+\.nhost\.run\/v1\/files\//i;

/** Same-origin proxy — streams Nhost Storage with the admin session cookie. */
export const ADMIN_MEDIA_FILE_PROXY_PREFIX = "/api/v1/admin/media/file";

export function getNhostStorageBaseUrl(): string | null {
  const sub = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN?.trim();
  const region = process.env.NEXT_PUBLIC_NHOST_REGION?.trim();
  if (sub && region) {
    return `https://${sub}.storage.${region}.nhost.run/v1`;
  }
  return null;
}

export function isNhostStorageUrl(url: string): boolean {
  return NHOST_STORAGE_URL_RE.test(url);
}

export function extractNhostFileId(publicUrl: string): string | null {
  const trimmed = publicUrl.trim();
  const match = trimmed.match(/\/v1\/files\/([^/?#]+)/i);
  const id = match?.[1]?.trim();
  if (!id || !NHOST_FILE_ID_RE.test(id)) return null;
  return id;
}

export function isValidNhostFileId(fileId: string): boolean {
  return NHOST_FILE_ID_RE.test(fileId.trim());
}

/**
 * URL for `<Image src>` in the admin app.
 * Nhost Storage files in a private bucket need same-origin proxy + Bearer auth.
 * Canonical `public_url` is unchanged in Hasura (for dropiti-v3 / public CDN).
 */
export function getMediaDisplayUrl(publicUrl: string): string {
  if (!isNhostMediaBackend() || !isNhostStorageUrl(publicUrl)) {
    return publicUrl;
  }
  const fileId = extractNhostFileId(publicUrl);
  if (!fileId) return publicUrl;
  return `${ADMIN_MEDIA_FILE_PROXY_PREFIX}/${fileId}`;
}

export function buildAdminMediaFileProxyUrl(fileId: string): string {
  return `${ADMIN_MEDIA_FILE_PROXY_PREFIX}/${fileId}`;
}
