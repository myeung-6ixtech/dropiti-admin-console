import { NextResponse } from "next/server";
import { getBearerToken } from "@/utils/auth";
import { corsResponse } from "@/utils/cors";
import axios from "axios";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = await getBearerToken();

    const requestBody = {
      ...body,
      request_id: `req_${Date.now()}`,
    };

    const { data } = await axios.post(
      "https://api-demo.airwallex.com/api/v1/accounts/create",
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
          "x-api-key": process.env.AIRWALLEX_API_KEY!,
        },
      }
    );

    return corsResponse(data);
  } catch (error) {
    console.error("Individual Account creation error:", error);
    return NextResponse.json(
      { error: "Individual account creation failed" },
      { status: 500 }
    );
  }
}
