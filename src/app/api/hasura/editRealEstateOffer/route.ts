import { decrypt } from '@dropiti/base/utils'
import {
  getHasuraGraphqlSDK,
  RealEstateOffer,
  RealEstateOfferByActionInsertInput,
  RealEstateOfferInsertInput
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
    firebaseId?: string
    currentOffer?: RealEstateOffer
    newOfferInsertInput?: RealEstateOfferInsertInput
  }

  if (
    payload.currentOffer &&
    payload.newOfferInsertInput &&
    payload.firebaseId
  ) {
    const isInitiator =
      payload.currentOffer.initiator_firebase_uid === payload.firebaseId
    try {
      // update offer status to WITHDRAWN
      const updateOfferRes = await sdk.updateRealEstateOfferStatus({
        offerId: payload.currentOffer.id,
        offerStatus: RealEstateOfferStatus.WITHDRAWN
      })

      // insert record of updating offer status to COUNTERED to offer_by_action
      const updateOfferActionObject = {
        created_at: payload.newOfferInsertInput.created_at || new Date().toISOString(),
        offer_id: payload.currentOffer.id,
        offer_key: payload.currentOffer.offer_key,
        property_id: payload.currentOffer.property_id,
        action: isInitiator
          ? RealEstateOfferAction.INITIATOR_EDITED
          : RealEstateOfferAction.RECIPIENT_EDITED
      } satisfies RealEstateOfferByActionInsertInput
      await sdk.insertRealEstateOfferByActionOne({
        object: updateOfferActionObject
      })

      // create new offer edited to
      const insertNewOfferRes = await sdk.insertRealEstateOfferOne({
        object: payload.newOfferInsertInput
      })
      const newOfferId = insertNewOfferRes.insert_real_estate_offer_one?.id

      // insert recrod of creating offer countered with to offer_by_action
      const actionObject = {
        created_at: payload.newOfferInsertInput.created_at || new Date().toISOString(),
        offer_id: newOfferId || '',
        offer_key: payload.currentOffer.offer_key,
        property_id: payload.newOfferInsertInput.property_id || '',
        action: isInitiator
          ? RealEstateOfferAction.INITIATOR_CREATED
          : RealEstateOfferAction.RECIPIENT_CREATED
      } satisfies RealEstateOfferByActionInsertInput
      const insertNewOfferActionRes =
        await sdk.insertRealEstateOfferByActionOne({
          object: actionObject
        })
      return Response.json(
        {
          ...(updateOfferRes as Record<string, unknown>),
          ...(insertNewOfferRes as Record<string, unknown>),
          ...(insertNewOfferActionRes as Record<string, unknown>)
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
