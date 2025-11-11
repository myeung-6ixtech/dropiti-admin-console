# Payment Intent Debug Guide (v1)

## Fixed Issues

### 1. Return URL Error ✅
**Issue**: `return_url` was causing validation errors with Airwallex API
**Solution**: Removed `return_url` from payment intent payload as it's not required for API-only integrations

**Fixed in**: `/admin-console/src/app/api/payments/deposit/route.ts`

## Testing the Fix

### 1. Test Deposit Payment Creation

Navigate to the deposit payment form and test with these steps:

1. **Access Form**: Go to `/dashboard/payments/deposit`
2. **Select Customer**: Choose an existing customer from the Airwallex system
3. **Configure Payment**:
   - Amount: `100.00`
   - Currency: `USD` or `HKD`
   - Description: `Test deposit payment`
4. **Submit Form**: Click "Create Deposit Payment Intent"

### 2. Expected Successful Response

The API should return:
```json
{
  "payment_intent_id": "pi_xxxxxxxxxx",
  "client_secret": "pi_xxxxxxxxxx_secret_xxxxxxxxxx",
  "status": "requires_payment_method",
  "amount": 100.00,
  "currency": "USD",
  "created_at": "2024-01-XX",
  "descriptor": "Test deposit payment",
  "metadata": {
    "payment_type": "deposit",
    "created_via": "admin_console",
    ...
  }
}
```

### 3. Check Browser Console

If still encountering errors, check browser console and network tab for:

1. **Network Request**: POST to `/api/payments/deposit`
2. **Request Payload**: Should not include `return_url`
3. **Response**: Look for Airwallex API error details

## Additional Potential Issues

### 1. Authentication Issues
**Symptoms**: 401 Unauthorized errors
**Check**:
- Environment variables are set: `AIRWALLEX_CLIENT_ID`, `AIRWALLEX_API_KEY`
- Bearer token is being generated correctly
- API credentials are valid for demo environment

**Debug**:
```bash
# Check environment variables
echo $AIRWALLEX_CLIENT_ID
echo $AIRWALLEX_API_KEY
```

### 2. Customer ID Issues
**Symptoms**: Customer not found errors
**Check**:
- Customer exists in Airwallex system
- Customer ID format is correct
- Customer API endpoint is working: `/api/customer`

**Debug**: Test customer retrieval first:
```bash
curl -X GET "http://localhost:3000/api/customer" \
  -H "Content-Type: application/json"
```

### 3. Amount Format Issues
**Symptoms**: Invalid amount errors
**Check**:
- Amount is positive decimal number
- Amount format matches Airwallex requirements
- Currency is valid ISO 4217 code

**Valid Amount Examples**:
- `100.00` (for $100 USD)
- `50.50` (for $50.50 USD)
- `1000` (for $1000 USD)

### 4. Currency Validation Issues
**Symptoms**: Invalid currency errors
**Check**:
- Currency is uppercase (USD, HKD, EUR)
- Currency is supported by Airwallex
- Currency matches your Airwallex account capabilities

**Supported Currencies** (Updated):
- USD, EUR, GBP, CAD, AUD
- HKD, SGD, JPY, CNY, CHF, NZD

### 5. Metadata Issues
**Symptoms**: Metadata validation errors
**Check**:
- Metadata values are strings or numbers
- No nested objects in metadata
- Metadata size within limits

## Debugging Steps

### Step 1: Enable Detailed Logging
The API endpoints already include detailed logging. Check server console for:

```
Creating deposit payment intent with payload: {
  "request_id": "deposit-...",
  "amount": 100.00,
  "currency": "USD",
  ...
}
```

### Step 2: Check Airwallex API Response
Look for Airwallex API error details in console:

```
Airwallex API error: {
  "code": "VALIDATION_ERROR",
  "message": "Invalid field: ...",
  "details": {...}
}
```

### Step 3: Validate Request Payload
Ensure the payload matches this structure:

```typescript
{
  request_id: string,           // Unique ID
  amount: number,               // Decimal amount
  currency: string,            // Uppercase ISO code
  merchant_order_id: string,   // Order ID
  customer_id: string,         // Airwallex customer ID
  descriptor: string,          // Description
  capture_method: "manual",    // For deposits
  confirmation_method: "automatic",
  metadata: {
    payment_type: "deposit",
    created_via: "admin_console",
    // ... other metadata
  }
  // NO return_url field
}
```

### Step 4: Test with Minimal Payload
Try with minimal required fields:

```json
{
  "customer_id": "cus_xxxxxxxxxx",
  "payment_intent": {
    "amount": 100.00,
    "currency": "USD",
    "descriptor": "Test payment"
  }
}
```

## Environment Variables Required

```env
AIRWALLEX_CLIENT_ID=your_client_id_here
AIRWALLEX_API_KEY=your_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Testing Commands

### Test in Development
```bash
cd /path/to/admin-console
npm run dev
```

### Test API Endpoint Directly
```bash
curl -X POST "http://localhost:3000/api/payments/deposit" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "cus_xxxxxxxxxx",
    "payment_intent": {
      "amount": 100.00,
      "currency": "USD",
      "descriptor": "Test deposit"
    }
  }'
```

## Common Error Messages & Solutions

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `return_url is invalid` | return_url field present | ✅ Fixed - removed return_url |
| `Invalid customer_id` | Customer doesn't exist | Create customer first or use existing ID |
| `Invalid currency` | Currency not supported | Use supported currency codes |
| `Authentication failed` | Missing/invalid API keys | Check environment variables |
| `Invalid amount` | Amount format wrong | Use decimal number format |

## Success Indicators

1. **No Console Errors**: Browser console shows no red errors
2. **Success Message**: Form shows success notification with payment intent ID
3. **API Response**: Returns 200 status with payment intent data
4. **Airwallex Dashboard**: Payment intent appears in Airwallex dashboard

## Next Steps After Fix

1. Test recurring payment form: `/dashboard/payments/recurring`
2. Test general payment form: `/dashboard/payments`
3. Verify webhook endpoints are working
4. Test end-to-end payment flow with actual card details (in demo mode) 