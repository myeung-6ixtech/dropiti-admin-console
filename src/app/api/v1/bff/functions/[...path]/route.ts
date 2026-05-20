import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { rewriteAdminBffPath } from "@/lib/bff-route-rewrite";
import { BFF_MISSING_ACCESS_TOKEN_CODE, getFunctionsBaseUrl } from "@/lib/nhost-functions";

const ACCESS_TOKEN_COOKIE = "nhost_access_token";

async function proxyToFunctions(
  request: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  const base = getFunctionsBaseUrl();
  if (!base) {
    return NextResponse.json(
      { ok: false, error: "NEXT_PUBLIC_FUNCTIONS_URL is not configured" },
      { status: 503 }
    );
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    const isDev = process.env.NODE_ENV !== "production";
    return NextResponse.json(
      {
        ok: false,
        error: "Session required",
        details: {
          code: BFF_MISSING_ACCESS_TOKEN_CODE,
          ...(isDev && {
            hint: "No httpOnly nhost_access_token on this request — use the same origin as login (localhost vs 127.0.0.1), credentials: include on fetch, and inspect the GET (not OPTIONS).",
          }),
        },
      },
      { status: 401 }
    );
  }

  const { pathSegments: upstreamSegments, searchParams } = rewriteAdminBffPath(
    request.method,
    pathSegments,
    request.nextUrl.searchParams
  );

  const subPath = upstreamSegments.join("/");
  const url = new URL(`${base}/v1/${subPath}`);
  searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
  };

  let body: string | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    const text = await request.text();
    if (text) {
      body = text;
      headers["Content-Type"] =
        request.headers.get("content-type") ?? "application/json";
    }
  }

  const upstream = await fetch(url.toString(), {
    method: request.method,
    headers,
    body,
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

type RouteCtx = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteCtx) {
  const { path } = await context.params;
  return proxyToFunctions(request, path);
}

export async function POST(request: NextRequest, context: RouteCtx) {
  const { path } = await context.params;
  return proxyToFunctions(request, path);
}

export async function PUT(request: NextRequest, context: RouteCtx) {
  const { path } = await context.params;
  return proxyToFunctions(request, path);
}

export async function PATCH(request: NextRequest, context: RouteCtx) {
  const { path } = await context.params;
  return proxyToFunctions(request, path);
}

export async function DELETE(request: NextRequest, context: RouteCtx) {
  const { path } = await context.params;
  return proxyToFunctions(request, path);
}
