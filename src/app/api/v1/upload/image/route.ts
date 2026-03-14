import { NextRequest } from 'next/server';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

// Support both S3_BUCKET_* (e.g. .env) and S3_* (alternative) env var names
const S3_REGION =
  process.env.S3_BUCKET_AWS_REGION ?? process.env.S3_REGION ?? '';
const S3_ACCESS_KEY =
  process.env.S3_BUCKET_ACCESS_KEY ?? process.env.S3_ACCESS_KEY_ID ?? '';
const S3_SECRET_KEY =
  process.env.S3_BUCKET_SECRET_KEY ?? process.env.S3_SECRET_ACCESS_KEY ?? '';

const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
});

const BUCKET = process.env.S3_BUCKET_NAME ?? '';

export async function POST(request: NextRequest) {
  try {
    if (!S3_REGION || !BUCKET || !S3_ACCESS_KEY || !S3_SECRET_KEY) {
      return Response.json(
        {
          success: false,
          error:
            'S3 configuration missing. Set S3_BUCKET_AWS_REGION, S3_BUCKET_NAME, S3_BUCKET_ACCESS_KEY, S3_BUCKET_SECRET_KEY (or S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY).',
        },
        { status: 500 }
      );
    }

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

    // Check if file already exists in S3 (optional optimization; skip if HeadObject fails e.g. missing permission)
    let fileExists = false;
    try {
      await s3Client.send(new HeadObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
      }));
      fileExists = true;
    } catch (err: unknown) {
      const error = err as { name?: string; Code?: string; $metadata?: { httpStatusCode?: number } };
      const isNotFound =
        error.name === 'NotFound' ||
        error.Code === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404;
      if (!isNotFound) {
        console.warn('S3 HeadObject failed (proceeding to upload):', error.name ?? error.Code, error);
        // Don't throw: proceed to PutObject; upload may still succeed if we have PutObject permission
      }
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

    // Construct public URL (S3_BUCKET_DOMAIN_URL can be full URL e.g. https://bucket.s3.region.amazonaws.com)
    const domainUrl = process.env.S3_BUCKET_DOMAIN_URL ?? process.env.S3_BUCKET_DOMAIN;
    const publicUrl = domainUrl && (domainUrl.startsWith('http://') || domainUrl.startsWith('https://'))
      ? `${domainUrl.replace(/\/$/, '')}/${s3Key}`
      : `https://${domainUrl || `${BUCKET}.s3.${S3_REGION}.amazonaws.com`}/${s3Key}`;

    // Insert into real_estate_media_assets table via Hasura
    const hasuraResponse = await fetch(process.env.HASURA_ENDPOINT!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET!,
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
    const err = error as { message?: string; name?: string; Code?: string; $metadata?: { httpStatusCode?: number } };
    console.error('Upload error:', err?.name ?? err?.Code, err?.message, err?.$metadata ?? error);
    const message =
      err?.message ||
      (err?.name && err.name !== 'Unknown' ? err.name : null) ||
      (err?.Code ? `S3 ${err.Code}` : null) ||
      'Failed to upload file';
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
