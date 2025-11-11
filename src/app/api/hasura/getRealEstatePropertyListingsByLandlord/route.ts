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
      const res = (
        await sdk.getRealEstatePropertyListingsByLandlord({
          landlordUID: body.landlordUID
        })
      ).real_estate_property_listing
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
