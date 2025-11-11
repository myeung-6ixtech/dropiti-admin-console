import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "@/utils/auth";

// Cancel/Delete transfer
export async function POST(request: NextRequest) {
  try {
    const token = await getBearerToken();
    if (!token) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const transferId = searchParams.get("id");

    if (!transferId) {
      return NextResponse.json(
        { error: "Transfer ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api-demo.airwallex.com/api/v1/transfers/${transferId}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
          "x-api-key": process.env.AIRWALLEX_API_KEY!,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to cancel transfer" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Transfer cancellation error:", error);
    return NextResponse.json(
      { error: "Failed to cancel transfer" },
      { status: 500 }
    );
  }
} 