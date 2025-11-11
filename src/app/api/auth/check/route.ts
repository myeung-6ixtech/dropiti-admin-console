import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("admin_session");

    if (sessionCookie && sessionCookie.value === "authenticated") {
      return NextResponse.json({
        isAuthenticated: true,
        user: {
          email: process.env.ROOT_EMAIL,
          role: "super_admin",
        },
      });
    }

    return NextResponse.json(
      { isAuthenticated: false, user: null },
      { status: 401 }
    );
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { isAuthenticated: false, user: null },
      { status: 500 }
    );
  }
} 