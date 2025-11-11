import { NextRequest } from 'next/server';
import { executeQuery, executeMutation } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user1FirebaseUid,
      user2FirebaseUid,
      user1Role,
      user2Role,
    } = body;

    if (!user1FirebaseUid || !user2FirebaseUid) {
      return errorResponse('user1FirebaseUid and user2FirebaseUid are required', undefined, 400);
    }

    // Note: This is a placeholder implementation
    // You'll need to implement room creation based on your database schema
    
    // Check if room already exists
    // If exists, return it
    // If not, create new room

    const roomId = randomUUID();
    const isNew = true; // Placeholder

    return successResponse({
      roomId,
      room: {
        id: roomId,
        room_type: 'direct',
        created_at: new Date().toISOString(),
      },
      isNew,
    });
  } catch (error: any) {
    console.error('Error getting or creating room:', error);
    return errorResponse(
      error.message || 'Failed to get or create room',
      undefined,
      500
    );
  }
}

