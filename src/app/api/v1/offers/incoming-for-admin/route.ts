import { NextRequest } from "next/server";
import { requireAdminHasuraUserId } from "@/lib/admin-session";
import { executeHasuraQuery } from "../../utils/hasuraServer";
import { successResponse, errorResponse } from "../../utils/response";

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
};

type UserRow = {
  nhost_user_id: string | null;
  firebase_uid: string | null;
  phone_number: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

const GET_INCOMING = `
  query AdminIncomingOffers($recipientId: String!, $limit: Int!, $offset: Int!) {
    real_estate_offer(
      where: { recipient_user_id: { _eq: $recipientId } }
      limit: $limit
      offset: $offset
      order_by: { created_at: desc }
    ) {
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
    real_estate_offer_aggregate(where: { recipient_user_id: { _eq: $recipientId } }) {
      aggregate {
        count
      }
    }
  }
`;

const GET_PROPERTIES = `
  query PropertiesForOffers($uuids: [uuid!]!) {
    real_estate_property_listing(where: { property_uuid: { _in: $uuids } }) {
      id
      property_uuid
      title
    }
  }
`;

const GET_INITIATORS = `
  query InitiatorsForOffers($ids: [String!]!) {
    real_estate_user(
      where: {
        _or: [
          { nhost_user_id: { _in: $ids } }
          { firebase_uid: { _in: $ids } }
        ]
      }
    ) {
      nhost_user_id
      firebase_uid
      phone_number
      display_name
      first_name
      last_name
      email
    }
  }
`;

function matchInitiatorUserId(row: UserRow, initiatorUserId: string): boolean {
  return row.nhost_user_id === initiatorUserId || row.firebase_uid === initiatorUserId;
}

function displayName(u: UserRow): string {
  const dn = u.display_name?.trim();
  if (dn) return dn;
  const parts = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  if (parts) return parts;
  return u.email?.trim() || initiatorFallback(u);
}

function initiatorFallback(u: UserRow): string {
  return u.nhost_user_id || u.firebase_uid || "Applicant";
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminHasuraUserId();
    if (!auth.ok) {
      return errorResponse(auth.message, undefined, auth.status);
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10) || 50, 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);

    const incoming = await executeHasuraQuery<{
      real_estate_offer?: OfferRow[];
      real_estate_offer_aggregate?: { aggregate?: { count?: number } };
    }>(GET_INCOMING, {
      recipientId: auth.userId,
      limit,
      offset,
    });

    const offers = incoming.real_estate_offer ?? [];
    const total = incoming.real_estate_offer_aggregate?.aggregate?.count ?? offers.length;

    const propertyUuids = [...new Set(offers.map((o) => o.property_uuid).filter(Boolean))];
    const initiatorIds = [...new Set(offers.map((o) => o.initiator_user_id).filter(Boolean))];

    let properties: PropertyRow[] = [];
    if (propertyUuids.length > 0) {
      const pr = await executeHasuraQuery<{ real_estate_property_listing?: PropertyRow[] }>(
        GET_PROPERTIES,
        { uuids: propertyUuids }
      );
      properties = pr.real_estate_property_listing ?? [];
    }

    let users: UserRow[] = [];
    if (initiatorIds.length > 0) {
      const ur = await executeHasuraQuery<{ real_estate_user?: UserRow[] }>(GET_INITIATORS, {
        ids: initiatorIds,
      });
      users = ur.real_estate_user ?? [];
    }

    const propertyByUuid = new Map(properties.map((p) => [p.property_uuid, p]));
    const initiatorByUserId = new Map<string, UserRow>();
    for (const uid of initiatorIds) {
      const row = users.find((u) => matchInitiatorUserId(u, uid));
      if (row) initiatorByUserId.set(uid, row);
    }

    const data = offers.map((offer) => {
      const prop = propertyByUuid.get(offer.property_uuid);
      const initiator = initiatorByUserId.get(offer.initiator_user_id);
      return {
        ...offer,
        property: prop
          ? { id: prop.id, property_uuid: prop.property_uuid, title: prop.title ?? "" }
          : null,
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
    });

    return successResponse(data, undefined, {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
  } catch (error: unknown) {
    console.error("incoming-for-admin error:", error);
    const errorObj = error as { message?: string };
    return errorResponse(errorObj.message || "Failed to load incoming offers", undefined, 500);
  }
}
