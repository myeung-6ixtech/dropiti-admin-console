import { NextRequest } from 'next/server';
import { RealEstatePropertyService } from '@/app/graphql/services/realEstatePropertyService';
import { successResponse, errorResponse } from '../../utils/response';
import { transformProperty } from '../../utils/transformers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const bedrooms = searchParams.get('bedrooms');
    const type = searchParams.get('type');
    const landlord_firebase_uid = searchParams.get('landlord_firebase_uid');

    // Build filters
    const filters: unknown = {};
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (bedrooms) filters.minBedrooms = parseInt(bedrooms);
    if (type) filters.propertyType = type;

    // Get properties
    let result;
    if (Object.keys(filters).length > 0) {
      result = await RealEstatePropertyService.filterProperties(filters, { limit, offset });
    } else if (landlord_firebase_uid) {
      // Get properties by landlord
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
          }
          real_estate_property_listing_aggregate(
            where: {landlord_firebase_uid: {_eq: $landlord_firebase_uid}}
          ) {
            aggregate {
              count
            }
          }
        }
      `;
      
      const { executeQuery } = await import('@/app/graphql/client');
      const queryResult = await executeQuery(GET_PROPERTIES_BY_LANDLORD, {
        landlord_firebase_uid,
        limit,
        offset,
      });

      const properties = queryResult.real_estate_property_listing || [];
      const total = queryResult.real_estate_property_listing_aggregate?.aggregate?.count || 0;

      result = {
        data: properties,
        total,
        hasMore: offset + limit < total,
      };
    } else {
      result = await RealEstatePropertyService.getRealEstateProperties({ limit, offset });
    }

    // Transform properties to API guide format
    const dataArray = Array.isArray(result) ? result : result.data;
    const transformedData = dataArray.map(transformProperty);
    const total = Array.isArray(result) ? result.length : result.total;
    const hasMore = Array.isArray(result) ? false : result.hasMore;

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
    return errorResponse(
      error.message || 'Failed to fetch listings',
      undefined,
      500
    );
  }
}

