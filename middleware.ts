import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get session cookie
  const sessionCookie = request.cookies.get("admin_session");
  const sessionToken = sessionCookie?.value;

  // Define protected routes
  const protectedRoutes = [
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

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // If accessing protected route, validate session
  if (isProtectedRoute) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    // Validate session with database
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
        const response = NextResponse.redirect(new URL("/signin", request.url));
        response.cookies.delete("admin_session");
        return response;
      }
    } catch (error) {
      console.error("Middleware validation error:", error);
      const response = NextResponse.redirect(new URL("/signin", request.url));
      response.cookies.delete("admin_session");
      return response;
    }
  }

  // If accessing signin while authenticated, redirect to dashboard
  if (pathname === "/signin" && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect root to dashboard if authenticated
  if (pathname === "/" && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|public).*)",
  ],
};
