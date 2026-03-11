import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { nhostSignIn, hasRole, getNhostJwtSecret } from "@/lib/nhost";

const ACCESS_TOKEN_COOKIE = "nhost_access_token";
const REFRESH_TOKEN_COOKIE = "nhost_refresh_token";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const { session, error } = await nhostSignIn(email.toLowerCase().trim(), password);

    if (error || !session) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify the JWT and check for admin role
    let payload: Record<string, unknown>;
    try {
      const { payload: decoded } = await jwtVerify(
        session.accessToken,
        getNhostJwtSecret()
      );
      payload = decoded as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Token verification failed" },
        { status: 401 }
      );
    }

    if (!hasRole(payload, "admin")) {
      return NextResponse.json(
        { error: "Access denied. Admin role required." },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === "production";

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
      // Refresh tokens are long-lived (30 days by default in Nhost)
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.displayName,
        avatar: session.user.avatarUrl ?? null,
        role: "admin",
        permissions: ["*"],
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Authentication failed. Please try again later." },
      { status: 500 }
    );
  }
}
