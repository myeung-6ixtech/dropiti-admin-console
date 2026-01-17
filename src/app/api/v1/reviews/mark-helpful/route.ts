import { NextRequest } from 'next/server';
import { executeMutation } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId } = body;

    if (!reviewId) {
      return errorResponse('reviewId is required', undefined, 400);
    }

    // Increment helpful_count
    const UPDATE_REVIEW = `
      mutation IncrementHelpfulCount($reviewId: Int!) {
        update_real_estate_review_by_pk(
          pk_columns: {id: $reviewId}
          _inc: {helpful_count: 1}
        ) {
          id
          helpful_count
        }
      }
    `;

    const result = await executeMutation(UPDATE_REVIEW, {
      reviewId: parseInt(reviewId),
    });

    return successResponse(
      result.update_real_estate_review_by_pk,
      'Review marked as helpful'
    );
  } catch (error: unknown) {
    console.error('Error marking review as helpful:', error);
    return errorResponse(
      error.message || 'Failed to mark review as helpful',
      undefined,
      500
    );
  }
}

