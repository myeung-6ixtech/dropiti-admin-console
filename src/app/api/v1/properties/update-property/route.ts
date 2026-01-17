import { NextRequest } from 'next/server';
import { RealEstatePropertyServiceByUuid } from '@/app/graphql/services/realEstatePropertyServiceByUuid';
import { RealEstateProperty } from '@/app/graphql/types';
import { successResponse, errorResponse } from '../../utils/response';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return errorResponse('id (property_uuid) is required', undefined, 400);
    }

    if (!updates || typeof updates !== 'object') {
      return errorResponse('updates object is required', undefined, 400);
    }

    // Transform updates to match schema
    const propertyUpdates: Partial<RealEstateProperty> = {};

    if (updates.title !== undefined) propertyUpdates.title = updates.title;
    if (updates.description !== undefined) propertyUpdates.description = updates.description;
    if (updates.price !== undefined) propertyUpdates.rental_price = updates.price;
    if (updates.bedrooms !== undefined) propertyUpdates.num_bedroom = updates.bedrooms;
    if (updates.bathrooms !== undefined) propertyUpdates.num_bathroom = updates.bathrooms;
    // Note: status updates (published/draft) ignored as is_public field not available in schema
    if (updates.photos !== undefined) {
      propertyUpdates.uploaded_images = updates.photos;
      if (updates.photos.length > 0) {
        propertyUpdates.display_image = updates.photos[0];
      }
    }
    if (updates.amenities !== undefined) {
      propertyUpdates.amenities = {
        additionals: Array.isArray(updates.amenities) ? updates.amenities : [],
      };
    }

    const updatedProperty = await RealEstatePropertyServiceByUuid.updateRealEstatePropertyByUuid(
      id,
      propertyUpdates
    );

    if (!updatedProperty) {
      return errorResponse('Property not found or update failed', undefined, 404);
    }

    return successResponse(
      updatedProperty,
      'Property updated successfully'
    );
  } catch (error: unknown) {
    console.error('Error updating property:', error);
    return errorResponse(
      error.message || 'Failed to update property',
      undefined,
      500
    );
  }
}

