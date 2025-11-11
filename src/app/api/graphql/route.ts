import { NextRequest, NextResponse } from 'next/server';
import { GraphQLClient } from 'graphql-request';

export async function POST(request: NextRequest) {
  try {
    // Get environment variables (server-side)
    const hasuraUrl = process.env.SDK_BACKEND_URL;
    const hasuraAdminSecret = process.env.SDK_HASURA_ADMIN_SECRET;

    if (!hasuraUrl) {
      return NextResponse.json(
        { error: 'SDK_BACKEND_URL environment variable is required' },
        { status: 500 }
      );
    }

    if (!hasuraAdminSecret) {
      return NextResponse.json(
        { error: 'SDK_HASURA_ADMIN_SECRET environment variable is required' },
        { status: 500 }
      );
    }

    // Create GraphQL client
    const client = new GraphQLClient(hasuraUrl, {
      headers: {
        'x-hasura-admin-secret': hasuraAdminSecret,
        'Content-Type': 'application/json',
      },
    });

    // Get the GraphQL query and variables from the request body
    const { query, variables } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'GraphQL query is required' },
        { status: 400 }
      );
    }

    // Execute the GraphQL query
    const result = await client.request(query, variables);

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('GraphQL API error:', error);
    return NextResponse.json(
      { error: error.message || 'GraphQL request failed' },
      { status: 500 }
    );
  }
} 