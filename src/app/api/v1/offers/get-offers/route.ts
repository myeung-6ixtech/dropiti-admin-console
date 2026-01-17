import { NextRequest } from 'next/server';
import { executeQuery } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'incoming' or 'outgoing'
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return errorResponse('userId is required', undefined, 400);
    }

    if (!type || !['incoming', 'outgoing'].includes(type)) {
      return errorResponse('type must be "incoming" or "outgoing"', undefined, 400);
    }

    const GET_OFFERS = type === 'incoming'
      ? `
        query GetIncomingOffers($recipient_firebase_uid: String!, $limit: Int, $offset: Int) {
          real_estate_offer(
            where: {recipient_firebase_uid: {_eq: $recipient_firebase_uid}}
            limit: $limit
            offset: $offset
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
          real_estate_offer_aggregate(
            where: {recipient_firebase_uid: {_eq: $recipient_firebase_uid}}
          ) {
            aggregate {
              count
            }
          }
        }
      `
      : `
        query GetOutgoingOffers($initiator_firebase_uid: String!, $limit: Int, $offset: Int) {
          real_estate_offer(
            where: {initiator_firebase_uid: {_eq: $initiator_firebase_uid}}
            limit: $limit
            offset: $offset
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
          real_estate_offer_aggregate(
            where: {initiator_firebase_uid: {_eq: $initiator_firebase_uid}}
          ) {
            aggregate {
              count
            }
          }
        }
      `;

    const variables = type === 'incoming'
      ? { recipient_firebase_uid: userId, limit, offset }
      : { initiator_firebase_uid: userId, limit, offset };

    const result = await executeQuery(GET_OFFERS, variables);

    const offers = result.real_estate_offer || [];
    const total = result.real_estate_offer_aggregate?.aggregate?.count || 0;

    return successResponse(
      offers,
      undefined,
      {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      }
    );
  } catch (error: unknown) {
    console.error('Error fetching offers:', error);
    return errorResponse(
      error.message || 'Failed to fetch offers',
      undefined,
      500
    );
  }
}

