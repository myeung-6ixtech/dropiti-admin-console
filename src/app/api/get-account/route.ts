import { NextResponse } from "next/server";
import { getBearerToken } from "@/utils/auth";

// Get All Connected Accounts
export async function GET() {
  try {
    const token = await getBearerToken();

    const response = await fetch(
      "https://api-demo.airwallex.com/api/v1/accounts",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
          "x-api-key": process.env.AIRWALLEX_API_KEY!,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to retrieve accounts");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Account retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve accounts" },
      { status: 500 }
    );
  }
}
