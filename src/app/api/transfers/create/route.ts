import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "@/utils/auth";

// Calculate platform fee based on payment type
function calculatePlatformFee(amount: number, paymentType: string): number {
  switch (paymentType) {
    case 'deposit':
      return amount * 0.05; // 5% for deposits
    case 'monthly_rent':
      return amount * 0.03; // 3% for rent payments
    default:
      return amount * 0.04; // 4% for other payment types
  }
}

// Create transfer to beneficiary
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
    console.log("Received transfer creation request:", JSON.stringify(body, null, 2));
    
    const { 
      request_id,
      source_currency, 
      transfer_currency,
      transfer_amount,
      beneficiary, 
      reference,
      quote_id,
      reason,
      remarks,
      transfer_date,
      transfer_method,
      metadata = {}
    } = body;

    // Updated validation: beneficiary object is now required instead of destination
    if (!beneficiary || !transfer_amount || !source_currency || !transfer_currency) {
      console.error("Validation failed:", {
        beneficiary: !!beneficiary,
        transfer_amount: !!transfer_amount,
        source_currency: !!source_currency,
        transfer_currency: !!transfer_currency
      });
      return NextResponse.json(
        { error: "Beneficiary object, transfer amount, source currency, and transfer currency are required" },
        { status: 400 }
      );
    }

    // Validate currency format (3-letter ISO-4217)
    const currencyRegex = /^[A-Z]{3}$/;
    if (!currencyRegex.test(source_currency) || !currencyRegex.test(transfer_currency)) {
      console.error("Invalid currency format:", { source_currency, transfer_currency });
      return NextResponse.json(
        { error: "Source currency and transfer currency must be in 3-letter ISO-4217 format (e.g., USD, EUR, HKD)" },
        { status: 400 }
      );
    }

    // Calculate platform fee and transfer amount (if needed)
    const transferAmount = parseFloat(transfer_amount);
    const platformFee = calculatePlatformFee(transferAmount, metadata.payment_type || 'other');
    const finalTransferAmount = transferAmount - platformFee;

    // Prepare transfer payload according to Airwallex API
    const transferPayload = {
      request_id: request_id || `transfer-${Date.now()}`,
      source_currency: source_currency,
      transfer_currency: transfer_currency,
      currency: transfer_currency,
      transfer_amount: finalTransferAmount.toFixed(2), // Use transfer_amount as string
      amount: finalTransferAmount.toFixed(2), // This field should be the payout to our platform
      destination: beneficiary, // This field defines our account
      beneficiary: beneficiary, // Use the beneficiary object provided in the payload
      reference: reference || "Direct transfer",
      quote_id: quote_id || undefined,
      reason: reason || "other",
      remarks: remarks || "",
      transfer_date: transfer_date || new Date().toISOString().split('T')[0],
      transfer_method: transfer_method || "LOCAL",
      metadata: {
        ...metadata,
        original_amount: transferAmount,
        platform_fee: platformFee,
        transfer_amount: finalTransferAmount,
        created_by: "admin_dashboard",
        beneficiary_id: metadata.beneficiary_id // Keep the ID for reference if provided
      }
    };

    console.log("Transfer payload:", JSON.stringify(transferPayload, null, 2));

    const response = await fetch(
      "https://api-demo.airwallex.com/api/v1/transfers/create", 
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
          "x-api-key": process.env.AIRWALLEX_API_KEY!,
        },
        body: JSON.stringify(transferPayload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Transfer creation error:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to create transfer" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      ...data,
      platform_fee: platformFee,
      original_amount: transferAmount
    });
  } catch (error) {
    console.error("Transfer creation error:", error);
    return NextResponse.json(
      { error: "Failed to create transfer" },
      { status: 500 }
    );
  }
} 