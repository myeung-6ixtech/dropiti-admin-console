import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { nhostRefreshToken, hasRole, extractHasuraClaims, getNhostJwtSecret } from "@/lib/nhost";

<<<<<<< HEAD
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
=======
const ACCESS_TOKEN_COOKIE = "nhost_access_token";
const REFRESH_TOKEN_COOKIE = "nhost_refresh_token";
>>>>>>> 6337a06 (add new authentication path)

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        { authenticated: false, error: "No session found" },
        { status: 401 }
      );
    }

    const isProd = process.env.NODE_ENV === "production";

    // Try to verify the access token
    if (accessToken) {
      try {
        const { payload } = await jwtVerify(accessToken, getNhostJwtSecret());
        const decoded = payload as Record<string, unknown>;

        if (!hasRole(decoded, "admin")) {
          cookieStore.delete(ACCESS_TOKEN_COOKIE);
          cookieStore.delete(REFRESH_TOKEN_COOKIE);
          return NextResponse.json(
            { authenticated: false, error: "Admin role required" },
            { status: 403 }
          );
        }

        const { userId } = extractHasuraClaims(decoded);

        return NextResponse.json({
          authenticated: true,
          user: {
            id: userId,
            email: (decoded.email as string) ?? "",
            name: (decoded.name as string) ?? userId,
            avatar: null,
            role: "admin",
            permissions: ["*"],
          },
        });
      } catch (err) {
        if ((err as { code?: string }).code !== "ERR_JWT_EXPIRED") {
          // Token is invalid (not just expired) — clear everything
          cookieStore.delete(ACCESS_TOKEN_COOKIE);
          cookieStore.delete(REFRESH_TOKEN_COOKIE);
          return NextResponse.json(
            { authenticated: false, error: "Invalid token" },
            { status: 401 }
          );
        }
        // Token is expired — fall through to refresh
      }
    }

<<<<<<< HEAD
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
=======
    // Access token expired or missing — attempt refresh
    if (!refreshToken) {
      cookieStore.delete(ACCESS_TOKEN_COOKIE);
>>>>>>> 6337a06 (add new authentication path)
      return NextResponse.json(
        { authenticated: false, error: "Session expired" },
        { status: 401 }
      );
    }

    const { session, error } = await nhostRefreshToken(refreshToken);

<<<<<<< HEAD
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
=======
    if (error || !session) {
      cookieStore.delete(ACCESS_TOKEN_COOKIE);
      cookieStore.delete(REFRESH_TOKEN_COOKIE);
>>>>>>> 6337a06 (add new authentication path)
      return NextResponse.json(
        { authenticated: false, error: "Session expired" },
        { status: 401 }
      );
    }

    // Verify the new access token and check admin role
    let payload: Record<string, unknown>;
    try {
      const { payload: decoded } = await jwtVerify(session.accessToken, getNhostJwtSecret());
      payload = decoded as Record<string, unknown>;
    } catch {
      cookieStore.delete(ACCESS_TOKEN_COOKIE);
      cookieStore.delete(REFRESH_TOKEN_COOKIE);
      return NextResponse.json(
        { authenticated: false, error: "Token verification failed" },
        { status: 401 }
      );
    }

    if (!hasRole(payload, "admin")) {
      cookieStore.delete(ACCESS_TOKEN_COOKIE);
      cookieStore.delete(REFRESH_TOKEN_COOKIE);
      return NextResponse.json(
        { authenticated: false, error: "Admin role required" },
        { status: 403 }
      );
    }

    // Rotate cookies with fresh tokens
    cookieStore.set(ACCESS_TOKEN_COOKIE, session.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      maxAge: session.accessTokenExpiresIn,
      path: "/",
    });

    cookieStore.set(REFRESH_TOKEN_COOKIE, session.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    const { userId } = extractHasuraClaims(payload);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: userId,
        email: session.user.email,
        name: session.user.displayName,
        avatar: session.user.avatarUrl ?? null,
        role: "admin",
        permissions: ["*"],
      },
    });
  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json(
      { authenticated: false, error: "Validation failed" },
      { status: 500 }
    );
  }
}
