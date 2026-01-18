import { NextRequest } from 'next/server';
import { RealEstatePropertyService, RealEstatePropertyInsertInput } from '@/app/graphql/services/realEstatePropertyService';
import { successResponse, errorResponse } from '../../utils/response';

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
    } = body;

    // Validate required fields
    if (!title || !ownerId) {
      return errorResponse('title and ownerId are required', undefined, 400);
    }

    // Transform request to service input format
    const propertyInput: RealEstatePropertyInsertInput = {
      landlord_firebase_uid: ownerId,
      title,
      description: description || '',
      property_type: details?.propertyType || 'apartment',
      rental_space: details?.rentalSpace || 'entire',
      address: address || {},
      show_specific_location: true, // Default
      gross_area_size: details?.grossArea,
      gross_area_size_unit: 'sqft', // Default
      num_bedroom: bedrooms,
      num_bathroom: bathrooms,
      furnished: details?.furnished || 'none',
      pets_allowed: details?.petsAllowed || false,
      amenities: {
        additionals: Array.isArray(amenities) ? amenities : [],
      },
      display_image: photos && photos.length > 0 ? photos[0] : undefined,
      uploaded_images: photos || [],
      rental_price: price,
      rental_price_currency: 'HKD', // Default, can be made configurable
      availability_date: availableDate,
    };

    // Note: isDraft parameter is ignored as is_public field is not available in schema
    const property = await RealEstatePropertyService.createRealEstateProperty(propertyInput);

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
      errorObj.message || 'Failed to create property',
      undefined,
      500
    );
  }
}

