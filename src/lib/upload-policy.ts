/**
 * Upload policy — keep in sync with dropiti-nhost/functions/_lib/upload-policy.ts
 */

export const PROXY_UPLOAD_MAX_BYTES_S3 = 5 * 1024 * 1024;
export const PROXY_UPLOAD_MAX_BYTES_NHOST = 10 * 1024 * 1024;
export const DIRECT_PRESIGN_MAX_BYTES = 10 * 1024 * 1024;

/** Matches Nhost batch upload cap (functions/_lib/upload-policy.ts). */
export const MAX_BATCH_UPLOAD_FILES = 20;

/** Same-origin proxy route (multipart in, raw bytes forwarded to Nhost). */
export const ADMIN_UPLOAD_PROXY_PATH = "/api/v1/admin/upload/image";

/** Dropzone accept map — align with server ALLOWED_UPLOAD_MIME for images. */
export const DROPZONE_IMAGE_ACCEPT = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
} as const;

export function isNhostMediaBackend(): boolean {
  return process.env.NEXT_PUBLIC_MEDIA_STORAGE_BACKEND?.trim().toLowerCase() === "nhost";
}

/**
 * When `NEXT_PUBLIC_MEDIA_STORAGE_BACKEND=nhost`, proxy accepts up to 10 MB (no S3 CORS).
 * Otherwise S3 hybrid: 5 MB proxy, larger files use presigned PUT.
 */
export function getProxyUploadMaxBytes(): number {
  return isNhostMediaBackend() ? PROXY_UPLOAD_MAX_BYTES_NHOST : PROXY_UPLOAD_MAX_BYTES_S3;
}

export function isProxyEligibleSize(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= getProxyUploadMaxBytes();
}

export function formatMaxUploadSizeLabel(): string {
  const mb = getProxyUploadMaxBytes() / (1024 * 1024);
  return `${mb}MB`;
}
