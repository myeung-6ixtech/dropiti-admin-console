/**
 * GET /api/v1/transfer-ownership/validate?token=<uuid>
 *
 * Public endpoint — no auth required.
 * Validates a transfer token and returns a sanitised property card.
 * Also auto-marks tokens as expired when expires_at has passed.
 */
import { NextRequest } from "next/server";
import { executeHasuraQuery } from "@/app/api/v1/utils/hasuraServer";
import { successResponse, errorResponse } from "@/app/api/v1/utils/response";

const GET_INVITATION = `
  query ValidateTransferToken($tokenUuid: uuid!) {
    real_estate_property_transfer_invitation(
      where: { token_uuid: { _eq: $tokenUuid } }
      limit: 1
    ) {
      id
      token_uuid
      property_uuid
      status
      expires_at
    }
  }
`;

const GET_PROPERTY_CARD = `
  query GetPropertyCard($propertyUuid: uuid!) {
    real_estate_property_listing(where: { property_uuid: { _eq: $propertyUuid } }) {
      property_uuid
      title
      description
      property_type
      address
      num_bedroom
      num_bathroom
      rental_price
      rental_price_currency
      display_image
    }
  }
`;

const MARK_EXPIRED = `
  mutation MarkInvitationExpired($id: bigint!) {
    update_real_estate_property_transfer_invitation_by_pk(
      pk_columns: { id: $id }
      _set: { status: "expired" }
    ) { id status }
  }
`;

type InvitationRow = {
  id: number;
  token_uuid: string;
  property_uuid: string;
  status: string;
  expires_at: string;
};

type PropertyCard = {
  property_uuid: string;
  title: string | null;
  description: string | null;
  property_type: string | null;
  address: Record<string, unknown> | null;
  num_bedroom: number | null;
  num_bathroom: number | null;
  rental_price: number | null;
  rental_price_currency: string | null;
  display_image: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    if (!token) return errorResponse("token is required", undefined, 400);

    const invResult = await executeHasuraQuery<{
      real_estate_property_transfer_invitation?: InvitationRow[];
    }>(GET_INVITATION, { tokenUuid: token });

    const invitation = invResult.real_estate_property_transfer_invitation?.[0];
    if (!invitation) {
      return successResponse({ tokenStatus: "invalid" });
    }

    // Auto-expire if past the expiry date
    if (
      invitation.status === "pending" &&
      new Date(invitation.expires_at).getTime() < Date.now()
    ) {
      await executeHasuraQuery(MARK_EXPIRED, { id: invitation.id }).catch(() => {});
      invitation.status = "expired";
    }

    if (invitation.status !== "pending") {
      // Return minimal info so the UI can render the correct error state
      const propResult = await executeHasuraQuery<{
        real_estate_property_listing?: PropertyCard[];
      }>(GET_PROPERTY_CARD, { propertyUuid: invitation.property_uuid });
      const property = propResult.real_estate_property_listing?.[0] ?? null;

      return successResponse({
        tokenStatus: invitation.status, // "expired" | "used" | "cancelled"
        property,
      });
    }

    // Token is valid and pending — return property card
    const propResult = await executeHasuraQuery<{
      real_estate_property_listing?: PropertyCard[];
    }>(GET_PROPERTY_CARD, { propertyUuid: invitation.property_uuid });
    const property = propResult.real_estate_property_listing?.[0] ?? null;

    return successResponse({
      tokenStatus: "valid",
      property,
      expiresAt: invitation.expires_at,
    });
  } catch (error: unknown) {
    console.error("[transfer-ownership/validate] error:", error);
    const e = error as { message?: string };
    return errorResponse(e.message || "Failed to validate token", undefined, 500);
  }
}
