import { NextRequest } from "next/server";
import { requireAdminHasuraUserId } from "@/lib/admin-session";
import { getAdminIncomingRecipientIds } from "@/lib/admin-incoming-offers";
import { executeHasuraQuery } from "../../../../utils/hasuraServer";
import { successResponse, errorResponse } from "../../../../utils/response";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function filterUuid(ids: string[]): string[] {
  return [...new Set(ids.filter((id) => UUID_RE.test(id)))];
}

type OfferRow = {
  id: number;
  offer_key: string;
  property_uuid: string;
  initiator_user_id: string;
  recipient_user_id: string;
  proposing_rent_price: number;
  proposing_rent_price_currency: string;
  num_leasing_months: number;
  payment_frequency: string;
  move_in_date: string | null;
  offer_status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type PropertyRow = {
  id: number | string;
  property_uuid: string;
  title: string | null;
  external_contact?: string | null;
  rental_price?: number | null;
};

type UserRow = {
  nhost_user_id: string | null;
  uuid: string | null;
  phone_number: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

const GET_OFFER_BY_PK = `
  query AdminOfferByPk($id: Int!) {
    real_estate_offer_by_pk(id: $id) {
      id
      offer_key
      property_uuid
      initiator_user_id
      recipient_user_id
      proposing_rent_price
      proposing_rent_price_currency
      num_leasing_months
      payment_frequency
      move_in_date
      offer_status
      is_active
      created_at
      updated_at
    }
  }
`;

const GET_PROPERTY_FOR_OFFER = `
  query PropertyForAdminOffer($property_uuid: uuid!) {
    real_estate_property_listing(
      where: { property_uuid: { _eq: $property_uuid } }
      limit: 1
    ) {
      id
      property_uuid
      title
      external_contact
      rental_price
    }
  }
`;

const GET_INITIATORS = `
  query InitiatorsForAdminIncoming($ids: [uuid!]!) {
    real_estate_user(
      where: {
        _or: [
          { nhost_user_id: { _in: $ids } }
          { uuid: { _in: $ids } }
        ]
      }
    ) {
      nhost_user_id
      uuid
      phone_number
      display_name
      first_name
      last_name
      email
    }
  }
`;

function displayName(u: UserRow): string {
  const dn = u.display_name?.trim();
  if (dn) return dn;
  const parts = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  if (parts) return parts;
  return u.email?.trim() || u.nhost_user_id || u.uuid || "Applicant";
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminHasuraUserId();
    if (!auth.ok) {
      return errorResponse(auth.message, undefined, auth.status);
    }

    const { id: idParam } = await context.params;
    const id = parseInt(idParam, 10);
    if (!Number.isFinite(id) || id < 1) {
      return errorResponse("Invalid offer id", undefined, 400);
    }

    const offerResult = await executeHasuraQuery<{
      real_estate_offer_by_pk: OfferRow | null;
    }>(GET_OFFER_BY_PK, { id });

    const offer = offerResult.real_estate_offer_by_pk;
    if (!offer || !offer.property_uuid) {
      return errorResponse("Offer not found", undefined, 404);
    }

    const allowedRecipients = getAdminIncomingRecipientIds(auth.userId);
    if (!allowedRecipients.includes(offer.recipient_user_id)) {
      return errorResponse("Offer not found", undefined, 404);
    }

    const propResult = await executeHasuraQuery<{
      real_estate_property_listing: PropertyRow[];
    }>(GET_PROPERTY_FOR_OFFER, { property_uuid: offer.property_uuid });

    const prop = propResult.real_estate_property_listing?.[0];
    if (!prop) {
      return errorResponse("Offer not found", undefined, 404);
    }

    const initiatorUuids = filterUuid([offer.initiator_user_id]);
    let users: UserRow[] = [];
    if (initiatorUuids.length > 0) {
      const ur = await executeHasuraQuery<{ real_estate_user?: UserRow[] }>(
        GET_INITIATORS,
        { ids: initiatorUuids }
      );
      users = ur.real_estate_user ?? [];
    }

    const userByKey = new Map<string, UserRow>();
    for (const u of users) {
      if (u.nhost_user_id) userByKey.set(u.nhost_user_id, u);
      if (u.uuid) userByKey.set(u.uuid, u);
    }
    const initiator = userByKey.get(offer.initiator_user_id);

    const data = {
      ...offer,
      property: {
        id: prop.id,
        property_uuid: prop.property_uuid,
        title: prop.title ?? "",
        external_contact: prop.external_contact ?? null,
        rental_price: prop.rental_price ?? null,
      },
      initiator: initiator
        ? {
            display_name: displayName(initiator),
            phone_number: initiator.phone_number ?? null,
            email: initiator.email ?? null,
          }
        : {
            display_name: offer.initiator_user_id,
            phone_number: null as string | null,
            email: null as string | null,
          },
    };

    return successResponse(data);
  } catch (error: unknown) {
    console.error("[admin/offers/incoming/[id]]", error);
    const errorObj = error as { message?: string };
    return errorResponse(
      errorObj.message || "Failed to load offer",
      undefined,
      500
    );
  }
}
