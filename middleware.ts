import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if user is authenticated by looking for the session cookie
  const sessionCookie = request.cookies.get("admin_session");
  const isAuthenticated = sessionCookie && sessionCookie.value === "authenticated";

  // Define protected routes (admin routes)
  const protectedRoutes = [
    "/dashboard",
    "/customers",
    "/payments",
    "/transfers",
    "/beneficiaries",
    "/settings",
    "/reports",
  ];

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Redirect root to dashboard if authenticated
  if (pathname === "/" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If accessing a protected route without authentication, redirect to signin
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // If accessing signin page while authenticated, redirect to dashboard
  if (pathname === "/signin" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}; 