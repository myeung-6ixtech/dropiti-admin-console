import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../../utils/response";
import { executeHasuraQuery } from "../../utils/hasuraServer";

const PROPERTY_FIELDS = `
  id
  property_uuid
  landlord_user_id
  title
  description
  created_at
  updated_at
  property_type
  rental_space
  address
  show_specific_location
  gross_area_size
  gross_area_size_unit
  num_bedroom
  num_bathroom
  furnished
  pets_allowed
  amenities
  display_image
  uploaded_images
  rental_price
  rental_price_currency
  availability_date
`;

const GET_PROPERTY_BY_UUID = `
  query GetPropertyByUuid($property_uuid: uuid!) {
    real_estate_property_listing(where: { property_uuid: { _eq: $property_uuid } }, limit: 1) {
      ${PROPERTY_FIELDS}
    }
  }
`;

const GET_LANDLORD_BY_ID = `
  query GetLandlordById($nhost_user_id: uuid!) {
    real_estate_user(where: { nhost_user_id: { _eq: $nhost_user_id } }, limit: 1) {
      nhost_user_id
      uuid
      email
      display_name
      first_name
      last_name
      photo_url
    }
  }
`;

type PropertyRow = {
  id?: number | string;
  property_uuid?: string;
  landlord_user_id?: string | null;
  title?: string;
  description?: string | null;
  address?: Record<string, unknown> | null;
  show_specific_location?: boolean | null;
  rental_price?: number | null;
  rental_price_currency?: string | null;
  rental_space?: string | null;
  gross_area_size?: number | null;
  gross_area_size_unit?: string | null;
  num_bedroom?: number | null;
  num_bathroom?: number | null;
  display_image?: string | null;
  uploaded_images?: string[] | null;
  property_type?: string | null;
  furnished?: string | null;
  pets_allowed?: boolean | null;
  amenities?: unknown;
  availability_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function formatLocation(address: PropertyRow["address"]): string {
  if (typeof address === "string") return address;
  if (!address || typeof address !== "object") return "";
  const parts = [
    (address as Record<string, unknown>).street,
    (address as Record<string, unknown>).district,
    (address as Record<string, unknown>).state,
    (address as Record<string, unknown>).country,
  ].filter(Boolean);
  return parts.join(", ");
}

function normalizeAmenities(amenities: unknown): string[] {
  if (Array.isArray(amenities)) return amenities.filter(Boolean) as string[];
  if (amenities && typeof amenities === "object") {
    return Object.values(amenities as Record<string, unknown>).flat().filter(Boolean) as string[];
  }
  return [];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const property_uuid = searchParams.get("property_uuid");

    if (!property_uuid) {
      return errorResponse("property_uuid is required", undefined, 400);
    }

    const result = await executeHasuraQuery<{
      real_estate_property_listing: PropertyRow[];
    }>(GET_PROPERTY_BY_UUID, { property_uuid });

    const property = result.real_estate_property_listing?.[0];
    if (!property) {
      return errorResponse("Property not found", undefined, 404);
    }

    const address = property.address ?? {};
    const transformedProperty = {
      id: String(property.id ?? ""),
      property_uuid: property.property_uuid ?? "",
      landlord_user_id: property.landlord_user_id ?? null,
      title: property.title ?? "",
      description: property.description ?? "",
      address: typeof address === "object" ? address : {},
      location: formatLocation(property.address),
      rental_price: Number(property.rental_price ?? 0),
      rental_price_currency: property.rental_price_currency ?? "HKD",
      rental_space: property.rental_space ?? "",
      show_specific_location: Boolean(property.show_specific_location),
      gross_area_size: property.gross_area_size ?? undefined,
      gross_area_size_unit: property.gross_area_size_unit ?? "sqft",
      num_bedroom: property.num_bedroom ?? 0,
      num_bathroom: property.num_bathroom ?? 0,
      display_image: property.display_image ?? "",
      uploaded_images: property.uploaded_images ?? [],
      property_type: property.property_type ?? "",
      furnished: property.furnished ?? "none",
      pets_allowed: property.pets_allowed ?? false,
      amenities: normalizeAmenities(property.amenities),
      availability_date: property.availability_date ?? "",
      status: "published",
      created_at: property.created_at ?? "",
      updated_at: property.updated_at ?? property.created_at ?? "",
    };

    let landlord: {
      id: string;
      name: string | null;
      email: string | null;
      avatar: string | null;
    } | null = null;

    const landlordUserId = property.landlord_user_id ?? null;
    if (landlordUserId) {
      try {
        const landlordResult = await executeHasuraQuery<{
          real_estate_user: Array<{
            nhost_user_id?: string;
            uuid?: string;
            email?: string | null;
            display_name?: string | null;
            first_name?: string | null;
            last_name?: string | null;
            photo_url?: string | null;
          }>;
        }>(GET_LANDLORD_BY_ID, { nhost_user_id: landlordUserId });
        const u = landlordResult.real_estate_user?.[0];
        if (u) {
          const name =
            u.display_name?.trim() ||
            [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
            null;
          landlord = {
            id: u.nhost_user_id ?? u.uuid ?? landlordUserId,
            name,
            email: u.email ?? null,
            avatar: u.photo_url ?? null,
          };
        }
      } catch {
        // Landlord resolution is best-effort
      }
    }

    return successResponse({
      property: transformedProperty,
      landlord,
    });
  } catch (error: unknown) {
    console.error("Error fetching property by UUID:", error);
    const errorObj = error as { message?: string };
    return errorResponse(
      errorObj.message ?? "Failed to fetch property",
      undefined,
      500
    );
  }
}
