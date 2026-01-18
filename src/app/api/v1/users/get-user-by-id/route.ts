import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    const query = `
      query GetAdministratorUser($id: uuid!) {
        real_estate_administrator_users_by_pk(id: $id) {
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
        variables: { id },
      }),
    });

    const data = await response.json();
    
    if (data.errors) {
      return NextResponse.json(
        { success: false, error: data.errors[0]?.message },
        { status: 500 }
      );
    }

    if (!data.data?.real_estate_administrator_users_by_pk) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data.real_estate_administrator_users_by_pk,
    });
  } catch (error: unknown) {
    console.error('Get user error:', error);
    const errorObj = error as { message?: string };
    return NextResponse.json(
      { success: false, error: errorObj.message || 'Failed to get user' },
      { status: 500 }
    );
  }
}
