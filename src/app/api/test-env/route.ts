import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    SDK_BACKEND_URL: process.env.SDK_BACKEND_URL || 'NOT SET',
    SDK_HASURA_ADMIN_SECRET: process.env.SDK_HASURA_ADMIN_SECRET ? 'SET (hidden)' : 'NOT SET',
    NEXT_PUBLIC_SDK_BACKEND_URL: process.env.NEXT_PUBLIC_SDK_BACKEND_URL || 'NOT SET',
    NEXT_PUBLIC_SDK_HASURA_ADMIN_SECRET: process.env.NEXT_PUBLIC_SDK_HASURA_ADMIN_SECRET ? 'SET (hidden)' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('SDK'))
  };

  return NextResponse.json({
    success: true,
    environment: envVars,
    message: 'Environment variables check'
  });
} 