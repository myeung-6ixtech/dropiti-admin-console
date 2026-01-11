"use client";
import React, { useState, useEffect, useCallback } from "react";
import Button from "@/components/ui/button/Button";
import { useDropzone } from "react-dropzone";
import { useToast } from "@/context/ToastContext";

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

export default function MediaLibrary() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const { showToast } = useToast();
  const limit = 50;

  const fetchAssets = useCallback(async (searchTerm: string = "", newOffset: number = 0) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/media-assets/list?limit=${limit}&offset=${newOffset}&search=${encodeURIComponent(searchTerm)}`
      );
      const data = await response.json();
      
      if (data.success) {
        setAssets(data.data);
        setTotal(data.meta.total);
        setOffset(newOffset);
      } else {
        showToast('error', data.error || 'Failed to load media assets');
      }
    } catch (error) {
      showToast('error', 'Failed to load media assets');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAssets(search, 0);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAssets(search, 0);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    let successCount = 0;
    
    for (const file of acceptedFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/v1/upload/image', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        
        if (data.success) {
          showToast('success', `Uploaded: ${file.name}`);
          successCount++;
        } else {
          showToast('error', `Failed to upload: ${file.name} - ${data.error}`);
        }
      } catch (error) {
        showToast('error', `Error uploading: ${file.name}`);
      }
    }
    
    setUploading(false);
    
    // Refresh list if any uploads succeeded
    if (successCount > 0) {
      fetchAssets(search, offset);
    }
  }, [showToast, search, offset, fetchAssets]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('success', 'Copied to clipboard');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Media Library
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage all uploaded images. Total: {total} assets
          </p>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-700 hover:border-blue-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-3">
          <div className="text-4xl">📁</div>
          <div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {uploading ? 'Uploading...' : isDragActive ? 'Drop files here' : 'Drag & drop images here'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              or click to browse (PNG, JPG, WebP, GIF • Max 10MB)
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by filename, URL, content type..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        />
        <Button type="submit">Search</Button>
        {search && (
          <Button
            type="button"
            onClick={() => {
              setSearch('');
              fetchAssets('', 0);
            }}
          >
            Clear
          </Button>
        )}
      </form>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : assets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No media assets found. Upload some images to get started!
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-blue-500 cursor-pointer transition-all"
              >
                <img
                  src={asset.public_url}
                  alt={asset.original_filename || 'Media asset'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <p className="text-white text-xs truncate w-full">
                    {asset.original_filename || asset.s3_key}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <Button
              disabled={offset === 0}
              onClick={() => fetchAssets(search, Math.max(0, offset - limit))}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Showing {offset + 1} - {Math.min(offset + limit, total)} of {total}
            </span>
            <Button
              disabled={offset + limit >= total}
              onClick={() => fetchAssets(search, offset + limit)}
            >
              Next
            </Button>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selectedAsset && (
        <div
          className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
          onClick={() => setSelectedAsset(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Asset Details
                </h3>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl leading-none"
                >
                  ✕
                </button>
              </div>

              <img
                src={selectedAsset.public_url}
                alt={selectedAsset.original_filename || 'Asset'}
                className="w-full rounded-lg"
              />

              <div className="space-y-3 text-sm">
                <div>
                  <strong className="text-gray-700 dark:text-gray-300">Filename:</strong>
                  <p className="text-gray-600 dark:text-gray-400">{selectedAsset.original_filename}</p>
                </div>
                <div>
                  <strong className="text-gray-700 dark:text-gray-300">URL:</strong>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                      {selectedAsset.public_url}
                    </code>
                    <Button onClick={() => copyToClipboard(selectedAsset.public_url)}>
                      Copy
                    </Button>
                  </div>
                </div>
                <div>
                  <strong className="text-gray-700 dark:text-gray-300">S3 Key:</strong>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                      {selectedAsset.s3_key}
                    </code>
                    <Button onClick={() => copyToClipboard(selectedAsset.s3_key)}>
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong className="text-gray-700 dark:text-gray-300">Size:</strong>
                    <p className="text-gray-600 dark:text-gray-400">{formatBytes(selectedAsset.size_bytes)}</p>
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
                  <code className="block px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs break-all">
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
