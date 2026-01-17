import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';

    const query = `
      query GetAdministratorUsers($limit: Int!, $offset: Int!, $search: String!) {
        real_estate_administrator_users(
          where: {
            _or: [
              { email: { _ilike: $search } },
              { name: { _ilike: $search } },
              { phone: { _ilike: $search } }
            ]
          }
          limit: $limit
          offset: $offset
          order_by: { created_at: desc }
        ) {
          id
          email
          name
          phone
          avatar
          address
          business_type
          company_name
          description
          status
          role_id
          permissions
          created_at
          updated_at
          last_login_at
          email_verified_at
        }
        real_estate_administrator_users_aggregate(
          where: {
            _or: [
              { email: { _ilike: $search } },
              { name: { _ilike: $search } },
              { phone: { _ilike: $search } }
            ]
          }
        ) {
          aggregate {
            count
          }
        }
      }
    `;

    const response = await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET!,
      },
      body: JSON.stringify({
        query,
        variables: {
          limit,
          offset,
          search: `%${search}%`,
        },
      }),
    });

    const data = await response.json();
    
    if (data.errors) {
      return NextResponse.json(
        { success: false, error: data.errors[0]?.message },
        { status: 500 }
      );
    }

    const total = data.data?.real_estate_administrator_users_aggregate?.aggregate?.count || 0;

    return NextResponse.json({
      success: true,
      data: data.data?.real_estate_administrator_users || [],
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: unknown) {
    console.error('List users error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list users' },
      { status: 500 }
    );
  }
}
