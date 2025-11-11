import { decrypt } from '@dropiti/base/utils'
import {
  getHasuraGraphqlSDK,
  RealEstateOfferByActionInsertInput,
  RealEstateOfferInsertInput
} from '@dropiti/sdk'
import { RealEstateOfferAction } from '@dropiti/sdk/enums'

export async function POST(request: Request) {
  const { sdk } = getHasuraGraphqlSDK()
  const body = (await request.json()) as {
    token: string
  }
  const payload = (await decrypt(body.token)).payload as {
    object?: RealEstateOfferInsertInput
  }

  if (payload.object) {
    try {
      const offerObject = payload.object
      const insertOfferRes = await sdk.insertRealEstateOfferOne({
        object: offerObject
      })

      const newOfferId = insertOfferRes.insert_real_estate_offer_one?.id
      const actionObject = {
        created_at: new Date().toISOString(),
        offer_id: newOfferId,
        offer_key: offerObject.offer_key,
        property_id: offerObject.property_id,
        action: RealEstateOfferAction.INITIATOR_CREATED
      } satisfies RealEstateOfferByActionInsertInput
      const insertActionRes = await sdk.insertRealEstateOfferByActionOne({
        object: actionObject
      })
      return Response.json(
        {
          ...insertOfferRes,
          ...insertActionRes
        },
        {
          status: 200,
          statusText: 'OK'
        }
      )
    } catch (error: any) {
      return Response.json(null, {
        status: error.code,
        statusText: error.message
      })
    }
  }
}
