import { NextRequest } from 'next/server';
// import { executeQuery } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userFirebaseUid = searchParams.get('userFirebaseUid');

    if (!userFirebaseUid) {
      return errorResponse('userFirebaseUid is required', undefined, 400);
    }

    // Note: This is a placeholder implementation
    // TODO: Implement actual unread count query
    /* const GET_UNREAD_COUNT = `
      query GetUnreadCount($userFirebaseUid: String!) {
        # Replace with your actual unread count query
      }
    `; */

    return successResponse({ count: 0 });
  } catch (error: unknown) {
    console.error('Error fetching unread count:', error);
    return errorResponse(
      error.message || 'Failed to fetch unread count',
      undefined,
      500
    );
  }
}

