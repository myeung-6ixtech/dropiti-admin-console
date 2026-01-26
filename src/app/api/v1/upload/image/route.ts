import { NextRequest } from 'next/server';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

const s3Client = new S3Client({
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET_NAME!;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return Response.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ success: false, error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ success: false, error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Get optional dimensions and hash from client (if provided by client-side processing)
    const clientWidth = formData.get('width') ? parseInt(formData.get('width') as string) : undefined;
    const clientHeight = formData.get('height') ? parseInt(formData.get('height') as string) : undefined;
    const clientHash = formData.get('sha256') as string | null;

    // Process image - upload as-is without server-side processing
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type;
    const extension = file.type.split('/')[1] || 'jpg';

    // Calculate SHA256 hash (use client hash if provided, otherwise compute)
    const sha256 = clientHash || crypto.createHash('sha256').update(buffer).digest('hex');
    const s3Key = `uploads/by-hash/${sha256}.${extension}`;

    // Check if file already exists in S3
    let fileExists = false;
    try {
      await s3Client.send(new HeadObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
      }));
      fileExists = true;
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error.name !== 'NotFound') throw err;
    }

    // Upload to S3 if doesn&apos;t exist
    let etag: string | undefined;
    if (!fileExists) {
      const uploadResult = await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
      }));
      etag = uploadResult.ETag?.replace(/"/g, '');
    }

    // Construct public URL
    const domain = process.env.S3_BUCKET_DOMAIN || `${BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com`;
    const publicUrl = `https://${domain}/${s3Key}`;

    // Insert into real_estate_media_assets table via Hasura
    const hasuraResponse = await fetch(process.env.SDK_BACKEND_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.SDK_HASURA_ADMIN_SECRET!,
      },
      body: JSON.stringify({
        query: `
          mutation InsertMediaAsset(
            $s3_bucket: String!,
            $s3_key: String!,
            $public_url: String!,
            $sha256: String!,
            $etag: String,
            $content_type: String!,
            $size_bytes: Int!,
            $width: Int,
            $height: Int,
            $original_filename: String
          ) {
            insert_real_estate_media_assets_one(
              object: {
                s3_bucket: $s3_bucket,
                s3_key: $s3_key,
                public_url: $public_url,
                sha256: $sha256,
                etag: $etag,
                content_type: $content_type,
                size_bytes: $size_bytes,
                width: $width,
                height: $height,
                original_filename: $original_filename
              },
              on_conflict: {
                constraint: real_estate_media_assets_sha256_key,
                update_columns: [updated_at]
              }
            ) {
              id
            }
          }
        `,
        variables: {
          s3_bucket: BUCKET,
          s3_key: s3Key,
          public_url: publicUrl,
          sha256,
          etag,
          content_type: contentType,
          size_bytes: buffer.length,
          width: clientWidth,
          height: clientHeight,
          original_filename: file.name,
        },
      }),
    });

    const hasuraData = await hasuraResponse.json();
    
    if (hasuraData.errors) {
      console.error('Hasura error:', hasuraData.errors);
      // Continue anyway - file is in S3
    }

    return Response.json({
      success: true,
      fileUrl: publicUrl,
      filePath: s3Key,
      sha256,
      message: fileExists ? 'File already exists (deduped)' : 'File uploaded successfully',
    });

  } catch (error: unknown) {
    console.error('Upload error:', error);
    const errorObj = error as { message?: string };
    return Response.json({ success: false, error: errorObj.message || 'Failed to upload file' }, { status: 500 });
  }
}
