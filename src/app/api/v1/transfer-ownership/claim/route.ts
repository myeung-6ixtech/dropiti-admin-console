/**
 * POST /api/v1/transfer-ownership/claim
 *
 * Claims a property on behalf of an authenticated user.
 * Body: { token: string; userId: string }
 *
 * Security note: In production, extract userId from the verified Nhost JWT
 * rather than trusting the client-supplied value.
 */
import { NextRequest } from "next/server";
import { executeHasuraQuery } from "@/app/api/v1/utils/hasuraServer";
import { successResponse, errorResponse } from "@/app/api/v1/utils/response";

const GET_INVITATION = `
  query ClaimGetInvitation($tokenUuid: uuid!) {
    real_estate_property_transfer_invitation(
      where: { token_uuid: { _eq: $tokenUuid } }
      limit: 1
    ) {
      id
      property_uuid
      status
      expires_at
    }
  }
`;

const CLAIM_PROPERTY = `
  mutation ClaimProperty($propertyUuid: uuid!, $landlordUserId: String!) {
    update_real_estate_property_listing(
      where: { property_uuid: { _eq: $propertyUuid } }
      _set: { landlord_user_id: $landlordUserId }
    ) {
      affected_rows
      returning {
        property_uuid
        landlord_user_id
      }
    }
  }
`;

const MARK_USED = `
  mutation MarkInvitationUsed($id: bigint!) {
    update_real_estate_property_transfer_invitation_by_pk(
      pk_columns: { id: $id }
      _set: { status: "used" }
    ) { id status }
  }
`;

type InvitationRow = {
  id: number;
  property_uuid: string;
  status: string;
  expires_at: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, userId } = body as { token?: string; userId?: string };

    if (!token) return errorResponse("token is required", undefined, 400);
    if (!userId) return errorResponse("userId is required", undefined, 400);

    const invResult = await executeHasuraQuery<{
      real_estate_property_transfer_invitation?: InvitationRow[];
    }>(GET_INVITATION, { tokenUuid: token });

    const invitation = invResult.real_estate_property_transfer_invitation?.[0];
    if (!invitation) {
      return errorResponse("Invitation not found or already used", undefined, 404);
    }
    if (invitation.status !== "pending") {
      return errorResponse(
        invitation.status === "used"
          ? "This property has already been claimed."
          : `Invitation is ${invitation.status}.`,
        undefined,
        409
      );
    }
    if (new Date(invitation.expires_at).getTime() < Date.now()) {
      return errorResponse("Invitation has expired.", undefined, 410);
    }

    // Assign the property to the claiming user
    const updateResult = await executeHasuraQuery<{
      update_real_estate_property_listing: { affected_rows: number };
    }>(CLAIM_PROPERTY, {
      propertyUuid: invitation.property_uuid,
      landlordUserId: userId,
    });

    if (!updateResult.update_real_estate_property_listing?.affected_rows) {
      return errorResponse("Property not found or already assigned", undefined, 404);
    }

    // Mark the invitation as used
    await executeHasuraQuery(MARK_USED, { id: invitation.id });

    return successResponse(
      { property_uuid: invitation.property_uuid, claimed_by: userId },
      "Property claimed successfully"
    );
  } catch (error: unknown) {
    console.error("[transfer-ownership/claim] error:", error);
    const e = error as { message?: string };
    return errorResponse(e.message || "Failed to claim property", undefined, 500);
  }
}
