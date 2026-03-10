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
<<<<<<< HEAD
  
  // Define public routes that don't require authentication
  const publicRoutes = [
    "/signin",
    "/signup",
    "/error-404",
    "/reset-password",
  ];
  
  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );
  
  // Get session cookie
  const sessionCookie = request.cookies.get("admin_session");
  const sessionToken = sessionCookie?.value;
  
  // If accessing a public route while authenticated, redirect to dashboard
  if (isPublicRoute && sessionToken) {
    if (pathname === "/signin" || pathname === "/signup") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }
  
  // If accessing a public route without auth, allow it
  if (isPublicRoute && !sessionToken) {
    return NextResponse.next();
  }
  
  // For all other routes (including root), require authentication
  if (!sessionToken) {
    // Redirect to signin, preserving the intended destination
    const signinUrl = new URL("/signin", request.url);
    if (pathname !== "/") {
      signinUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(signinUrl);
  }
  
  // Validate session with database for protected routes
  try {
    const validationResponse = await fetch(
      new URL("/api/auth/check", request.url).toString(),
      {
        headers: {
          Cookie: `admin_session=${sessionToken}`,
        },
      }
    );

    if (!validationResponse.ok) {
      // Invalid or expired session
=======

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
      // AuthContext will attempt a refresh via /api/auth/check on next load.
>>>>>>> 6337a06 (add new authentication path)
      const response = NextResponse.redirect(new URL("/signin", request.url));
      response.cookies.delete(ACCESS_TOKEN_COOKIE);
      return response;
    }
  } catch (error) {
    console.error("Middleware validation error:", error);
    const response = NextResponse.redirect(new URL("/signin", request.url));
    response.cookies.delete("admin_session");
    return response;
  }
<<<<<<< HEAD
  
  // Redirect root to dashboard if authenticated
  if (pathname === "/" && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
=======

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
>>>>>>> 6337a06 (add new authentication path)
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|public).*)",
  ],
};
