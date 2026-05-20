/**
 * Single entry for admin Nhost Functions via same-origin BFF.
 * Path segments: use `adminRoutes` from `@/lib/admin-routes` (e.g. `adminRoutes.users()`).
 *
 * Flow: browser → `functionsBffUrl()` → `/api/v1/bff/functions/...` (reads httpOnly
 * `nhost_access_token`) → `{NEXT_PUBLIC_FUNCTIONS_URL}/v1/...` with Bearer.
 *
 * Spec: `dropiti-nhost/documentation/api-doc-v1.md` (v2.0 — auth §3, envelope §4, admin routes §11).
 */
import { adminRoutes } from "@/lib/admin-routes";
import {
  functionsBffUrl,
  parseFunctionsEnvelope,
} from "@/lib/nhost-functions";

export { functionsBffUrl, parseFunctionsEnvelope };

export type AdminPagination = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type AdminListResult<T> = {
  items: T[];
  pagination?: AdminPagination;
  has_more?: boolean;
  stub?: boolean;
};

type AdminFetchInit = RequestInit & {
  searchParams?: URLSearchParams | Record<string, string>;
};

export async function adminFetch<T = unknown>(
  pathSegment: string,
  init?: AdminFetchInit
): Promise<{ data: T | null; error: string | null; status: number; ok: boolean }> {
  const params =
    init?.searchParams instanceof URLSearchParams
      ? init.searchParams
      : init?.searchParams
        ? new URLSearchParams(init.searchParams)
        : undefined;
  const { searchParams: _sp, ...fetchInit } = init ?? {};
  const res = await fetch(functionsBffUrl(pathSegment, params), {
    credentials: "include",
    ...fetchInit,
  });
  const parsed = await parseFunctionsEnvelope<T>(res);
  return {
    data: parsed.data,
    error: parsed.error,
    status: parsed.status,
    ok: res.ok && !parsed.error,
  };
}

/** Unwrap `{ items, pagination }` or Airwallex `{ items, has_more }` from Functions `data`. */
export function unwrapList<T>(data: unknown): AdminListResult<T> {
  if (!data || typeof data !== "object") {
    return { items: [] };
  }
  const d = data as Record<string, unknown>;
  if (Array.isArray(d.items)) {
    return {
      items: d.items as T[],
      pagination: d.pagination as AdminPagination | undefined,
      has_more: typeof d.has_more === "boolean" ? d.has_more : undefined,
      stub: typeof d.stub === "boolean" ? d.stub : undefined,
    };
  }
  return { items: [] };
}

export async function adminList<T>(
  pathSegment: string,
  params?: Record<string, string>
): Promise<AdminListResult<T> & { error: string | null }> {
  const result = await adminFetch<unknown>(pathSegment, {
    searchParams: params,
  });
  if (result.error) {
    return { items: [], error: result.error };
  }
  return { ...unwrapList<T>(result.data), error: null };
}

/** Map Hasura `real_estate_user` row to legacy list shape. */
export function mapAppUser(row: Record<string, unknown>) {
  const profile = row.user_profile as { defaultRole?: string } | null | undefined;
  const name =
    (typeof row.display_name === "string" && row.display_name.trim()) ||
    [row.first_name, row.last_name].filter(Boolean).join(" ") ||
    null;
  return {
    id: String(row.nhost_user_id ?? row.uuid ?? ""),
    email: (row.email as string | null) ?? null,
    name,
    phone: (row.phone_number as string | null) ?? null,
    avatar: (row.photo_url as string | null) ?? null,
    address: (row.location as string | Record<string, unknown> | null) ?? null,
    status: profile?.defaultRole ?? null,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

/** Map property listing row to dashboard list card shape (AdminListProperties / v6 §8a). */
export function mapPropertyListing(row: Record<string, unknown>) {
  const currency =
    (typeof row.currency === "string" && row.currency) ||
    (row.rental_price_currency as string | undefined) ||
    "HKD";
  const imageUrl =
    (typeof row.primary_image === "string" && row.primary_image) ||
    (row.display_image as string | undefined);
  const images = Array.isArray(row.images)
    ? (row.images as string[])
    : Array.isArray(row.uploaded_images)
      ? (row.uploaded_images as string[])
      : undefined;
  const nBed =
    row.num_bedroom != null && row.num_bedroom !== ""
      ? Number(row.num_bedroom)
      : row.bedrooms != null && row.bedrooms !== ""
        ? Number(row.bedrooms)
        : NaN;
  const nBath =
    row.num_bathroom != null && row.num_bathroom !== ""
      ? Number(row.num_bathroom)
      : row.bathrooms != null && row.bathrooms !== ""
        ? Number(row.bathrooms)
        : NaN;

  return {
    id: String(row.id ?? ""),
    property_uuid: String(row.property_uuid ?? ""),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    price: Number(row.rental_price ?? 0),
    priceCurrency: currency,
    bedrooms: Number.isFinite(nBed) ? nBed : undefined,
    bathrooms: Number.isFinite(nBath) ? nBath : undefined,
    imageUrl,
    images,
    status: typeof row.status === "string" ? row.status : undefined,
    completionPercentage:
      row.completion_percentage != null && row.completion_percentage !== ""
        ? Number(row.completion_percentage)
        : undefined,
  };
}

/** Airwallex list pages expect `{ items, has_more }`. */
export function toAirwallexListResponse<T>(list: AdminListResult<T>) {
  return {
    items: list.items,
    has_more: list.has_more ?? list.pagination?.hasMore ?? false,
    stub: list.stub,
  };
}

type BatchUploadItem = {
  filename: string;
  uploadUrl: string;
  fileId: string;
};

/** Presign via admin/upload/batch then PUT each file to the presigned S3 URL from the response. */
export async function adminUploadImages(
  files: File[]
): Promise<{ ok: boolean; uploaded: BatchUploadItem[]; error: string | null }> {
  if (files.length === 0) {
    return { ok: false, uploaded: [], error: "No files" };
  }

  const result = await adminFetch<{ items: BatchUploadItem[] }>(adminRoutes.uploadBatch(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      files.map((file) => ({
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
      }))
    ),
  });

  if (result.error || !result.data?.items?.length) {
    return { ok: false, uploaded: [], error: result.error ?? "Presign failed" };
  }

  const uploaded: BatchUploadItem[] = [];
  for (let i = 0; i < files.length; i++) {
    const item = result.data.items[i];
    if (!item?.uploadUrl) continue;
    const putRes = await fetch(item.uploadUrl, {
      method: "PUT",
      body: files[i],
      headers: { "Content-Type": files[i].type || "application/octet-stream" },
    });
    if (putRes.ok) uploaded.push(item);
  }

  return {
    ok: uploaded.length > 0,
    uploaded,
    error: uploaded.length > 0 ? null : "Upload failed",
  };
}
