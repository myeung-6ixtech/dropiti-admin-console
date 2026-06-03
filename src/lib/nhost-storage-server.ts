/**
 * Server-only Nhost Storage helpers (Route Handlers, not client bundles).
 */

import { getNhostStorageBaseUrl } from "@/lib/media-url";

const TRANSFORM_PARAMS = new Set(["w", "h", "f", "q", "blur"]);

function getHasuraGraphqlEndpoint(): string | null {
  const explicit = process.env.HASURA_ENDPOINT?.trim();
  if (explicit) return explicit;
  const sub = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN?.trim();
  const region = process.env.NEXT_PUBLIC_NHOST_REGION?.trim();
  if (sub && region) return `https://${sub}.hasura.${region}.nhost.run/v1/graphql`;
  return null;
}

/**
 * Query Hasura for the stored content_type of a media asset by its Nhost file UUID.
 * Used as a fallback when Nhost Storage returns `application/octet-stream` due to
 * missing or incorrect mime_type in storage.files (pre-raw-multipart-fix uploads).
 * Returns null if the lookup fails or no matching row is found.
 */
export async function lookupMediaContentType(fileId: string): Promise<string | null> {
  try {
    const endpoint = getHasuraGraphqlEndpoint();
    const secret = readHasuraAdminSecret();
    if (!endpoint || !secret) return null;

    const pattern = `%${fileId}%`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": secret,
      },
      body: JSON.stringify({
        query: `
          query LookupMediaContentType($pattern: String!) {
            real_estate_media_assets(
              where: {
                public_url: { _ilike: $pattern }
                deleted_at: { _is_null: true }
              }
              limit: 1
            ) {
              content_type
            }
          }
        `,
        variables: { pattern },
      }),
      cache: "no-store",
    });

    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { real_estate_media_assets?: { content_type?: string }[] };
    };
    const contentType =
      json.data?.real_estate_media_assets?.[0]?.content_type?.trim() ?? null;
    return contentType && contentType !== "application/octet-stream" ? contentType : null;
  } catch {
    return null;
  }
}

export function readHasuraAdminSecret(): string | null {
  const secret =
    process.env.HASURA_GRAPHQL_ADMIN_SECRET?.trim() ||
    process.env.HASURA_ADMIN_SECRET?.trim() ||
    process.env.NHOST_ADMIN_SECRET?.trim();
  return secret || null;
}

export function buildStorageFileUrl(fileId: string, transform?: URLSearchParams): string | null {
  const base = getNhostStorageBaseUrl();
  if (!base) return null;
  const qs = transform?.toString();
  return `${base}/files/${fileId}${qs ? `?${qs}` : ""}`;
}

export function pickStorageTransformParams(search: URLSearchParams): URLSearchParams {
  const transform = new URLSearchParams();
  for (const [key, value] of search.entries()) {
    if (TRANSFORM_PARAMS.has(key) && value.trim()) {
      transform.set(key, value.trim());
    }
  }
  return transform;
}

export type StorageFetchResult =
  | { ok: true; response: Response }
  | { ok: false; status: number; message: string };

/** Fetch file from Nhost Storage using Hasura admin secret (server-only). */
export async function fetchNhostStorageFileDirect(
  fileId: string,
  transform?: URLSearchParams
): Promise<StorageFetchResult> {
  const secret = readHasuraAdminSecret();
  const url = buildStorageFileUrl(fileId, transform);
  if (!secret || !url) {
    return {
      ok: false,
      status: 503,
      message: "Server storage credentials are not configured",
    };
  }

  const response = await fetch(url, {
    headers: { "x-hasura-admin-secret": secret },
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: `Storage download failed (HTTP ${response.status})`,
    };
  }

  return { ok: true, response };
}
