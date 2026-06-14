import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  cookieOptions,
  refreshAdminSession,
  verifyAccessToken,
} from "@/lib/auth-session";

const PROTECTED_ROUTE_PREFIXES = ["/dashboard", "/profile"];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function redirectToSignin(request: NextRequest, clearCookies = false): NextResponse {
  const response = NextResponse.redirect(new URL("/signin", request.url));
  if (clearCookies) {
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api") || pathname.includes("/api/")) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const isProd = process.env.NODE_ENV === "production";
  const opts = cookieOptions(isProd);

  if (isProtectedRoute(pathname)) {
    if (!accessToken && !refreshToken) {
      return redirectToSignin(request);
    }

    if (accessToken) {
      const verified = await verifyAccessToken(accessToken);
      if (verified.ok) {
        return NextResponse.next();
      }
      if (verified.reason === "invalid") {
        return redirectToSignin(request, true);
      }
    }

    if (refreshToken) {
      const refreshed = await refreshAdminSession(refreshToken);
      if (refreshed.ok) {
        const response = NextResponse.next();
        response.cookies.set(
          ACCESS_TOKEN_COOKIE,
          refreshed.session.accessToken,
          opts.access(refreshed.session.accessTokenExpiresIn)
        );
        response.cookies.set(
          REFRESH_TOKEN_COOKIE,
          refreshed.session.refreshToken,
          opts.refresh
        );
        return response;
      }
    }

    return redirectToSignin(request, true);
  }

  if ((pathname === "/signin" || pathname === "/") && (accessToken || refreshToken)) {
    if (accessToken) {
      const verified = await verifyAccessToken(accessToken);
      if (verified.ok) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    if (refreshToken) {
      const refreshed = await refreshAdminSession(refreshToken);
      if (refreshed.ok) {
        const response = NextResponse.redirect(new URL("/dashboard", request.url));
        response.cookies.set(
          ACCESS_TOKEN_COOKIE,
          refreshed.session.accessToken,
          opts.access(refreshed.session.accessTokenExpiresIn)
        );
        response.cookies.set(
          REFRESH_TOKEN_COOKIE,
          refreshed.session.refreshToken,
          opts.refresh
        );
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|public).*)"],
};
