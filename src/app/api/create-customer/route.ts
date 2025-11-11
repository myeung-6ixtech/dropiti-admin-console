import { NextResponse } from "next/server";
import axios from "axios";
import { getBearerToken } from "@/utils/auth";
import { corsResponse, handleOptions } from "@/utils/cors";

// Create Business Account
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = await getBearerToken();

    const requestBody = {
      ...body,
      request_id: `req_${Date.now()}`,
      merchant_customer_id: `merchant_${Date.now()}`,
    };

    const { data } = await axios.post(
      "https://api-demo.airwallex.com/api/v1/pa/customers/create",
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
    console.error("Customer creation error:", error);
    return NextResponse.json(
      { error: "Customer account creation failed" },
      { status: 500 }
    );
  }
}
