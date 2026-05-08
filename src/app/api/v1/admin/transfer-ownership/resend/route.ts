/**
 * POST /api/v1/admin/transfer-ownership/resend
 *
 * Re-sends an ownership invitation for a property. Guards:
 *   - previous invitation must be either expired OR pending and older than 24 h.
 *   - cancels any pending invitation before creating a new one.
 *
 * Body: { propertyUuid: string }
 */
import { NextRequest } from "next/server";
import { requireAdminHasuraUserId } from "@/lib/admin-session";
import { executeHasuraQuery } from "@/app/api/v1/utils/hasuraServer";
import { successResponse, errorResponse } from "@/app/api/v1/utils/response";
import { sendOwnershipInvitation, INVITATION_EXPIRY_DAYS } from "@/lib/whatsappService";

const GET_PROPERTY = `
  query GetPropertyForResend($propertyUuid: uuid!) {
    real_estate_property_listing(where: { property_uuid: { _eq: $propertyUuid } }) {
      property_uuid
      title
      external_contact
    }
  }
`;

const GET_LATEST_INVITATION = `
  query GetLatestInvitation($propertyUuid: uuid!) {
    real_estate_property_transfer_invitation(
      where: { property_uuid: { _eq: $propertyUuid } }
      order_by: { created_at: desc }
      limit: 1
    ) {
      id
      token_uuid
      status
      expires_at
      created_at
    }
  }
`;

const CANCEL_INVITATION = `
  mutation CancelInvitation($id: bigint!) {
    update_real_estate_property_transfer_invitation_by_pk(
      pk_columns: { id: $id }
      _set: { status: "cancelled" }
    ) {
      id
      status
    }
  }
`;

const INSERT_INVITATION = `
  mutation ResendTransferInvitation(
    $propertyUuid: uuid!
    $invitedBy: String!
    $externalContact: String!
    $expiresAt: timestamptz!
  ) {
    insert_real_estate_property_transfer_invitation_one(
      object: {
        property_uuid: $propertyUuid
        invited_by: $invitedBy
        external_contact: $externalContact
        status: "pending"
        expires_at: $expiresAt
      }
    ) {
      id
      token_uuid
      status
      expires_at
    }
  }
`;

type PropertyRow = { property_uuid: string; title: string | null; external_contact: string | null };
type InvitationRow = { id: number; token_uuid: string; status: string; expires_at: string; created_at: string };

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminHasuraUserId();
    if (!auth.ok) return errorResponse(auth.message, undefined, auth.status);

    const { propertyUuid } = (await request.json()) as { propertyUuid?: string };
    if (!propertyUuid) return errorResponse("propertyUuid is required", undefined, 400);

    const propResult = await executeHasuraQuery<{
      real_estate_property_listing?: PropertyRow[];
    }>(GET_PROPERTY, { propertyUuid });
    const property = propResult.real_estate_property_listing?.[0];
    if (!property) return errorResponse("Property not found", undefined, 404);
    if (!property.external_contact)
      return errorResponse("Property has no external_contact", undefined, 422);

    const latestResult = await executeHasuraQuery<{
      real_estate_property_transfer_invitation?: InvitationRow[];
    }>(GET_LATEST_INVITATION, { propertyUuid });
    const latest = latestResult.real_estate_property_transfer_invitation?.[0];

    if (latest) {
      const isExpired =
        latest.status === "expired" ||
        new Date(latest.expires_at).getTime() < Date.now();
      const hoursSinceSent =
        (Date.now() - new Date(latest.created_at).getTime()) / (1000 * 60 * 60);
      const isPendingStale = latest.status === "pending" && hoursSinceSent >= 24;

      if (!isExpired && !isPendingStale) {
        return errorResponse(
          "Cannot resend yet — the invitation is still active and less than 24 hours old.",
          undefined,
          429
        );
      }

      // Cancel the old invitation so only one is active at a time
      if (latest.status === "pending") {
        await executeHasuraQuery(CANCEL_INVITATION, { id: latest.id });
      }
    }

    const expiresAt = new Date(
      Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const insertResult = await executeHasuraQuery<{
      insert_real_estate_property_transfer_invitation_one?: InvitationRow;
    }>(INSERT_INVITATION, {
      propertyUuid,
      invitedBy: auth.userId,
      externalContact: property.external_contact,
      expiresAt,
    });

    const invitation = insertResult.insert_real_estate_property_transfer_invitation_one;
    if (!invitation) return errorResponse("Failed to create invitation", undefined, 500);

    const appBase =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
    const claimUrl = `${appBase}/transfer-ownership/${invitation.token_uuid}`;

    const waResult = await sendOwnershipInvitation(
      property.external_contact,
      property.title ?? "your listing",
      claimUrl
    );

    return successResponse(
      {
        token_uuid: invitation.token_uuid,
        status: invitation.status,
        expires_at: invitation.expires_at,
        whatsapp_sent: waResult.success,
      },
      "Ownership invitation resent successfully"
    );
  } catch (error: unknown) {
    console.error("[admin/transfer-ownership/resend] error:", error);
    const e = error as { message?: string };
    return errorResponse(e.message || "Failed to resend invitation", undefined, 500);
  }
}
