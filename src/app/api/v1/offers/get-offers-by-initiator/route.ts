import { NextRequest } from 'next/server';
import { executeQuery } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const initiatorFirebaseUid = searchParams.get('initiatorFirebaseUid');

    if (!initiatorFirebaseUid) {
      return errorResponse('initiatorFirebaseUid is required', undefined, 400);
    }

    const GET_OFFERS = `
      query GetOffersByInitiator($initiatorFirebaseUid: String!) {
        real_estate_offer(
          where: {initiator_firebase_uid: {_eq: $initiatorFirebaseUid}}
          order_by: {created_at: desc}
        ) {
          id
          offer_key
          property_id
          initiator_firebase_uid
          recipient_firebase_uid
          proposing_rent_price
          proposing_rent_price_currency
          num_leasing_months
          payment_frequency
          move_in_date
          offer_status
          is_active
          created_at
          updated_at
        }
      }
    `;

    const result = await executeQuery(GET_OFFERS, { initiatorFirebaseUid });

    return successResponse(result.real_estate_offer || []);
  } catch (error: unknown) {
    console.error('Error fetching offers by initiator:', error);
    return errorResponse(
      error.message || 'Failed to fetch offers',
      undefined,
      500
    );
  }
}

