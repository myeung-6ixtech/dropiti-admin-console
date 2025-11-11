import { NextRequest } from 'next/server';
import { executeQuery } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const offerId = searchParams.get('offerId');

    if (!offerId) {
      return errorResponse('offerId is required', undefined, 400);
    }

    const GET_OFFER_ACTIONS = `
      query GetOfferActions($offerId: Int!) {
        real_estate_offer_by_action(
          where: {offer_id: {_eq: $offerId}}
          order_by: {created_at: asc}
        ) {
          id
          offer_id
          offer_key
          property_id
          action
          created_at
        }
      }
    `;

    const result = await executeQuery(GET_OFFER_ACTIONS, { offerId: parseInt(offerId) });

    return successResponse(result.real_estate_offer_by_action || []);
  } catch (error: any) {
    console.error('Error fetching offer actions:', error);
    return errorResponse(
      error.message || 'Failed to fetch offer actions',
      undefined,
      500
    );
  }
}

