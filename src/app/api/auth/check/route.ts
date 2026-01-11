import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
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
            status
            role_id
            permissions
            account_type
            role {
              id
              name
              permissions
            }
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

    // Check if user is still active
    if (user.status !== 'active') {
      // Deactivate session
      await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_API_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET!,
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
      ...(user.role?.permissions || []),
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
        role: user.role ? { id: user.role.id, name: user.role.name } : null,
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
