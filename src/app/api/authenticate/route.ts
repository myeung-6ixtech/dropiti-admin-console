import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = await fetch(
      "https://api-demo.airwallex.com/api/v1/authentication/login",
      {
        method: "POST",
        headers: {
          "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
          "x-api-key": process.env.AIRWALLEX_API_KEY!,
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Account Authentication Error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
