# Airwallex API Type Analysis and Improvements

## Overview
This document outlines the inconsistencies found between our type definitions and the actual Airwallex API usage in the codebase, along with the improvements made to align them better.

## Key Findings

### 1. Missing `request_id` Field
**Issue**: Most Airwallex API requests require a `request_id` field for idempotency, but our types were missing this field.

**Impact**: 
- Payment intent creation, updates, confirmation, capture, and cancellation
- Customer creation and updates
- Transfer creation
- Payment method creation

**Fix**: Added `request_id: string` to all request interfaces.

### 2. Payment Intent Types
**Issues Found**:
- Missing `request_id` in `PaymentIntent` interface
- Missing `captured_amount` and `metadata` fields
- Missing specific request interfaces for different operations

**Improvements Made**:
```typescript
// Added missing fields
export interface PaymentIntent {
  request_id: string;
  captured_amount?: number;
  metadata?: Record<string, unknown>;
}

// Added specific request interfaces
export interface PaymentIntentConfirmRequest {
  request_id: string;
  customer_id: string;
  payment_method_id?: string;
  payment_method?: { /* ... */ };
  payment_method_options?: Record<string, unknown>;
  return_url?: string;
}

export interface PaymentIntentCaptureRequest {
  request_id: string;
  amount?: number;
  descriptor?: string;
}

export interface PaymentIntentCancelRequest {
  request_id: string;
  cancellation_reason?: string;
}
```

### 3. Transfer Types
**Issues Found**:
- Missing `transfer_currency` and `transfer_amount` fields (Airwallex uses these instead of `target_currency`)
- Missing `TransferCreateRequest` interface
- Missing platform fee and original amount fields used in our implementation

**Improvements Made**:
```typescript
export interface Transfer {
  transfer_currency?: string;
  transfer_amount?: number;
  platform_fee?: number;
  original_amount?: number;
}

export interface TransferCreateRequest {
  request_id: string;
  source_currency: string;
  transfer_currency: string;
  transfer_amount: number;
  beneficiary_id: string;
  reference: string;
  metadata?: Record<string, unknown>;
}
```

### 4. Customer Types
**Issues Found**:
- Missing request interfaces for create and update operations
- Inconsistent field naming (e.g., `phone` vs `phone_number`)

**Improvements Made**:
```typescript
export interface CustomerCreateRequest {
  request_id: string;
  merchant_customer_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  business_name?: string;
  address: CustomerAddress;
  metadata?: Record<string, string>;
}

export interface CustomerUpdateRequest {
  request_id: string;
  // ... optional fields for updates
}
```

### 5. Beneficiary Types
**Issues Found**:
- Missing `BeneficiaryUpdateRequest` interface
- Some fields marked as required that should be optional

**Improvements Made**:
```typescript
export interface BeneficiaryUpdateRequest {
  beneficiary?: {
    type?: "BANK_ACCOUNT" | "DIGITAL_WALLET";
    entity_type?: "PERSONAL" | "COMPANY";
    // ... other optional fields
  };
  nickname?: string;
  transfer_methods?: string[];
}
```

## API Endpoint Mapping

### Payment Intents
- **Create**: `POST /api/v1/pa/payment_intents/create`
- **Get**: `GET /api/v1/pa/payment_intents/{id}`
- **Update**: `PATCH /api/v1/pa/payment_intents/{id}`
- **Confirm**: `POST /api/v1/pa/payment_intents/{id}/confirm`
- **Capture**: `POST /api/v1/pa/payment_intents/{id}/capture`
- **Cancel**: `POST /api/v1/pa/payment_intents/{id}/cancel`

### Customers
- **Create**: `POST /api/v1/pa/customers/create`
- **Get**: `GET /api/v1/pa/customers/{id}`
- **Update**: `PATCH /api/v1/pa/customers/{id}/update`
- **Delete**: `DELETE /api/v1/pa/customers/{id}`

### Beneficiaries
- **Create**: `POST /api/v1/beneficiaries`
- **Get**: `GET /api/v1/beneficiaries/{id}`
- **Update**: `PATCH /api/v1/beneficiaries/{id}`
- **Delete**: `DELETE /api/v1/beneficiaries/{id}`

### Transfers
- **Create**: `POST /api/v1/transfers`
- **Get**: `GET /api/v1/transfers/{id}`
- **Update**: `PUT /api/v1/transfers/{id}`
- **Cancel**: `POST /api/v1/transfers/{id}/cancel`

## Recommendations

### 1. API Documentation Reference
- Always refer to the official Airwallex API documentation when adding new endpoints
- Use the exact field names and types from the API documentation
- Include all required fields in request interfaces

### 2. Type Safety
- Use strict typing for all API requests and responses
- Avoid using `any` type in favor of specific interfaces
- Add validation for required fields at runtime

### 3. Error Handling
- Define specific error response interfaces
- Handle different error scenarios appropriately
- Log detailed error information for debugging

### 4. Testing
- Create unit tests for type definitions
- Test API integration with real Airwallex sandbox
- Validate request/response mapping

## Remaining Considerations

### 1. Webhook Types
- Need to define webhook payload types
- Handle different webhook event types
- Validate webhook signatures

### 2. Authentication
- Define authentication request/response types
- Handle token refresh scenarios
- Manage API key rotation

### 3. Rate Limiting
- Handle rate limit responses
- Implement retry logic with exponential backoff
- Monitor API usage

### 4. Sandbox vs Production
- Ensure types work for both environments
- Handle environment-specific field variations
- Test with real production data when available

## Conclusion

The type improvements made align our interfaces much better with the actual Airwallex API usage. The key changes focus on:

1. **Completeness**: Adding missing required fields like `request_id`
2. **Accuracy**: Using correct field names and types from the API
3. **Specificity**: Creating dedicated interfaces for different operations
4. **Flexibility**: Making optional fields truly optional

These changes improve type safety, reduce runtime errors, and make the codebase more maintainable when working with the Airwallex API. 