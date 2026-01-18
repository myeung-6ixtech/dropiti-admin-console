import { decrypt } from '@dropiti/base/utils'
import {
  getHasuraGraphqlSDK,
  RealEstatePropertyListingInsertInput
} from '@dropiti/sdk'

export async function POST(request: Request) {
  const { sdk } = getHasuraGraphqlSDK()
  let body = await request.json()
  body = (await decrypt(body.token)).payload as {
    object?: RealEstatePropertyListingInsertInput
  }

  if (body.object) {
    try {
      const res = await sdk.insertRealEstatePropertyListingOne({
        object: body.object
      })
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
