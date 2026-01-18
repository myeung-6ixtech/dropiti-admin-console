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
      const result = await sdk.getRealEstateUsersByIds({
        ids: JSON.stringify(body.ids)
      }) as { real_estate_user?: unknown[] };
      const res = result.real_estate_user || [];
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
