import { decrypt } from '@dropiti/base/utils'
import { getHasuraGraphqlSDK } from '@dropiti/sdk'

export async function POST(request: Request) {
  const { sdk } = getHasuraGraphqlSDK()
  let body = await request.json()
  body = (await decrypt(body.token)).payload as {
    offerId: number
    offerStatus: string
  }

  if (body.offerId && body.offerStatus) {
    try {
      const result = await sdk.updateRealEstateOfferStatus({
        ...body
      }) as { update_real_estate_offer?: unknown };
      const res = result.update_real_estate_offer || null;
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
