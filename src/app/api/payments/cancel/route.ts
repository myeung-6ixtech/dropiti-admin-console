import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "@/utils/auth";

interface CancelPaymentRequest {
  payment_intent_id: string;
  cancellation_reason?: string;
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

    const body: CancelPaymentRequest = await request.json();

    // Validate required fields
    if (!body.payment_intent_id) {
      return NextResponse.json(
        { error: "Payment intent ID is required" },
        { status: 400 }
      );
    }

    // Prepare cancellation payload for Airwallex API
    const cancellationPayload = {
      request_id: `cancel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      cancellation_reason: body.cancellation_reason || "admin_requested",
      metadata: {
        cancelled_via: "admin_console",
        cancelled_by: "admin_user",
        cancellation_timestamp: new Date().toISOString(),
        ...body.metadata,
      },
    };

    console.log("Canceling payment with payload:", JSON.stringify(cancellationPayload, null, 2));

    // Call Airwallex API to cancel payment intent
    const airwallexResponse = await fetch(
      `https://api-demo.airwallex.com/api/v1/pa/payment_intents/${body.payment_intent_id}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
          "x-api-key": process.env.AIRWALLEX_API_KEY!,
        },
        body: JSON.stringify(cancellationPayload),
      }
    );

    const responseData = await airwallexResponse.json();
    console.log("Airwallex cancel payment response:", responseData);

    if (!airwallexResponse.ok) {
      console.error("Airwallex cancel payment error:", responseData);
      
      // Handle specific error cases
      if (airwallexResponse.status === 400 && responseData.code === "invalid_request_error") {
        return NextResponse.json(
          { 
            error: "Payment cannot be cancelled in its current state",
            details: responseData.message || "Payment may already be processed or cancelled"
          },
          { status: 400 }
        );
      }
      
      if (airwallexResponse.status === 404) {
        return NextResponse.json(
          { 
            error: "Payment not found",
            details: "The specified payment intent does not exist"
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          error: responseData.message || "Failed to cancel payment",
          details: responseData 
        },
        { status: airwallexResponse.status }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      payment_intent: responseData,
      message: "Payment cancelled successfully",
      status: responseData.status,
      cancelled_at: responseData.updated_at || new Date().toISOString(),
    });

  } catch (error: unknown) {
    console.error("Payment cancellation error:", error);
    const errorObj = error as { message?: string };
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: errorObj.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = await getBearerToken();
    if (!token) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get("payment_intent_id");

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment intent ID is required" },
        { status: 400 }
      );
    }

    // Check if payment can be cancelled by fetching its current status
    const airwallexResponse = await fetch(
      `https://api-demo.airwallex.com/api/v1/pa/payment_intents/${paymentIntentId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
          "x-api-key": process.env.AIRWALLEX_API_KEY!,
        },
      }
    );

    if (!airwallexResponse.ok) {
      return NextResponse.json(
        { error: "Failed to check payment status" },
        { status: airwallexResponse.status }
      );
    }

    const paymentData = await airwallexResponse.json();
    
    // Determine if payment can be cancelled based on status
    const cancellableStatuses = [
      "requires_payment_method",
      "requires_confirmation",
      "requires_capture",
      "processing"
    ];
    
    const canCancel = cancellableStatuses.includes(paymentData.status);
    
    return NextResponse.json({
      can_cancel: canCancel,
      current_status: paymentData.status,
      reason: canCancel 
        ? "Payment can be cancelled" 
        : `Payment cannot be cancelled in '${paymentData.status}' status`,
    });

  } catch (error: unknown) {
    console.error("Payment cancellation check error:", error);
    const errorObj = error as { message?: string };
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: errorObj.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
} 