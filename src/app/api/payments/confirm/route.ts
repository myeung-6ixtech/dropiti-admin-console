import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "@/utils/auth";

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
    const paymentId = searchParams.get("id");

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('API received payload:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.request_id || !body.payment_method) {
      return NextResponse.json(
        { error: "request_id and payment_method are required" },
        { status: 400 }
      );
    }

    // Prepare the request body for Airwallex - simplified pass-through
    const airwallexPayload: Record<string, unknown> = {
      request_id: body.request_id,
      payment_method: body.payment_method
    };

    // Add optional customer_id if provided
    if (body.customer_id) {
      airwallexPayload.customer_id = body.customer_id;
    }

    console.log('Sending to Airwallex:', JSON.stringify(airwallexPayload, null, 2));
    
    // Confirm the payment intent with Airwallex
    const response = await fetch(
      `https://api-demo.airwallex.com/api/v1/pa/payment_intents/${paymentId}/confirm`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
          "x-api-key": process.env.AIRWALLEX_API_KEY!,
        },
        body: JSON.stringify(airwallexPayload),
      }
    );

    console.log('Airwallex response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Airwallex API Error:', errorData);   
      return NextResponse.json(
        { error: errorData.message || "Failed to confirm payment" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Airwallex success response:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    );
  }
} 