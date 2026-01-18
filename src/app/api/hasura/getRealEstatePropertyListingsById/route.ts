import { decrypt } from '@dropiti/base/utils'
import { getHasuraGraphqlSDK } from '@dropiti/sdk'

export async function POST(request: Request) {
  const { sdk } = getHasuraGraphqlSDK()
  const body = await request.json()
  const payload = (await decrypt(body.token)).payload as {
    propertyId: string
  }

  if (payload.propertyId) {
    try {
      const result = await sdk.getRealEstatePropertyListingsByIdDetailed({
        propertyId: +payload.propertyId
      }) as { real_estate_property_listing_by_pk?: unknown };
      const res = result.real_estate_property_listing_by_pk || null;
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
}
