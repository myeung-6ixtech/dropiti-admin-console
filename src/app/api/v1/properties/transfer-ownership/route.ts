import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../../utils/response";
import { executeHasuraQuery } from "../../utils/hasuraServer";

const UPDATE_OWNER_MUTATION = `
  mutation TransferOwnership($property_uuid: uuid!, $landlord_user_id: uuid!) {
    update_real_estate_property_listing(
      where: { property_uuid: { _eq: $property_uuid } }
      _set: { landlord_user_id: $landlord_user_id }
    ) {
      affected_rows
      returning {
        property_uuid
        landlord_user_id
      }
    }
  }
`;

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { property_uuid, new_owner_id } = body;

    if (!property_uuid) {
      return errorResponse("property_uuid is required", undefined, 400);
    }
    if (!new_owner_id) {
      return errorResponse("new_owner_id is required", undefined, 400);
    }

    const result = await executeHasuraQuery<{
      update_real_estate_property_listing: {
        affected_rows: number;
        returning: Array<{ property_uuid: string; landlord_user_id: string | null }>;
      };
    }>(UPDATE_OWNER_MUTATION, {
      property_uuid,
      landlord_user_id: new_owner_id,
    });

    const updateResult = result.update_real_estate_property_listing;
    if (!updateResult || updateResult.affected_rows === 0) {
      return errorResponse("Property not found or transfer failed", undefined, 404);
    }

    return successResponse(
      { property_uuid, landlord_user_id: new_owner_id },
      "Ownership transferred successfully"
    );
  } catch (error: unknown) {
    console.error("Error transferring ownership:", error);
    const errorObj = error as { message?: string };
    return errorResponse(
      errorObj.message || "Failed to transfer ownership",
      undefined,
      500
    );
  }
}
