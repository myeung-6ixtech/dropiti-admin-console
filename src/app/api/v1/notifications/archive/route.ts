import { NextRequest } from 'next/server';
// import { executeMutation } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return errorResponse('notificationId is required', undefined, 400);
    }

    // Note: This is a placeholder implementation
    // TODO: Implement actual notification archiving
    return successResponse(
      { archived: true },
      'Notification archived'
    );
  } catch (error: unknown) {
    console.error('Error archiving notification:', error);
    const errorObj = error as { message?: string };
    return errorResponse(
      errorObj.message || 'Failed to archive notification',
      undefined,
      500
    );
  }
}

