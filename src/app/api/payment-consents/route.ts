import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "@/utils/auth";

// Get customer payment consents
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
    const paymentConsentId = searchParams.get("payment_consent_id");

    if (!customerId && !paymentConsentId) {
      return NextResponse.json(
        { error: "Either customer_id or payment_consent_id is required" },
        { status: 400 }
      );
    }

    let apiUrl = `https://api-demo.airwallex.com/api/v1/pa/payment_consents`;
    
    // If specific payment consent ID is provided
    if (paymentConsentId) {
      apiUrl += `/${paymentConsentId}`;
    } else if (customerId) {
      // List payment consents for customer
      apiUrl += `?customer_id=${customerId}`;
    }

    console.log("Fetching payment consents from:", apiUrl);

    const airwallexResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const responseData = await airwallexResponse.json();
    console.log("Airwallex payment consents response:", responseData);

    if (!airwallexResponse.ok) {
      console.error("Airwallex payment consents error:", responseData);
      return NextResponse.json(
        { 
          error: responseData.message || "Failed to fetch payment consents",
          details: responseData 
        },
        { status: airwallexResponse.status }
      );
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("Payment consent fetch error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Create a new payment consent (for storing the result from SDK)
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
    const { payment_consent_data, customer_id, metadata } = body;

    // Validate required fields
    if (!payment_consent_data || !customer_id) {
      return NextResponse.json(
        { error: "Payment consent data and customer ID are required" },
        { status: 400 }
      );
    }

    // Store the payment consent data (this would typically be stored in your database)
    // For now, we'll just return the data as confirmation
    console.log("Payment consent created successfully:", {
      customer_id,
      payment_consent_data,
      metadata
    });

    return NextResponse.json({
      success: true,
      payment_consent_id: payment_consent_data.id,
      customer_id,
      message: "Payment consent created successfully",
      metadata: {
        admin_created: true,
        created_via: "admin_console",
        creation_timestamp: new Date().toISOString(),
        ...metadata
      }
    });

  } catch (error: any) {
    console.error("Payment consent creation error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error.message 
      },
      { status: 500 }
    );
  }
} 