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
      const res = (
        await sdk.getRealEstatePropertyListingsByIdDetailed({
          propertyId: +payload.propertyId
        })
      ).real_estate_property_listing_by_pk
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
