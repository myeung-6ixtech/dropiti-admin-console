import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '../../utils/response';
import { executeHasuraQuery } from '../../utils/hasuraServer';

const INSERT_PROPERTY_MUTATION = `
  mutation InsertRealEstateProperty($object: real_estate_property_listing_insert_input!) {
    insert_real_estate_property_listing_one(object: $object) {
      id
      property_uuid
      landlord_user_id
      status
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      address,
      price,
      bedrooms,
      bathrooms,
      photos,
      details,
      amenities,
      availableDate,
      ownerId,
      status: statusParam,
    } = body;

    if (!title || !ownerId) {
      return errorResponse('title and ownerId are required', undefined, 400);
    }

    const status = statusParam === 'published' ? 'published' : 'draft';

    const amenitiesArray = Array.isArray(amenities)
      ? amenities.filter(Boolean)
      : amenities && typeof amenities === 'object' && Array.isArray((amenities as { additionals?: unknown }).additionals)
        ? ((amenities as { additionals: unknown[] }).additionals.filter(Boolean) as string[])
        : [];

    const object: Record<string, unknown> = {
      landlord_user_id: ownerId,
      status,
      title,
      description: description ?? '',
      property_type: details?.propertyType ?? 'apartment',
      rental_space: details?.rentalSpace ?? 'entire',
      address: address ?? {},
      show_specific_location: true,
      gross_area_size: details?.grossArea ?? null,
      gross_area_size_unit: 'sqft',
      num_bedroom: bedrooms ?? null,
      num_bathroom: bathrooms ?? null,
      furnished: details?.furnished ?? 'none',
      pets_allowed: details?.petsAllowed ?? false,
      amenities: amenitiesArray,
      display_image: photos?.length > 0 ? photos[0] : null,
      uploaded_images: photos ?? [],
      rental_price: price ?? null,
      rental_price_currency: 'HKD',
      availability_date: availableDate ?? null,
    };

    const result = await executeHasuraQuery<{
      insert_real_estate_property_listing_one: Record<string, unknown>;
    }>(INSERT_PROPERTY_MUTATION, { object });

    const property = result.insert_real_estate_property_listing_one;
    if (!property) {
      return errorResponse('Insert did not return a property', undefined, 500);
    }

    return successResponse(
      property,
      'Property created successfully',
      undefined,
      201
    );
  } catch (error: unknown) {
    console.error('Error creating property:', error);
    const errorObj = error as { message?: string };
    return errorResponse(
      errorObj.message ?? 'Failed to create property',
      undefined,
      500
    );
  }
}
