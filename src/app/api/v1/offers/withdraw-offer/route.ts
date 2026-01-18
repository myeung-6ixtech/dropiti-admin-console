import { NextRequest } from 'next/server';
import { getHasuraGraphqlSDK } from '@dropiti/sdk';
import { RealEstateOfferAction, RealEstateOfferStatus } from '@dropiti/sdk/enums';
import { executeQuery } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { offerId, currentUserId, reason } = body;

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

    // Only initiator can withdraw
    if (currentOffer.initiator_firebase_uid !== currentUserId) {
      return errorResponse('Only the initiator can withdraw this offer', undefined, 403);
    }

    if (currentOffer.offer_status === 'accepted' || currentOffer.offer_status === 'completed') {
      return errorResponse('Cannot withdraw an accepted or completed offer', undefined, 400);
    }

    const { sdk } = getHasuraGraphqlSDK();

    // Update offer status to WITHDRAWN
    await sdk.updateRealEstateOfferStatus({
      offerId: parseInt(offerId),
      offerStatus: RealEstateOfferStatus.WITHDRAWN,
    });

    // Insert action record
    const actionObject = {
      created_at: new Date().toISOString(),
      offer_id: parseInt(offerId),
      offer_key: currentOffer.offer_key,
      property_id: currentOffer.property_id,
      action: RealEstateOfferAction.INITIATOR_CANCELLED,
    };

    await sdk.insertRealEstateOfferByActionOne({
      object: actionObject,
    });

    return successResponse(
      {
        offerId: offerId.toString(),
        offerKey: currentOffer.offer_key,
        newStatus: 'withdrawn',
        reason: reason || undefined,
      },
      'Offer withdrawn successfully'
    );
  } catch (error: unknown) {
    console.error('Error withdrawing offer:', error);
    const errorObj = error as { message?: string };
    return errorResponse(
      errorObj.message || 'Failed to withdraw offer',
      undefined,
      500
    );
  }
}

