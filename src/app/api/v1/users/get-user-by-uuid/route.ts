import { NextRequest } from 'next/server';
import { RealEstateUserService } from '@/app/graphql/services/realEstateUserService';
import { successResponse, errorResponse } from '../../utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uuid = searchParams.get('uuid');

    if (!uuid) {
      return errorResponse('uuid is required', undefined, 400);
    }

    // For now, uuid is the same as firebase_uid
    const user = await RealEstateUserService.getRealEstateUserByUid(uuid);

    if (!user) {
      return errorResponse('User not found', undefined, 404);
    }

    return successResponse({
      uuid: user.firebase_uid,
      firebase_uid: user.firebase_uid,
      display_name: user.display_name,
      email: user.email,
      photo_url: user.photo_url || '',
      phone_number: user.phone_number || '',
    });
  } catch (error: any) {
    console.error('Error fetching user by UUID:', error);
    return errorResponse(
      error.message || 'Failed to fetch user',
      undefined,
      500
    );
  }
}

