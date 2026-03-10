import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { nhostSignOut } from "@/lib/nhost";

const ACCESS_TOKEN_COOKIE = "nhost_access_token";
const REFRESH_TOKEN_COOKIE = "nhost_refresh_token";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

    if (refreshToken) {
      // Best-effort revocation on Nhost side
      await nhostSignOut(refreshToken);
    }

    cookieStore.delete(ACCESS_TOKEN_COOKIE);
    cookieStore.delete(REFRESH_TOKEN_COOKIE);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
