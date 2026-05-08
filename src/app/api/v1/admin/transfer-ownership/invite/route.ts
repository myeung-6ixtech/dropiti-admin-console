/**
 * POST /api/v1/admin/transfer-ownership/invite
 *
 * Creates a property_transfer_invitation row and sends a WhatsApp ownership-
 * invitation message to the property's external_contact number.
 *
 * Body: { propertyUuid: string }
 */
import { NextRequest } from "next/server";
import { requireAdminHasuraUserId } from "@/lib/admin-session";
import { executeHasuraQuery } from "@/app/api/v1/utils/hasuraServer";
import { successResponse, errorResponse } from "@/app/api/v1/utils/response";
import { sendOwnershipInvitation, INVITATION_EXPIRY_DAYS } from "@/lib/whatsappService";

const GET_PROPERTY = `
  query GetPropertyForInvite($propertyUuid: uuid!) {
    real_estate_property_listing(where: { property_uuid: { _eq: $propertyUuid } }) {
      property_uuid
      title
      external_contact
    }
  }
`;

const GET_PENDING_INVITATION = `
  query GetPendingInvitation($propertyUuid: uuid!) {
    real_estate_property_transfer_invitation(
      where: {
        property_uuid: { _eq: $propertyUuid }
        status: { _eq: "pending" }
      }
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

const INSERT_INVITATION = `
  mutation InsertTransferInvitation(
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

type PropertyRow = {
  property_uuid: string;
  title: string | null;
  external_contact: string | null;
};

type InvitationRow = {
  id: number;
  token_uuid: string;
  status: string;
  expires_at: string;
  created_at: string;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminHasuraUserId();
    if (!auth.ok) {
      return errorResponse(auth.message, undefined, auth.status);
    }

    const body = await request.json();
    const { propertyUuid } = body as { propertyUuid?: string };

    if (!propertyUuid) {
      return errorResponse("propertyUuid is required", undefined, 400);
    }

    // Fetch property to get external_contact
    const propResult = await executeHasuraQuery<{
      real_estate_property_listing?: PropertyRow[];
    }>(GET_PROPERTY, { propertyUuid });

    const property = propResult.real_estate_property_listing?.[0];
    if (!property) {
      return errorResponse("Property not found", undefined, 404);
    }
    if (!property.external_contact) {
      return errorResponse(
        "This property has no external_contact. Add a phone number in the property edit form first.",
        undefined,
        422
      );
    }

    // Check for a recent pending invitation (prevent spam within 24 h)
    const existingResult = await executeHasuraQuery<{
      real_estate_property_transfer_invitation?: InvitationRow[];
    }>(GET_PENDING_INVITATION, { propertyUuid });

    const existing = existingResult.real_estate_property_transfer_invitation?.[0];
    if (existing) {
      const hoursSinceSent =
        (Date.now() - new Date(existing.created_at).getTime()) / (1000 * 60 * 60);
      if (hoursSinceSent < 24) {
        return errorResponse(
          "An invitation was already sent less than 24 hours ago. Use the resend endpoint after 24 hours.",
          undefined,
          429
        );
      }
    }

    // Create the invitation row
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
    if (!invitation) {
      return errorResponse("Failed to create invitation", undefined, 500);
    }

    // Build the claim URL and send the WhatsApp message
    const appBase =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      "http://localhost:3000";
    const claimUrl = `${appBase}/transfer-ownership/${invitation.token_uuid}`;
    const propertyTitle = property.title ?? "your listing";

    const waResult = await sendOwnershipInvitation(
      property.external_contact,
      propertyTitle,
      claimUrl
    );

    return successResponse(
      {
        token_uuid: invitation.token_uuid,
        status: invitation.status,
        expires_at: invitation.expires_at,
        whatsapp_sent: waResult.success,
        whatsapp_message_id: waResult.messageId,
      },
      "Ownership invitation sent successfully"
    );
  } catch (error: unknown) {
    console.error("[admin/transfer-ownership/invite] error:", error);
    const e = error as { message?: string };
    return errorResponse(e.message || "Failed to send invitation", undefined, 500);
  }
}
