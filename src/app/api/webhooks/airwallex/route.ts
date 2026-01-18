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

// Auto-create transfer for successful payments
async function createAutoTransfer(paymentData: Record<string, unknown>) {
  try {
    const token = await getBearerToken();
    if (!token) {
      console.error("Authentication failed for auto-transfer");
      return;
    }

    const metadata = (paymentData.metadata || {}) as Record<string, unknown>;
    
    // Only auto-transfer if we have beneficiary info in metadata
    if (!metadata.beneficiary_id) {
      console.log("No beneficiary_id in metadata, skipping auto-transfer");
      return;
    }

    const paymentType = (metadata.payment_type as string) || 'other';
    const amount = paymentData.amount as number;
    const platformFee = calculatePlatformFee(amount, paymentType);
    const transferAmount = amount - platformFee;

    const transferPayload = {
      request_id: `auto-transfer-${Date.now()}`,
      source_currency: paymentData.currency,
      transfer_currency: paymentData.currency,
      transfer_amount: transferAmount,
      beneficiary_id: metadata.beneficiary_id as string,
      reference: `Auto-transfer for payment ${paymentData.id}`,
      metadata: {
        ...metadata,
        payment_intent_id: paymentData.id,
        payment_type: paymentType,
        original_amount: paymentData.amount,
        platform_fee: platformFee,
        transfer_amount: transferAmount,
        auto_created: true,
        created_by: "webhook_handler"
      }
    };

    console.log("Creating auto-transfer:", JSON.stringify(transferPayload, null, 2));

    const response = await fetch(
      "https://api-demo.airwallex.com/api/v1/transfers",
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
      console.error("Auto-transfer creation failed:", errorData);
      return;
    }

    const transferData = await response.json();
    console.log("Auto-transfer created successfully:", transferData.id);
    
    return transferData;
  } catch (error) {
    console.error("Auto-transfer creation error:", error);
  }
}

// Webhook handler for Airwallex events
export async function POST(request: NextRequest) {
  try {
    const event = await request.json();
    
    // Log the webhook event (without sensitive data)
    console.log(`Webhook received: ${event.type}`);

    // Process different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log(`Payment succeeded: ${event.data.id}`);
        
        // Auto-create transfer to beneficiary
        await createAutoTransfer(event.data);
        break;

      case 'payment_intent.requires_customer_action':
        console.log(`Payment requires customer action: ${event.data.id}`);
        // Handle 3DS or other customer actions
        break;

      case 'payment_intent.failed':
        console.log(`Payment failed: ${event.data.id}`);
        // Handle payment failure
        break;

      case 'payment_consent.verified':
        console.log(`Payment consent verified: ${event.data.id}`);
        // Handle payment consent verification
        break;

      case 'transfer.sent':
        console.log(`Transfer sent: ${event.data.id}`);
        // Handle successful transfer
        break;

      case 'transfer.failed':
        console.log(`Transfer failed: ${event.data.id}`);
        // Handle transfer failure
        break;

      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    return NextResponse.json(
      { message: "Webhook processed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Webhook processing error:", error);
    
    // Return 200 to acknowledge receipt even if processing failed
    // This prevents Airwallex from retrying the webhook indefinitely
    return NextResponse.json(
      { message: "Webhook received, processing failed" },
      { status: 200 }
    );
  }
} 