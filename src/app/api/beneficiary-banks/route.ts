import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "@/utils/auth";

export async function GET(request: NextRequest) {
  try {
    const token = await getBearerToken();
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters for the Airwallex API
    const bankCountryCode = searchParams.get("bank_country_code");
    const accountCurrency = searchParams.get("account_currency");
    const transferMethod = searchParams.get("transfer_method") || "LOCAL";
    const localClearingSystem = searchParams.get("local_clearing_system");
    const entityType = searchParams.get("entity_type") || "PERSONAL";
    const keyword = searchParams.get("keyword");
    const bankIdentifier = searchParams.get("bank_identifier");

    // Build query string for Airwallex API
    const queryParams = new URLSearchParams();
    if (bankCountryCode) queryParams.append("bank_country_code", bankCountryCode);
    if (accountCurrency) queryParams.append("account_currency", accountCurrency);
    queryParams.append("transfer_method", transferMethod);
    if (localClearingSystem) queryParams.append("local_clearing_system", localClearingSystem);
    queryParams.append("entity_type", entityType);
    if (keyword) queryParams.append("keyword", keyword);
    if (bankIdentifier) queryParams.append("bank_identifier", bankIdentifier);

    const response = await fetch(
      `https://api-demo.airwallex.com/api/v1/financial_institutions?${queryParams.toString()}`,
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
        { error: errorData.message || "Failed to retrieve supported banks" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Beneficiary banks retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve supported banks" },
      { status: 500 }
    );
  }
} 