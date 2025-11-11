import { executeQuery, executeMutation } from '../client';
import { 
  PaginationInput,
  PaginatedResponse,
  RealEstateProperty
} from '../types';

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
  is_public: boolean;
}

// GraphQL queries and mutations
const GET_REAL_ESTATE_PROPERTIES = `
  query GetRealEstatePropertyListings($limit: Int, $offset: Int) {
    real_estate_property_listing(limit: $limit, offset: $offset, order_by: {created_at: desc}) {
      id
      property_uuid
      landlord_firebase_uid
      title
      description
      created_at
      property_type
      rental_space
      address
      show_specific_location
      gross_area_size
      gross_area_size_unit
      num_bedroom
      num_bathroom
      furnished
      pets_allowed
      amenities
      display_image
      uploaded_images
      rental_price
      rental_price_currency
      availability_date
      is_public
    }
    real_estate_property_listing_aggregate {
      aggregate {
        count
      }
    }
  }
`;

const GET_REAL_ESTATE_PROPERTY_BY_ID = `
  query GetRealEstatePropertyById($id: uuid!) {
    real_estate_property_listing_by_pk(id: $id) {
      id
      property_uuid
      landlord_firebase_uid
      title
      description
      created_at
      property_type
      rental_space
      address
      show_specific_location
      gross_area_size
      gross_area_size_unit
      num_bedroom
      num_bathroom
      furnished
      pets_allowed
      amenities
      display_image
      uploaded_images
      rental_price
      rental_price_currency
      availability_date
      is_public
    }
  }
`;

const GET_REAL_ESTATE_PROPERTY_BY_UUID = `
  query GetRealEstatePropertyByUuid($propertyUuid: uuid!) {
    real_estate_property_listing(where: {property_uuid: {_eq: $propertyUuid}}, limit: 1) {
      id
      property_uuid
      landlord_firebase_uid
      title
      description
      created_at
      property_type
      rental_space
      address
      show_specific_location
      gross_area_size
      gross_area_size_unit
      num_bedroom
      num_bathroom
      furnished
      pets_allowed
      amenities
      display_image
      uploaded_images
      rental_price
      rental_price_currency
      availability_date
      is_public
    }
  }
`;

const GET_PROPERTIES_BY_LANDLORD = `
  query GetPropertiesByLandlord($landlord_firebase_uid: String!, $limit: Int, $offset: Int) {
    real_estate_property_listing(
      where: {landlord_firebase_uid: {_eq: $landlord_firebase_uid}}
      limit: $limit
      offset: $offset
      order_by: {created_at: desc}
    ) {
      id
      property_uuid
      landlord_firebase_uid
      title
      description
      created_at
      property_type
      rental_space
      address
      show_specific_location
      gross_area_size
      gross_area_size_unit
      num_bedroom
      num_bathroom
      furnished
      pets_allowed
      amenities
      display_image
      uploaded_images
      rental_price
      rental_price_currency
      availability_date
      is_public
    }
  }
`;

const INSERT_REAL_ESTATE_PROPERTY = `
  mutation InsertRealEstateProperty($object: real_estate_property_listing_insert_input!) {
    insert_real_estate_property_listing_one(object: $object) {
      id
      landlord_firebase_uid
      title
      description
      created_at
      property_type
      rental_space
      address
      show_specific_location
      gross_area_size
      gross_area_size_unit
      num_bedroom
      num_bathroom
      furnished
      pets_allowed
      amenities
      display_image
      uploaded_images
      rental_price
      rental_price_currency
      availability_date
      is_public
    }
  }
`;

const UPDATE_REAL_ESTATE_PROPERTY = `
  mutation UpdateRealEstateProperty($id: uuid!, $set: real_estate_property_listing_set_input!) {
    update_real_estate_property_listing_by_pk(
      pk_columns: {id: $id}
      _set: $set
    ) {
      id
      landlord_firebase_uid
      title
      description
      created_at
      property_type
      rental_space
      address
      show_specific_location
      gross_area_size
      gross_area_size_unit
      num_bedroom
      num_bathroom
      furnished
      pets_allowed
      amenities
      display_image
      uploaded_images
      rental_price
      rental_price_currency
      availability_date
      is_public
    }
  }
`;

const DELETE_REAL_ESTATE_PROPERTY = `
  mutation DeleteRealEstateProperty($id: uuid!) {
    delete_real_estate_property_listing_by_pk(id: $id) {
      id
      title
      landlord_firebase_uid
    }
  }
`;

// Service functions
export class RealEstatePropertyService {
  // Get all real estate properties with pagination
  static async getRealEstateProperties(
    pagination?: PaginationInput
  ): Promise<PaginatedResponse<RealEstateProperty>> {
    try {
      const variables = {
        limit: pagination?.limit || 10,
        offset: pagination?.offset || 0,
      };

      console.log('Executing getRealEstateProperties with variables:', variables);

      const result = await executeQuery<{
        real_estate_property_listing: RealEstateProperty[];
        real_estate_property_listing_aggregate: {
          aggregate: { count: number };
        };
      }>(GET_REAL_ESTATE_PROPERTIES, variables);

      console.log('getRealEstateProperties result:', result);

      return {
        data: result.real_estate_property_listing,
        total: result.real_estate_property_listing_aggregate.aggregate.count,
        hasMore: (pagination?.offset || 0) + (pagination?.limit || 10) < result.real_estate_property_listing_aggregate.aggregate.count,
      };
    } catch (error) {
      console.error('Error in getRealEstateProperties:', error);
      throw error;
    }
  }

  // Get a single property by ID
  static async getRealEstatePropertyById(id: string): Promise<RealEstateProperty | null> {
    const result = await executeQuery<{
      real_estate_property_listing_by_pk: RealEstateProperty | null;
    }>(GET_REAL_ESTATE_PROPERTY_BY_ID, { id });

    return result.real_estate_property_listing_by_pk;
  }

  // Get a single property by UUID
  static async getRealEstatePropertyByUuid(propertyUuid: string): Promise<RealEstateProperty | null> {
    const result = await executeQuery<{
      real_estate_property_listing: RealEstateProperty[];
    }>(GET_REAL_ESTATE_PROPERTY_BY_UUID, { propertyUuid });

    return result.real_estate_property_listing.length > 0 ? result.real_estate_property_listing[0] : null;
  }

  // Update an existing real estate property by UUID
  static async updateRealEstatePropertyByUuid(
    propertyUuid: string,
    updates: Partial<RealEstatePropertyInsertInput>
  ): Promise<RealEstateProperty | null> {
    // First get the property by UUID to get the ID
    const property = await this.getRealEstatePropertyByUuid(propertyUuid);
    if (!property) {
      return null;
    }
    
    // Then update using the ID
    return this.updateRealEstateProperty(property.id, updates);
  }

  // Get properties by landlord (Firebase UID)
  static async getPropertiesByLandlord(
    landlordFirebaseUid: string,
    pagination?: PaginationInput
  ): Promise<RealEstateProperty[]> {
    const variables = {
      landlord_firebase_uid: landlordFirebaseUid,
      limit: pagination?.limit || 10,
      offset: pagination?.offset || 0,
    };

    const result = await executeQuery<{
      real_estate_property_listing: RealEstateProperty[];
    }>(GET_PROPERTIES_BY_LANDLORD, variables);

    return result.real_estate_property_listing;
  }

  // Create a new real estate property
  static async createRealEstateProperty(
    property: RealEstatePropertyInsertInput
  ): Promise<RealEstateProperty> {
    const result = await executeMutation<{
      insert_real_estate_property_listing_one: RealEstateProperty;
    }>(INSERT_REAL_ESTATE_PROPERTY, { object: property });

    return result.insert_real_estate_property_listing_one;
  }

  // Update an existing real estate property
  static async updateRealEstateProperty(
    id: string,
    updates: Partial<RealEstatePropertyInsertInput>
  ): Promise<RealEstateProperty | null> {
    const result = await executeMutation<{
      update_real_estate_property_listing_by_pk: RealEstateProperty | null;
    }>(UPDATE_REAL_ESTATE_PROPERTY, { id, set: updates });

    return result.update_real_estate_property_listing_by_pk;
  }

  // Delete a real estate property
  static async deleteRealEstateProperty(id: string): Promise<{ id: string; title: string; landlord_firebase_uid: string } | null> {
    const result = await executeMutation<{
      delete_real_estate_property_listing_by_pk: { id: string; title: string; landlord_firebase_uid: string } | null;
    }>(DELETE_REAL_ESTATE_PROPERTY, { id });

    return result.delete_real_estate_property_listing_by_pk;
  }

  // Search properties by title, description, or address
  static async searchRealEstateProperties(searchTerm: string, pagination?: PaginationInput): Promise<RealEstateProperty[]> {
    const SEARCH_REAL_ESTATE_PROPERTIES = `
      query SearchRealEstateProperties($searchTerm: String!, $limit: Int, $offset: Int) {
        real_estate_property_listing(
          where: {
            _or: [
              {title: {_ilike: $searchTerm}},
              {description: {_ilike: $searchTerm}},
              {address: {_ilike: $searchTerm}}
            ]
          }
          limit: $limit
          offset: $offset
          order_by: {created_at: desc}
        ) {
          id
          landlord_firebase_uid
          title
          description
          created_at
          property_type
          rental_space
          address
          show_specific_location
          gross_area_size
          gross_area_size_unit
          num_bedroom
          num_bathroom
          furnished
          pets_allowed
          amenities
          display_image
          uploaded_images
          rental_price
          rental_price_currency
          availability_date
          is_public
        }
      }
    `;

    const variables = {
      searchTerm: `%${searchTerm}%`,
      limit: pagination?.limit || 10,
      offset: pagination?.offset || 0,
    };

    const result = await executeQuery<{
      real_estate_property_listing: RealEstateProperty[];
    }>(SEARCH_REAL_ESTATE_PROPERTIES, variables);

    return result.real_estate_property_listing;
  }

  // Get properties by property type
  static async getPropertiesByType(propertyType: string, pagination?: PaginationInput): Promise<RealEstateProperty[]> {
    const GET_PROPERTIES_BY_TYPE = `
      query GetPropertiesByType($propertyType: String!, $limit: Int, $offset: Int) {
        real_estate_property_listing(
          where: {property_type: {_eq: $propertyType}}
          limit: $limit
          offset: $offset
          order_by: {created_at: desc}
        ) {
          id
          landlord_firebase_uid
          title
          description
          created_at
          property_type
          rental_space
          address
          show_specific_location
          gross_area_size
          gross_area_size_unit
          num_bedroom
          num_bathroom
          furnished
          pets_allowed
          amenities
          display_image
          uploaded_images
          rental_price
          rental_price_currency
          availability_date
          is_public
        }
      }
    `;

    const variables = {
      propertyType,
      limit: pagination?.limit || 10,
      offset: pagination?.offset || 0,
    };

    const result = await executeQuery<{
      real_estate_property_listing: RealEstateProperty[];
    }>(GET_PROPERTIES_BY_TYPE, variables);

    return result.real_estate_property_listing;
  }

  // Get properties by rental space
  static async getPropertiesByRentalSpace(rentalSpace: string, pagination?: PaginationInput): Promise<RealEstateProperty[]> {
    const GET_PROPERTIES_BY_RENTAL_SPACE = `
      query GetPropertiesByRentalSpace($rentalSpace: String!, $limit: Int, $offset: Int) {
        real_estate_property_listing(
          where: {rental_space: {_eq: $rentalSpace}}
          limit: $limit
          offset: $offset
          order_by: {created_at: desc}
        ) {
          id
          landlord_firebase_uid
          title
          description
          created_at
          property_type
          rental_space
          address
          show_specific_location
          gross_area_size
          gross_area_size_unit
          num_bedroom
          num_bathroom
          furnished
          pets_allowed
          amenities
          display_image
          uploaded_images
          rental_price
          rental_price_currency
          availability_date
          is_public
        }
      }
    `;

    const variables = {
      rentalSpace,
      limit: pagination?.limit || 10,
      offset: pagination?.offset || 0,
    };

    const result = await executeQuery<{
      real_estate_property_listing: RealEstateProperty[];
    }>(GET_PROPERTIES_BY_RENTAL_SPACE, variables);

    return result.real_estate_property_listing;
  }

  // Get public properties only
  static async getPublicProperties(pagination?: PaginationInput): Promise<RealEstateProperty[]> {
    const GET_PUBLIC_PROPERTIES = `
      query GetPublicProperties($limit: Int, $offset: Int) {
        real_estate_property_listing(
          where: {is_public: {_eq: true}}
          limit: $limit
          offset: $offset
          order_by: {created_at: desc}
        ) {
          id
          landlord_firebase_uid
          title
          description
          created_at
          property_type
          rental_space
          address
          show_specific_location
          gross_area_size
          gross_area_size_unit
          num_bedroom
          num_bathroom
          furnished
          pets_allowed
          amenities
          display_image
          uploaded_images
          rental_price
          rental_price_currency
          availability_date
          is_public
        }
      }
    `;

    const variables = {
      limit: pagination?.limit || 10,
      offset: pagination?.offset || 0,
    };

    const result = await executeQuery<{
      real_estate_property_listing: RealEstateProperty[];
    }>(GET_PUBLIC_PROPERTIES, variables);

    return result.real_estate_property_listing;
  }

  // Filter properties by multiple criteria
  static async filterProperties(filters: {
    propertyType?: string;
    rentalSpace?: string;
    minBedrooms?: number;
    maxBedrooms?: number;
    minBathrooms?: number;
    maxBathrooms?: number;
    furnished?: boolean;
    petsAllowed?: boolean;
    minPrice?: number;
    maxPrice?: number;
    currency?: string;
    isPublic?: boolean;
  }, pagination?: PaginationInput): Promise<RealEstateProperty[]> {
    const FILTER_PROPERTIES = `
      query FilterProperties(
        $propertyType: String,
        $rentalSpace: String,
        $minBedrooms: Int,
        $maxBedrooms: Int,
        $minBathrooms: Int,
        $maxBathrooms: Int,
        $furnished: Boolean,
        $petsAllowed: Boolean,
        $minPrice: numeric,
        $maxPrice: numeric,
        $currency: String,
        $isPublic: Boolean,
        $limit: Int,
        $offset: Int
      ) {
        real_estate_property_listing(
          where: {
            _and: [
              {property_type: {_eq: $propertyType}},
              {rental_space: {_eq: $rentalSpace}},
              {num_bedroom: {_gte: $minBedrooms, _lte: $maxBedrooms}},
              {num_bathroom: {_gte: $minBathrooms, _lte: $maxBathrooms}},
              {furnished: {_eq: $furnished}},
              {pets_allowed: {_eq: $petsAllowed}},
              {rental_price: {_gte: $minPrice, _lte: $maxPrice}},
              {rental_price_currency: {_eq: $currency}},
              {is_public: {_eq: $isPublic}}
            ]
          }
          limit: $limit
          offset: $offset
          order_by: {created_at: desc}
        ) {
          id
          landlord_firebase_uid
          title
          description
          created_at
          property_type
          rental_space
          address
          show_specific_location
          gross_area_size
          gross_area_size_unit
          num_bedroom
          num_bathroom
          furnished
          pets_allowed
          amenities
          display_image
          uploaded_images
          rental_price
          rental_price_currency
          availability_date
          is_public
        }
      }
    `;

    const variables = {
      propertyType: filters.propertyType,
      rentalSpace: filters.rentalSpace,
      minBedrooms: filters.minBedrooms,
      maxBedrooms: filters.maxBedrooms,
      minBathrooms: filters.minBathrooms,
      maxBathrooms: filters.maxBathrooms,
      furnished: filters.furnished,
      petsAllowed: filters.petsAllowed,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      currency: filters.currency,
      isPublic: filters.isPublic,
      limit: pagination?.limit || 10,
      offset: pagination?.offset || 0,
    };

    const result = await executeQuery<{
      real_estate_property_listing: RealEstateProperty[];
    }>(FILTER_PROPERTIES, variables);

    return result.real_estate_property_listing;
  }

  // Check if property exists
  static async propertyExists(id: string): Promise<boolean> {
    const property = await this.getRealEstatePropertyById(id);
    return property !== null;
  }

  // Get properties by availability date range
  static async getPropertiesByAvailabilityDate(
    startDate: string,
    endDate: string,
    pagination?: PaginationInput
  ): Promise<RealEstateProperty[]> {
    const GET_PROPERTIES_BY_AVAILABILITY = `
      query GetPropertiesByAvailabilityDate($startDate: timestamptz!, $endDate: timestamptz!, $limit: Int, $offset: Int) {
        real_estate_property_listing(
          where: {
            availability_date: {_gte: $startDate, _lte: $endDate}
          }
          limit: $limit
          offset: $offset
          order_by: {availability_date: asc}
        ) {
          id
          landlord_firebase_uid
          title
          description
          created_at
          property_type
          rental_space
          address
          show_specific_location
          gross_area_size
          gross_area_size_unit
          num_bedroom
          num_bathroom
          furnished
          pets_allowed
          amenities
          display_image
          uploaded_images
          rental_price
          rental_price_currency
          availability_date
          is_public
        }
      }
    `;

    const variables = {
      startDate,
      endDate,
      limit: pagination?.limit || 10,
      offset: pagination?.offset || 0,
    };

    const result = await executeQuery<{
      real_estate_property_listing: RealEstateProperty[];
    }>(GET_PROPERTIES_BY_AVAILABILITY, variables);

    return result.real_estate_property_listing;
  }
} 