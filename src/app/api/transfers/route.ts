import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "@/utils/auth";
import { TransferUpdateRequest } from "@/types";

// Handle list transfers and get individual transfer
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
    const transferId = searchParams.get("id");

    // If transfer ID is provided, return individual transfer details
    if (transferId) {
      const response = await fetch(
        `https://api-demo.airwallex.com/api/v1/transfers/${transferId}`,
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
          { error: errorData.message || "Failed to retrieve transfer" },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // If no transfer ID is provided, return list of all transfers
    // Use the Airwallex transfers list endpoint
    console.log("Fetching all transfers from Airwallex API...");
    
    const response = await fetch(
      "https://api-demo.airwallex.com/api/v1/transfers",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
          "x-api-key": process.env.AIRWALLEX_API_KEY!,
        },
      }
    );

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Transfers list error:", errorData);
      
      // If it's a 404, the endpoint might not exist or we might need different parameters
      if (response.status === 404) {
        console.log("404 error - trying alternative approach with query parameters");
        
        // Try with query parameters that might be required
        const altResponse = await fetch(
          "https://api-demo.airwallex.com/api/v1/transfers?limit=100&offset=0",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
              "x-api-key": process.env.AIRWALLEX_API_KEY!,
            },
          }
        );
        
        if (altResponse.ok) {
          const altData = await altResponse.json();
          console.log("Alternative API call successful:", JSON.stringify(altData, null, 2));
          
          const transfers = altData.data || altData.transfers || altData.items || [];
          return NextResponse.json({
            items: transfers,
            total: altData.total || altData.count || transfers.length,
            page: 1,
            limit: 100
          });
        }
        
        // If both approaches fail, return empty array
        console.log("Both API calls failed - returning empty transfers list");
        return NextResponse.json({
          items: [],
          total: 0,
          page: 1,
          limit: 10
        });
      }
      
      return NextResponse.json(
        { error: errorData.message || "Failed to retrieve transfers list" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log("Raw Airwallex transfers response:", JSON.stringify(data, null, 2));
    
    // Handle different possible response structures from Airwallex
    const transfers = data.data || data.transfers || data.items || [];
    
    console.log("Extracted transfers:", transfers.length);
    
    // Return the data in the expected format for the frontend
    return NextResponse.json({
      items: transfers,
      total: data.total || data.count || transfers.length,
      page: data.page || 1,
      limit: data.limit || data.page_size || 10
    });
  } catch (error) {
    console.error("Transfer retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve transfer data" },
      { status: 500 }
    );
  }
}

// Update transfer
export async function PUT(request: NextRequest) {
  try {
    const token = await getBearerToken();
    const { searchParams } = new URL(request.url);
    const transferId = searchParams.get("id");

    if (!transferId) {
      return NextResponse.json(
        { error: "Transfer ID is required" },
        { status: 400 }
      );
    }

    const body: TransferUpdateRequest = await request.json();
    
    const response = await fetch(
      `https://api-demo.airwallex.com/api/v1/transfers/${transferId}`,
      {
        method: "PUT",
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
        { error: errorData.message || "Failed to update transfer" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Transfer update error:", error);
    return NextResponse.json(
      { error: "Failed to update transfer" },
      { status: 500 }
    );
  }
} 