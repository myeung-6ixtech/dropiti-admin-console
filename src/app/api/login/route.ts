import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const ROOT_EMAIL = process.env.ROOT_EMAIL;
const ROOT_PASSWORD = process.env.ROOT_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Check email first
    if (email !== ROOT_EMAIL) {
      return NextResponse.json(
        { error: "No user found with this email" },
        { status: 401 }
      );
    }

    // Check password
    if (password !== ROOT_PASSWORD) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    if (email === ROOT_EMAIL && password === ROOT_PASSWORD) {
      const response = NextResponse.json({ success: true });

      // Set secure HTTP-only cookie
      response.cookies.set("admin_session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch (error) {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
