import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "@/utils/auth";

interface RecurringPaymentRequest {
  customer_id: string;
  currency: string;
  metadata?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const token = await getBearerToken();
    if (!token) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    const body: RecurringPaymentRequest = await request.json();

    // Validate required fields
    if (!body.customer_id || !body.currency) {
      return NextResponse.json(
        { error: "Customer ID and currency are required" },
        { status: 400 }
      );
    }

    // Prepare payment consent payload according to Airwallex API format
    const paymentConsentPayload = {
      request_id: `consent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      customer_id: body.customer_id,
      currency: body.currency.toUpperCase(),
      next_triggered_by: "merchant",
      metadata: {
        payment_type: "monthly_rent",
        created_via: "admin_console",
        ...body.metadata,
      },
    };

    console.log("Creating payment consent with payload:", JSON.stringify(paymentConsentPayload, null, 2));

    const response = await fetch(
      "https://api-demo.airwallex.com/api/v1/pa/payment_consents/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
          "x-api-key": process.env.AIRWALLEX_API_KEY!,
        },
        body: JSON.stringify(paymentConsentPayload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Airwallex API error:", errorData);
      return NextResponse.json(
        { 
          error: errorData.message || "Failed to create payment consent",
          details: errorData
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      payment_consent_id: data.id,
      client_secret: data.client_secret,
      status: data.status,
      currency: data.currency,
      created_at: data.created_at,
      next_triggered_by: data.next_triggered_by,
      metadata: data.metadata,
    });

  } catch (error) {
    console.error("Payment consent creation error:", error);
    return NextResponse.json(
      { error: "Failed to create payment consent" },
      { status: 500 }
    );
  }
} 