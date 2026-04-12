import { NextRequest } from "next/server";
import { RealEstateProperty } from "@/app/graphql/types";
import { successResponse, errorResponse } from "../../utils/response";
import { transformProperty } from "../../utils/transformers";
import { executeHasuraQuery } from "../../utils/hasuraServer";

const LISTINGS_FIELDS = `
  id
  property_uuid
  title
  description
  created_at
  updated_at
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
  external_url
  completion_percentage
`;

const GET_ALL_PROPERTIES = `
  query GetRealEstatePropertyListings($limit: Int, $offset: Int) {
    real_estate_property_listing(limit: $limit, offset: $offset, order_by: {created_at: desc}) {
      ${LISTINGS_FIELDS}
    }
    real_estate_property_listing_aggregate {
      aggregate {
        count
      }
    }
  }
`;

const GET_PROPERTIES_BY_LANDLORD = `
  query GetPropertiesByLandlord($landlord_user_id: uuid!, $limit: Int, $offset: Int) {
    real_estate_property_listing(
      where: {landlord_user_id: {_eq: $landlord_user_id}}
      limit: $limit
      offset: $offset
      order_by: {created_at: desc}
    ) {
      ${LISTINGS_FIELDS}
    }
    real_estate_property_listing_aggregate(
      where: {landlord_user_id: {_eq: $landlord_user_id}}
    ) {
      aggregate {
        count
      }
    }
  }
`;

function buildFilterListingsQuery(conditions: string[]): string {
  const whereClause =
    conditions.length > 0 ? `where: { _and: [ ${conditions.join(", ")} ] }` : "";
  return `
  query FilterListings($limit: Int, $offset: Int, $minPrice: numeric, $maxPrice: numeric, $minBedrooms: Int, $propertyType: String) {
    real_estate_property_listing(
      ${whereClause}
      limit: $limit
      offset: $offset
      order_by: { created_at: desc }
    ) {
      ${LISTINGS_FIELDS}
    }
    real_estate_property_listing_aggregate( ${whereClause} ) {
      aggregate {
        count
      }
    }
  }
`;
}

type ListingsResult = {
  data: unknown[];
  total: number;
  hasMore: boolean;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const bedrooms = searchParams.get("bedrooms");
    const type = searchParams.get("type");
    const landlord_user_id =
      searchParams.get("landlord_user_id") ?? searchParams.get("landlord_firebase_uid");

    // Build filters
    const hasFilters = !!(minPrice || maxPrice || bedrooms || type);

    let result: ListingsResult;

    if (hasFilters) {
      const conditions: string[] = [];
      if (minPrice != null) conditions.push("{ rental_price: { _gte: $minPrice } }");
      if (maxPrice != null) conditions.push("{ rental_price: { _lte: $maxPrice } }");
      if (bedrooms != null) conditions.push("{ num_bedroom: { _gte: $minBedrooms } }");
      if (type != null) conditions.push("{ property_type: { _eq: $propertyType } }");
      const filterQuery = buildFilterListingsQuery(conditions);
      const queryResult = await executeHasuraQuery<{
        real_estate_property_listing: unknown[];
        real_estate_property_listing_aggregate?: {
          aggregate?: { count?: number };
        };
      }>(filterQuery, {
        limit,
        offset,
        minPrice: minPrice != null ? parseFloat(minPrice) : null,
        maxPrice: maxPrice != null ? parseFloat(maxPrice) : null,
        minBedrooms: bedrooms != null ? parseInt(bedrooms) : null,
        propertyType: type ?? null,
      });
      const properties = queryResult.real_estate_property_listing ?? [];
      const total = queryResult.real_estate_property_listing_aggregate?.aggregate?.count ?? 0;
      result = { data: properties, total, hasMore: offset + limit < total };
    } else if (landlord_user_id) {
      const queryResult = await executeHasuraQuery<{
        real_estate_property_listing?: unknown[];
        real_estate_property_listing_aggregate?: {
          aggregate?: { count?: number };
        };
      }>(GET_PROPERTIES_BY_LANDLORD, {
        landlord_user_id,
        limit,
        offset,
      });
      const properties = queryResult.real_estate_property_listing ?? [];
      const total = queryResult.real_estate_property_listing_aggregate?.aggregate?.count ?? 0;
      result = { data: properties, total, hasMore: offset + limit < total };
    } else {
      const queryResult = await executeHasuraQuery<{
        real_estate_property_listing: unknown[];
        real_estate_property_listing_aggregate: {
          aggregate: { count: number };
        };
      }>(GET_ALL_PROPERTIES, { limit, offset });
      const properties = queryResult.real_estate_property_listing ?? [];
      const total = queryResult.real_estate_property_listing_aggregate.aggregate.count;
      result = { data: properties, total, hasMore: offset + limit < total };
    }

    // Transform properties to API guide format
    const dataArray = result.data as RealEstateProperty[];
    const transformedData = dataArray.map(transformProperty);
    const total = result.total;
    const hasMore = result.hasMore;

    return successResponse(
      transformedData,
      undefined,
      {
        total,
        limit,
        offset,
        hasMore,
      }
    );
  } catch (error: unknown) {
    console.error('Error fetching listings:', error);
    const errorObj = error as { message?: string };
    return errorResponse(
      errorObj.message || 'Failed to fetch listings',
      undefined,
      500
    );
  }
}

