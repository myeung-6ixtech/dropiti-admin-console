// Common GraphQL response types
export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: GraphQLError[];
}

export interface GraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: string[];
  extensions?: Record<string, unknown>;
}

// Hasura specific types
export interface HasuraResponse<T = unknown> {
  data: T;
  errors?: GraphQLError[];
}

// Common query/mutation result types
export interface QueryResult<T = unknown> {
  data: T;
  loading: boolean;
  error?: Error;
}

// Example types for real estate (based on your existing API)
export interface RealEstatePropertyListing {
  id: string;
  title: string;
  description?: string;
  price?: number;
  address?: string;
  created_at: string;
  updated_at: string;
  // Add more fields as needed
}

export interface RealEstatePropertyListingInsertInput {
  title: string;
  description?: string;
  price?: number;
  address?: string;
  // Add more fields as needed
}

// Real estate user types
export interface RealEstateUser {
  firebase_uid: string;
  auth_provider: string;
  display_name: string;
  email: string;
  photo_url?: string;
  user_since: string;
}

export interface RealEstateUserInsertInput {
  firebase_uid: string;
  auth_provider: string;
  display_name: string;
  email: string;
  photo_url?: string;
}

// Real estate property types
export interface RealEstateProperty {
  id: string;
  property_uuid: string;
  landlord_firebase_uid: string;
  title: string;
  description?: string;
  created_at: string;
  property_type: string;
  rental_space: string;
  address: {
    unit?: string;
    block?: string;
    floor?: string;
    state?: string;
    street?: string;
    country?: string;
    district?: string;
    apartmentEstate?: string;
  };
  show_specific_location: boolean;
  gross_area_size?: number;
  gross_area_size_unit?: string;
  num_bedroom?: number;
  num_bathroom?: number;
  furnished: string; // "partial", "none", "full"
  pets_allowed: boolean;
  amenities: {
    kitchen?: string[];
    bathroom?: string[];
    furnitures?: string[];
    additionals?: string[];
    electricalAppliances?: string[];
  };
  display_image?: string;
  uploaded_images?: string[];
  rental_price?: number;
  rental_price_currency?: string;
  availability_date?: string;
}

export interface RealEstatePropertyInsertInput {
  landlord_firebase_uid: string;
  title: string;
  description?: string;
  property_type: string;
  rental_space: string;
  address: {
    unit?: string;
    block?: string;
    floor?: string;
    state?: string;
    street?: string;
    country?: string;
    district?: string;
    apartmentEstate?: string;
  };
  show_specific_location: boolean;
  gross_area_size?: number;
  gross_area_size_unit?: string;
  num_bedroom?: number;
  num_bathroom?: number;
  furnished: string; // "partial", "none", "full"
  pets_allowed: boolean;
  amenities: {
    kitchen?: string[];
    bathroom?: string[];
    furnitures?: string[];
    additionals?: string[];
    electricalAppliances?: string[];
  };
  display_image?: string;
  uploaded_images?: string[];
  rental_price?: number;
  rental_price_currency?: string;
  availability_date?: string;
}

// Generic CRUD operations
export interface CreateInput<T> {
  object: T;
}

export interface UpdateInput<T> {
  where: Record<string, unknown>;
  _set: Partial<T>;
}

export interface DeleteInput {
  where: Record<string, unknown>;
}

// Pagination types
export interface PaginationInput {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  hasMore: boolean;
} 