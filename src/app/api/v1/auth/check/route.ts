import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  cookieOptions,
  refreshAdminSession,
  resolveAdminUser,
  verifyAccessToken,
} from "@/lib/auth-session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
    const isProd = process.env.NODE_ENV === "production";
    const opts = cookieOptions(isProd);

    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        { authenticated: false, error: "No session found" },
        { status: 401 }
      );
    }

    if (accessToken) {
      const verified = await verifyAccessToken(accessToken);
      if (verified.ok) {
        const user = await resolveAdminUser(accessToken, verified.payload);
        return NextResponse.json({
          authenticated: true,
          user,
        });
      }
      if (verified.reason === "invalid") {
        cookieStore.delete(ACCESS_TOKEN_COOKIE);
        cookieStore.delete(REFRESH_TOKEN_COOKIE);
        return NextResponse.json(
          { authenticated: false, error: "Invalid token" },
          { status: 401 }
        );
      }
    }

    if (!refreshToken) {
      cookieStore.delete(ACCESS_TOKEN_COOKIE);
      return NextResponse.json(
        { authenticated: false, error: "Session expired" },
        { status: 401 }
      );
    }

    const refreshed = await refreshAdminSession(refreshToken);
    if (!refreshed.ok) {
      cookieStore.delete(ACCESS_TOKEN_COOKIE);
      cookieStore.delete(REFRESH_TOKEN_COOKIE);
      return NextResponse.json(
        { authenticated: false, error: refreshed.error },
        { status: 401 }
      );
    }

    cookieStore.set(
      ACCESS_TOKEN_COOKIE,
      refreshed.session.accessToken,
      opts.access(refreshed.session.accessTokenExpiresIn)
    );
    cookieStore.set(
      REFRESH_TOKEN_COOKIE,
      refreshed.session.refreshToken,
      opts.refresh
    );

    return NextResponse.json({
      authenticated: true,
      user: await resolveAdminUser(
        refreshed.session.accessToken,
        refreshed.payload,
        refreshed.session
      ),
    });
  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json(
      { authenticated: false, error: "Validation failed" },
      { status: 500 }
    );
  }
}
