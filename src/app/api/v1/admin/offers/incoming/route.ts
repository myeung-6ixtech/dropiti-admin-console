import { NextRequest } from "next/server";
import { requireAdminHasuraUserId } from "@/lib/admin-session";
import { getAdminIncomingRecipientIds } from "@/lib/admin-incoming-offers";
import { executeHasuraQuery } from "../../../utils/hasuraServer";
import { successResponse, errorResponse } from "../../../utils/response";

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

function buildOffersQuery(includeStatus: boolean, includePropertyUuid: boolean): string {
  const andParts: string[] = [
    "{ is_active: { _eq: true } }",
    "{ recipient_user_id: { _in: $recipientIds } }",
  ];
  if (includeStatus) {
    andParts.push("{ offer_status: { _eq: $offerStatus } }");
  }
  if (includePropertyUuid) {
    andParts.push("{ property_uuid: { _eq: $filterPropertyUuid } }");
  }
  const whereClause = `_and: [${andParts.join("\n        ")}]`;

  return `
    query AdminIncomingOffersForListings(
      $recipientIds: [String!]!
      $limit: Int!
      $offset: Int!
      ${includeStatus ? "$offerStatus: String!" : ""}
      ${includePropertyUuid ? "$filterPropertyUuid: uuid!" : ""}
    ) {
      real_estate_offer(
        where: { ${whereClause} }
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
        where: { ${whereClause} }
      ) {
        aggregate {
          count
        }
      }
    }
  `;
}

const GET_PROPERTIES = `
  query PropertiesForAdminIncoming($uuids: [uuid!]!) {
    real_estate_property_listing(where: { property_uuid: { _in: $uuids } }) {
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

function mapOffersToResponse(
  offers: OfferRow[],
  properties: PropertyRow[],
  users: UserRow[]
) {
  const propertyByUuid = new Map(properties.map((p) => [p.property_uuid, p]));
  const userByKey = new Map<string, UserRow>();
  for (const u of users) {
    if (u.nhost_user_id) userByKey.set(u.nhost_user_id, u);
    if (u.uuid) userByKey.set(u.uuid, u);
  }

  return offers.map((offer) => {
    const prop = propertyByUuid.get(offer.property_uuid);
    const initiator = userByKey.get(offer.initiator_user_id);
    return {
      ...offer,
      property: prop
        ? {
            id: prop.id,
            property_uuid: prop.property_uuid,
            title: prop.title ?? "",
            external_contact: prop.external_contact ?? null,
            rental_price: prop.rental_price ?? null,
          }
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
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminHasuraUserId();
    if (!auth.ok) {
      return errorResponse(auth.message, undefined, auth.status);
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50", 10) || 50,
      100
    );
    const offset = Math.max(
      parseInt(searchParams.get("offset") || "0", 10) || 0,
      0
    );
    const statusFilter = searchParams.get("status")?.trim() || null;
    const propertyUuidParam = searchParams.get("propertyUuid")?.trim() || null;

    if (propertyUuidParam && !UUID_RE.test(propertyUuidParam)) {
      return errorResponse("propertyUuid must be a valid UUID", undefined, 400);
    }

    const recipientIds = getAdminIncomingRecipientIds(auth.userId);
    if (recipientIds.length === 0) {
      return successResponse([], undefined, {
        total: 0,
        limit,
        offset,
        hasMore: false,
      });
    }

    const includeStatus = Boolean(statusFilter);
    const includePropertyUuid = Boolean(propertyUuidParam);
    const query = buildOffersQuery(includeStatus, includePropertyUuid);

    const variables: Record<string, unknown> = {
      recipientIds,
      limit,
      offset,
    };
    if (includeStatus) {
      variables.offerStatus = statusFilter;
    }
    if (includePropertyUuid) {
      variables.filterPropertyUuid = propertyUuidParam;
    }

    const incoming = await executeHasuraQuery<{
      real_estate_offer?: OfferRow[];
      real_estate_offer_aggregate?: { aggregate?: { count?: number } };
    }>(query, variables);

    const offers = incoming.real_estate_offer ?? [];
    const total =
      incoming.real_estate_offer_aggregate?.aggregate?.count ?? offers.length;

    const offerPropertyUuids = [
      ...new Set(offers.map((o) => o.property_uuid).filter(Boolean)),
    ];
    const initiatorUuidList = filterUuid(
      offers.map((o) => o.initiator_user_id)
    );

    let properties: PropertyRow[] = [];
    if (offerPropertyUuids.length > 0) {
      const pr = await executeHasuraQuery<{
        real_estate_property_listing?: PropertyRow[];
      }>(GET_PROPERTIES, { uuids: offerPropertyUuids });
      properties = pr.real_estate_property_listing ?? [];
    }

    let users: UserRow[] = [];
    if (initiatorUuidList.length > 0) {
      const ur = await executeHasuraQuery<{ real_estate_user?: UserRow[] }>(
        GET_INITIATORS,
        { ids: initiatorUuidList }
      );
      users = ur.real_estate_user ?? [];
    }

    const data = mapOffersToResponse(offers, properties, users);

    return successResponse(data, undefined, {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
  } catch (error: unknown) {
    console.error("[admin/offers/incoming]", error);
    const errorObj = error as { message?: string };
    return errorResponse(
      errorObj.message || "Failed to load admin incoming offers",
      undefined,
      500
    );
  }
}
