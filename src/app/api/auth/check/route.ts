import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { nhostRefreshToken, hasRole, extractHasuraClaims, getNhostJwtSecret } from "@/lib/nhost";

const ACCESS_TOKEN_COOKIE = "nhost_access_token";
const REFRESH_TOKEN_COOKIE = "nhost_refresh_token";

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

    // Access token expired or missing — attempt refresh
    if (!refreshToken) {
      cookieStore.delete(ACCESS_TOKEN_COOKIE);
      return NextResponse.json(
        { authenticated: false, error: "Session expired" },
        { status: 401 }
      );
    }

    const { session, error } = await nhostRefreshToken(refreshToken);

    if (error || !session) {
      cookieStore.delete(ACCESS_TOKEN_COOKIE);
      cookieStore.delete(REFRESH_TOKEN_COOKIE);
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
