import { NextRequest } from 'next/server';
import { getHasuraGraphqlSDK } from '@dropiti/sdk';
import { RealEstateOfferAction, RealEstateOfferStatus } from '@dropiti/sdk/enums';
import { executeQuery } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { offerId, currentUserId, counterData } = body;

    if (!offerId || !currentUserId || !counterData) {
      return errorResponse('offerId, currentUserId, and counterData are required', undefined, 400);
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
      return errorResponse('User does not have permission to counter this offer', undefined, 403);
    }

    const { sdk } = getHasuraGraphqlSDK();

    // Update current offer status to COUNTERED
    await sdk.updateRealEstateOfferStatus({
      offerId: parseInt(offerId),
      offerStatus: RealEstateOfferStatus.COUNTERED,
    });

    // Insert action record for countering
    const counterActionObject = {
      created_at: new Date().toISOString(),
      offer_id: parseInt(offerId),
      offer_key: currentOffer.offer_key,
      property_id: currentOffer.property_id,
      action: isInitiator
        ? RealEstateOfferAction.INITIATOR_COUNTERED
        : RealEstateOfferAction.RECIPIENT_COUNTERED,
    };

    await sdk.insertRealEstateOfferByActionOne({
      object: counterActionObject,
    });

    // Create new counter offer
    const newOfferKey = currentOffer.offer_key; // Keep same offer key
    const newOfferObject = {
      offer_key: newOfferKey,
      property_id: currentOffer.property_id,
      initiator_firebase_uid: isInitiator ? currentUserId : currentOffer.initiator_firebase_uid,
      recipient_firebase_uid: isRecipient ? currentUserId : currentOffer.recipient_firebase_uid,
      proposing_rent_price: counterData.rentPrice,
      proposing_rent_price_currency: 'HKD', // Default
      num_leasing_months: counterData.numLeasingMonths || 12,
      payment_frequency: counterData.paymentFrequency || 'monthly',
      move_in_date: counterData.moveInDate,
      offer_status: 'pending',
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const insertNewOfferRes = await sdk.insertRealEstateOfferOne({
      object: newOfferObject,
    });

    const newOfferId = insertNewOfferRes.insert_real_estate_offer_one?.id;

    // Insert action record for new offer
    const newOfferActionObject = {
      created_at: new Date().toISOString(),
      offer_id: newOfferId,
      offer_key: newOfferKey,
      property_id: currentOffer.property_id,
      action: isInitiator
        ? RealEstateOfferAction.INITIATOR_CREATED
        : RealEstateOfferAction.RECIPIENT_CREATED,
    };

    await sdk.insertRealEstateOfferByActionOne({
      object: newOfferActionObject,
    });

    return successResponse(
      {
        originalOfferId: offerId.toString(),
        newOfferId: newOfferId?.toString() || '',
        offerKey: newOfferKey,
        status: 'countered',
      },
      'Counter offer created successfully'
    );
  } catch (error: unknown) {
    console.error('Error creating counter offer:', error);
    const errorObj = error as { message?: string };
    return errorResponse(
      errorObj.message || 'Failed to create counter offer',
      undefined,
      500
    );
  }
}

