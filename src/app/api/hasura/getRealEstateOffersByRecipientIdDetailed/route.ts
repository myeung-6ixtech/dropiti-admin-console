import { decrypt } from '@dropiti/base/utils'
import { getHasuraGraphqlSDK } from '@dropiti/sdk'

export async function POST(request: Request) {
  const { sdk } = getHasuraGraphqlSDK()
  let body = await request.json()
  body = (await decrypt(body.token)).payload as {
    recipientId?: string
  }

  if (body.recipientId) {
    try {
      const res = (
        await sdk.getRealEstateOffersByRecipientIdDetailed({
          recipientId: body.recipientId
        })
      ).real_estate_offer
      const offerMap = new Map()
      res.forEach((offer) => {
        offerMap.set(offer.offer_key, offer)
      })
      return Response.json(Array.from(offerMap.values()), {
        status: 200,
        statusText: 'OK'
      })
    } catch (error: any) {
      return Response.json(null, {
        status: error.code,
        statusText: error.message
      })
    }
  }
}
