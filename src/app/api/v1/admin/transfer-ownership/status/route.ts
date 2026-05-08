/**
 * GET /api/v1/admin/transfer-ownership/status?propertyUuid=<uuid>
 *
 * Returns the latest invitation status for a given property.
 * Used by AdminOfferCard to render the correct badge/button.
 */
import { NextRequest } from "next/server";
import { requireAdminHasuraUserId } from "@/lib/admin-session";
import { executeHasuraQuery } from "@/app/api/v1/utils/hasuraServer";
import { successResponse, errorResponse } from "@/app/api/v1/utils/response";

const GET_LATEST = `
  query GetLatestInvitationStatus($propertyUuid: uuid!) {
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

type InvitationRow = {
  id: number;
  token_uuid: string;
  status: string;
  expires_at: string;
  created_at: string;
};

export type InvitationStatusResult =
  | { status: "none" }
  | {
      status: "pending_fresh" | "pending_stale" | "expired" | "used" | "cancelled";
      daysRemaining: number | null;
      hoursSinceSent: number;
      canResend: boolean;
    };

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminHasuraUserId();
    if (!auth.ok) return errorResponse(auth.message, undefined, auth.status);

    const { searchParams } = new URL(request.url);
    const propertyUuid = searchParams.get("propertyUuid");
    if (!propertyUuid) return errorResponse("propertyUuid is required", undefined, 400);

    const result = await executeHasuraQuery<{
      real_estate_property_transfer_invitation?: InvitationRow[];
    }>(GET_LATEST, { propertyUuid });

    const invitation = result.real_estate_property_transfer_invitation?.[0];
    if (!invitation) {
      return successResponse({ status: "none" } satisfies InvitationStatusResult);
    }

    const now = Date.now();
    const expiresAt = new Date(invitation.expires_at).getTime();
    const createdAt = new Date(invitation.created_at).getTime();

    const isActuallyExpired = expiresAt < now;
    const hoursSinceSent = (now - createdAt) / (1000 * 60 * 60);

    // Resolve the status: a DB "pending" row that is past its expiry is treated as expired
    type NonNoneStatus = Exclude<InvitationStatusResult["status"], "none">;
    let finalStatus: NonNoneStatus;
    if (invitation.status === "pending" && isActuallyExpired) {
      finalStatus = "expired";
    } else if (invitation.status === "pending") {
      finalStatus = hoursSinceSent < 24 ? "pending_fresh" : "pending_stale";
    } else {
      finalStatus = invitation.status as NonNoneStatus;
    }

    const isPending = finalStatus === "pending_fresh" || finalStatus === "pending_stale";
    const daysRemaining = isPending
      ? Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)))
      : null;
    const canResend =
      finalStatus === "expired" || (isPending && hoursSinceSent >= 24);

    const payload: InvitationStatusResult = {
      status: finalStatus,
      daysRemaining,
      hoursSinceSent: Math.round(hoursSinceSent),
      canResend,
    };

    return successResponse(payload);
  } catch (error: unknown) {
    console.error("[admin/transfer-ownership/status] error:", error);
    const e = error as { message?: string };
    return errorResponse(e.message || "Failed to fetch status", undefined, 500);
  }
}
