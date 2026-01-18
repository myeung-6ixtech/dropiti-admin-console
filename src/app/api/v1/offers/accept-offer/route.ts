import { NextRequest } from 'next/server';
import { getHasuraGraphqlSDK } from '@dropiti/sdk';
import { RealEstateOfferAction, RealEstateOfferStatus } from '@dropiti/sdk/enums';
import { executeQuery } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { offerId, currentUserId } = body;

    if (!offerId || !currentUserId) {
      return errorResponse('offerId and currentUserId are required', undefined, 400);
    }

    // Get the offer first
    const GET_OFFER = `
      query GetOffer($offerId: Int!) {
        real_estate_offer_by_pk(id: $offerId) {
          id
          offer_key
          property_id
          initiator_firebase_uid
          recipient_firebase_uid
          offer_status
          is_active
        }
      }
    `;

    const offerResult = await executeQuery(GET_OFFER, { offerId: parseInt(offerId) }) as { 
      real_estate_offer_by_pk?: {
        id: number;
        offer_key: string;
        property_id: string;
        initiator_firebase_uid: string;
        recipient_firebase_uid: string;
        offer_status: string;
        is_active: boolean;
      }
    };
    const currentOffer = offerResult.real_estate_offer_by_pk;

    if (!currentOffer) {
      return errorResponse('Offer not found', undefined, 404);
    }

    // Verify user has permission
    const isInitiator = currentOffer.initiator_firebase_uid === currentUserId;
    const isRecipient = currentOffer.recipient_firebase_uid === currentUserId;

    if (!isInitiator && !isRecipient) {
      return errorResponse('User does not have permission to accept this offer', undefined, 403);
    }

    if (currentOffer.offer_status !== 'pending' && currentOffer.offer_status !== 'countered') {
      return errorResponse('Offer cannot be accepted in its current state', undefined, 400);
    }

    const { sdk } = getHasuraGraphqlSDK();

    // Update offer status to ACCEPTED
    await sdk.updateRealEstateOfferStatus({
      offerId: parseInt(offerId),
      offerStatus: RealEstateOfferStatus.ACCEPTED,
    });

    // Insert action record
    const actionObject = {
      created_at: new Date().toISOString(),
      offer_id: parseInt(offerId),
      offer_key: currentOffer.offer_key,
      property_id: currentOffer.property_id,
      action: isInitiator
        ? RealEstateOfferAction.INITIATOR_ACCEPTED
        : RealEstateOfferAction.RECIPIENT_ACCEPTED,
    };

    await sdk.insertRealEstateOfferByActionOne({
      object: actionObject,
    });

    // Reject other active offers for the same property (if needed)
    // This is a simplified version - you may want to add more logic here

    return successResponse(
      {
        offerId: offerId.toString(),
        offerKey: currentOffer.offer_key,
        newStatus: 'accepted',
        action: isInitiator ? 'INITIATOR_ACCEPTED' : 'RECIPIENT_ACCEPTED',
      },
      'Offer accepted and deal finalized!',
      undefined,
      200
    );
  } catch (error: unknown) {
    console.error('Error accepting offer:', error);
    const errorObj = error as { message?: string };
    return errorResponse(
      errorObj.message || 'Failed to accept offer',
      undefined,
      500
    );
  }
}

