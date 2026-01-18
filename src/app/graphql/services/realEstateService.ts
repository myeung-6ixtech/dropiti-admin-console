import { executeQuery, executeMutation } from '../client';
import { 
  RealEstatePropertyListing, 
  RealEstatePropertyListingInsertInput,
  PaginationInput,
  PaginatedResponse 
} from '../types';

// GraphQL queries and mutations
const GET_PROPERTY_LISTINGS = `
  query GetPropertyListings($limit: Int, $offset: Int) {
    real_estate_property_listings(limit: $limit, offset: $offset, order_by: {created_at: desc}) {
      id
      title
      description
      price
      address
      created_at
      updated_at
    }
    real_estate_property_listings_aggregate {
      aggregate {
        count
      }
    }
  }
`;

const GET_PROPERTY_BY_ID = `
  query GetPropertyById($id: uuid!) {
    real_estate_property_listings_by_pk(id: $id) {
      id
      title
      description
      price
      address
      created_at
      updated_at
    }
  }
`;

const INSERT_PROPERTY = `
  mutation InsertProperty($object: real_estate_property_listings_insert_input!) {
    insert_real_estate_property_listings_one(object: $object) {
      id
      title
      description
      price
      address
      created_at
      updated_at
    }
  }
`;

const UPDATE_PROPERTY = `
  mutation UpdateProperty($id: uuid!, $set: real_estate_property_listings_set_input!) {
    update_real_estate_property_listings_by_pk(
      pk_columns: {id: $id}
      _set: $set
    ) {
      id
      title
      description
      price
      address
      created_at
      updated_at
    }
  }
`;

const DELETE_PROPERTY = `
  mutation DeleteProperty($id: uuid!) {
    delete_real_estate_property_listings_by_pk(id: $id) {
      id
      title
    }
  }
`;

// Service functions
export class RealEstateService {
  // Get all property listings with pagination
  static async getPropertyListings(
    pagination?: PaginationInput
  ): Promise<PaginatedResponse<RealEstatePropertyListing>> {
    const variables = {
      limit: pagination?.limit || 10,
      offset: pagination?.offset || 0,
    };

    const result = await executeQuery<{
      real_estate_property_listings: RealEstatePropertyListing[];
      real_estate_property_listings_aggregate: {
        aggregate: { count: number };
      };
    }>(GET_PROPERTY_LISTINGS, variables);

    return {
      data: result.real_estate_property_listings,
      total: result.real_estate_property_listings_aggregate.aggregate.count,
      hasMore: (pagination?.offset || 0) + (pagination?.limit || 10) < result.real_estate_property_listings_aggregate.aggregate.count,
    };
  }

  // Get a single property by ID
  static async getPropertyById(id: string): Promise<RealEstatePropertyListing | null> {
    const result = await executeQuery<{
      real_estate_property_listings_by_pk: RealEstatePropertyListing | null;
    }>(GET_PROPERTY_BY_ID, { id });

    return result.real_estate_property_listings_by_pk;
  }

  // Create a new property
  static async createProperty(
    property: RealEstatePropertyListingInsertInput
  ): Promise<RealEstatePropertyListing> {
    const result = await executeMutation<{
      insert_real_estate_property_listings_one: RealEstatePropertyListing;
    }>(INSERT_PROPERTY, { object: property });

    return result.insert_real_estate_property_listings_one;
  }

  // Update an existing property
  static async updateProperty(
    id: string,
    updates: Partial<RealEstatePropertyListingInsertInput>
  ): Promise<RealEstatePropertyListing | null> {
    const result = await executeMutation<{
      update_real_estate_property_listings_by_pk: RealEstatePropertyListing | null;
    }>(UPDATE_PROPERTY, { id, set: updates });

    return result.update_real_estate_property_listings_by_pk;
  }

  // Delete a property
  static async deleteProperty(id: string): Promise<{ id: string; title: string } | null> {
    const result = await executeMutation<{
      delete_real_estate_property_listings_by_pk: { id: string; title: string } | null;
    }>(DELETE_PROPERTY, { id });

    return result.delete_real_estate_property_listings_by_pk;
  }

  // Search properties by title or description
  static async searchProperties(searchTerm: string, pagination?: PaginationInput) {
    const SEARCH_PROPERTIES = `
      query SearchProperties($searchTerm: String!, $limit: Int, $offset: Int) {
        real_estate_property_listings(
          where: {
            _or: [
              {title: {_ilike: $searchTerm}},
              {description: {_ilike: $searchTerm}}
            ]
          }
          limit: $limit
          offset: $offset
          order_by: {created_at: desc}
        ) {
          id
          title
          description
          price
          address
          created_at
          updated_at
        }
      }
    `;

    const variables = {
      searchTerm: `%${searchTerm}%`,
      limit: pagination?.limit || 10,
      offset: pagination?.offset || 0,
    };

    const result = await executeQuery<{
      real_estate_property_listings: RealEstatePropertyListing[];
    }>(SEARCH_PROPERTIES, variables);

    return result.real_estate_property_listings;
  }
} 