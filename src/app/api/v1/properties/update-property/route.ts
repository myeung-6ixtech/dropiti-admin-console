import { NextRequest } from "next/server";
import { RealEstatePropertyServiceByUuid } from "@/app/graphql/services/realEstatePropertyServiceByUuid";
import { RealEstateProperty, RealEstatePropertyInsertInput } from "@/app/graphql/types";
import { successResponse, errorResponse } from "../../utils/response";

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

    // Accept both API-guide style (price, bedrooms, photos) and schema style (rental_price, num_bedroom, etc.)
    const propertyUpdates: Partial<RealEstateProperty & RealEstatePropertyInsertInput> = {};

    if (updates.title !== undefined) propertyUpdates.title = updates.title;
    if (updates.description !== undefined) propertyUpdates.description = updates.description;
    if (updates.rental_price !== undefined) propertyUpdates.rental_price = updates.rental_price;
    if (updates.price !== undefined) propertyUpdates.rental_price = updates.price;
    if (updates.num_bedroom !== undefined) propertyUpdates.num_bedroom = updates.num_bedroom;
    if (updates.bedrooms !== undefined) propertyUpdates.num_bedroom = updates.bedrooms;
    if (updates.num_bathroom !== undefined) propertyUpdates.num_bathroom = updates.num_bathroom;
    if (updates.bathrooms !== undefined) propertyUpdates.num_bathroom = updates.bathrooms;
    if (updates.address !== undefined) propertyUpdates.address = updates.address;
    if (updates.property_type !== undefined) propertyUpdates.property_type = updates.property_type;
    if (updates.rental_space !== undefined) propertyUpdates.rental_space = updates.rental_space;
    if (updates.show_specific_location !== undefined)
      propertyUpdates.show_specific_location = updates.show_specific_location;
    if (updates.gross_area_size !== undefined) propertyUpdates.gross_area_size = updates.gross_area_size;
    if (updates.gross_area_size_unit !== undefined)
      propertyUpdates.gross_area_size_unit = updates.gross_area_size_unit;
    if (updates.furnished !== undefined) propertyUpdates.furnished = updates.furnished;
    if (updates.pets_allowed !== undefined) propertyUpdates.pets_allowed = updates.pets_allowed;
    if (updates.availability_date !== undefined)
      propertyUpdates.availability_date = updates.availability_date;
    if (updates.rental_price_currency !== undefined)
      propertyUpdates.rental_price_currency = updates.rental_price_currency;

    if (updates.uploaded_images !== undefined) {
      propertyUpdates.uploaded_images = updates.uploaded_images;
      if (Array.isArray(updates.uploaded_images) && updates.uploaded_images.length > 0)
        propertyUpdates.display_image = updates.display_image ?? updates.uploaded_images[0];
    }
    if (updates.photos !== undefined) {
      propertyUpdates.uploaded_images = updates.photos;
      if (updates.photos.length > 0)
        propertyUpdates.display_image = updates.photos[0];
    }
    if (updates.display_image !== undefined) propertyUpdates.display_image = updates.display_image;

    if (updates.amenities !== undefined) {
      propertyUpdates.amenities =
        typeof updates.amenities === "object" && !Array.isArray(updates.amenities)
          ? updates.amenities
          : { additionals: Array.isArray(updates.amenities) ? updates.amenities : [] };
    }

    const updatedProperty = await RealEstatePropertyServiceByUuid.updateRealEstatePropertyByUuid(
      id,
      propertyUpdates as Partial<RealEstatePropertyInsertInput>
    );

    if (!updatedProperty) {
      return errorResponse("Property not found or update failed", undefined, 404);
    }

    return successResponse(updatedProperty, "Property updated successfully");
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
