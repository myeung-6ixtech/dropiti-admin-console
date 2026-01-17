import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "@/utils/auth";
import { CustomerData } from "@/types";

// Handle both list and single customer requests
export async function GET(request: NextRequest) {
  try {
    const token = await getBearerToken();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("id");

    const endpoint = customerId
      ? `https://api-demo.airwallex.com/api/v1/pa/customers/${customerId}`
      : "https://api-demo.airwallex.com/api/v1/pa/customers";

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
        { error: errorData.message || "Failed to fetch customer(s)" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Customer GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer(s)" },
      { status: 500 }
    );
  }
}

// Create new customer
export async function POST(request: NextRequest) {
  try {
    const token = await getBearerToken();
    const body: CustomerData = await request.json();

    // Validate required fields
    if (!body.merchant_customer_id?.trim() || !body.first_name?.trim() || !body.last_name?.trim() || !body.email?.trim()) {
      return NextResponse.json(
        { error: "Merchant customer ID, first name, last name, and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email.trim())) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Prepare customer payload for Airwallex
    const customerPayload: unknown = {
      request_id: `req_${Date.now()}`,
      merchant_customer_id: body.merchant_customer_id.trim(),
      first_name: body.first_name.trim(),
      last_name: body.last_name.trim(),
      email: body.email.trim(),
    };

    // Add optional fields if provided
    if (body.phone_number?.trim()) {
      customerPayload.phone_number = body.phone_number.trim();
    }

    if (body.business_name?.trim()) {
      customerPayload.business_name = body.business_name.trim();
    }

    // Add address if any address field is provided
    if (body.address && Object.values(body.address).some(val => val?.trim())) {
      customerPayload.address = {};
      if (body.address.street?.trim()) customerPayload.address.street = body.address.street.trim();
      if (body.address.city?.trim()) customerPayload.address.city = body.address.city.trim();
      if (body.address.state?.trim()) customerPayload.address.state = body.address.state.trim();
      if (body.address.postcode?.trim()) customerPayload.address.postcode = body.address.postcode.trim();
      if (body.address.country_code?.trim()) customerPayload.address.country_code = body.address.country_code.trim();
    }

    // Add metadata if provided
    if (body.metadata && Object.keys(body.metadata).length > 0) {
      const cleanMetadata = Object.entries(body.metadata)
        .filter(([key, value]) => key.trim() && value.trim())
        .reduce((acc, [key, value]) => ({ ...acc, [key.trim()]: value.trim() }), {});
      
      if (Object.keys(cleanMetadata).length > 0) {
        customerPayload.metadata = cleanMetadata;
      }
    }

    console.log("Creating customer with payload:", customerPayload);

    const response = await fetch(
      "https://api-demo.airwallex.com/api/v1/pa/customers/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
          "x-api-key": process.env.AIRWALLEX_API_KEY!,
        },
        body: JSON.stringify(customerPayload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Airwallex API Error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      return NextResponse.json(
        { error: errorData.message || "Failed to create customer" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Customer creation error:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}

// Update customer
export async function PUT(request: NextRequest) {
  try {
    const token = await getBearerToken();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("id");

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    const body: Partial<CustomerData> = await request.json();

    // Validate required fields if provided
    if (body.first_name !== undefined && !body.first_name?.trim()) {
      return NextResponse.json(
        { error: "First name cannot be empty" },
        { status: 400 }
      );
    }

    if (body.last_name !== undefined && !body.last_name?.trim()) {
      return NextResponse.json(
        { error: "Last name cannot be empty" },
        { status: 400 }
      );
    }

    if (body.email !== undefined) {
      if (!body.email?.trim()) {
        return NextResponse.json(
          { error: "Email cannot be empty" },
          { status: 400 }
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email.trim())) {
        return NextResponse.json(
          { error: "Please provide a valid email address" },
          { status: 400 }
        );
      }
    }

    // Prepare update payload for Airwallex
    const updatePayload: Record<string, unknown> = {
      request_id: `req_${Date.now()}`,
    };

    // Add fields that are being updated
    if (body.first_name !== undefined) updatePayload.first_name = body.first_name.trim();
    if (body.last_name !== undefined) updatePayload.last_name = body.last_name.trim();
    if (body.email !== undefined) updatePayload.email = body.email.trim();

    // Handle optional fields
    if (body.phone_number !== undefined) {
      updatePayload.phone_number = body.phone_number?.trim() || null;
    }

    if (body.business_name !== undefined) {
      updatePayload.business_name = body.business_name?.trim() || null;
    }

    // Handle address update
    if (body.address !== undefined) {
      if (Object.values(body.address).some(val => val?.trim())) {
        updatePayload.address = {};
        if (body.address.street !== undefined) updatePayload.address.street = body.address.street?.trim() || null;
        if (body.address.city !== undefined) updatePayload.address.city = body.address.city?.trim() || null;
        if (body.address.state !== undefined) updatePayload.address.state = body.address.state?.trim() || null;
        if (body.address.postcode !== undefined) updatePayload.address.postcode = body.address.postcode?.trim() || null;
        if (body.address.country_code !== undefined) updatePayload.address.country_code = body.address.country_code?.trim() || null;
      } else {
        updatePayload.address = null;
      }
    }

    // Handle metadata update
    if (body.metadata !== undefined) {
      if (Object.keys(body.metadata).length > 0) {
        const cleanMetadata = Object.entries(body.metadata)
          .filter(([key, value]) => key.trim() && value.trim())
          .reduce((acc, [key, value]) => ({ ...acc, [key.trim()]: value.trim() }), {});
        
        updatePayload.metadata = Object.keys(cleanMetadata).length > 0 ? cleanMetadata : null;
      } else {
        updatePayload.metadata = null;
      }
    }

    const response = await fetch(
      `https://api-demo.airwallex.com/api/v1/pa/customers/${customerId}/update`,
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

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to update customer" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Customer update error:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// Delete customer
export async function DELETE(request: NextRequest) {
  try {
    const token = await getBearerToken();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("id");

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api-demo.airwallex.com/api/v1/pa/customers/${customerId}`,
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
        { error: errorData.message || "Failed to delete customer" },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Customer deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
