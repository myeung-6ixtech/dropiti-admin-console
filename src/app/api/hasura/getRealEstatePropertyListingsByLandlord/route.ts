import { decrypt } from '@dropiti/base/utils'
import { getHasuraGraphqlSDK } from '@dropiti/sdk'

export async function POST(request: Request) {
  const { sdk } = getHasuraGraphqlSDK()
  let body = await request.json()
  body = (await decrypt(body.token)).payload as {
    landlordUID?: string
  }

  if (body.landlordUID) {
    try {
      const result = await sdk.getRealEstatePropertyListingsByLandlord({
        landlordUID: body.landlordUID
      }) as { real_estate_property_listing?: unknown[] };
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
}
