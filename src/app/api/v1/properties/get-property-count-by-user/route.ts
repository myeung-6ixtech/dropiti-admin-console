import { NextRequest } from 'next/server';
import { executeQuery } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const landlordFirebaseUid = searchParams.get('landlordFirebaseUid');

    if (!landlordFirebaseUid) {
      return errorResponse('landlordFirebaseUid is required', undefined, 400);
    }

    const GET_PROPERTY_COUNT = `
      query GetPropertyCount($landlord_firebase_uid: String!) {
        real_estate_property_listing_aggregate(
          where: {landlord_firebase_uid: {_eq: $landlord_firebase_uid}}
        ) {
          aggregate {
            count
          }
        }
      }
    `;

    const result = await executeQuery(GET_PROPERTY_COUNT, {
      landlord_firebase_uid: landlordFirebaseUid,
    }) as {
      real_estate_property_listing_aggregate?: {
        aggregate?: {
          count?: number;
        };
      };
    };

    const count = result.real_estate_property_listing_aggregate?.aggregate?.count || 0;

    return successResponse({ count });
  } catch (error: unknown) {
    console.error('Error fetching property count:', error);
    const errorObj = error as { message?: string };
    return errorResponse(
      errorObj.message || 'Failed to fetch property count',
      undefined,
      500
    );
  }
}

