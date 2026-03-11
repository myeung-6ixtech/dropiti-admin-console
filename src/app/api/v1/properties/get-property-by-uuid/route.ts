import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../../utils/response";
import { executeHasuraQuery } from "../../utils/hasuraServer";

const PROPERTY_FIELDS = `
  id
  property_uuid
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

type PropertyRow = {
  id?: number | string;
  property_uuid?: string;
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

    // Landlord: optional; resolve via Nhost/Hasura in a separate call if needed. Omit for now to avoid client usage.
    const landlord = null;

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
