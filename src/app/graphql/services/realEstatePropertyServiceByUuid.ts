import { executeQuery, executeMutation } from '../client';
import { RealEstateProperty } from '../types';

// Extended type for detailed property with landlord information
export interface RealEstatePropertyDetailed extends RealEstateProperty {
  landlord?: {
    auth_provider: string;
    display_name: string;
    email: string;
    firebase_uid: string;
    photo_url?: string;
    user_since: string;
  };
}

// GraphQL queries
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
    }
  }
`;

const GET_REAL_ESTATE_PROPERTY_BY_UUID_DETAILED = `
  query GetRealEstatePropertyByUuidDetailed($propertyUuid: uuid!) {
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
      landlord {
        auth_provider
        display_name
        email
        firebase_uid
        photo_url
        user_since
      }
    }
  }
`;

const UPDATE_REAL_ESTATE_PROPERTY_BY_UUID = `
  mutation UpdateRealEstatePropertyByUuid($propertyUuid: uuid!, $set: real_estate_property_listing_set_input!) {
    update_real_estate_property_listing(
      where: {property_uuid: {_eq: $propertyUuid}}
      _set: $set
    ) {
      affected_rows
      returning {
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
      }
    }
  }
`;

export class RealEstatePropertyServiceByUuid {
  /**
   * Get a real estate property by UUID with basic information
   * @param propertyUuid - The UUID of the property
   * @returns Promise<RealEstateProperty | null>
   */
  static async getRealEstatePropertyByUuid(propertyUuid: string): Promise<RealEstateProperty | null> {
    try {
      const result = await executeQuery(GET_REAL_ESTATE_PROPERTY_BY_UUID, {
        propertyUuid
      });

      // The GraphQL client returns result.data, so we check result directly
      if (result.real_estate_property_listing && result.real_estate_property_listing.length > 0) {
        return result.real_estate_property_listing[0];
      }

      // Fallback check in case the structure is different
      if (result.data?.real_estate_property_listing && result.data.real_estate_property_listing.length > 0) {
        return result.data.real_estate_property_listing[0];
      }
      console.log('No property found in result');
      return null;
    } catch (error) {
      console.error('Error fetching property by UUID:', error);
      throw new Error('Failed to fetch property by UUID');
    }
  }

  /**
   * Get a real estate property by UUID with basic information (backward compatibility)
   * @param propertyId - The UUID of the property
   * @returns Promise<RealEstateProperty | null>
   */
  static async getRealEstatePropertyById(propertyId: string): Promise<RealEstateProperty | null> {
    try {
      // Try to fetch by ID using the main service
      const result = await executeQuery(`
        query GetRealEstatePropertyById($id: Int!) {
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
          }
        }
      `, { id: parseInt(propertyId) });

      if (result.data?.real_estate_property_listing_by_pk) {
        return result.data.real_estate_property_listing_by_pk;
      }

      return null;
    } catch (error) {
      console.error('Error fetching property by ID:', error);
      throw new Error('Failed to fetch property by ID');
    }
  }

  /**
   * Get a real estate property by UUID with detailed information including landlord data
   * @param propertyUuid - The UUID of the property
   * @returns Promise<RealEstatePropertyDetailed | null>
   */
  static async getRealEstatePropertyByUuidDetailed(propertyUuid: string): Promise<RealEstatePropertyDetailed | null> {
    try {
      const result = await executeQuery(GET_REAL_ESTATE_PROPERTY_BY_UUID_DETAILED, {
        propertyUuid
      });

      if (result.data?.real_estate_property_listing && result.data.real_estate_property_listing.length > 0) {
        return result.data.real_estate_property_listing[0];
      }

      return null;
    } catch (error) {
      console.error('Error fetching detailed property by UUID:', error);
      throw new Error('Failed to fetch detailed property by UUID');
    }
  }

  /**
   * Get a real estate property by UUID with detailed information including landlord data (backward compatibility)
   * @param propertyId - The UUID of the property
   * @returns Promise<RealEstatePropertyDetailed | null>
   */
  static async getRealEstatePropertyByIdDetailed(propertyId: string): Promise<RealEstatePropertyDetailed | null> {
    return this.getRealEstatePropertyByUuidDetailed(propertyId);
  }

  /**
   * Check if a property exists by UUID
   * @param propertyUuid - The UUID of the property
   * @returns Promise<boolean>
   */
  static async propertyExists(propertyUuid: string): Promise<boolean> {
    try {
      const property = await this.getRealEstatePropertyByUuid(propertyUuid);
      return property !== null;
    } catch (error) {
      console.error('Error checking if property exists:', error);
      return false;
    }
  }

  /**
   * Get multiple properties by their UUIDs
   * @param propertyUuids - Array of property UUIDs
   * @returns Promise<RealEstateProperty[]>
   */
  static async getRealEstatePropertiesByUuids(propertyUuids: string[]): Promise<RealEstateProperty[]> {
    try {
      const properties: RealEstateProperty[] = [];
      
      // Fetch properties in parallel
      const promises = propertyUuids.map(uuid => this.getRealEstatePropertyByUuid(uuid));
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          properties.push(result.value);
        } else {
          console.warn(`Failed to fetch property with UUID: ${propertyUuids[index]}`);
        }
      });

      return properties;
    } catch (error) {
      console.error('Error fetching properties by UUIDs:', error);
      throw new Error('Failed to fetch properties by UUIDs');
    }
  }

  /**
   * Get multiple properties by their UUIDs with detailed information
   * @param propertyUuids - Array of property UUIDs
   * @returns Promise<RealEstatePropertyDetailed[]>
   */
  static async getRealEstatePropertiesByUuidsDetailed(propertyUuids: string[]): Promise<RealEstatePropertyDetailed[]> {
    try {
      const properties: RealEstatePropertyDetailed[] = [];
      
      // Fetch properties in parallel
      const promises = propertyUuids.map(uuid => this.getRealEstatePropertyByUuidDetailed(uuid));
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          properties.push(result.value);
        } else {
          console.warn(`Failed to fetch detailed property with UUID: ${propertyUuids[index]}`);
        }
      });

      return properties;
    } catch (error) {
      console.error('Error fetching detailed properties by UUIDs:', error);
      throw new Error('Failed to fetch detailed properties by UUIDs');
    }
  }

  /**
   * Update a real estate property by UUID
   * @param propertyUuid - The UUID of the property to update
   * @param updates - The updates to apply to the property
   * @returns Promise<RealEstateProperty | null>
   */
  static async updateRealEstatePropertyByUuid(
    propertyUuid: string,
    updates: Partial<RealEstateProperty>
  ): Promise<RealEstateProperty | null> {
    try {
      console.log('updateRealEstatePropertyByUuid called with:', { propertyUuid, updates });
      
      const result = await executeMutation(UPDATE_REAL_ESTATE_PROPERTY_BY_UUID, {
        propertyUuid,
        set: updates
      });

      console.log('updateRealEstatePropertyByUuid result:', result);

      if (result.update_real_estate_property_listing && 
          result.update_real_estate_property_listing.affected_rows > 0 &&
          result.update_real_estate_property_listing.returning.length > 0) {
        return result.update_real_estate_property_listing.returning[0];
      }

      return null;
    } catch (error) {
      console.error('Error updating property by UUID:', error);
      throw new Error('Failed to update property by UUID');
    }
  }
} 