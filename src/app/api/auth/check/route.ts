import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Helper: Get role information
async function getRoleInfo(roleId: string) {
  try {
    const query = `
      query GetRole($id: String!) {
        real_estate_admin_roles_by_pk(id: $id) {
          id
          name
          permissions
        }
      }
    `;

    const response = await fetch(process.env.SDK_BACKEND_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.SDK_HASURA_ADMIN_SECRET!,
      },
      body: JSON.stringify({
        query,
        variables: { id: roleId }
      }),
    });

    const data = await response.json();
    return data.data?.real_estate_admin_roles_by_pk || null;
  } catch (error) {
    console.error('Failed to get role info:', error);
    return null;
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("admin_session")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { authenticated: false, error: "No session found" },
        { status: 401 }
      );
    }

    // Validate session in database
    const query = `
      query ValidateSession($token: String!) {
        real_estate_user_sessions(
          where: {
            token: { _eq: $token },
            is_active: { _eq: true },
            expires_at: { _gt: "now()" }
          }
          limit: 1
        ) {
          id
          user_id
          expires_at
          user {
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
            account_type
          }
        }
      }
    `;

    const response = await fetch(process.env.SDK_BACKEND_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.SDK_HASURA_ADMIN_SECRET!,
      },
      body: JSON.stringify({
        query,
        variables: { token: sessionToken }
      }),
    });

    const data = await response.json();
    const sessions = data.data?.real_estate_user_sessions || [];

    if (sessions.length === 0) {
      // Invalid or expired session
      cookieStore.delete("admin_session");
      return NextResponse.json(
        { authenticated: false, error: "Session expired" },
        { status: 401 }
      );
    }

    const session = sessions[0];
    const user = session.user;

    // Get role information
    const role = user.role_id ? await getRoleInfo(user.role_id) : null;

    // Check if user is still active
    if (user.status !== 'active') {
      // Deactivate session
      await fetch(process.env.SDK_BACKEND_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': process.env.SDK_HASURA_ADMIN_SECRET!,
        },
        body: JSON.stringify({
          query: `
            mutation DeactivateSession($id: uuid!) {
              update_real_estate_user_sessions_by_pk(
                pk_columns: { id: $id },
                _set: { is_active: false }
              ) {
                id
              }
            }
          `,
          variables: { id: session.id }
        }),
      });

      cookieStore.delete("admin_session");
      return NextResponse.json(
        { authenticated: false, error: "Account no longer active" },
        { status: 403 }
      );
    }

    // Merge permissions
    const allPermissions = [
      ...(role?.permissions || []),
      ...(user.permissions || [])
    ];
    const uniquePermissions = [...new Set(allPermissions)];

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        role: role ? { id: role.id, name: role.name } : null,
        permissions: uniquePermissions,
      }
    });
  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json(
      { authenticated: false, error: "Validation failed" },
      { status: 500 }
    );
  }
}
