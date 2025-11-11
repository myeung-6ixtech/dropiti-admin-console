import { NextRequest } from 'next/server';
import { RealEstateUserService } from '@/app/graphql/services/realEstateUserService';
import { successResponse, errorResponse } from '../../utils/response';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return errorResponse('id (firebase_uid) is required', undefined, 400);
    }

    if (!updates || typeof updates !== 'object') {
      return errorResponse('updates object is required', undefined, 400);
    }

    // Transform updates to match service format
    const userUpdates: any = {};

    if (updates.display_name !== undefined) userUpdates.display_name = updates.display_name;
    if (updates.phone_number !== undefined) userUpdates.phone_number = updates.phone_number;
    if (updates.location !== undefined) userUpdates.location = updates.location;
    if (updates.about !== undefined) userUpdates.about = updates.about;
    if (updates.languages !== undefined) userUpdates.languages = updates.languages;
    if (updates.preferences !== undefined) userUpdates.preferences = updates.preferences;
    if (updates.notification_settings !== undefined) userUpdates.notification_settings = updates.notification_settings;

    const updatedUser = await RealEstateUserService.updateRealEstateUser(id, userUpdates);

    if (!updatedUser) {
      return errorResponse('User not found or update failed', undefined, 404);
    }

    return successResponse(
      updatedUser,
      'User updated successfully'
    );
  } catch (error: any) {
    console.error('Error updating user:', error);
    return errorResponse(
      error.message || 'Failed to update user',
      undefined,
      500
    );
  }
}

