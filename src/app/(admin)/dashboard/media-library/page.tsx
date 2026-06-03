"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Button from "@/components/ui/button/Button";
import { useDropzone } from "react-dropzone";
import { useToast } from "@/context/ToastContext";
import {
  DROPZONE_IMAGE_ACCEPT,
  formatMaxUploadSizeLabel,
  getProxyUploadMaxBytes,
  MAX_BATCH_UPLOAD_FILES,
} from "@/lib/upload-policy";
import {
  extractNhostFileId,
  getMediaDisplayUrl,
  isNhostStorageUrl,
  normalizeMediaAssetFields,
} from "@/lib/media-url";

interface MediaAsset {
  id: string;
  s3_bucket: string;
  s3_key: string;
  public_url: string;
  sha256: string;
  content_type: string;
  size_bytes: number;
  width?: number;
  height?: number;
  original_filename?: string;
  created_at: string;
  updated_at: string;
}

const PAGE_LIMIT = 50;

export default function MediaLibrary() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  /** Input field (does not trigger fetch until Search). */
  const [searchInput, setSearchInput] = useState("");
  /** Last term sent to the API (pagination / refresh). */
  const [appliedSearch, setAppliedSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const { showToast } = useToast();
  const imageErrorOnceRef = useRef<Set<string>>(new Set());

  const loadMediaAssets = useCallback(async (searchTerm: string, newOffset: number) => {
    try {
      setLoading(true);
      setError(null);
      const { adminList } = await import("@/lib/admin-api");
      const { adminRoutes } = await import("@/lib/admin-routes");
      const list = await adminList<MediaAsset>(adminRoutes.media(), {
        limit: String(PAGE_LIMIT),
        offset: String(newOffset),
        search: searchTerm,
      });

      if (list.error) {
        setError(list.error);
        setAssets([]);
        setTotal(0);
        return;
      }

      setAssets(list.items.map((item) => normalizeMediaAssetFields(item)));
      setTotal(list.pagination?.total ?? list.items.length);
      setOffset(newOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load media assets");
      setAssets([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMediaAssets("", 0);
  }, [loadMediaAssets]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchInput.trim();
    setAppliedSearch(term);
    void loadMediaAssets(term, 0);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setAppliedSearch("");
    void loadMediaAssets("", 0);
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setUploading(true);
      try {
        const { adminUploadImages } = await import("@/lib/admin-api");
        const upload = await adminUploadImages(acceptedFiles);

        if (upload.ok) {
          const summary =
            upload.messages.length > 0
              ? upload.messages.length === 1
                ? upload.messages[0]!
                : `Processed ${upload.uploaded.length} file(s): ${upload.messages.join("; ")}`
              : `Uploaded ${upload.uploaded.length} file(s)`;
          showToast("success", summary);
          if (upload.error) {
            showToast("warning", upload.error);
          }
          void loadMediaAssets(appliedSearch, offset);
        } else {
          showToast("error", upload.error ?? "Upload failed");
        }
      } catch (err) {
        showToast("error", err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [showToast, appliedSearch, offset, loadMediaAssets]
  );

  const maxUploadLabel = formatMaxUploadSizeLabel();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: DROPZONE_IMAGE_ACCEPT,
    maxFiles: MAX_BATCH_UPLOAD_FILES,
    maxSize: getProxyUploadMaxBytes(),
    disabled: uploading,
  });

  const handleImageError = useCallback((url?: string) => {
    const key = (url ?? "").trim() || "unknown";
    if (imageErrorOnceRef.current.has(key)) return;
    imageErrorOnceRef.current.add(key);

    const id = url ? extractNhostFileId(url) : null;
    showToast(
      "error",
      id
        ? `Image failed to load (fileId=${id}). The file may be missing in Nhost Storage — try re-uploading the same image to repair.`
        : "Image failed to load. Check Network for the image URL."
    );
  }, [showToast]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("success", "Copied to clipboard");
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Media Library</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage all uploaded images. Total: {total} assets
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-600 dark:text-red-400">Error: {error}</p>
          <button
            type="button"
            onClick={() => void loadMediaAssets(appliedSearch, offset)}
            className="mt-3 text-sm font-medium text-red-700 underline hover:no-underline dark:text-red-300"
          >
            Retry
          </button>
        </div>
      )}

      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-700 hover:border-blue-400"
        } ${uploading ? "pointer-events-none opacity-50" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-3">
          <div className="text-4xl">📁</div>
          <div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {uploading ? "Uploading..." : isDragActive ? "Drop files here" : "Drag & drop images here"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              or click to browse (PNG, JPG, WebP, GIF • Max {maxUploadLabel} • up to {MAX_BATCH_UPLOAD_FILES} files)
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by filename, URL, content type..."
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
        <Button type="submit">Search</Button>
        {(searchInput || appliedSearch) && (
          <Button type="button" onClick={handleClearSearch}>
            Clear
          </Button>
        )}
      </form>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : assets.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          {error
            ? "Could not load media assets."
            : "No media assets found. Upload some images to get started!"}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {assets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-gray-200 transition-all hover:border-blue-500 dark:border-gray-800"
              >
                <Image
                  src={getMediaDisplayUrl(asset)}
                  alt={asset.original_filename || "Media asset"}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  onError={() => handleImageError(asset.public_url)}
                />
                <div className="absolute inset-0 flex items-end bg-black/60 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="w-full truncate text-xs text-white">
                    {asset.original_filename || asset.s3_key}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Button
              disabled={offset === 0}
              onClick={() => void loadMediaAssets(appliedSearch, Math.max(0, offset - PAGE_LIMIT))}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Showing {offset + 1} - {Math.min(offset + PAGE_LIMIT, total)} of {total}
            </span>
            <Button
              disabled={offset + PAGE_LIMIT >= total}
              onClick={() => void loadMediaAssets(appliedSearch, offset + PAGE_LIMIT)}
            >
              Next
            </Button>
          </div>
        </>
      )}

      {selectedAsset && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedAsset(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4 p-6">
              <div className="flex items-start justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Asset Details</h3>
                <button
                  type="button"
                  onClick={() => setSelectedAsset(null)}
                  className="text-2xl leading-none text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="relative aspect-video w-full">
                <Image
                  src={getMediaDisplayUrl(selectedAsset)}
                  alt={selectedAsset.original_filename || "Asset"}
                  fill
                  unoptimized
                  className="rounded-lg object-contain"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  onError={() => handleImageError(selectedAsset.public_url)}
                />
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <strong className="text-gray-700 dark:text-gray-300">Filename:</strong>
                  <p className="text-gray-600 dark:text-gray-400">{selectedAsset.original_filename}</p>
                </div>
                {isNhostStorageUrl(selectedAsset.public_url) && extractNhostFileId(selectedAsset.public_url) && (
                  <div>
                    <strong className="text-gray-700 dark:text-gray-300">Nhost file ID:</strong>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 overflow-x-auto rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                        {extractNhostFileId(selectedAsset.public_url)}
                      </code>
                      <Button
                        onClick={() =>
                          copyToClipboard(extractNhostFileId(selectedAsset.public_url) ?? "")
                        }
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
                <div>
                  <strong className="text-gray-700 dark:text-gray-300">Public URL:</strong>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Canonical URL stored in Hasura (used by dropiti-v3 when bucket is public-read).
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 overflow-x-auto rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                      {selectedAsset.public_url}
                    </code>
                    <Button onClick={() => copyToClipboard(selectedAsset.public_url)}>Copy</Button>
                  </div>
                </div>
                <div>
                  <strong className="text-gray-700 dark:text-gray-300">Storage path:</strong>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Logical object key (not a browser URL).
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 overflow-x-auto rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                      {selectedAsset.s3_key}
                    </code>
                    <Button onClick={() => copyToClipboard(selectedAsset.s3_key)}>Copy</Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong className="text-gray-700 dark:text-gray-300">Size:</strong>
                    <p className="text-gray-600 dark:text-gray-400">
                      {formatBytes(selectedAsset.size_bytes)}
                    </p>
                  </div>
                  <div>
                    <strong className="text-gray-700 dark:text-gray-300">Dimensions:</strong>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedAsset.width} × {selectedAsset.height}
                    </p>
                  </div>
                  <div>
                    <strong className="text-gray-700 dark:text-gray-300">Type:</strong>
                    <p className="text-gray-600 dark:text-gray-400">{selectedAsset.content_type}</p>
                  </div>
                  <div>
                    <strong className="text-gray-700 dark:text-gray-300">Uploaded:</strong>
                    <p className="text-gray-600 dark:text-gray-400">
                      {new Date(selectedAsset.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div>
                  <strong className="text-gray-700 dark:text-gray-300">SHA256:</strong>
                  <code className="block break-all rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                    {selectedAsset.sha256}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
