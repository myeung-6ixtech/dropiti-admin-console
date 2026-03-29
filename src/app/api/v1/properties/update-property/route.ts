import { NextRequest } from "next/server";
import { RealEstateProperty, RealEstatePropertyInsertInput } from "@/app/graphql/types";
import { successResponse, errorResponse } from "../../utils/response";
import { executeHasuraQuery } from "../../utils/hasuraServer";

const UPDATE_PROPERTY_MUTATION = `
  mutation UpdatePropertyByUuid($propertyUuid: uuid!, $set: real_estate_property_listing_set_input!) {
    update_real_estate_property_listing(
      where: { property_uuid: { _eq: $propertyUuid } }
      _set: $set
    ) {
      affected_rows
      returning {
        id
        property_uuid
        status
        title
        description
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
      }
    }
  }
`;

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return errorResponse("id (property_uuid) is required", undefined, 400);
    }

    if (!updates || typeof updates !== "object") {
      return errorResponse("updates object is required", undefined, 400);
    }

    const set: Record<string, unknown> = {};

    if (updates.title !== undefined) set.title = updates.title;
    if (updates.description !== undefined) set.description = updates.description;
    if (updates.rental_price !== undefined) set.rental_price = updates.rental_price;
    if (updates.price !== undefined) set.rental_price = updates.price;
    if (updates.num_bedroom !== undefined) set.num_bedroom = updates.num_bedroom;
    if (updates.bedrooms !== undefined) set.num_bedroom = updates.bedrooms;
    if (updates.num_bathroom !== undefined) set.num_bathroom = updates.num_bathroom;
    if (updates.bathrooms !== undefined) set.num_bathroom = updates.bathrooms;
    if (updates.address !== undefined) set.address = updates.address;
    if (updates.property_type !== undefined) set.property_type = updates.property_type;
    if (updates.rental_space !== undefined) set.rental_space = updates.rental_space;
    if (updates.show_specific_location !== undefined)
      set.show_specific_location = updates.show_specific_location;
    if (updates.gross_area_size !== undefined) set.gross_area_size = updates.gross_area_size;
    if (updates.gross_area_size_unit !== undefined)
      set.gross_area_size_unit = updates.gross_area_size_unit;
    if (updates.furnished !== undefined) set.furnished = updates.furnished;
    if (updates.pets_allowed !== undefined) set.pets_allowed = updates.pets_allowed;
    if (updates.availability_date !== undefined)
      set.availability_date = updates.availability_date;
    if (updates.rental_price_currency !== undefined) {
      set.rental_price_currency =
        updates.rental_price_currency === "MOP" ? "MOP" : "HKD";
    }
    if (updates.status !== undefined)
      set.status = updates.status === "draft" ? "draft" : "published";

    if (updates.uploaded_images !== undefined) {
      set.uploaded_images = updates.uploaded_images;
      if (
        Array.isArray(updates.uploaded_images) &&
        updates.uploaded_images.length > 0
      ) {
        set.display_image = updates.display_image ?? updates.uploaded_images[0];
      }
    }
    if (updates.photos !== undefined) {
      set.uploaded_images = updates.photos;
      if (updates.photos.length > 0) {
        set.display_image = updates.photos[0];
      }
    }
    if (updates.display_image !== undefined)
      set.display_image = updates.display_image;

    if (updates.amenities !== undefined) {
      const a = updates.amenities;
      const amenitiesArray = Array.isArray(a)
        ? [...a.filter(Boolean)]
        : a && typeof a === "object" && Array.isArray((a as { additionals?: unknown }).additionals)
          ? [...((a as { additionals: unknown[] }).additionals.filter(Boolean))]
          : [];
      set.amenities = amenitiesArray;
    }

    const result = await executeHasuraQuery<{
      update_real_estate_property_listing: {
        affected_rows: number;
        returning: Partial<RealEstateProperty & RealEstatePropertyInsertInput>[];
      };
    }>(UPDATE_PROPERTY_MUTATION, {
      propertyUuid: id,
      set,
    });

    const updateResult = result.update_real_estate_property_listing;
    if (
      !updateResult ||
      updateResult.affected_rows === 0 ||
      !updateResult.returning?.length
    ) {
      return errorResponse("Property not found or update failed", undefined, 404);
    }

    return successResponse(
      updateResult.returning[0],
      "Property updated successfully"
    );
  } catch (error: unknown) {
    console.error("Error updating property:", error);
    const errorObj = error as { message?: string };
    return errorResponse(
      errorObj.message || "Failed to update property",
      undefined,
      500
    );
  }
}
