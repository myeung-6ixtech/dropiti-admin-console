import { decrypt } from '@dropiti/base/utils'
import { getHasuraGraphqlSDK } from '@dropiti/sdk'

export async function POST(request: Request) {
  const { sdk } = getHasuraGraphqlSDK()
  let body = await request.json()
  body = (await decrypt(body.token)).payload as {
    ids?: Array<string>
  }

  if (body.ids) {
    try {
      const res = (
        await sdk.getRealEstateUsersByIds({
          ids: JSON.stringify(body.ids)
        })
      ).real_estate_user
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
