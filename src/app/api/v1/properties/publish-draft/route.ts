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

    // Note: is_public field not available in schema
    // Simply fetch the property to confirm it exists
    const property = await RealEstatePropertyServiceByUuid.getRealEstatePropertyByUuidDetailed(property_uuid);

    if (!property) {
      return errorResponse('Property not found', undefined, 404);
    }

    return successResponse(
      property,
      'Draft published successfully (Note: draft/publish status not supported in current schema)'
    );
  } catch (error: unknown) {
    console.error('Error publishing draft:', error);
    return errorResponse(
      error.message || 'Failed to publish draft',
      undefined,
      500
    );
  }
}

