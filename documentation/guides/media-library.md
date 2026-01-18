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

The restaurant create and edit pages (`/dashboard/admin/restaurant-listings/create` and `/dashboard/admin/restaurant-listings/edit/[id]`) implement a comprehensive media management system using the Media Library components.

**File Locations:**
- Create page: `src/app/(main)/dashboard/admin/restaurant-listings/create/page.tsx`
- Edit page: `src/app/(main)/dashboard/admin/restaurant-listings/edit/[id]/edit-restaurant-client.tsx`

#### Component Architecture

The implementation uses a two-component pattern:

1. **`MediaLibraryPickerDialog`** - Modal for uploading and selecting images
2. **`ImageUploadDnd`** - Drag-and-drop reorder grid with featured image selection

#### State Management

```tsx
// Image state - array of S3 URLs
const [uploadedImages, setUploadedImages] = useState<string[]>([]);

// Modal state
const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

// Featured image (stored separately in formData)
const [formData, setFormData] = useState({
  featured_image_url: "",
  // ... other fields
});
```

#### Component Implementation

**Media Section Card:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Media</CardTitle>
    <CardDescription>
      Upload into the Media Library, then select images here. Drag to reorder below.
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setMediaPickerOpen(true)}
        disabled={isSubmitting}
      >
        Choose from Media Library
      </Button>
    </div>
    <ImageUploadDnd
      images={uploadedImages}
      onImagesChange={setUploadedImages}
      featuredImageUrl={formData.featured_image_url}
      onFeaturedImageChange={handleFeaturedImageChange}
      maxImages={20}
      disabled={isSubmitting}
      hideDropzone  // Upload happens in modal, not here
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

#### Handler Functions

**Adding Selected Images:**

```tsx
const addExistingMediaUrls = useCallback((urls: string[]) => {
  if (!urls || urls.length === 0) return;
  
  // Add URLs to uploadedImages array, preventing duplicates
  setUploadedImages((prev) => {
    const next = Array.from(new Set([...(prev || []), ...urls]));
    return next;
  });
  
  // Auto-set first image as featured if no featured image exists
  setFormData((prev) => {
    if (prev.featured_image_url) return prev;
    const first = urls[0];
    return first ? { ...prev, featured_image_url: first } : prev;
  });
}, []);
```

**Featured Image Change:**

```tsx
const handleFeaturedImageChange = useCallback((url: string | null) => {
  setFormData(prev => ({ ...prev, featured_image_url: url || "" }));
}, []);
```

#### Drag-and-Drop Reordering

The `ImageUploadDnd` component implements drag-and-drop reordering using `@dnd-kit`:

- **Library**: `@dnd-kit/core` and `@dnd-kit/sortable`
- **Strategy**: `verticalListSortingStrategy` (works with grid layout)
- **Sensors**: Pointer and keyboard sensors for accessibility
- **Visual Feedback**: 
  - Dragging item shows 50% opacity
  - Ring highlight on drag target
  - Smooth transitions during reorder

**How it works:**
1. User clicks and drags an image using the grip handle (⋮⋮ icon)
2. Component tracks drag position using `closestCenter` collision detection
3. On drop, `arrayMove` reorders the `imageFiles` array
4. State updates trigger `onImagesChange` callback
5. Parent component receives new ordered array of URLs

#### Featured Image Selection

- **Visual Indicator**: Star icon (⭐) appears on featured image
- **Toggle Behavior**: Click star to set/unset featured image
- **Auto-selection**: First image added is automatically set as featured (if none exists)
- **State Sync**: Featured image URL is stored separately in `formData.featured_image_url`

#### Image Removal

- **Remove Button**: X icon appears on hover in top-right corner
- **Cleanup**: Blob URLs are automatically revoked when removed
- **Featured Image**: If featured image is removed, it's automatically cleared

#### Form Submission & Data Persistence

**On Submit (Create/Edit):**

```tsx
// Filter out blob URLs - only keep actual S3 URLs
let finalImageUrls = [...uploadedImages];

finalImageUrls = finalImageUrls.filter(url => {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('blob:')) return false;  // Remove local previews
  // Only keep valid HTTP/HTTPS URLs (S3 URLs)
  return url.startsWith('http://') || url.startsWith('https://');
});

// Filter featured_image_url similarly
let featuredImageUrl = formData.featured_image_url.trim() || undefined;
if (featuredImageUrl && featuredImageUrl.startsWith('blob:')) {
  featuredImageUrl = undefined;  // Clear invalid blob URLs
}

// Save to backend
await restaurantV2Service.createRestaurant({
  // ... other fields
  featured_image_url: featuredImageUrl,
  uploaded_images: finalImageUrls.length > 0 ? finalImageUrls : undefined,
});
```

**On Load (Edit Page):**

```tsx
// Load existing images from restaurant data
const existingImages = restaurantData.uploaded_images || [];
const featuredImage = restaurantData.featured_image_url;

// Include featured image in array if it exists and isn't already included
if (featuredImage && !existingImages.includes(featuredImage)) {
  setUploadedImages([featuredImage, ...existingImages]);
} else {
  setUploadedImages(existingImages);
}
```

#### Complete User Workflow

1. **Opening Media Picker:**
   - User clicks "Choose from Media Library" button
   - `MediaLibraryPickerDialog` modal opens

2. **Uploading New Images:**
   - User drags & drops images into modal dropzone (or clicks to select)
   - Images upload to S3 via `/api/v1/upload/image`
   - Upload happens sequentially to avoid overloading
   - Modal automatically refreshes to show new images
   - Cache invalidation ensures new images appear immediately

3. **Selecting Existing Images:**
   - User can search media assets (filename, S3 key, hash)
   - Search is debounced (300ms delay)
   - User clicks images to select (multi-select with visual indicators)
   - Selected count shown: "Selected: 3 / 20"
   - Pagination available (50 items per page)

4. **Adding Selected Images:**
   - User clicks "Add selected" button
   - `onSelect` callback fires with array of `public_url` strings
   - Images added to `uploadedImages` state (duplicates prevented)
   - Modal closes automatically
   - First image auto-set as featured (if none exists)

5. **Managing Images on Page:**
   - Images appear in `ImageUploadDnd` grid (2-4 columns responsive)
   - User can drag images to reorder (grip handle: ⋮⋮)
   - User can set featured image (star icon: ⭐)
   - User can remove images (X icon on hover)
   - Grid shows count: "5 images (drag to reorder)"

6. **Saving Form:**
   - On submit, blob URLs are filtered out
   - Only S3 URLs are saved to database
   - `uploaded_images` array and `featured_image_url` saved separately
   - Backend receives clean array of S3 URLs

#### Key Features

- **No Duplicate Uploads**: Content-addressable storage prevents duplicates
- **Automatic Deduplication**: Same image hash = same S3 key = no re-upload
- **Blob URL Handling**: Local previews (blob URLs) are automatically cleaned up
- **State Reconciliation**: Component syncs with parent `images` prop changes
- **Featured Image Sync**: Featured image automatically cleared if removed from array
- **Responsive Grid**: 2 columns (mobile), 3 (tablet), 4 (desktop)
- **Accessibility**: Keyboard navigation support via `@dnd-kit` sensors
- **Loading States**: Disabled during form submission
- **Error Handling**: Toast notifications for upload/search errors

#### Component Props Summary

**ImageUploadDnd:**
- `images: string[]` - Array of S3 URLs
- `onImagesChange: (images: string[]) => void` - Callback when images change
- `featuredImageUrl?: string` - Currently featured image URL
- `onFeaturedImageChange?: (url: string | null) => void` - Featured image callback
- `maxImages?: number` - Maximum images (default: 20)
- `disabled?: boolean` - Disable interactions
- `hideDropzone?: boolean` - Hide upload UI (show only reorder grid)

**MediaLibraryPickerDialog:**
- `open: boolean` - Modal open state
- `onOpenChange: (open: boolean) => void` - Modal state callback
- `onSelect: (selectedUrls: string[]) => void` - Selection callback
- `maxSelect?: number` - Maximum selectable items (default: unlimited)
- `allowUpload?: boolean` - Show upload dropzone (default: true)
- `pageSize?: number` - Items per page (default: 50)

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
