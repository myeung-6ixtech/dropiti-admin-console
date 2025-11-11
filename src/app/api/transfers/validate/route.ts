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

// Validate transfer before creation
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
    console.log("Received transfer validation request:", JSON.stringify(body, null, 2));
    
    const { 
      source_currency, 
      transfer_currency,
      transfer_amount,
      beneficiary, 
      transfer_method,
      metadata = {}
    } = body;

    const validationErrors: string[] = [];
    const warnings: string[] = [];

    // Basic field validation
    if (!beneficiary) {
      validationErrors.push("Beneficiary object is required");
    }
    if (!transfer_amount || parseFloat(transfer_amount) <= 0) {
      validationErrors.push("Transfer amount must be greater than 0");
    }
    if (!source_currency) {
      validationErrors.push("Source currency is required");
    }
    if (!transfer_currency) {
      validationErrors.push("Transfer currency is required");
    }

    // Currency format validation
    const currencyRegex = /^[A-Z]{3}$/;
    if (source_currency && !currencyRegex.test(source_currency)) {
      validationErrors.push("Source currency must be in 3-letter ISO-4217 format (e.g., USD, EUR, HKD)");
    }
    if (transfer_currency && !currencyRegex.test(transfer_currency)) {
      validationErrors.push("Transfer currency must be in 3-letter ISO-4217 format (e.g., USD, EUR, HKD)");
    }

    // If we have basic validation errors, return them immediately
    if (validationErrors.length > 0) {
      return NextResponse.json({
        valid: false,
        errors: validationErrors,
        warnings: warnings
      }, { status: 400 });
    }

    // Validate beneficiary object structure
    if (beneficiary) {
      // Validate entity type
      if (!beneficiary.entity_type || !["PERSONAL", "COMPANY"].includes(beneficiary.entity_type)) {
        validationErrors.push("Beneficiary entity_type must be either 'PERSONAL' or 'COMPANY'");
      }

      // Validate bank details
      const bankDetails = beneficiary.bank_details;
      if (bankDetails) {
        if (!bankDetails.account_number) {
          validationErrors.push("Beneficiary account number is missing");
        }
        if (!bankDetails.account_name) {
          validationErrors.push("Beneficiary account name is missing");
        }
        if (!bankDetails.bank_country_code) {
          validationErrors.push("Beneficiary bank country code is missing");
        }
        if (!bankDetails.account_currency) {
          validationErrors.push("Beneficiary account currency is missing");
        }
      } else {
        validationErrors.push("Beneficiary bank details are required");
      }

      // Validate currency compatibility
      const beneficiaryCurrency = beneficiary.bank_details?.account_currency;
      if (beneficiaryCurrency && transfer_currency && beneficiaryCurrency !== transfer_currency) {
        warnings.push(`Transfer currency (${transfer_currency}) differs from beneficiary account currency (${beneficiaryCurrency}). This may result in currency conversion fees.`);
      }
    }

    // Validate transfer amount limits
    const transferAmount = parseFloat(transfer_amount);
    if (transferAmount < 1.00) {
      warnings.push("Transfer amount is very low. Minimum recommended amount is $1.00");
    }
    if (transferAmount > 100000) {
      warnings.push("Transfer amount is very high. Please verify the amount before proceeding.");
    }

    // Validate transfer method compatibility
    if (transfer_method) {
      const validMethods = ["LOCAL", "SWIFT", "SEPA"];
      if (!validMethods.includes(transfer_method)) {
        validationErrors.push(`Invalid transfer method: ${transfer_method}. Valid methods are: ${validMethods.join(", ")}`);
      }
    }

    // Calculate platform fee for information
    const platformFee = calculatePlatformFee(transferAmount, metadata.payment_type || 'other');
    const finalTransferAmount = transferAmount - platformFee;

    if (finalTransferAmount <= 0) {
      validationErrors.push("Transfer amount after platform fee deduction would be zero or negative");
    }

    // Check for potential issues
    if (source_currency !== transfer_currency) {
      warnings.push("Cross-currency transfer detected. Exchange rates and fees may apply.");
    }

    // Return validation results
    const isValid = validationErrors.length === 0;
    
    return NextResponse.json({
      valid: isValid,
      errors: validationErrors,
      warnings: warnings,
      validation_details: {
        beneficiary: {
          entity_type: beneficiary?.entity_type,
          account_currency: beneficiary?.bank_details?.account_currency,
          account_name: beneficiary?.bank_details?.account_name,
          bank_country_code: beneficiary?.bank_details?.bank_country_code
        },
        transfer: {
          source_currency,
          transfer_currency,
          transfer_amount: transferAmount,
          final_amount: finalTransferAmount,
          platform_fee: platformFee,
          transfer_method: transfer_method || "LOCAL"
        },
        calculated_fees: {
          platform_fee: platformFee,
          original_amount: transferAmount,
          final_amount: finalTransferAmount
        }
      }
    });

  } catch (error) {
    console.error("Transfer validation error:", error);
    return NextResponse.json(
      { 
        valid: false,
        errors: ["Failed to validate transfer. Please try again."],
        warnings: []
      },
      { status: 500 }
    );
  }
} 