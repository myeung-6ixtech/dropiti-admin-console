import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
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
