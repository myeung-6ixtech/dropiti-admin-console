import { NextRequest } from 'next/server';
import { executeQuery } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!roomId) {
      return errorResponse('roomId is required', undefined, 400);
    }

    // Note: This is a placeholder implementation
    // You'll need to implement message retrieval based on your database schema
    // Messages should be decrypted if they're stored encrypted

    const GET_MESSAGES = `
      query GetRoomMessages($roomId: uuid!, $limit: Int, $offset: Int) {
        # Replace with your actual message query
        # This is a placeholder structure
      }
    `;

    // For now, return empty array as placeholder
    // TODO: Implement actual message query and decryption
    return successResponse([]);
  } catch (error: any) {
    console.error('Error fetching room messages:', error);
    return errorResponse(
      error.message || 'Failed to fetch room messages',
      undefined,
      500
    );
  }
}

