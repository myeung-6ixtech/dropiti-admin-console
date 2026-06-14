import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE, verifyAccessToken } from "@/lib/auth-session";
import { runUptimeProbes } from "@/lib/uptime-probes";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const verified = await verifyAccessToken(accessToken);
  if (!verified.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin = request.nextUrl.origin;
  const report = await runUptimeProbes(origin);

  return NextResponse.json(report);
}
