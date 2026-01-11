import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ success: false, error: 'ID required' }, { status: 400 });
    }

    const hasuraResponse = await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET!,
      },
      body: JSON.stringify({
        query: `
          query GetMediaAsset($id: uuid!) {
            real_estate_media_assets_by_pk(id: $id) {
              id
              s3_bucket
              s3_key
              public_url
              sha256
              etag
              content_type
              size_bytes
              width
              height
              original_filename
              uploaded_by_user_id
              created_at
              updated_at
              deleted_at
            }
          }
        `,
        variables: { id },
      }),
    });

    const data = await hasuraResponse.json();
    
    if (data.errors) {
      console.error('Hasura error:', data.errors);
      return Response.json(
        { success: false, error: data.errors[0]?.message || 'Failed to fetch media asset' },
        { status: 500 }
      );
    }

    if (!data.data?.real_estate_media_assets_by_pk) {
      return Response.json({ success: false, error: 'Media asset not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: data.data.real_estate_media_assets_by_pk,
    });

  } catch (error: any) {
    console.error('Get error:', error);
    return Response.json({ success: false, error: error.message || 'Failed to get media asset' }, { status: 500 });
  }
}
