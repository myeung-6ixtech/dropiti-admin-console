import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "@/utils/auth";

interface DepositPaymentRequest {
  customer_id: string;
  payment_intent: {
    amount: number;
    currency: string;
    capture_method: "manual" | "automatic";
    descriptor?: string;
    metadata?: Record<string, unknown>;
  };
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

    const body: DepositPaymentRequest = await request.json();

    // Validate required fields
    if (!body.customer_id || !body.payment_intent) {
      return NextResponse.json(
        { error: "Customer ID and payment intent details are required" },
        { status: 400 }
      );
    }

    if (!body.payment_intent.amount || !body.payment_intent.currency) {
      return NextResponse.json(
        { error: "Amount and currency are required" },
        { status: 400 }
      );
    }

    // Prepare payment intent payload according to Airwallex API format
    const paymentIntentPayload = {
      request_id: `deposit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amount: body.payment_intent.amount,
      currency: body.payment_intent.currency.toUpperCase(),
      merchant_order_id: `deposit-order-${Date.now()}`,
      customer_id: body.customer_id,
      descriptor: body.payment_intent.descriptor || `Deposit payment for property`,
      capture_method: body.payment_intent.capture_method || "manual",
      confirmation_method: "automatic",
      metadata: {
        payment_type: "deposit",
        created_via: "admin_console",
        ...body.payment_intent.metadata,
      },
    };

    console.log("Creating deposit payment intent with payload:", JSON.stringify(paymentIntentPayload, null, 2));

    const response = await fetch(
      "https://api-demo.airwallex.com/api/v1/pa/payment_intents/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
          "x-api-key": process.env.AIRWALLEX_API_KEY!,
        },
        body: JSON.stringify(paymentIntentPayload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Airwallex API error:", errorData);
      return NextResponse.json(
        { 
          error: errorData.message || "Failed to create deposit payment intent",
          details: errorData
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      payment_intent_id: data.id,
      client_secret: data.client_secret,
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      created_at: data.created_at,
      descriptor: data.descriptor,
      metadata: data.metadata,
    });

  } catch (error) {
    console.error("Deposit payment creation error:", error);
    return NextResponse.json(
      { error: "Failed to create deposit payment intent" },
      { status: 500 }
    );
  }
} 