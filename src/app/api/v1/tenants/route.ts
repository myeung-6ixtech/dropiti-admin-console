import { NextRequest } from 'next/server';
// import { executeQuery } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Note: This is a placeholder implementation
    // You'll need to implement tenant profiles based on your database schema
    /* const GET_TENANTS = `
      query GetTenants($status: String!, $limit: Int, $offset: Int) {
        # Replace with your actual tenant profile query
        # This is a placeholder structure
      }
    `; */

    // For now, return empty array as placeholder
    // TODO: Implement actual tenant profile query
    return successResponse(
      [],
      undefined,
      {
        total: 0,
        limit,
        offset,
        hasMore: false,
      }
    );
  } catch (error: unknown) {
    console.error('Error fetching tenant profiles:', error);
    return errorResponse(
      error.message || 'Failed to fetch tenant profiles',
      undefined,
      500
    );
  }
}

