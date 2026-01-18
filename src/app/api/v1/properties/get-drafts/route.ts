import { NextRequest } from 'next/server';
import { executeQuery } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const landlord_id = searchParams.get('landlord_id');

    if (!landlord_id) {
      return errorResponse('landlord_id is required', undefined, 400);
    }

    const GET_DRAFTS = `
      query GetDrafts($landlord_firebase_uid: String!) {
        real_estate_property_listing(
          where: {
            landlord_firebase_uid: {_eq: $landlord_firebase_uid}
          }
          order_by: {created_at: desc}
        ) {
          id
          property_uuid
          title
          description
          created_at
          updated_at
        }
      }
    `;

    const result = await executeQuery(GET_DRAFTS, {
      landlord_firebase_uid: landlord_id,
    }) as {
      real_estate_property_listing?: Array<Record<string, unknown>>;
    };

    const drafts = (result.real_estate_property_listing || []).map((draft: Record<string, unknown>) => ({
      id: draft.id?.toString() || '',
      property_uuid: draft.property_uuid,
      title: draft.title,
      status: 'draft',
      completion_percentage: calculateCompletionPercentage(draft),
      last_saved_at: draft.updated_at || draft.created_at,
    }));

    return successResponse(drafts);
  } catch (error: unknown) {
    console.error('Error fetching drafts:', error);
    const errorObj = error as { message?: string };
    return errorResponse(
      errorObj.message || 'Failed to fetch drafts',
      undefined,
      500
    );
  }
}

function calculateCompletionPercentage(draft: Record<string, unknown>): number {
  let completed = 0;
  const total = 8; // Total required fields

  if (draft.title) completed++;
  if (draft.description) completed++;
  // Add more field checks as needed

  return Math.round((completed / total) * 100);
}

