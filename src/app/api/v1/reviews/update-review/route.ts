import { NextRequest } from 'next/server';
import { executeMutation } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, updates } = body;

    if (!reviewId || !updates) {
      return errorResponse('reviewId and updates are required', undefined, 400);
    }

    const UPDATE_REVIEW = `
      mutation UpdateReview($reviewId: Int!, $set: real_estate_review_set_input!) {
        update_real_estate_review_by_pk(
          pk_columns: {id: $reviewId}
          _set: $set
        ) {
          id
          review_uuid
          rating
          comment
          updated_at
        }
      }
    `;

    const updateSet: Record<string, unknown> = {};
    if (updates.rating !== undefined) {
      if (updates.rating < 1 || updates.rating > 5) {
        return errorResponse('Rating must be between 1 and 5', undefined, 400);
      }
      updateSet.rating = updates.rating;
    }
    if (updates.comment !== undefined) updateSet.comment = updates.comment;

    const result = await executeMutation(UPDATE_REVIEW, {
      reviewId: parseInt(reviewId),
      set: updateSet,
    }) as {
      update_real_estate_review_by_pk?: unknown;
    };

    return successResponse(
      result.update_real_estate_review_by_pk,
      'Review updated successfully'
    );
  } catch (error: unknown) {
    console.error('Error updating review:', error);
    const errorObj = error as { message?: string };
    return errorResponse(
      errorObj.message || 'Failed to update review',
      undefined,
      500
    );
  }
}

