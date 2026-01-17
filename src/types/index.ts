/**
 * Centralized Type Definitions
 * 
 * This file contains all shared interfaces and types used across the application.
 * 
 * Guidelines for adding new types:
 * 1. All business logic types (Customer, Beneficiary, User, etc.) should be defined here
 * 2. API response types should be centralized here
 * 3. Component-specific prop interfaces should remain local to their components
 * 4. When creating new features, check this file first for existing types
 * 5. Use descriptive names and group related types together
 * 6. Export all types that might be used in multiple files
 */

// Customer types
export interface CustomerAddress {
  country_code: string;
  state: string;
  city: string;
  street: string;
  postcode: string;
}

export interface CustomerData {
  id?: string;
  merchant_customer_id?: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  date_of_birth?: string;
  business_name?: string;
  address?: CustomerAddress;
  metadata?: Record<string, unknown>;
}

export interface Customer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  date_of_birth?: string;
  address?: CustomerAddress;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface CustomersResponse {
  has_more: boolean;
  items: Customer[];
}

// User types
export interface User {
  id: string;
  email: string;
  role: string;
  name: string;
  status: "active" | "inactive";
  createdAt: string;
  lastLogin?: string;
}

// Ecommerce types
export interface Product {
  id: number;
  name: string;
  variants: string;
  category: string;
  price: string;
  image: string;
  status: "Delivered" | "Pending" | "Canceled";
}

// Table types
export interface Order {
  id: number;
  user: {
    image: string;
    name: string;
    role: string;
  };
  projectName: string;
  team: {
    images: string[];
  };
  status: string;
  budget: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Beneficiary types
export interface BeneficiaryBankDetails {
  account_currency: string;
  account_name: string;
  account_number?: string;
  bank_country_code: string;
  bank_name?: string;
  swift_code?: string;
  iban?: string;
  account_routing_type1?: string;
  account_routing_type2?: string;
  account_routing_value1?: string;
  account_routing_value2?: string;
  local_clearing_system?: string;
  bank_branch?: string;
}

export interface BeneficiaryAddress {
  street_address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country_code?: string;
}

export interface BeneficiaryAdditionalInfo {
  personal_email?: string;
  external_identifier?: string;
  personal_id_number?: string;
  personal_id_type?: string;
  personal_mobile_number?: string;
  business_registration_number?: string;
  legal_rep_first_name_in_chinese?: string;
  legal_rep_last_name_in_chinese?: string;
  legal_rep_id_number?: string;
  personal_first_name_in_chinese?: string;
  personal_last_name_in_chinese?: string;
}

export interface BeneficiaryEntity {
  type?: string;
  entity_type: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  date_of_birth?: string;
  bank_details: BeneficiaryBankDetails;
  address?: BeneficiaryAddress;
  additional_info?: BeneficiaryAdditionalInfo;
}

export interface Beneficiary {
  beneficiary_id: string;
  beneficiary: BeneficiaryEntity;
  payment_methods: string[];
  payer_entity_type?: string;
  nickname?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BeneficiariesResponse {
  has_more: boolean;
  items: Beneficiary[];
  total_count: number;
}

export interface BeneficiaryCreateRequest {
  beneficiary: {
    type?: string;
    entity_type: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    bank_details: {
      account_currency: string;
      account_name: string;
      account_number?: string;
      bank_country_code: string;
      bank_name?: string;
      swift_code?: string;
      account_routing_type1?: string;
      account_routing_value1?: string;
      account_routing_type2?: string;
      account_routing_value2?: string;
      local_clearing_system?: string;
    };
    address?: {
      street_address?: string;
      city?: string;
      state?: string;
      postcode?: string;
      country_code?: string;
    };
    additional_info?: {
      personal_email?: string;
      external_identifier?: string;
    };
  };
  nickname?: string;
  transfer_methods?: string[];
}

// Payment types
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  customer_id?: string;
  payment_method?: unknown;
  metadata?: Record<string, unknown>;
}

export interface PaymentIntentDetail {
  id: string;
  amount: number;
  currency: string;
  status: string;
  customer_id?: string;
  merchant_order_id?: string;
  descriptor?: string;
  capture_method: "automatic" | "manual";
  confirmation_method: "automatic" | "manual";
  created_at: string;
  updated_at: string;
  payment_method?: unknown;
  metadata?: Record<string, unknown>;
  customer?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export interface PaymentIntentsResponse {
  items: PaymentIntentDetail[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface PaymentIntentCreateRequest {
  amount: number;
  currency: string;
  customer_id?: string;
  merchant_order_id?: string;
  descriptor?: string;
  capture_method?: "automatic" | "manual";
  confirmation_method?: "automatic" | "manual";
  metadata?: Record<string, unknown>;
}

export interface PaymentIntentUpdateRequest {
  customer_id?: string;
  merchant_order_id?: string;
  descriptor?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expiry_month: number;
    expiry_year: number;
  };
  bank_account?: {
    bank_name: string;
    account_number: string;
    account_bsb?: string;
  };
}

// Transfer types
export interface TransferUpdateRequest {
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface Transfer {
  id: string;
  source_currency: string;
  transfer_currency: string;
  transfer_amount: number;
  amount: number;
  status: string;
  reference?: string;
  reason?: string;
  remarks?: string;
  transfer_date: string;
  transfer_method: string;
  created_at: string;
  updated_at: string;
  beneficiary?: {
    beneficiary_id: string;
    nickname?: string;
    beneficiary: {
      entity_type: string;
      first_name?: string;
      last_name?: string;
      company_name?: string;
      bank_details: {
        account_name: string;
        account_currency: string;
        bank_name?: string;
      };
    };
  };
  metadata?: Record<string, unknown>;
}

export interface TransfersResponse {
  items: Transfer[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
} 