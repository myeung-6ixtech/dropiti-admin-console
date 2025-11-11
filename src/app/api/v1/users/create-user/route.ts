import { NextRequest } from 'next/server';
import { RealEstateUserService } from '@/app/graphql/services/realEstateUserService';
import { successResponse, errorResponse } from '../../utils/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firebase_uid,
      display_name,
      email,
      photo_url,
      auth_provider,
    } = body;

    if (!firebase_uid || !display_name || !email) {
      return errorResponse('firebase_uid, display_name, and email are required', undefined, 400);
    }

    // Check if user already exists
    const existingUser = await RealEstateUserService.getRealEstateUserByUid(firebase_uid);
    if (existingUser) {
      return errorResponse('User already exists', undefined, 409);
    }

    const user = await RealEstateUserService.createRealEstateUser({
      firebase_uid,
      display_name,
      email,
      photo_url: photo_url || null,
      auth_provider: auth_provider || 'firebase',
      phone_number: '', // Can be updated later
    });

    return successResponse(
      {
        uuid: user.firebase_uid, // Using firebase_uid as uuid for now
        firebase_uid: user.firebase_uid,
        display_name: user.display_name,
        email: user.email,
        photo_url: user.photo_url || '',
        auth_provider: user.auth_provider,
      },
      'User created successfully',
      undefined,
      201
    );
  } catch (error: any) {
    console.error('Error creating user:', error);
    return errorResponse(
      error.message || 'Failed to create user',
      undefined,
      500
    );
  }
}

