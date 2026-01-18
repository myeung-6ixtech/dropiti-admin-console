import { decrypt } from '@dropiti/base/utils'
import { getHasuraGraphqlSDK } from '@dropiti/sdk'

export async function POST(request: Request) {
  const { sdk } = getHasuraGraphqlSDK()
  let body = await request.json()
  body = (await decrypt(body.token)).payload as {
    propertyIds?: string
  }

  if (body.propertyIds) {
    try {
      const result = await sdk.getRealEstateOffersByPropertyIds({
        propertyIds: JSON.parse(body.propertyIds)
      }) as { real_estate_offer?: unknown[] };
      const res = result.real_estate_offer || [];
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
