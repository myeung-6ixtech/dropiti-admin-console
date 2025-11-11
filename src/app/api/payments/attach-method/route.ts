import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "@/utils/auth";

interface AttachPaymentMethodRequest {
  payment_intent_id: string;
  payment_method_id: string;
  admin_override?: boolean;
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

    const body: AttachPaymentMethodRequest = await request.json();

    // Validate required fields
    if (!body.payment_intent_id || !body.payment_method_id) {
      return NextResponse.json(
        { error: "Payment intent ID and payment method ID are required" },
        { status: 400 }
      );
    }

    // Prepare payload for attaching payment method to payment intent
    const attachPayload = {
      request_id: `attach-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      payment_method_id: body.payment_method_id,
      metadata: {
        admin_override: body.admin_override || false,
        attached_via: "admin_console",
        attachment_timestamp: new Date().toISOString(),
      },
    };

    console.log("Attaching payment method with payload:", JSON.stringify(attachPayload, null, 2));

    // Call Airwallex API to attach payment method to payment intent
    const airwallexResponse = await fetch(
      `https://api-demo.airwallex.com/api/v1/pa/payment_intents/${body.payment_intent_id}/attach_payment_method`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
          "x-api-key": process.env.AIRWALLEX_API_KEY!,
        },
        body: JSON.stringify(attachPayload),
      }
    );

    const responseData = await airwallexResponse.json();
    console.log("Airwallex attach payment method response:", responseData);

    if (!airwallexResponse.ok) {
      console.error("Airwallex attach payment method error:", responseData);
      return NextResponse.json(
        { 
          error: responseData.message || "Failed to attach payment method",
          details: responseData 
        },
        { status: airwallexResponse.status }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      payment_intent: responseData,
      message: body.admin_override 
        ? "Payment method attached successfully via admin override"
        : "Payment method attached successfully",
    });

  } catch (error: any) {
    console.error("Attach payment method error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error.message 
      },
      { status: 500 }
    );
  }
} 