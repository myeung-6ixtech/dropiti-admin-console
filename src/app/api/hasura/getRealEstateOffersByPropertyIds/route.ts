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
      const res = (
        await sdk.getRealEstateOffersByPropertyIds({
          propertyIds: JSON.parse(body.propertyIds)
        })
      ).real_estate_offer
      return Response.json(res, {
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
