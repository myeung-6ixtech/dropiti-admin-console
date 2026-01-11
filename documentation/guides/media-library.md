# Media Library System Documentation

## Overview

The Media Library system provides a unified, commercially-viable solution for managing image assets across the application. It prevents duplicate uploads through content-addressable storage (SHA256-based deduplication), provides a centralized media catalog, and enables reuse of images without re-uploading.

### Key Features

- **Content-Addressable Storage**: Images are stored in S3 using SHA256 hashes as keys (`uploads/by-hash/{sha256}.{ext}`), preventing duplicates
- **Automatic Deduplication**: If an image with the same hash already exists in S3, the upload is skipped and the existing URL is returned
- **Media Asset Catalog**: All uploaded images are tracked in the `media_assets` Hasura table for efficient querying
- **Redis Caching**: List queries are cached with tag-based invalidation for fast refresh after uploads
- **Image Optimization**: Automatic WebP conversion and resizing (max 1600x1600px) for JPEG/PNG images
- **Reusable Components**: Two main components for different use cases:
  - `ImageUploadDnd`: Drag-and-drop upload with reordering and featured image selection
  - `MediaLibraryPickerDialog`: Modal picker for selecting existing media assets

---

## Database Schema

### `media_assets` Table

The `media_assets` table catalogs all uploaded images in Hasura:

```sql
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  s3_bucket TEXT NOT NULL,
  s3_key TEXT NOT NULL,
  public_url TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  etag TEXT,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  original_filename TEXT,
  uploaded_by_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

**Important Notes:**
- The table must be **tracked in Hasura** for GraphQL queries to work
- `sha256` is used for deduplication (content-addressable storage)
- `deleted_at` is used for soft deletes (filtered out in list queries)

---

## API Routes

### 1. List Media Assets

**Endpoint:** `GET /api/v1/media-assets/list`

**Query Parameters:**
- `limit` (optional, default: 50, max: 100): Number of items per page
- `offset` (optional, default: 0): Pagination offset
- `search` (optional): Search term (searches filename, S3 key, URL, content type, SHA256)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "s3_bucket": "bucket-name",
      "s3_key": "uploads/by-hash/abc123.webp",
      "public_url": "https://bucket.s3.region.amazonaws.com/uploads/by-hash/abc123.webp",
      "sha256": "abc123...",
      "etag": "...",
      "content_type": "image/webp",
      "size_bytes": 123456,
      "width": 1600,
      "height": 1200,
      "original_filename": "photo.jpg",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true,
    "fetchedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Caching:**
- Cached for 60 seconds with tag `media_assets:list`
- Automatically invalidated when new images are uploaded

**Example:**
```typescript
const response = await fetch('/api/v1/media-assets/list?limit=50&offset=0&search=photo');
const data = await response.json();
```

---

### 2. Get Media Asset by ID

**Endpoint:** `GET /api/v1/media-assets/get`

**Query Parameters:**
- `id` (required): UUID of the media asset

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "s3_bucket": "bucket-name",
    "s3_key": "uploads/by-hash/abc123.webp",
    "public_url": "https://bucket.s3.region.amazonaws.com/uploads/by-hash/abc123.webp",
    "sha256": "abc123...",
    "etag": "...",
    "content_type": "image/webp",
    "size_bytes": 123456,
    "width": 1600,
    "height": 1200,
    "original_filename": "photo.jpg",
    "uploaded_by_user_id": "uuid",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "deleted_at": null
  }
}
```

**Caching:**
- Cached for 300 seconds (5 minutes)

**Example:**
```typescript
const response = await fetch('/api/v1/media-assets/get?id=uuid-here');
const data = await response.json();
```

---

### 3. Upload Image

**Endpoint:** `POST /api/v1/upload/image`

**Request:**
- Content-Type: `multipart/form-data`
- Body: FormData with `file` field

**Supported Formats:**
- JPEG, PNG, WebP, GIF
- Max file size: 10MB

**Processing:**
- JPEG/PNG/WebP are automatically converted to WebP
- Images are resized to max 1600x1600px (maintains aspect ratio)
- Animated GIFs are preserved as-is
- SHA256 hash is computed from the processed image

**Response:**
```json
{
  "success": true,
  "fileUrl": "https://bucket.s3.region.amazonaws.com/uploads/by-hash/abc123.webp",
  "filePath": "uploads/by-hash/abc123.webp",
  "sha256": "abc123...",
  "message": "File uploaded successfully" // or "File already exists (deduped)"
}
```

**Deduplication:**
- Before uploading, checks if an object with the same SHA256 key exists in S3
- If exists, skips upload and returns existing URL
- Always records metadata in `media_assets` table (upsert if needed)

**Cache Invalidation:**
- Automatically invalidates `media_assets:list` cache tag after upload

**Example:**
```typescript
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/v1/upload/image', {
  method: 'POST',
  body: formData,
});
const data = await response.json();
```

---

## Components

### 1. `ImageUploadDnd`

A reusable component for drag-and-drop image uploads with reordering and featured image selection.

**Location:** `src/components/ui/image-upload-dnd.tsx`

**Props:**
```typescript
interface ImageUploadDndProps {
  images: string[];                    // Array of S3 URLs (existing images)
  onImagesChange: (images: string[]) => void;  // Callback when images change
  onFilesChange?: (files: File[]) => void;     // Callback when files are added (optional)
  featuredImageUrl?: string;           // Currently featured image URL
  onFeaturedImageChange?: (url: string | null) => void;  // Callback when featured changes
  maxImages?: number;                  // Maximum number of images (default: 20)
  disabled?: boolean;                  // Disable interactions
  hideDropzone?: boolean;               // Hide upload dropzone (show only reorder grid)
}
```

**Features:**
- Drag-and-drop file upload
- Drag-to-reorder images
- Featured image selection (star icon)
- Remove images
- Supports both blob URLs (local previews) and S3 URLs
- Automatically reconciles when parent `images` prop changes

**Usage Example:**
```tsx
import { ImageUploadDnd } from "@/components/ui/image-upload-dnd";

function MyComponent() {
  const [images, setImages] = useState<string[]>([]);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);

  return (
    <ImageUploadDnd
      images={images}
      onImagesChange={setImages}
      featuredImageUrl={featuredImage}
      onFeaturedImageChange={setFeaturedImage}
      maxImages={20}
      hideDropzone={false}  // Set to true to hide upload UI
    />
  );
}
```

**When to Use:**
- Restaurant create/edit pages (with `hideDropzone={true}` - upload happens in modal)
- Any form that needs image upload with reordering
- When you need featured image selection

---

### 2. `MediaLibraryPickerDialog`

A modal dialog for selecting existing media assets from the library. Includes upload functionality and search.

**Location:** `src/components/ui/media-library-picker-dialog.tsx`

**Props:**
```typescript
interface MediaLibraryPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (selectedUrls: string[]) => void;  // Returns array of public_url strings
  title?: string;                              // Default: "Choose from Media Library"
  description?: string;                        // Default: "Upload here, then select..."
  initialSearch?: string;                      // Initial search term
  pageSize?: number;                           // Default: 50
  maxSelect?: number;                          // Maximum selectable items
  allowUpload?: boolean;                       // Default: true - show upload dropzone
}
```

**Features:**
- Search media assets (filename, S3 key, URL, content type, SHA256)
- Pagination (50 items per page)
- Multi-select with visual indicators
- Upload new images directly in the modal
- Automatic list refresh after upload (cache invalidation)
- Debounced search (300ms delay)

**Usage Example:**
```tsx
import { MediaLibraryPickerDialog } from "@/components/ui/media-library-picker-dialog";

function MyComponent() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);

  const handleSelect = (urls: string[]) => {
    setSelectedUrls(prev => [...prev, ...urls]);
  };

  return (
    <>
      <Button onClick={() => setPickerOpen(true)}>
        Choose from Media Library
      </Button>
      
      <MediaLibraryPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleSelect}
        maxSelect={20}
        allowUpload={true}
      />
    </>
  );
}
```

**When to Use:**
- Restaurant create/edit pages (to select existing images)
- Any form where you want to reuse existing media assets
- When you want to prevent duplicate uploads

---

## Pages

### 1. Media Library Page

**Location:** `src/app/(main)/dashboard/admin/media-library/page.tsx`

**Route:** `/dashboard/admin/media-library`

**Features:**
- Browse all uploaded media assets
- Search functionality
- Pagination (50 items per page)
- Upload new images via drag-and-drop
- View detailed information about each asset
- Copy URLs and S3 keys to clipboard

**Usage:**
Navigate to `/dashboard/admin/media-library` to manage all media assets.

---

## Integration Examples

### Restaurant Create/Edit Pages

The restaurant create and edit pages demonstrate the recommended pattern:

1. **Upload happens in the modal** (`MediaLibraryPickerDialog`)
2. **Selection happens in the modal** (choose existing assets)
3. **Reordering happens on the page** (`ImageUploadDnd` with `hideDropzone={true}`)

**Example from Restaurant Create:**

```tsx
// State
const [uploadedImages, setUploadedImages] = useState<string[]>([]);
const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

// Handler for media library selection
const addExistingMediaUrls = useCallback((urls: string[]) => {
  setUploadedImages((prev) => {
    const next = Array.from(new Set([...(prev || []), ...urls]));
    return next;
  });
}, []);

// In JSX
<Card>
  <CardHeader>
    <CardTitle>Media</CardTitle>
  </CardHeader>
  <CardContent>
    <Button onClick={() => setMediaPickerOpen(true)}>
      Choose from Media Library
    </Button>
    
    <ImageUploadDnd
      images={uploadedImages}
      onImagesChange={setUploadedImages}
      featuredImageUrl={formData.featured_image_url}
      onFeaturedImageChange={handleFeaturedImageChange}
      maxImages={20}
      hideDropzone={true}  // Upload happens in modal
    />
  </CardContent>
</Card>

<MediaLibraryPickerDialog
  open={mediaPickerOpen}
  onOpenChange={setMediaPickerOpen}
  onSelect={addExistingMediaUrls}
  maxSelect={20}
/>
```

**Workflow:**
1. User clicks "Choose from Media Library"
2. Modal opens with upload dropzone at top
3. User can:
   - Upload new images (drag & drop in modal)
   - Search existing images
   - Select multiple images
   - Click "Add selected"
4. Selected images appear in `ImageUploadDnd` reorder grid
5. User can reorder, set featured, remove images
6. On form submit, only S3 URLs are saved (no blob URLs)

---

## Architecture & Best Practices

### Content-Addressable Storage

Images are stored in S3 using SHA256 hashes as keys:
- Format: `uploads/by-hash/{sha256}.{ext}`
- Benefits:
  - Automatic deduplication (same image = same hash = same key)
  - No need to check database before upload (S3 `HeadObject` is fast)
  - Deterministic URLs (same image always has same URL)

### Caching Strategy

- **List queries**: 60-second TTL with `media_assets:list` tag
- **Detail queries**: 300-second TTL (5 minutes)
- **Invalidation**: Tag-based (`cacheInvalidateTags(['media_assets:list'])`)
- **Result**: New uploads appear immediately in the UI without waiting for cache expiry

### Image Processing

- **Format**: JPEG/PNG/WebP → WebP (animated GIFs preserved)
- **Size**: Max 1600x1600px (maintains aspect ratio)
- **Quality**: 75% WebP quality (configurable via `IMAGE_WEBP_QUALITY` env var)
- **Metadata**: Width, height, original filename stored in `media_assets` table

### Deduplication Flow

1. User uploads image
2. Image is processed (resize, convert to WebP)
3. SHA256 hash is computed from processed image
4. S3 key is generated: `uploads/by-hash/{sha256}.webp`
5. Check if object exists in S3 (`HeadObjectCommand`)
6. If exists: Skip upload, return existing URL
7. If not exists: Upload to S3, return new URL
8. Record metadata in `media_assets` table (always)
9. Invalidate `media_assets:list` cache

### Environment Variables

Required for upload functionality:

```env
# AWS S3 Configuration
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_REGION=ap-northeast-2
S3_BUCKET_NAME=your-bucket-name
S3_BUCKET_DOMAIN=your-bucket-domain.com  # Optional, defaults to s3.{region}.amazonaws.com

# Image Processing (Optional)
IMAGE_MAX_WIDTH=1600
IMAGE_MAX_HEIGHT=1600
IMAGE_WEBP_QUALITY=75

# Hasura (for media_assets queries)
NEXT_PUBLIC_HASURA_GRAPHQL_API_URL=https://your-hasura-instance.com/v1/graphql
NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET=your-admin-secret

# Redis (for caching - optional but recommended)
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── media-assets/
│   │       │   ├── list/route.ts      # List media assets
│   │       │   └── get/route.ts       # Get single asset
│   │       └── upload/
│   │           └── image/route.ts     # Upload image
│   └── (main)/
│       └── dashboard/
│           └── admin/
│               └── media-library/
│                   └── page.tsx      # Media Library page
├── components/
│   └── ui/
│       ├── image-upload-dnd.tsx       # Upload & reorder component
│       └── media-library-picker-dialog.tsx  # Media picker modal
└── lib/
    └── redis-cache.ts                 # Cache utilities
```

---

## Common Use Cases

### 1. Add Media Section to Any Form

```tsx
import { ImageUploadDnd } from "@/components/ui/image-upload-dnd";
import { MediaLibraryPickerDialog } from "@/components/ui/media-library-picker-dialog";

function MyForm() {
  const [images, setImages] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setPickerOpen(true)}>
        Choose from Media Library
      </Button>
      
      <ImageUploadDnd
        images={images}
        onImagesChange={setImages}
        hideDropzone={true}
        maxImages={10}
      />
      
      <MediaLibraryPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(urls) => setImages(prev => [...prev, ...urls])}
      />
    </div>
  );
}
```

### 2. Standalone Upload Component

```tsx
import { ImageUploadDnd } from "@/components/ui/image-upload-dnd";

function UploadOnly() {
  const [images, setImages] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // Upload files when they're added
  useEffect(() => {
    if (pendingFiles.length === 0) return;
    
    const uploadAll = async () => {
      for (const file of pendingFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/v1/upload/image', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          setImages(prev => [...prev, data.fileUrl]);
        }
      }
      setPendingFiles([]);
    };
    
    uploadAll();
  }, [pendingFiles]);

  return (
    <ImageUploadDnd
      images={images}
      onImagesChange={setImages}
      onFilesChange={setPendingFiles}
      hideDropzone={false}  // Show upload UI
    />
  );
}
```

---

## Troubleshooting

### Images not appearing after upload

- **Check cache**: The list is cached for 60 seconds. Uploads should invalidate cache automatically, but you can manually refresh.
- **Check Hasura**: Ensure `media_assets` table is tracked in Hasura.
- **Check console**: Look for errors in browser console and server logs.

### "citext" type errors

- The `admin_users.email` column (and potentially `media_assets` fields) may be `citext` type.
- Use `_ilike` instead of `_eq` in GraphQL queries for `citext` columns.

### Upload fails

- Check AWS credentials in environment variables
- Verify S3 bucket permissions
- Check file size (max 10MB)
- Check file type (only images allowed)

### Cache not invalidating

- Ensure Redis is configured (`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`)
- Check that `cacheInvalidateTags(['media_assets:list'])` is called after uploads

---

## Performance Considerations

- **List queries**: Cached for 60 seconds to reduce Hasura load
- **Upload deduplication**: Uses S3 `HeadObject` (fast, no data transfer)
- **Image processing**: Done server-side with `sharp` (efficient)
- **Pagination**: Server-side (50 items per page) to avoid loading large datasets
- **Search**: Debounced (300ms) to reduce API calls

---

## Future Enhancements

Potential improvements:
- Batch upload endpoint (upload multiple files in one request)
- Image editing (crop, rotate, filters)
- Bulk delete functionality
- Image CDN integration
- Automatic thumbnail generation
- Video support

---

## Summary

The Media Library system provides a complete, production-ready solution for managing images:

1. **Upload once, reuse everywhere** - No duplicate uploads
2. **Automatic optimization** - WebP conversion and resizing
3. **Fast refresh** - Redis caching with tag-based invalidation
4. **Reusable components** - `ImageUploadDnd` and `MediaLibraryPickerDialog`
5. **Commercial viability** - Minimal S3 calls, efficient caching, deduplication

Use `MediaLibraryPickerDialog` for selecting existing assets, and `ImageUploadDnd` for reordering and managing selected images.
