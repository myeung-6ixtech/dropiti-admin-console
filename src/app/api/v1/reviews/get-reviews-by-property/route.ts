import { NextRequest } from 'next/server';
import { executeQuery } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyUuid = searchParams.get('propertyUuid');
    const reviewType = searchParams.get('reviewType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!propertyUuid) {
      return errorResponse('propertyUuid is required', undefined, 400);
    }

    const GET_REVIEWS = `
      query GetReviewsByProperty($propertyUuid: uuid!, $reviewType: String, $limit: Int, $offset: Int) {
        real_estate_review(
          where: {
            property_uuid: {_eq: $propertyUuid}
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
            property_uuid: {_eq: $propertyUuid}
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
      propertyUuid,
      reviewType: reviewType || null,
      limit,
      offset,
    });

    const reviews = result.real_estate_review || [];
    const total = result.real_estate_review_aggregate?.aggregate?.count || 0;

    // Get reviewer and reviewee details
    const enrichedReviews = await Promise.all(
      reviews.map(async (review: any) => {
        const GET_REVIEWER = `
          query GetUser($firebase_uid: String!) {
            real_estate_user(where: {firebase_uid: {_eq: $firebase_uid}}, limit: 1) {
              uuid
              display_name
              email
              photo_url
            }
          }
        `;

        const reviewerResult = await executeQuery(GET_REVIEWER, {
          firebase_uid: review.reviewer_firebase_uid,
        });
        const reviewer = reviewerResult.real_estate_user?.[0];

        const revieweeResult = await executeQuery(GET_REVIEWER, {
          firebase_uid: review.reviewee_firebase_uid,
        });
        const reviewee = revieweeResult.real_estate_user?.[0];

        return {
          id: review.id.toString(),
          reviewUuid: review.review_uuid,
          reviewerFirebaseUid: review.reviewer_firebase_uid,
          revieweeFirebaseUid: review.reviewee_firebase_uid,
          reviewType: review.review_type,
          rating: review.rating,
          comment: review.comment,
          reviewer: reviewer ? {
            uuid: reviewer.uuid || reviewer.firebase_uid,
            displayName: reviewer.display_name,
            email: reviewer.email,
            photoUrl: reviewer.photo_url || '',
          } : null,
          reviewee: reviewee ? {
            uuid: reviewee.uuid || reviewee.firebase_uid,
            displayName: reviewee.display_name,
            email: reviewee.email,
            photoUrl: reviewee.photo_url || '',
          } : null,
        };
      })
    );

    return successResponse(
      enrichedReviews,
      undefined,
      {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      }
    );
  } catch (error: any) {
    console.error('Error fetching reviews by property:', error);
    return errorResponse(
      error.message || 'Failed to fetch reviews',
      undefined,
      500
    );
  }
}

