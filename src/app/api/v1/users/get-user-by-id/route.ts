import { NextRequest } from 'next/server';
import { RealEstateUserService } from '@/app/graphql/services/realEstateUserService';
import { executeQuery } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firebase_uid = searchParams.get('firebase_uid');
    const id = searchParams.get('id');

    const userId = firebase_uid || id;

    if (!userId) {
      return errorResponse('firebase_uid or id is required', undefined, 400);
    }

    const user = await RealEstateUserService.getRealEstateUserByUid(userId);

    if (!user) {
      return errorResponse('User not found', undefined, 404);
    }

    // Get additional user stats (rating, review_count) - placeholder for now
    // In a real implementation, you'd query reviews to calculate these
    const GET_USER_STATS = `
      query GetUserStats($firebase_uid: String!) {
        real_estate_review_aggregate(
          where: {reviewee_firebase_uid: {_eq: $firebase_uid}}
        ) {
          aggregate {
            count
            avg {
              rating
            }
          }
        }
      }
    `;

    let rating = 0;
    let review_count = 0;

    try {
      const statsResult = await executeQuery(GET_USER_STATS, { firebase_uid: userId });
      review_count = statsResult.real_estate_review_aggregate?.aggregate?.count || 0;
      rating = statsResult.real_estate_review_aggregate?.aggregate?.avg?.rating || 0;
    } catch (error) {
      // Stats query failed, use defaults
      console.warn('Failed to fetch user stats:', error);
    }

    return successResponse({
      uuid: user.firebase_uid,
      firebase_uid: user.firebase_uid,
      display_name: user.display_name,
      email: user.email,
      photo_url: user.photo_url || '',
      phone_number: user.phone_number || '',
      location: '', // Can be added to schema
      about: '', // Can be added to schema
      verified: true, // Can be added to schema
      rating: Math.round(rating * 10) / 10, // Round to 1 decimal
      review_count,
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return errorResponse(
      error.message || 'Failed to fetch user',
      undefined,
      500
    );
  }
}

