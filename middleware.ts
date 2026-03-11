import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const ACCESS_TOKEN_COOKIE = "nhost_access_token";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/customers",
  "/payments",
  "/transfers",
  "/beneficiaries",
  "/settings",
  "/reports",
  "/properties",
  "/payment-intents",
  "/user-management",
  "/media-library",
];

function getJwtSecret(): Uint8Array {
  const secret = process.env.NHOST_JWT_SECRET;
  if (!secret) throw new Error("NHOST_JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

function hasAdminRole(payload: Record<string, unknown>): boolean {
  const claims = payload["https://hasura.io/jwt/claims"] as
    | Record<string, unknown>
    | undefined;
  const allowedRoles = (claims?.["x-hasura-allowed-roles"] as string[]) ?? [];
  return allowedRoles.includes("admin");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never run auth logic or redirects on API routes (avoids ERR_TOO_MANY_REDIRECTS on fetch)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    if (!accessToken) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    try {
      const { payload } = await jwtVerify(accessToken, getJwtSecret());

      if (!hasAdminRole(payload as Record<string, unknown>)) {
        const response = NextResponse.redirect(new URL("/signin", request.url));
        response.cookies.delete(ACCESS_TOKEN_COOKIE);
        return response;
      }
    } catch {
      // Token is invalid or expired — redirect to /signin; the client's
      // AuthContext will attempt a refresh via /api/v1/auth/check on next load.
      const response = NextResponse.redirect(new URL("/signin", request.url));
      response.cookies.delete(ACCESS_TOKEN_COOKIE);
      return response;
    }
  }

  // Redirect authenticated users away from /signin and /
  if ((pathname === "/signin" || pathname === "/") && accessToken) {
    try {
      const { payload } = await jwtVerify(accessToken, getJwtSecret());
      if (hasAdminRole(payload as Record<string, unknown>)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      // Expired/invalid token — let them through to /signin to re-authenticate
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|public).*)",
  ],
};
