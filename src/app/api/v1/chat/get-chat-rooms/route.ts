import { NextRequest } from 'next/server';
import { executeQuery } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userFirebaseUid = searchParams.get('userFirebaseUid');

    if (!userFirebaseUid) {
      return errorResponse('userFirebaseUid is required', undefined, 400);
    }

    // Note: This is a placeholder implementation
    // You'll need to implement chat rooms based on your database schema
    const GET_CHAT_ROOMS = `
      query GetChatRooms($userFirebaseUid: String!) {
        # Replace with your actual chat room query
        # This is a placeholder structure
      }
    `;

    // For now, return empty array as placeholder
    // TODO: Implement actual chat room query based on your schema
    return successResponse([]);
  } catch (error: any) {
    console.error('Error fetching chat rooms:', error);
    return errorResponse(
      error.message || 'Failed to fetch chat rooms',
      undefined,
      500
    );
  }
}

