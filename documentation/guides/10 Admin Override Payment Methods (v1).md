# Admin Override Payment Methods (v1)

## Overview

This document explains the admin override functionality that allows administrators to manually enter payment details for payments in 'requires_payment_method' status, bypassing the normal customer-facing payment flow.

## When to Use Admin Override

### **Payment Status: 'requires_payment_method'**
- **Trigger**: Payment intent created but no payment method attached
- **Customer Impact**: Customer would normally need to provide payment details
- **Admin Action**: Override to manually enter payment details on behalf of customer

### **Common Scenarios**
1. **Customer Unable to Complete Payment**: Technical issues preventing customer completion
2. **Phone/In-Person Payments**: Admin collecting payment details over phone or in person
3. **Legacy System Migration**: Importing payments from previous systems
4. **Emergency Processing**: Urgent payments requiring immediate processing

## Technical Implementation

### **API Endpoints Created**

#### 1. Payment Methods API (`/api/payment-methods`)
**Purpose**: Create and manage payment methods with admin override support

**Features**:
- Card and bank account payment method creation
- Admin override metadata tracking
- Billing address support
- Comprehensive validation

**Request Structure**:
```typescript
POST /api/payment-methods
{
  customer_id: string,
  type: "card" | "bank_account",
  card?: {
    number: string,
    expiry_month: string,
    expiry_year: string,
    cvc: string,
    name: string
  },
  bank_account?: {
    account_number: string,
    routing_number: string,
    account_holder_name: string,
    account_type: "checking" | "savings"
  },
  billing_address?: {
    line1: string,
    line2?: string,
    city: string,
    state: string,
    postal_code: string,
    country_code: string
  },
  admin_override: boolean
}
```

#### 2. Attach Payment Method API (`/api/payments/attach-method`)
**Purpose**: Attach created payment methods to payment intents

**Features**:
- Links payment methods to specific payment intents
- Updates payment status from 'requires_payment_method'
- Admin override tracking

**Request Structure**:
```typescript
POST /api/payments/attach-method
{
  payment_intent_id: string,
  payment_method_id: string,
  admin_override: boolean
}
```

### **Enhanced Payment Details Page**

#### 1. Status Detection
- **Automatic Detection**: Identifies when payment.status === 'requires_payment_method'
- **Visual Indicator**: ⚠️ warning icon in step description
- **Action Button**: "Collect Payment Details" becomes available

#### 2. Admin Override Form
**Payment Method Types Supported**:
- **Credit/Debit Cards**:
  - Card number
  - Expiry month/year
  - CVC
  - Cardholder name
  - Optional billing address

- **Bank Accounts (ACH)**:
  - Account holder name
  - Account number
  - Routing number
  - Account type (checking/savings)

#### 3. Form Validation
**Card Validation**:
- All fields required (number, expiry, CVC, name)
- Format validation for card numbers
- Expiry date validation

**Bank Account Validation**:
- All fields required except account type
- Routing number limited to 9 digits
- Account number format validation

## User Experience Flow

### **Step 1: Identify Payment Requiring Action**
1. Navigate to payment details page
2. Look for payments with status 'requires_payment_method'
3. Observe warning indicator in Payment Process Flow

### **Step 2: Access Admin Override**
1. Current step shows "⚠️ ADMIN ACTION REQUIRED"
2. Click "Collect Payment Details" button
3. Admin override modal opens

### **Step 3: Enter Payment Details**
1. Select payment method type (Card or Bank Account)
2. Fill in required fields
3. Review warning about admin override
4. Submit form

### **Step 4: Process Completion**
1. Payment method created in Airwallex
2. Payment method attached to payment intent
3. Payment status updated from 'requires_payment_method'
4. Step marked as completed
5. Payment ready for next step (confirmation)

## Security and Compliance

### **PCI Compliance Considerations**
- **Card Data Handling**: Should integrate with Airwallex secure elements in production
- **Admin Access Control**: Restrict to authorized personnel only
- **Audit Logging**: All admin overrides logged with timestamps
- **Data Encryption**: All sensitive data encrypted in transit and at rest

### **Admin Override Tracking**
**Metadata Fields Added**:
```typescript
{
  admin_override: true,
  admin_created: true,
  created_via: "admin_console",
  creation_timestamp: "2024-01-15T10:30:00.000Z",
  payment_method_id: "pm_12345",
  payment_method_collected: true,
  payment_method_timestamp: "2024-01-15T10:30:00.000Z",
  airwallex_step: "payment_details_collected"
}
```

### **Audit Trail**
- **Who**: Admin user performing override
- **When**: Exact timestamp of action
- **What**: Payment method details (masked for security)
- **Why**: Admin override reason (implicit: requires_payment_method status)

## Error Handling

### **Common Errors and Solutions**

#### 1. Authentication Errors
**Error**: "Authentication failed"
**Solution**: Check Airwallex credentials and token validity

#### 2. Invalid Customer ID
**Error**: "Customer not found"
**Solution**: Verify customer exists in Airwallex system

#### 3. Payment Method Creation Failed
**Error**: "Failed to create payment method"
**Solution**: Check card/bank account details format and validity

#### 4. Attachment Failed
**Error**: "Failed to attach payment method"
**Solution**: Verify payment intent exists and is in correct status

### **Validation Errors**
- **Card Number**: Invalid format or test card in production
- **Expiry Date**: Past date or invalid month/year
- **Routing Number**: Invalid bank routing number
- **Required Fields**: Missing mandatory information

## Production Considerations

### **Before Production Deployment**

#### 1. Security Enhancements
- Implement proper PCI compliance measures
- Add role-based access control
- Enhance audit logging
- Secure credential management

#### 2. Airwallex SDK Integration
- Replace manual forms with Airwallex secure elements
- Implement tokenization
- Add 3DS authentication support

#### 3. User Interface Improvements
- Add confirmation dialogs for admin overrides
- Implement better error messaging
- Add loading states and progress indicators

#### 4. Monitoring and Alerting
- Monitor admin override usage
- Alert on unusual patterns
- Track success/failure rates

## Testing Guidelines

### **Test Scenarios**

#### 1. Happy Path Testing
1. Create payment intent with 'requires_payment_method' status
2. Navigate to payment details page
3. Verify admin override button appears
4. Fill in valid payment method details
5. Submit and verify success

#### 2. Error Scenario Testing
1. Test with invalid card numbers
2. Test with expired cards
3. Test with missing required fields
4. Test with invalid bank routing numbers

#### 3. Security Testing
1. Verify admin override metadata is saved
2. Check audit trail completeness
3. Test with non-admin users (should fail)
4. Verify sensitive data masking

### **Test Data**

#### Valid Test Cards (Airwallex Demo)
```
Card Number: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123
Name: Test Cardholder
```

#### Valid Test Bank Account
```
Account Number: 123456789
Routing Number: 123456789
Account Holder: Test Account Holder
Account Type: checking
```

## Future Enhancements

### **Phase 1: Enhanced Security**
1. Role-based permissions for admin override
2. Multi-factor authentication requirements
3. Enhanced audit logging with user tracking

### **Phase 2: Improved UX**
1. Bulk payment method operations
2. Import from CSV functionality
3. Customer notification integration

### **Phase 3: Advanced Features**
1. Payment method validation services
2. Fraud detection integration
3. Automated retry mechanisms

## Conclusion

The admin override functionality provides a crucial capability for handling payments that require manual intervention while maintaining security and audit requirements. This feature bridges the gap between automated payment processing and real-world scenarios requiring human intervention.

The implementation follows Airwallex best practices and maintains compatibility with the existing payment flow while adding the necessary flexibility for administrative control. 