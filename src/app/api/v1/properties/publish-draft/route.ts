import { NextRequest } from 'next/server';
import { RealEstatePropertyServiceByUuid } from '@/app/graphql/services/realEstatePropertyServiceByUuid';
import { successResponse, errorResponse } from '../../utils/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { property_uuid } = body;

    if (!property_uuid) {
      return errorResponse('property_uuid is required', undefined, 400);
    }

    // Update property to be public
    const updatedProperty = await RealEstatePropertyServiceByUuid.updateRealEstatePropertyByUuid(
      property_uuid,
      { is_public: true }
    );

    if (!updatedProperty) {
      return errorResponse('Property not found', undefined, 404);
    }

    return successResponse(
      updatedProperty,
      'Draft published successfully'
    );
  } catch (error: any) {
    console.error('Error publishing draft:', error);
    return errorResponse(
      error.message || 'Failed to publish draft',
      undefined,
      500
    );
  }
}

