import { decrypt } from '@dropiti/base/utils'
import { getHasuraGraphqlSDK } from '@dropiti/sdk'

export async function POST(request: Request) {
  const { sdk } = getHasuraGraphqlSDK()
  let body = await request.json()
  body = (await decrypt(body.token)).payload as {
    initiatorId?: string
  }

  if (body.initiatorId) {
    try {
      const result = await sdk.getRealEstateOffersByInitiatorIdDetailed({
        initiatorId: body.initiatorId
      }) as { real_estate_offer?: unknown[] };
      const res = result.real_estate_offer || [];
      const offerMap = new Map()
      res.forEach((offer: unknown) => {
        const offerObj = offer as { offer_key: string };
        offerMap.set(offerObj.offer_key, offer)
      })
      return Response.json(Array.from(offerMap.values()), {
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
