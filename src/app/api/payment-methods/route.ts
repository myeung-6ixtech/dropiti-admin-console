import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "@/utils/auth";

interface PaymentMethodRequest {
  customer_id: string;
  type: "card" | "bank_account";
  card?: {
    number: string;
    expiry_month: string;
    expiry_year: string;
    cvc: string;
    name: string;
  };
  bank_account?: {
    account_number: string;
    routing_number: string;
    account_holder_name: string;
    account_type: "checking" | "savings";
  };
  billing_address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
      country_code: string;
  };
  admin_override?: boolean;
}

// Get customer payment methods
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
    const customerId = searchParams.get("customer_id");
    const paymentMethodId = searchParams.get("payment_method_id");

    if (!customerId && !paymentMethodId) {
      return NextResponse.json(
        { error: "Either customer_id or payment_method_id is required" },
        { status: 400 }
      );
    }

    let apiUrl = `https://api-demo.airwallex.com/api/v1/pa/payment_methods`;
    
    // If specific payment method ID is provided
    if (paymentMethodId) {
      apiUrl += `/${paymentMethodId}`;
    } else if (customerId) {
      // List payment methods for customer
      apiUrl += `?customer_id=${customerId}`;
    }

    console.log("Fetching payment methods from:", apiUrl);

    const airwallexResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const responseData = await airwallexResponse.json();
    console.log("Airwallex payment methods response:", responseData);

    if (!airwallexResponse.ok) {
      console.error("Airwallex payment methods error:", responseData);
      return NextResponse.json(
        { 
          error: responseData.message || "Failed to fetch payment methods",
          details: responseData 
        },
        { status: airwallexResponse.status }
      );
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("Payment method fetch error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Create/store a new payment method
export async function POST(request: NextRequest) {
  try {
    const token = await getBearerToken();
    if (!token) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Check if this is a request to store payment method data from Airwallex SDK
    if (body.payment_method_data && body.customer_id) {
      // Store the payment method data (this would typically be stored in your database)
      console.log("Payment method created successfully:", {
        customer_id: body.customer_id,
        payment_method_data: body.payment_method_data,
        metadata: body.metadata
      });

      return NextResponse.json({
        success: true,
        payment_method_id: body.payment_method_data.id,
        customer_id: body.customer_id,
        message: "Payment method stored successfully",
        metadata: {
          admin_created: true,
          created_via: "admin_console",
          creation_timestamp: new Date().toISOString(),
          ...body.metadata
        }
      });
    }

    // Original payment method creation logic for raw card details
    const paymentMethodBody: PaymentMethodRequest = body;

    // Validate required fields
    if (!paymentMethodBody.customer_id || !paymentMethodBody.type) {
      return NextResponse.json(
        { error: "Customer ID and payment method type are required" },
        { status: 400 }
      );
    }

    if (paymentMethodBody.type === "card" && !paymentMethodBody.card) {
      return NextResponse.json(
        { error: "Card details are required for card payment method" },
        { status: 400 }
      );
    }

    if (paymentMethodBody.type === "bank_account" && !paymentMethodBody.bank_account) {
      return NextResponse.json(
        { error: "Bank account details are required for bank account payment method" },
        { status: 400 }
      );
    }

    // Prepare payment method payload for Airwallex API
    const paymentMethodPayload: any = {
      request_id: `pm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      customer_id: paymentMethodBody.customer_id,
      type: paymentMethodBody.type,
    };

    // Add card details if provided
    if (paymentMethodBody.type === "card" && paymentMethodBody.card) {
      paymentMethodPayload.card = {
        number: paymentMethodBody.card.number.replace(/\s/g, ""), // Remove spaces
        expiry_month: paymentMethodBody.card.expiry_month.padStart(2, "0"), // Ensure 2 digits
          expiry_year: paymentMethodBody.card.expiry_year,
          cvc: paymentMethodBody.card.cvc,
        name: paymentMethodBody.card.name,
      };

      // Add billing address if provided
      if (paymentMethodBody.billing_address) {
        paymentMethodPayload.billing = {
          address: paymentMethodBody.billing_address,
        };
      }
    }

    // Add bank account details if provided
    if (paymentMethodBody.type === "bank_account" && paymentMethodBody.bank_account) {
      paymentMethodPayload.bank_account = {
        account_number: paymentMethodBody.bank_account.account_number,
        routing_number: paymentMethodBody.bank_account.routing_number,
        account_holder_name: paymentMethodBody.bank_account.account_holder_name,
        account_type: paymentMethodBody.bank_account.account_type,
      };
    }

    // Add admin override metadata
    if (paymentMethodBody.admin_override) {
      paymentMethodPayload.metadata = {
        admin_override: true,
        admin_created: true,
        created_via: "admin_console",
        creation_timestamp: new Date().toISOString(),
      };
    }

    console.log("Creating payment method with payload:", JSON.stringify(paymentMethodPayload, null, 2));

    // Call Airwallex API to create payment method
    const airwallexResponse = await fetch(
      `https://api-demo.airwallex.com/api/v1/pa/payment_methods/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
          "x-api-key": process.env.AIRWALLEX_API_KEY!,
        },
        body: JSON.stringify(paymentMethodPayload),
      }
    );

    const responseData = await airwallexResponse.json();
    console.log("Airwallex payment method response:", responseData);

    if (!airwallexResponse.ok) {
      console.error("Airwallex payment method error:", responseData);
      return NextResponse.json(
        { 
          error: responseData.message || "Failed to create payment method",
          details: responseData 
        },
        { status: airwallexResponse.status }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      payment_method_id: responseData.id,
      payment_method: responseData,
      message: paymentMethodBody.admin_override 
        ? "Payment method created successfully via admin override"
        : "Payment method created successfully",
    });

  } catch (error: any) {
    console.error("Payment method creation error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Update payment method
export async function PUT(request: NextRequest) {
  try {
    const token = await getBearerToken();
    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get("id");

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "Payment Method ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const response = await fetch(
      `https://api-demo.airwallex.com/api/v1/pa/payment_methods/${paymentMethodId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
          "x-api-key": process.env.AIRWALLEX_API_KEY!,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to update payment method" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Payment method update error:", error);
    return NextResponse.json(
      { error: "Failed to update payment method" },
      { status: 500 }
    );
  }
}

// Delete payment method
export async function DELETE(request: NextRequest) {
  try {
    const token = await getBearerToken();
    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get("id");

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "Payment Method ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api-demo.airwallex.com/api/v1/pa/payment_methods/${paymentMethodId}`,
      {
        method: "DELETE",
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
        { error: errorData.message || "Failed to delete payment method" },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: "Payment method deleted successfully" });
  } catch (error) {
    console.error("Payment method deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete payment method" },
      { status: 500 }
    );
  }
} 