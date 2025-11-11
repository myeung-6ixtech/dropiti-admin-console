import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "@/utils/auth";
import axios from "axios";
import { 
  PaymentIntentCreateRequest, 
  PaymentIntentUpdateRequest, 
  ApiResponse 
} from "@/types";

// Get payment details or list all payments
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
    const paymentId = searchParams.get("id");

    if (paymentId) {
      // Get specific payment details with enhanced information
      const response = await fetch(
        `https://api-demo.airwallex.com/api/v1/pa/payment_intents/${paymentId}`,
        {
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
          { error: errorData.message || "Failed to retrieve payment" },
          { status: response.status }
        );
      }

      const paymentData = await response.json();

      // Fetch customer details if customer_id exists
      let customerData = null;
      if (paymentData.customer_id) {
        try {
          const customerResponse = await fetch(
            `https://api-demo.airwallex.com/api/v1/pa/customers/${paymentData.customer_id}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
                "x-api-key": process.env.AIRWALLEX_API_KEY!,
              },
            }
          );
          if (customerResponse.ok) {
            customerData = await customerResponse.json();
          }
        } catch (error) {
          console.warn("Failed to fetch customer data:", error);
        }
      }

      // Create payment timeline from status history
      const timeline = [
        {
          status: "created",
          timestamp: paymentData.created_at,
          message: "Payment intent created"
        }
      ];

      if (paymentData.status === "succeeded") {
        timeline.push({
          status: "succeeded",
          timestamp: paymentData.updated_at,
          message: "Payment completed successfully"
        });
      } else if (paymentData.status === "failed") {
        timeline.push({
          status: "failed",
          timestamp: paymentData.updated_at,
          message: paymentData.failure_reason || "Payment failed"
        });
      } else if (paymentData.status === "requires_capture") {
        timeline.push({
          status: "requires_capture",
          timestamp: paymentData.updated_at,
          message: "Payment authorized, awaiting capture"
        });
      }

      const enhancedPayment = {
        ...paymentData,
        customer: customerData ? {
          id: customerData.id,
          name: `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim(),
          email: customerData.email
        } : null,
        timeline,
        method: paymentData.payment_method?.type || "Not specified"
      };

      return NextResponse.json(enhancedPayment);
    } else {
      // List all payments with optional filters
      const page = searchParams.get("page") || "0";
      const limit = searchParams.get("limit") || "20";
      const status = searchParams.get("status");
      const merchant_order_id = searchParams.get("merchant_order_id");
      const customer_id = searchParams.get("customer_id");
      const created_before = searchParams.get("created_before");
      const created_after = searchParams.get("created_after");

      let endpoint = "https://api-demo.airwallex.com/api/v1/pa/payment_intents";
      const queryParams: string[] = [];

      queryParams.push(`page=${page}`);
      queryParams.push(`limit=${limit}`);
      
      if (status) queryParams.push(`status=${status}`);
      if (merchant_order_id) queryParams.push(`merchant_order_id=${merchant_order_id}`);
      if (customer_id) queryParams.push(`customer_id=${customer_id}`);
      if (created_before) queryParams.push(`created_before=${created_before}`);
      if (created_after) queryParams.push(`created_after=${created_after}`);
      
      if (queryParams.length > 0) {
        endpoint += `?${queryParams.join('&')}`;
      }

      const response = await fetch(endpoint, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
          "x-api-key": process.env.AIRWALLEX_API_KEY!,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json(
          { error: errorData.message || "Failed to retrieve payments" },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error("Payment retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve payment(s)" },
      { status: 500 }
    );
  }
}

// Update payment
export async function PUT(request: NextRequest) {
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

    const body: PaymentIntentUpdateRequest = await request.json();

    // Prepare update payload
    const updatePayload = {
      request_id: `update-${Date.now()}`,
      ...(body.descriptor && { descriptor: body.descriptor }),
      ...(body.merchant_order_id && { merchant_order_id: body.merchant_order_id }),
      ...(body.customer_id && { customer_id: body.customer_id }),
      ...(body.metadata && { metadata: body.metadata })
    };

    // Try different methods to update the payment intent
    let response;
    let errorData;
    
    // First try PUT
    response = await fetch(
      `https://api-demo.airwallex.com/api/v1/pa/payment_intents/${paymentId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
          "x-api-key": process.env.AIRWALLEX_API_KEY!,
        },
        body: JSON.stringify(updatePayload),
      }
    );

    // If PUT fails, try PATCH
    if (!response.ok) {
      response = await fetch(
        `https://api-demo.airwallex.com/api/v1/pa/payment_intents/${paymentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
            "x-api-key": process.env.AIRWALLEX_API_KEY!,
          },
          body: JSON.stringify(updatePayload),
        }
      );
    }

    // If both fail, try POST with update endpoint
    if (!response.ok) {
      response = await fetch(
        `https://api-demo.airwallex.com/api/v1/pa/payment_intents/${paymentId}/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
            "x-api-key": process.env.AIRWALLEX_API_KEY!,
          },
          body: JSON.stringify(updatePayload),
        }
      );
    }

    if (!response.ok) {
      errorData = await response.json();
      console.error("Payment update error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      return NextResponse.json(
        { error: errorData.message || `Failed to update payment (${response.status})` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Payment update successful:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Payment update error:", error);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
}

// Create payment intent
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
    const action = searchParams.get("action");
    const paymentIntentId = searchParams.get("id");

    if (action && paymentIntentId) {
      // Handle payment intent actions (capture, cancel, confirm)
      return await handlePaymentIntentAction(token, paymentIntentId, action, request);
    }

    if (action && !paymentIntentId) {
      return NextResponse.json(
        { error: "Payment Intent ID is required for action operations" },
        { status: 400 }
      );
    }

    // Create new payment intent
    const body: PaymentIntentCreateRequest = await request.json();
    
    // Validate required fields
    if (!body.amount || !body.currency) {
      return NextResponse.json(
        { error: "Amount and currency are required" },
        { status: 400 }
      );
    }

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
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}

// Handle payment intent actions (capture, cancel, confirm)
async function handlePaymentIntentAction(
  token: string,
  paymentIntentId: string,
  action: string,
  request: NextRequest
) {
  try {
    let endpoint: string;
    const method = "POST";
    let body: any = {};

    switch (action) {
      case "capture":
        endpoint = `https://api-demo.airwallex.com/api/v1/pa/payment_intents/${paymentIntentId}/capture`;
        const captureBody = await request.json();
        body = {
          amount: captureBody.amount,
          descriptor: captureBody.descriptor,
        };
        break;

      case "cancel":
        endpoint = `https://api-demo.airwallex.com/api/v1/pa/payment_intents/${paymentIntentId}/cancel`;
        const cancelBody = await request.json();
        body = {
          cancellation_reason: cancelBody.cancellation_reason || "requested_by_customer",
        };
        break;

      case "confirm":
        endpoint = `https://api-demo.airwallex.com/api/v1/pa/payment_intents/${paymentIntentId}/confirm`;
        const confirmBody = await request.json();
        body = {
          customer_id: confirmBody.customer_id,
          payment_method_id: confirmBody.payment_method_id,
          payment_method: confirmBody.payment_method,
          payment_method_options: confirmBody.payment_method_options,
          return_url: confirmBody.return_url,
        };
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported action: ${action}` },
          { status: 400 }
        );
    }

    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
        "x-api-key": process.env.AIRWALLEX_API_KEY!,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: `Failed to ${action} payment intent` },
      { status: 500 }
    );
  }
}