import { NextRequest } from 'next/server';
import { executeMutation } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const property_uuid = searchParams.get('property_uuid');

    if (!property_uuid) {
      return errorResponse('property_uuid is required', undefined, 400);
    }

    const DELETE_PROPERTY = `
      mutation DeleteProperty($propertyUuid: uuid!) {
        delete_real_estate_property_listing(
          where: {property_uuid: {_eq: $propertyUuid}}
        ) {
          affected_rows
        }
      }
    `;

    // Actually delete the property (hard delete)
    const result = await executeMutation(DELETE_PROPERTY, {
      propertyUuid: property_uuid,
    });

    if (result.delete_real_estate_property_listing?.affected_rows === 0) {
      return errorResponse('Draft not found', undefined, 404);
    }

    return successResponse(
      { deleted: true },
      'Draft deleted successfully'
    );
  } catch (error: unknown) {
    console.error('Error deleting draft:', error);
    return errorResponse(
      error.message || 'Failed to delete draft',
      undefined,
      500
    );
  }
}

