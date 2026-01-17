import { NextRequest } from 'next/server';
import { executeQuery } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userFirebaseUid = searchParams.get('userFirebaseUid');
    const reviewType = searchParams.get('reviewType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userFirebaseUid) {
      return errorResponse('userFirebaseUid is required', undefined, 400);
    }

    const GET_REVIEWS = `
      query GetReviewsByUser($userFirebaseUid: String!, $reviewType: String, $limit: Int, $offset: Int) {
        real_estate_review(
          where: {
            reviewee_firebase_uid: {_eq: $userFirebaseUid}
            ${reviewType ? 'review_type: {_eq: $reviewType}' : ''}
          }
          limit: $limit
          offset: $offset
          order_by: {created_at: desc}
        ) {
          id
          review_uuid
          reviewer_firebase_uid
          reviewee_firebase_uid
          review_type
          rating
          comment
          created_at
        }
        real_estate_review_aggregate(
          where: {
            reviewee_firebase_uid: {_eq: $userFirebaseUid}
            ${reviewType ? 'review_type: {_eq: $reviewType}' : ''}
          }
        ) {
          aggregate {
            count
          }
        }
      }
    `;

    const result = await executeQuery(GET_REVIEWS, {
      userFirebaseUid,
      reviewType: reviewType || null,
      limit,
      offset,
    });

    const reviews = result.real_estate_review || [];
    const total = result.real_estate_review_aggregate?.aggregate?.count || 0;

    return successResponse(
      reviews,
      undefined,
      {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      }
    );
  } catch (error: unknown) {
    console.error('Error fetching reviews by user:', error);
    return errorResponse(
      error.message || 'Failed to fetch reviews',
      undefined,
      500
    );
  }
}

