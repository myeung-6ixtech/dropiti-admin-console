import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user is super_admin (prevent deletion)
    const checkQuery = `
      query CheckUserRole($id: uuid!) {
        real_estate_administrator_users_by_pk(id: $id) {
          id
          role_id
          email
          name
        }
      }
    `;

    const checkResponse = await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET!,
      },
      body: JSON.stringify({
        query: checkQuery,
        variables: { id },
      }),
    });

    const checkData = await checkResponse.json();
    const user = checkData.data?.real_estate_administrator_users_by_pk;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (user.role_id === 'super_admin') {
      return NextResponse.json(
        { success: false, error: "Super Admin cannot be deleted" },
        { status: 403 }
      );
    }

    const mutation = `
      mutation DeleteAdministratorUser($id: uuid!) {
        delete_real_estate_administrator_users_by_pk(id: $id) {
          id
          email
          name
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
        query: mutation,
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

    return NextResponse.json({
      success: true,
      data: data.data?.delete_real_estate_administrator_users_by_pk,
      message: "User deleted successfully",
    });
  } catch (error: unknown) {
    console.error('Delete user error:', error);
    const errorObj = error as { message?: string };
    return NextResponse.json(
      { success: false, error: errorObj.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
