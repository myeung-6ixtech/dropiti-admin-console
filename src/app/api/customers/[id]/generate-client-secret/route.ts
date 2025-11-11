import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "@/utils/auth";

// GET handler for generating client secret
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return await generateClientSecret(params);
}

// POST handler for generating client secret (for backward compatibility)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return await generateClientSecret(params);
}

async function generateClientSecret(params: Promise<{ id: string }>) {
  try {
    const token = await getBearerToken();
    if (!token) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    const { id: customerId } = await params;

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    console.log(`Generating client secret for customer: ${customerId}`);

    // First, let's try to get the customer data to see if client_secret is already available
    const customerResponse = await fetch(
      `https://api-demo.airwallex.com/api/v1/pa/customers/${customerId}`,
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

    if (customerResponse.ok) {
      const customerData = await customerResponse.json();
      console.log("Customer data retrieved:", customerData);
      
      // Check if client_secret is already available
      if (customerData.client_secret) {
        console.log("Client secret already available for customer:", customerId);
        return NextResponse.json({
          client_secret: customerData.client_secret
        });
      }
    }

    // If client_secret is not available, we might need to use a different approach
    // For now, let's return an error indicating that client secret generation is not supported
    return NextResponse.json(
      { 
        error: "Client secret generation not supported for existing customers",
        message: "Please use a newly created customer or check Airwallex documentation for client secret generation"
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Client secret generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate client secret" },
      { status: 500 }
    );
  }
} 