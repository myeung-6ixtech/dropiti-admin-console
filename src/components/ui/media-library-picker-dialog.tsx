"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

interface MediaAsset {
  id: string;
  s3_bucket: string;
  s3_key: string;
  public_url: string;
  sha256: string;
  etag?: string;
  content_type: string;
  size_bytes: number;
  width?: number;
  height?: number;
  original_filename?: string;
  created_at: string;
  updated_at: string;
}

interface MediaLibraryPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (selectedUrls: string[]) => void;
  title?: string;
  description?: string;
  initialSearch?: string;
  pageSize?: number;
  maxSelect?: number;
  allowUpload?: boolean;
}

export function MediaLibraryPickerDialog({
  open,
  onOpenChange,
  onSelect,
  title = "Choose from Media Library",
  description = "Upload new images or select from existing ones. Selected images will be added to your gallery.",
  initialSearch = "",
  pageSize = 50,
  maxSelect,
  allowUpload = true,
}: MediaLibraryPickerDialogProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setOffset(0); // Reset pagination on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch assets
  const fetchAssets = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: currentOffset.toString(),
      });
      
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      const response = await fetch(`/api/v1/media-assets/list?${params}`);
      const data = await response.json();

      if (data.success) {
        if (reset) {
          setAssets(data.data);
        } else {
          setAssets((prev) => [...prev, ...data.data]);
        }
        setTotal(data.meta.total);
        setHasMore(data.meta.hasMore);
      }
    } catch (error) {
      console.error('Error fetching media assets:', error);
    } finally {
      setLoading(false);
    }
  }, [offset, pageSize, debouncedSearch]);

  // Load assets when dialog opens or search changes
  useEffect(() => {
    if (open) {
      fetchAssets(true);
    }
  }, [open, debouncedSearch, fetchAssets]);

  // Load more handler
  const handleLoadMore = () => {
    setOffset((prev) => prev + pageSize);
  };

  // Load more when offset changes (but not on initial load)
  useEffect(() => {
    if (offset > 0) {
      fetchAssets(false);
    }
  }, [offset, fetchAssets]);

  // File upload handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    
    try {
      const uploadPromises = acceptedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/v1/upload/image', {
          method: 'POST',
          body: formData,
        });

        return response.json();
      });

      await Promise.all(uploadPromises);
      
      // Refresh the list after upload
      await fetchAssets(true);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  }, [fetchAssets]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: !allowUpload || uploading,
  });

  // Toggle selection
  const toggleSelection = (asset: MediaAsset) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(asset.id)) {
        next.delete(asset.id);
      } else {
        if (maxSelect && next.size >= maxSelect) {
          return prev; // Don't add if max reached
        }
        next.add(asset.id);
      }
      return next;
    });
  };

  // Confirm selection
  const handleConfirm = () => {
    const selectedAssets = assets.filter((a) => selectedIds.has(a.id));
    const urls = selectedAssets.map((a) => a.public_url);
    onSelect(urls);
    setSelectedIds(new Set()); // Clear selection
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by filename, type, or hash..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Upload dropzone */}
          {allowUpload && (
            <div
              {...getRootProps()}
              className={`mt-4 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <p className="text-gray-600 dark:text-gray-400">Uploading...</p>
              ) : isDragActive ? (
                <p className="text-blue-600 dark:text-blue-400">Drop the files here...</p>
              ) : (
                <div>
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Drag and drop images here, or click to select files
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    JPEG, PNG, WebP, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && assets.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No images found</p>
              {allowUpload && (
                <p className="text-sm mt-2">Upload some images to get started</p>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {assets.map((asset) => {
                  const isSelected = selectedIds.has(asset.id);
                  const canSelect = !maxSelect || selectedIds.size < maxSelect || isSelected;
                  
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => canSelect && toggleSelection(asset)}
                      disabled={!canSelect}
                      className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      } ${!canSelect ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <Image
                        src={asset.public_url}
                        alt={asset.original_filename || 'Media asset'}
                        fill
                        className="object-cover"
                      />
                      
                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <div className="bg-blue-500 text-white rounded-full p-1">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* Image info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 opacity-0 hover:opacity-100 transition-opacity">
                        <p className="truncate">{asset.original_filename || asset.s3_key}</p>
                        {asset.width && asset.height && (
                          <p className="text-gray-300">{asset.width} × {asset.height}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    type="button"
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedIds.size} selected{maxSelect && ` (max: ${maxSelect})`}
            {' · '}
            {total} total images
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onOpenChange(false)}
              type="button"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              type="button"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Selected ({selectedIds.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
