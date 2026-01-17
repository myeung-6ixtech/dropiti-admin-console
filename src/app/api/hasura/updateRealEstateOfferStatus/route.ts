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
      const res = (
        await sdk.updateRealEstateOfferStatus({
          ...body
        })
      ).update_real_estate_offer
      return Response.json(res, {
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
