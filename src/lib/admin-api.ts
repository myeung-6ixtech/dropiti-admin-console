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
import {
  ADMIN_UPLOAD_PROXY_PATH,
  getProxyUploadMaxBytes,
  isNhostMediaBackend,
  isProxyEligibleSize,
} from "@/lib/upload-policy";

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
  publicUrl?: string;
  s3Key?: string;
  mediaId?: string | null;
};

async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function adminUploadImageProxy(
  file: File
): Promise<{ item: BatchUploadItem | null; error: string | null }> {
  const sha256 = await sha256Hex(file);
  const form = new FormData();
  form.append("file", file);
  form.append("sha256", sha256);

  const res = await fetch(ADMIN_UPLOAD_PROXY_PATH, {
    method: "POST",
    credentials: "include",
    body: form,
  });

  const parsed = await parseFunctionsEnvelope<{
    filename: string;
    publicUrl: string;
    s3Key: string;
    fileId: string;
    mediaId?: string | null;
  }>(res);

  if (parsed.error || !parsed.data) {
    return {
      item: null,
      error: parsed.error ?? `${file.name}: proxy upload failed`,
    };
  }

  return {
    item: {
      filename: parsed.data.filename ?? file.name,
      uploadUrl: "",
      fileId: parsed.data.fileId,
      publicUrl: parsed.data.publicUrl,
      s3Key: parsed.data.s3Key,
      mediaId: parsed.data.mediaId,
    },
    error: null,
  };
}

type PresignBatchItem = BatchUploadItem & {
  publicUrl: string;
  s3Key: string;
  useProxy?: boolean;
};

async function adminUploadImagesPresign(
  files: File[]
): Promise<{ uploaded: BatchUploadItem[]; error: string | null }> {
  const filesWithHash = await Promise.all(
    files.map(async (file) => ({
      file,
      sha256: await sha256Hex(file),
    }))
  );

  const result = await adminFetch<{ items: PresignBatchItem[] }>(adminRoutes.uploadBatch(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      filesWithHash.map(({ file, sha256 }) => ({
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        sha256,
      }))
    ),
  });

  if (result.error || !result.data?.items?.length) {
    return { uploaded: [], error: result.error ?? "Presign failed" };
  }

  const uploaded: BatchUploadItem[] = [];
  const errors: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const item = result.data.items[i];
    if (!item) continue;

    if (item.useProxy || !item.uploadUrl) {
      const proxyResult = await adminUploadImageProxy(file);
      if (proxyResult.item) uploaded.push(proxyResult.item);
      else if (proxyResult.error) errors.push(proxyResult.error);
      continue;
    }

    const putRes = await fetch(item.uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "application/octet-stream" },
    });

    if (!putRes.ok) {
      errors.push(`${file.name}: direct upload failed (${putRes.status})`);
      continue;
    }

    const sha256 = filesWithHash[i]?.sha256 ?? (await sha256Hex(file));
    const register = await adminFetch<{
      filename: string;
      publicUrl: string;
      s3Key: string;
      fileId: string;
      mediaId?: string | null;
    }>(adminRoutes.uploadRegister(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        s3Key: item.s3Key,
        publicUrl: item.publicUrl,
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        sha256,
      }),
    });

    if (register.error || !register.data) {
      errors.push(register.error ?? `${file.name}: register failed`);
      continue;
    }

    uploaded.push({
      filename: register.data.filename ?? file.name,
      uploadUrl: item.uploadUrl,
      fileId: register.data.fileId,
      publicUrl: register.data.publicUrl,
      s3Key: register.data.s3Key,
      mediaId: register.data.mediaId,
    });
  }

  return {
    uploaded,
    error: errors.length > 0 ? errors.join("; ") : uploaded.length > 0 ? null : "Upload failed",
  };
}

/**
 * Hybrid upload: proxy (same-origin) or presign + direct PUT (S3 only, > proxy cap).
 * With Nhost Storage (`NEXT_PUBLIC_MEDIA_STORAGE_BACKEND=nhost`), all files use proxy only.
 */
export async function adminUploadImages(
  files: File[]
): Promise<{ ok: boolean; uploaded: BatchUploadItem[]; error: string | null }> {
  if (files.length === 0) {
    return { ok: false, uploaded: [], error: "No files" };
  }

  const maxBytes = getProxyUploadMaxBytes();
  const nhostOnly = isNhostMediaBackend();

  const uploaded: BatchUploadItem[] = [];
  const errors: string[] = [];

  if (nhostOnly) {
    for (const file of files) {
      if (!isProxyEligibleSize(file.size)) {
        errors.push(`${file.name}: exceeds ${maxBytes} byte limit for Nhost proxy upload`);
        continue;
      }
      const result = await adminUploadImageProxy(file);
      if (result.item) uploaded.push(result.item);
      else if (result.error) errors.push(result.error);
    }

    return {
      ok: uploaded.length > 0,
      uploaded,
      error: errors.length > 0 ? errors.join("; ") : null,
    };
  }

  const proxyFiles: File[] = [];
  const presignFiles: File[] = [];
  for (const file of files) {
    if (isProxyEligibleSize(file.size)) {
      proxyFiles.push(file);
    } else {
      presignFiles.push(file);
    }
  }

  for (const file of proxyFiles) {
    const result = await adminUploadImageProxy(file);
    if (result.item) uploaded.push(result.item);
    else if (result.error) errors.push(result.error);
  }

  if (presignFiles.length > 0) {
    const presignResult = await adminUploadImagesPresign(presignFiles);
    uploaded.push(...presignResult.uploaded);
    if (presignResult.error) errors.push(presignResult.error);
  }

  return {
    ok: uploaded.length > 0,
    uploaded,
    error: errors.length > 0 ? errors.join("; ") : null,
  };
}
