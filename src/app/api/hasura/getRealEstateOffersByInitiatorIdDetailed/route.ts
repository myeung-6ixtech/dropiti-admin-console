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
      const res = (
        await sdk.getRealEstateOffersByInitiatorIdDetailed({
          initiatorId: body.initiatorId
        })
      ).real_estate_offer
      const offerMap = new Map()
      res.forEach((offer: unknown) => {
        offerMap.set(offer.offer_key, offer)
      })
      return Response.json(Array.from(offerMap.values()), {
        status: 200,
        statusText: 'OK'
      })
    } catch (error: unknown) {
      return Response.json(null, {
        status: error.code,
        statusText: error.message
      })
    }
  }
}
