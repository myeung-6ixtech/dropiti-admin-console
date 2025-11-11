import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "@/utils/auth";

interface FundsSplitCreateRequest {
  payment_intent_id: string;
  splits: Array<{
    account_id: string;
    amount: number;
    currency: string;
    auto_release?: boolean;
    reference?: string;
  }>;
}

interface FundsSplitReleaseRequest {
  split_id: string;
}

// Get funds split information
export async function GET(request: NextRequest) {
  try {
    const token = await getBearerToken();
    const { searchParams } = new URL(request.url);
    const splitId = searchParams.get("split_id");
    const paymentIntentId = searchParams.get("payment_intent_id");

    let endpoint = "https://api-demo.airwallex.com/api/v1/payment_intents";
    
    if (splitId) {
      endpoint = `https://api-demo.airwallex.com/api/v1/payment_intents/splits/${splitId}`;
    } else if (paymentIntentId) {
      endpoint = `https://api-demo.airwallex.com/api/v1/payment_intents/${paymentIntentId}/splits`;
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
        { error: errorData.message || "Failed to retrieve funds split information" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Funds split retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve funds split information" },
      { status: 500 }
    );
  }
}

// Create funds split
export async function POST(request: NextRequest) {
  try {
    const token = await getBearerToken();
    const body: FundsSplitCreateRequest = await request.json();

    // Validate required fields
    if (!body.payment_intent_id || !body.splits || body.splits.length === 0) {
      return NextResponse.json(
        { error: "Payment intent ID and splits array are required" },
        { status: 400 }
      );
    }

    // Validate each split
    for (const split of body.splits) {
      if (!split.account_id || !split.amount || !split.currency) {
        return NextResponse.json(
          { error: "Each split must have account_id, amount, and currency" },
          { status: 400 }
        );
      }
    }

    // Prepare funds split payload for Airwallex
    const splitPayload = {
      payment_intent_id: body.payment_intent_id,
      splits: body.splits.map(split => ({
        account_id: split.account_id,
        amount: split.amount,
        currency: split.currency,
        auto_release: split.auto_release !== undefined ? split.auto_release : true,
        reference: split.reference || `SPLIT_${Date.now()}`,
      })),
    };

    const response = await fetch(
      "https://api-demo.airwallex.com/api/v1/payment_intents/splits",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
          "x-api-key": process.env.AIRWALLEX_API_KEY!,
        },
        body: JSON.stringify(splitPayload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to create funds split" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Funds split creation error:", error);
    return NextResponse.json(
      { error: "Failed to create funds split" },
      { status: 500 }
    );
  }
}

// Release funds split (for manual release splits)
export async function PATCH(request: NextRequest) {
  try {
    const token = await getBearerToken();
    const body: FundsSplitReleaseRequest = await request.json();

    if (!body.split_id) {
      return NextResponse.json(
        { error: "Split ID is required for release operation" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api-demo.airwallex.com/api/v1/payment_intents/splits/${body.split_id}/release`,
      {
        method: "POST",
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
        { error: errorData.message || "Failed to release funds split" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Funds split release error:", error);
    return NextResponse.json(
      { error: "Failed to release funds split" },
      { status: 500 }
    );
  }
}

// Reverse funds split
export async function DELETE(request: NextRequest) {
  try {
    const token = await getBearerToken();
    const { searchParams } = new URL(request.url);
    const splitId = searchParams.get("split_id");
    const body = await request.json();

    if (!splitId) {
      return NextResponse.json(
        { error: "Split ID is required for reverse operation" },
        { status: 400 }
      );
    }

    const reversePayload = {
      amount: body.amount,
      currency: body.currency,
      reason: body.reason || "Refund or chargeback adjustment",
    };

    const response = await fetch(
      `https://api-demo.airwallex.com/api/v1/payment_intents/splits/${splitId}/reverse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
          "x-api-key": process.env.AIRWALLEX_API_KEY!,
        },
        body: JSON.stringify(reversePayload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to reverse funds split" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Funds split reverse error:", error);
    return NextResponse.json(
      { error: "Failed to reverse funds split" },
      { status: 500 }
    );
  }
} 