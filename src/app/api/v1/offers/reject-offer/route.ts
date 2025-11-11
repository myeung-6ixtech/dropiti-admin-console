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

    const offerResult = await executeQuery(GET_OFFER, { offerId: parseInt(offerId) });
    const currentOffer = offerResult.real_estate_offer_by_pk;

    if (!currentOffer) {
      return errorResponse('Offer not found', undefined, 404);
    }

    // Verify user has permission
    const isInitiator = currentOffer.initiator_firebase_uid === currentUserId;
    const isRecipient = currentOffer.recipient_firebase_uid === currentUserId;

    if (!isInitiator && !isRecipient) {
      return errorResponse('User does not have permission to reject this offer', undefined, 403);
    }

    const { sdk } = getHasuraGraphqlSDK();

    // Update offer status to REJECTED
    const updateOfferRes = await sdk.updateRealEstateOfferStatus({
      offerId: parseInt(offerId),
      offerStatus: RealEstateOfferStatus.REJECTED,
    });

    // Insert action record
    const actionObject = {
      created_at: new Date().toISOString(),
      offer_id: parseInt(offerId),
      offer_key: currentOffer.offer_key,
      property_id: currentOffer.property_id,
      action: isInitiator
        ? RealEstateOfferAction.INITIATOR_REJECTED
        : RealEstateOfferAction.RECIPIENT_REJECTED,
    };

    await sdk.insertRealEstateOfferByActionOne({
      object: actionObject,
    });

    return successResponse(
      {
        offerId: offerId.toString(),
        offerKey: currentOffer.offer_key,
        newStatus: 'rejected',
        reason: reason || undefined,
      },
      'Offer rejected successfully'
    );
  } catch (error: any) {
    console.error('Error rejecting offer:', error);
    return errorResponse(
      error.message || 'Failed to reject offer',
      undefined,
      500
    );
  }
}

