import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "@/utils/auth";
import { BeneficiaryCreateRequest } from "@/types";

// Get list of beneficiaries or specific beneficiary
export async function GET(request: NextRequest) {
  try {
    const token = await getBearerToken();
    const { searchParams } = new URL(request.url);
    const beneficiaryId = searchParams.get("id");

    const endpoint = beneficiaryId
      ? `https://api-demo.airwallex.com/api/v1/beneficiaries/${beneficiaryId}`
      : "https://api-demo.airwallex.com/api/v1/beneficiaries";

    // Build query parameters for list endpoint
    const queryParams = new URLSearchParams();
    if (!beneficiaryId) {
      const fromDate = searchParams.get("from_date");
      const toDate = searchParams.get("to_date");
      const pageNum = searchParams.get("page_num");
      const pageSize = searchParams.get("page_size");
      const bankAccountNumber = searchParams.get("bank_account_number");
      const companyName = searchParams.get("company_name");
      const entityType = searchParams.get("entity_type");
      const nickName = searchParams.get("nick_name");

      if (fromDate) queryParams.append("from_date", fromDate);
      if (toDate) queryParams.append("to_date", toDate);
      if (pageNum) queryParams.append("page_num", pageNum);
      if (pageSize) queryParams.append("page_size", pageSize);
      if (bankAccountNumber) queryParams.append("bank_account_number", bankAccountNumber);
      if (companyName) queryParams.append("company_name", companyName);
      if (entityType) queryParams.append("entity_type", entityType);
      if (nickName) queryParams.append("nick_name", nickName);
    }

    const finalEndpoint = !beneficiaryId && queryParams.toString()
      ? `${endpoint}?${queryParams.toString()}`
      : endpoint;

    const response = await fetch(finalEndpoint, {
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
        { error: errorData.message || "Failed to retrieve beneficiary/beneficiaries" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Beneficiaries retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve beneficiary/beneficiaries" },
      { status: 500 }
    );
  }
}

// Create a new beneficiary
export async function POST(request: NextRequest) {
  try {
    const token = await getBearerToken();
    const body = await request.json();

    // Validate required fields
    if (!body.account_name || !body.account_number || !body.account_currency) {
      return NextResponse.json(
        { error: "Account name, number, and currency are required" },
        { status: 400 }
      );
    }

    if (!body.entity_type) {
      return NextResponse.json(
        { error: "Entity type is required" },
        { status: 400 }
      );
    }

    // Entity-specific validation
    if (body.entity_type === "PERSONAL" && (!body.first_name || !body.last_name)) {
      return NextResponse.json(
        { error: "First name and last name are required for personal accounts" },
        { status: 400 }
      );
    }

    if (body.entity_type === "COMPANY" && !body.company_name) {
      return NextResponse.json(
        { error: "Company name is required for company accounts" },
        { status: 400 }
      );
    }

    // Prepare the payload according to Airwallex API structure
    const payload: BeneficiaryCreateRequest = {
      beneficiary: {
        type: body.type || "BANK_ACCOUNT",
        entity_type: body.entity_type,
        bank_details: {
          account_currency: body.account_currency,
          account_name: body.account_name.trim(),
          account_number: body.account_number.trim(),
          bank_country_code: body.bank_country_code,
        },
      },
      transfer_methods: body.transfer_methods || ["LOCAL"],
    };

    // Add entity-specific fields
    if (body.entity_type === "PERSONAL") {
      payload.beneficiary.first_name = body.first_name?.trim();
      payload.beneficiary.last_name = body.last_name?.trim();
    } else {
      payload.beneficiary.company_name = body.company_name?.trim();
    }

    // Add nickname (use company name or full name as default)
    if (body.nickname) {
      payload.nickname = body.nickname.trim();
    } else {
      payload.nickname = body.entity_type === "COMPANY" 
        ? body.company_name?.trim() 
        : `${body.first_name?.trim() || ""} ${body.last_name?.trim() || ""}`.trim();
    }

    // Add optional bank details
    if (body.swift_code?.trim()) {
      payload.beneficiary.bank_details.swift_code = body.swift_code.trim();
    }
    if (body.bank_name?.trim()) {
      payload.beneficiary.bank_details.bank_name = body.bank_name.trim();
    }
    if (body.account_routing_type1?.trim()) {
      payload.beneficiary.bank_details.account_routing_type1 = body.account_routing_type1.trim();
    }
    if (body.account_routing_value1?.trim()) {
      payload.beneficiary.bank_details.account_routing_value1 = body.account_routing_value1.trim();
    }
    if (body.account_routing_type2?.trim()) {
      payload.beneficiary.bank_details.account_routing_type2 = body.account_routing_type2.trim();
    }
    if (body.account_routing_value2?.trim()) {
      payload.beneficiary.bank_details.account_routing_value2 = body.account_routing_value2.trim();
    }
    if (body.local_clearing_system?.trim()) {
      payload.beneficiary.bank_details.local_clearing_system = body.local_clearing_system.trim();
    }

    // Add address if provided
    if (body.street_address?.trim() || body.city?.trim()) {
      payload.beneficiary.address = {};
      if (body.street_address?.trim()) payload.beneficiary.address.street_address = body.street_address.trim();
      if (body.city?.trim()) payload.beneficiary.address.city = body.city.trim();
      if (body.state?.trim()) payload.beneficiary.address.state = body.state.trim();
      if (body.postcode?.trim()) payload.beneficiary.address.postcode = body.postcode.trim();
      if (body.country_code?.trim()) payload.beneficiary.address.country_code = body.country_code.trim();
    }

    // Add additional info if provided
    if (body.personal_email?.trim() || body.external_identifier?.trim()) {
      payload.beneficiary.additional_info = {};
      if (body.personal_email?.trim()) payload.beneficiary.additional_info.personal_email = body.personal_email.trim();
      if (body.external_identifier?.trim()) payload.beneficiary.additional_info.external_identifier = body.external_identifier.trim();
    }

    console.log("Beneficiary creation payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(
      "https://api-demo.airwallex.com/api/v1/beneficiaries",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
          "x-api-key": process.env.AIRWALLEX_API_KEY!,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Beneficiary creation error response:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to create beneficiary" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Beneficiary creation error:", error);
    return NextResponse.json(
      { error: "Failed to create beneficiary" },
      { status: 500 }
    );
  }
}

// Update beneficiary
export async function PUT(request: NextRequest) {
  try {
    const token = await getBearerToken();
    const { searchParams } = new URL(request.url);
    const beneficiaryId = searchParams.get("id");

    if (!beneficiaryId) {
      return NextResponse.json(
        { error: "Beneficiary ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const response = await fetch(
      `https://api-demo.airwallex.com/api/v1/beneficiaries/${beneficiaryId}`,
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
        { error: errorData.message || "Failed to update beneficiary" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Beneficiary update error:", error);
    return NextResponse.json(
      { error: "Failed to update beneficiary" },
      { status: 500 }
    );
  }
}

// Delete beneficiary
export async function DELETE(request: NextRequest) {
  try {
    const token = await getBearerToken();
    const { searchParams } = new URL(request.url);
    const beneficiaryId = searchParams.get("id");

    if (!beneficiaryId) {
      return NextResponse.json(
        { error: "Beneficiary ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api-demo.airwallex.com/api/v1/beneficiaries/${beneficiaryId}`,
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
        { error: errorData.message || "Failed to delete beneficiary" },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: "Beneficiary deleted successfully" });
  } catch (error) {
    console.error("Beneficiary deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete beneficiary" },
      { status: 500 }
    );
  }
} 