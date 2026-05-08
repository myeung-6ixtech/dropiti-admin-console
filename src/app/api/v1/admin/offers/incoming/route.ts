import { NextRequest } from "next/server";
import { requireAdminHasuraUserId } from "@/lib/admin-session";
import { executeHasuraQuery } from "@/app/api/v1/utils/hasuraServer";
import { successResponse, errorResponse } from "@/app/api/v1/utils/response";

// ─── Types ───────────────────────────────────────────────────────────────────

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
  external_contact: string | null;
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

// ─── GraphQL ─────────────────────────────────────────────────────────────────

/**
 * Builds a dynamic where-clause string and matching variable declarations so
 * that optional uuid/String filters are only injected when a value is present.
 * Passing null into `_eq` on a uuid column causes Hasura to throw
 * "unexpected null value for type 'uuid'", so we omit the clause entirely.
 */
function buildIncomingQuery(
  propertyUuid?: string,
  status?: string
): { query: string; extraVarDecls: string; extraWhereClauses: string } {
  const varDecls: string[] = [];
  const whereClauses: string[] = [];

  if (propertyUuid) {
    varDecls.push("$propertyUuid: uuid!");
    whereClauses.push("{ property_uuid: { _eq: $propertyUuid } }");
  }
  if (status) {
    varDecls.push("$status: String!");
    whereClauses.push("{ offer_status: { _eq: $status } }");
  }

  const extraVarDecls = varDecls.length ? "\n    " + varDecls.join("\n    ") : "";
  const extraWhereClauses =
    whereClauses.length
      ? `\n        _and: [\n          ${whereClauses.join("\n          ")}\n        ]`
      : "";

  const query = `
  query AdminIncomingOffersNew(
    $recipientId: String!
    $limit: Int!
    $offset: Int!${extraVarDecls}
  ) {
    real_estate_offer(
      where: {
        recipient_user_id: { _eq: $recipientId }${extraWhereClauses}
      }
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
    real_estate_offer_aggregate(
      where: {
        recipient_user_id: { _eq: $recipientId }${extraWhereClauses}
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

  return { query, extraVarDecls, extraWhereClauses };
}

const GET_PROPERTIES = `
  query AdminPropertiesForOffers($uuids: [uuid!]!) {
    real_estate_property_listing(where: { property_uuid: { _in: $uuids } }) {
      id
      property_uuid
      title
      external_contact
    }
  }
`;

// The Hasura `real_estate_user` table in this app exposes UUID identifiers:
// - nhost_user_id (uuid)
// - uuid (uuid)
// Some older parts of the codebase reference firebase_uid, but on this schema
// that field does not exist (see error: \"field 'firebase_uid' not found in type: real_estate_user_bool_exp\").
const GET_INITIATORS = `
  query AdminInitiatorsForOffers($ids: [uuid!]!) {
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

function matchInitiatorUserId(row: UserRow, initiatorUserId: string): boolean {
  return row.nhost_user_id === initiatorUserId || row.uuid === initiatorUserId;
}

function resolveDisplayName(u: UserRow): string {
  const dn = u.display_name?.trim();
  if (dn) return dn;
  const parts = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  if (parts) return parts;
  return u.email?.trim() || u.nhost_user_id || u.uuid || "Applicant";
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminHasuraUserId();
    if (!auth.ok) {
      return errorResponse(auth.message, undefined, auth.status);
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10) || 50, 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);
    const propertyUuid = searchParams.get("propertyUuid") || undefined;
    const status = searchParams.get("status") || undefined;

    const { query: GET_INCOMING } = buildIncomingQuery(propertyUuid, status);

    // Build variables — only include optional filter vars when they have values
    const queryVars: Record<string, unknown> = {
      recipientId: auth.userId,
      limit,
      offset,
    };
    if (propertyUuid) queryVars.propertyUuid = propertyUuid;
    if (status) queryVars.status = status;

    const incoming = await executeHasuraQuery<{
      real_estate_offer?: OfferRow[];
      real_estate_offer_aggregate?: { aggregate?: { count?: number } };
    }>(GET_INCOMING, queryVars);

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
      // Only UUIDs are supported in this schema for user identifiers.
      const ids = initiatorIds.filter(isUuid);
      if (ids.length === 0) {
        users = [];
      } else {
      const ur = await executeHasuraQuery<{ real_estate_user?: UserRow[] }>(GET_INITIATORS, {
          ids,
      });
      users = ur.real_estate_user ?? [];
      }
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
          ? {
              id: prop.id,
              property_uuid: prop.property_uuid,
              title: prop.title ?? "",
              external_contact: prop.external_contact ?? null,
            }
          : null,
        initiator: initiator
          ? {
              display_name: resolveDisplayName(initiator),
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
    console.error("[admin/offers/incoming] error:", error);
    const errorObj = error as { message?: string };
    return errorResponse(errorObj.message || "Failed to load incoming offers", undefined, 500);
  }
}
