# Payment Cancellation API (v1)

## Overview

This document outlines the payment cancellation functionality that allows administrators to cancel payments through the admin console, integrated with the Airwallex API.

## API Endpoint

### **POST /api/payments/cancel**
Cancels a payment intent through the Airwallex API.

**Request Body:**
```typescript
{
  payment_intent_id: string;
  cancellation_reason?: string;
  metadata?: Record<string, unknown>;
}
```

**Response:**
```typescript
{
  success: boolean;
  payment_intent: AirwallexPaymentIntent;
  message: string;
  status: string;
  cancelled_at: string;
}
```

### **GET /api/payments/cancel**
Checks if a payment can be cancelled based on its current status.

**Query Parameters:**
- `payment_intent_id`: The ID of the payment intent to check

**Response:**
```typescript
{
  can_cancel: boolean;
  current_status: string;
  reason: string;
}
```

## Cancellable Payment Statuses

According to Airwallex documentation, payments can be cancelled in the following statuses:
- `requires_payment_method`
- `requires_confirmation` 
- `requires_capture`
- `processing`

Payments **cannot** be cancelled in these statuses:
- `succeeded` (already completed)
- `canceled` (already cancelled)
- `failed` (already failed)

## User Interface Integration

### **Cancel Button Visibility**
The Cancel Payment button is conditionally displayed based on:
1. **Status Check**: API checks if payment can be cancelled
2. **Loading State**: Shows "Checking..." while verifying cancellation eligibility
3. **Disabled State**: Shows "Cannot Cancel" with tooltip for non-cancellable payments

### **Cancel Dialog Features**
- **Warning Alert**: Clear indication that cancellation is permanent
- **Payment Summary**: Shows customer, type, amount, and current status
- **Confirmation Required**: User must explicitly confirm cancellation
- **Loading State**: Shows progress during cancellation process

### **Post-Cancellation Flow**
1. **Success Message**: Displays confirmation of successful cancellation
2. **Automatic Redirect**: Redirects to payments page after 2-second delay
3. **Error Handling**: Shows specific error messages for failed cancellations

## Implementation Details

### **Frontend Logic**
```typescript
// Check if payment can be cancelled
const cancelCheckResponse = await axios.get(`/api/payments/cancel?payment_intent_id=${paymentId}`);
setCanCancelPayment(cancelCheckResponse.data.can_cancel);

// Cancel payment
const response = await axios.post('/api/payments/cancel', {
  payment_intent_id: payment.id,
  cancellation_reason: "admin_override",
  metadata: {
    admin_cancelled: true,
    admin_cancellation_timestamp: new Date().toISOString()
  }
});

// Redirect after success
if (response.data.success) {
  setTimeout(() => {
    router.push("/dashboard/payments");
  }, 2000);
}
```

### **Error Handling**
The API handles various error scenarios:

#### **400 Bad Request**
- Payment cannot be cancelled in current state
- Invalid request parameters

#### **404 Not Found**
- Payment intent does not exist

#### **500 Internal Server Error**
- Network issues
- Airwallex API unavailable
- Authentication problems

### **Audit Trail**
Every cancellation includes metadata for compliance:
```typescript
{
  cancelled_via: "admin_console",
  cancelled_by: "admin_user", 
  cancellation_timestamp: "2024-01-15T10:30:00.000Z",
  admin_cancelled: true,
  cancellation_reason: "admin_override"
}
```

## Security Considerations

### **Authorization**
- Requires valid Airwallex authentication token
- Admin-only functionality (should add role-based access control)

### **Audit Logging**
- All cancellation attempts logged
- Includes timestamp, user, and reason
- Metadata preserved for compliance

### **Data Validation**
- Payment intent ID validation
- Status verification before cancellation
- Error handling for edge cases

## Testing Guidelines

### **Test Scenarios**

#### 1. **Successful Cancellation**
```typescript
// Create payment in cancellable status
// Verify cancel button appears
// Click cancel and confirm
// Verify payment is cancelled
// Verify redirect to payments page
```

#### 2. **Non-Cancellable Payment**
```typescript
// Create payment in 'succeeded' status
// Verify cancel button is disabled
// Verify tooltip shows reason
```

#### 3. **Error Handling**
```typescript
// Test with invalid payment ID
// Test with network errors
// Test with authentication failures
```

### **Test Data**
Use Airwallex demo environment with test payment intents in various statuses.

## Production Considerations

### **Before Production**
1. **Role-Based Access**: Restrict cancellation to authorized users
2. **Enhanced Logging**: Add user tracking and detailed audit logs
3. **Confirmation Emails**: Notify customers of cancellations
4. **Refund Integration**: Handle refunds for captured payments

### **Monitoring**
- Track cancellation rates
- Monitor for unusual patterns
- Alert on high cancellation volumes
- Log all admin actions for compliance

## Integration with Payment Flow

The cancellation functionality integrates seamlessly with the existing payment process flow:

1. **Status Detection**: Automatically detects cancellable payments
2. **Visual Indicators**: Clear UI feedback on cancellation eligibility  
3. **Flow Interruption**: Cleanly exits payment flow on cancellation
4. **Navigation**: Returns user to payments list for next action

## Future Enhancements

### **Phase 1: Enhanced UX**
- Confirmation emails to customers
- Bulk cancellation capabilities
- Cancellation reason selection

### **Phase 2: Advanced Features**
- Partial cancellations for multi-item orders
- Automatic refund processing
- Customer notification system

### **Phase 3: Analytics**
- Cancellation analytics dashboard
- Trend analysis and reporting
- Integration with business intelligence tools

## Conclusion

The payment cancellation functionality provides essential admin control over the payment lifecycle while maintaining security, audit compliance, and integration with the Airwallex payment system. The implementation ensures reliable cancellation with proper error handling and user feedback. 