import { getHasuraGraphqlSDK } from '@dropiti/sdk'

export async function GET() {
  const { sdk } = getHasuraGraphqlSDK()
  try {
    const res = (await sdk.getRealEstatePropertyListings())
      .real_estate_property_listing
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
