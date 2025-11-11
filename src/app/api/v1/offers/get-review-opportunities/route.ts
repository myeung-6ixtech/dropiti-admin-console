import { NextRequest } from 'next/server';
import { executeQuery } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return errorResponse('user_id is required', undefined, 400);
    }

    // Get completed/accepted offers for this user
    const GET_COMPLETED_OFFERS = `
      query GetCompletedOffers($user_id: String!) {
        real_estate_offer(
          where: {
            _or: [
              {initiator_firebase_uid: {_eq: $user_id}}
              {recipient_firebase_uid: {_eq: $user_id}}
            ]
            offer_status: {_eq: "accepted"}
          }
          order_by: {created_at: desc}
        ) {
          id
          offer_key
          property_id
          initiator_firebase_uid
          recipient_firebase_uid
          created_at
        }
      }
    `;

    const result = await executeQuery(GET_COMPLETED_OFFERS, { user_id });
    const offers = result.real_estate_offer || [];

    // Transform to review opportunities format
    // Note: This is a simplified version - you may want to check if reviews already exist
    const opportunities = await Promise.all(
      offers.map(async (offer: any) => {
        const isInitiator = offer.initiator_firebase_uid === user_id;
        const otherPartyId = isInitiator 
          ? offer.recipient_firebase_uid 
          : offer.initiator_firebase_uid;

        // Get other party info
        const GET_USER = `
          query GetUser($firebase_uid: String!) {
            real_estate_user(where: {firebase_uid: {_eq: $firebase_uid}}, limit: 1) {
              display_name
              photo_url
            }
          }
        `;

        const userResult = await executeQuery(GET_USER, { firebase_uid: otherPartyId });
        const otherParty = userResult.real_estate_user?.[0];

        // Get property info
        const GET_PROPERTY = `
          query GetProperty($propertyId: Int!) {
            real_estate_property_listing_by_pk(id: $propertyId) {
              property_uuid
              title
            }
          }
        `;

        const propertyResult = await executeQuery(GET_PROPERTY, { propertyId: offer.property_id });
        const property = propertyResult.real_estate_property_listing_by_pk;

        // Calculate review window end (e.g., 30 days after offer acceptance)
        const reviewWindowEnd = new Date(offer.created_at);
        reviewWindowEnd.setDate(reviewWindowEnd.getDate() + 30);

        return {
          id: offer.id.toString(),
          offerId: offer.id.toString(),
          propertyUuid: property?.property_uuid || '',
          propertyTitle: property?.title || '',
          otherPartyName: otherParty?.display_name || '',
          otherPartyPhotoUrl: otherParty?.photo_url || '',
          reviewType: isInitiator ? 'tenant_to_landlord' : 'landlord_to_tenant',
          reviewWindowEnd: reviewWindowEnd.toISOString(),
          status: 'pending',
        };
      })
    );

    return successResponse({ opportunities });
  } catch (error: any) {
    console.error('Error fetching review opportunities:', error);
    return errorResponse(
      error.message || 'Failed to fetch review opportunities',
      undefined,
      500
    );
  }
}

