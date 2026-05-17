import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getFunctionsBaseUrl } from "@/lib/nhost-functions";

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
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const subPath = pathSegments.join("/");
  const url = new URL(`${base}/v1/${subPath}`);
  request.nextUrl.searchParams.forEach((value, key) => {
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
