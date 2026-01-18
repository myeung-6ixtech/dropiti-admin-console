import { NextRequest } from 'next/server';
import { executeMutation } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return errorResponse('reviewId is required', undefined, 400);
    }

    const DELETE_REVIEW = `
      mutation DeleteReview($reviewId: Int!) {
        delete_real_estate_review_by_pk(id: $reviewId) {
          id
          review_uuid
        }
      }
    `;

    const result = await executeMutation(DELETE_REVIEW, {
      reviewId: parseInt(reviewId),
    }) as {
      delete_real_estate_review_by_pk?: {
        id: number;
        review_uuid: string;
      };
    };

    if (!result.delete_real_estate_review_by_pk) {
      return errorResponse('Review not found', undefined, 404);
    }

    return successResponse(
      { deleted: true },
      'Review deleted successfully'
    );
  } catch (error: unknown) {
    console.error('Error deleting review:', error);
    const errorObj = error as { message?: string };
    return errorResponse(
      errorObj.message || 'Failed to delete review',
      undefined,
      500
    );
  }
}

