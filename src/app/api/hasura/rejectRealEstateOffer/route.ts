import { decrypt } from '@dropiti/base/utils'
import {
  getHasuraGraphqlSDK,
  RealEstateOffer,
  RealEstateOfferByActionInsertInput
} from '@dropiti/sdk'
import {
  RealEstateOfferAction,
  RealEstateOfferStatus
} from '@dropiti/sdk/enums'

export async function POST(request: Request) {
  const { sdk } = getHasuraGraphqlSDK()
  const body = (await request.json()) as {
    token: string
  }
  const payload = (await decrypt(body.token)).payload as {
    currentOffer?: RealEstateOffer
    firebaseId?: string
  }

  if (payload.currentOffer && payload.firebaseId) {
    const isInitiator =
      payload.currentOffer.initiator_firebase_uid === payload.firebaseId

    try {
      // update offer status to ACCEPTED
      const updateOfferRes = await sdk.updateRealEstateOfferStatus({
        offerId: payload.currentOffer.id,
        offerStatus: RealEstateOfferStatus.REJECTED
      })

      // insert record of updating offer status to COUNTERED to offer_by_action
      const updateOfferActionObject = {
        created_at: new Date().toISOString(),
        offer_id: payload.currentOffer.id,
        offer_key: payload.currentOffer.offer_key,
        property_id: payload.currentOffer.property_id,
        action: isInitiator
          ? RealEstateOfferAction.INITIATOR_REJECTED
          : RealEstateOfferAction.RECIPIENT_REJECTED
      } satisfies RealEstateOfferByActionInsertInput
      const updateOfferActioNRes = await sdk.insertRealEstateOfferByActionOne({
        object: updateOfferActionObject
      })

      return Response.json(
        {
          ...(updateOfferRes as Record<string, unknown>),
          ...(updateOfferActioNRes as Record<string, unknown>)
        },
        {
          status: 200,
          statusText: 'OK'
        }
      )
    } catch (error: unknown) {
      const errorObj = error as { code?: number; message?: string };
      return Response.json(null, {
        status: errorObj.code || 500,
        statusText: errorObj.message || 'Internal Server Error'
      })
    }
  }
}
