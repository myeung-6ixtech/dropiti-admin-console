import { NextResponse } from "next/server";

export async function POST() {
  try {
    const clientId = process.env.AIRWALLEX_CLIENT_ID;
    const apiKey = process.env.AIRWALLEX_API_KEY;

    // Create payment intent
    const response = await fetch(
      "https://api-demo.airwallex.com/api/v1/pa/payment_intents/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": clientId!,
          "x-api-key": apiKey!,
        },
        body: JSON.stringify({
          amount: 10.0,
          currency: "USD",
          order_id: `order-${Date.now()}`,
          descriptor: "Order Payment",
          metadata: {
            merchant_reference: `ref-${Date.now()}`,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to create payment intent");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: "Payment initialization failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "Payment endpoint ready" },
    { status: 200 }
  );
}
