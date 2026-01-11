import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';

    const hasuraResponse = await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET!,
      },
      body: JSON.stringify({
        query: `
          query ListMediaAssets($limit: Int!, $offset: Int!, $search: String!) {
            real_estate_media_assets(
              where: {
                deleted_at: { _is_null: true },
                _or: [
                  { original_filename: { _ilike: $search } },
                  { s3_key: { _ilike: $search } },
                  { public_url: { _ilike: $search } },
                  { content_type: { _ilike: $search } },
                  { sha256: { _ilike: $search } }
                ]
              },
              limit: $limit,
              offset: $offset,
              order_by: { created_at: desc }
            ) {
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
              created_at
              updated_at
            }
            real_estate_media_assets_aggregate(
              where: {
                deleted_at: { _is_null: true },
                _or: [
                  { original_filename: { _ilike: $search } },
                  { s3_key: { _ilike: $search } },
                  { public_url: { _ilike: $search } },
                  { content_type: { _ilike: $search } },
                  { sha256: { _ilike: $search } }
                ]
              }
            ) {
              aggregate {
                count
              }
            }
          }
        `,
        variables: {
          limit,
          offset,
          search: `%${search}%`,
        },
      }),
    });

    const data = await hasuraResponse.json();
    
    if (data.errors) {
      console.error('Hasura error:', data.errors);
      return Response.json(
        { success: false, error: data.errors[0]?.message || 'Failed to fetch media assets' },
        { status: 500 }
      );
    }

    const total = data.data?.real_estate_media_assets_aggregate?.aggregate?.count || 0;

    return Response.json({
      success: true,
      data: data.data?.real_estate_media_assets || [],
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
        fetchedAt: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('List error:', error);
    return Response.json({ success: false, error: error.message || 'Failed to list media assets' }, { status: 500 });
  }
}
