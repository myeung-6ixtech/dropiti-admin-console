import { NextRequest } from 'next/server';
import { getHasuraGraphqlSDK } from '@dropiti/sdk';
import { RealEstateOfferAction } from '@dropiti/sdk/enums';
import { successResponse, errorResponse } from '../../utils/response';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      propertyId,
      initiatorFirebaseUid,
      recipientFirebaseUid,
      proposingRentPrice,
      numLeasingMonths,
      paymentFrequency,
      moveInDate,
      currency,
    } = body;

    // Validate required fields
    if (!propertyId || !initiatorFirebaseUid || !recipientFirebaseUid || !proposingRentPrice) {
      return errorResponse(
        'propertyId, initiatorFirebaseUid, recipientFirebaseUid, and proposingRentPrice are required',
        undefined,
        400
      );
    }

    const { sdk } = getHasuraGraphqlSDK();

    // Generate offer key
    const offer_key = `offer_${Date.now()}_${randomUUID().substring(0, 8)}`;

    // Create offer object
    const offerObject = {
      offer_key,
      property_id: propertyId,
      initiator_firebase_uid: initiatorFirebaseUid,
      recipient_firebase_uid: recipientFirebaseUid,
      proposing_rent_price: proposingRentPrice,
      proposing_rent_price_currency: currency || 'HKD',
      num_leasing_months: numLeasingMonths || 12,
      payment_frequency: paymentFrequency || 'monthly',
      move_in_date: moveInDate,
      offer_status: 'pending',
      is_active: true,
      created_at: new Date().toISOString(),
    };

    // Insert offer
    const insertOfferRes = await sdk.insertRealEstateOfferOne({
      object: offerObject,
    });

    const newOfferId = insertOfferRes.insert_real_estate_offer_one?.id;

    if (!newOfferId) {
      return errorResponse('Failed to create offer', undefined, 500);
    }

    // Insert action record
    const actionObject = {
      created_at: new Date().toISOString(),
      offer_id: newOfferId,
      offer_key,
      property_id: propertyId,
      action: RealEstateOfferAction.INITIATOR_CREATED,
    };

    await sdk.insertRealEstateOfferByActionOne({
      object: actionObject,
    });

    const createdOffer = insertOfferRes.insert_real_estate_offer_one;

    return successResponse(
      {
        id: createdOffer?.id?.toString() || '',
        offer_key: createdOffer?.offer_key || offer_key,
        property_uuid: propertyId,
        initiator_firebase_uid: initiatorFirebaseUid,
        recipient_firebase_uid: recipientFirebaseUid,
        proposing_rent_price: proposingRentPrice,
        offer_status: 'pending',
        is_active: true,
        created_at: createdOffer?.created_at || new Date().toISOString(),
      },
      'Offer created successfully',
      undefined,
      201
    );
  } catch (error: unknown) {
    console.error('Error creating offer:', error);
    return errorResponse(
      error.message || 'Failed to create offer',
      undefined,
      500
    );
  }
}

