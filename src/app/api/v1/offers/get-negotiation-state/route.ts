import { NextRequest } from 'next/server';
import { executeQuery } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const offerId = searchParams.get('offerId');
    const currentUserId = searchParams.get('currentUserId');

    if (!offerId || !currentUserId) {
      return errorResponse('offerId and currentUserId are required', undefined, 400);
    }

    const GET_OFFER = `
      query GetOffer($offerId: Int!) {
        real_estate_offer_by_pk(id: $offerId) {
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

    const result = await executeQuery(GET_OFFER, { offerId: parseInt(offerId) });
    const offer = result.real_estate_offer_by_pk;

    if (!offer) {
      return errorResponse('Offer not found', undefined, 404);
    }

    const isInitiator = offer.initiator_firebase_uid === currentUserId;
    const isRecipient = offer.recipient_firebase_uid === currentUserId;

    if (!isInitiator && !isRecipient) {
      return errorResponse('User does not have access to this offer', undefined, 403);
    }

    // Determine negotiation state based on offer status and user role
    const negotiationState = {
      canAccept: (offer.offer_status === 'pending' || offer.offer_status === 'countered') && isRecipient,
      canReject: (offer.offer_status === 'pending' || offer.offer_status === 'countered') && (isInitiator || isRecipient),
      canCounter: (offer.offer_status === 'pending' || offer.offer_status === 'countered') && (isInitiator || isRecipient),
      canWithdraw: offer.offer_status === 'pending' && isInitiator,
    };

    return successResponse({
      offer,
      negotiationState,
    });
  } catch (error: unknown) {
    console.error('Error fetching negotiation state:', error);
    return errorResponse(
      error.message || 'Failed to fetch negotiation state',
      undefined,
      500
    );
  }
}

