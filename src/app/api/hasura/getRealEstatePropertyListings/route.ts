import { getHasuraGraphqlSDK } from '@dropiti/sdk'

export async function GET() {
  const { sdk } = getHasuraGraphqlSDK()
  try {
    const result = await sdk.getRealEstatePropertyListings() as { real_estate_property_listing?: unknown[] };
    const res = result.real_estate_property_listing || [];
    return Response.json(res, {
      status: 200,
      statusText: 'OK'
    })
  } catch (error: unknown) {
    const errorObj = error as { code?: number; message?: string };
    return Response.json(null, {
      status: errorObj.code || 500,
      statusText: errorObj.message || 'Internal Server Error'
    })
  }
}
