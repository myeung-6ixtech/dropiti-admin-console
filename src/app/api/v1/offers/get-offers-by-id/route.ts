import { NextRequest } from 'next/server';
import { executeQuery } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recipientFirebaseUid = searchParams.get('recipientFirebaseUid');
    const propertyUuid = searchParams.get('propertyUuid');

    if (!recipientFirebaseUid || !propertyUuid) {
      return errorResponse('recipientFirebaseUid and propertyUuid are required', undefined, 400);
    }

    // First get property ID from UUID
    const GET_PROPERTY = `
      query GetPropertyByUuid($propertyUuid: uuid!) {
        real_estate_property_listing(
          where: {property_uuid: {_eq: $propertyUuid}}
          limit: 1
        ) {
          id
        }
      }
    `;

    const propertyResult = await executeQuery(GET_PROPERTY, { propertyUuid });
    const property = propertyResult.real_estate_property_listing?.[0];

    if (!property || !property.id) {
      return errorResponse('Property not found', undefined, 404);
    }

    // Get offers for this property and recipient
    const GET_OFFERS = `
      query GetOffersByPropertyAndRecipient($propertyId: Int!, $recipientFirebaseUid: String!) {
        real_estate_offer(
          where: {
            property_id: {_eq: $propertyId}
            recipient_firebase_uid: {_eq: $recipientFirebaseUid}
          }
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

    const offersResult = await executeQuery(GET_OFFERS, {
      propertyId: property.id,
      recipientFirebaseUid,
    });

    return successResponse(offersResult.real_estate_offer || []);
  } catch (error: any) {
    console.error('Error fetching offers by ID:', error);
    return errorResponse(
      error.message || 'Failed to fetch offers',
      undefined,
      500
    );
  }
}

