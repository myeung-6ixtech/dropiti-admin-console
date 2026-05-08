/**
 * Provider-agnostic WhatsApp service layer.
 *
 * Phase 1: stub implementation — messages are logged server-side only.
 *          Replace WHATSAPP_PROVIDER env var with "meta" or "twilio" in Phase 2.
 */

export const INVITATION_EXPIRY_DAYS = 7;

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Build the ownership-invitation message body.
 * The link directs the recipient to the claim page.
 */
export function buildOwnershipInvitationMessage(
  propertyTitle: string,
  claimUrl: string
): string {
  return (
    `Hi,\n\n` +
    `You have been invited to claim ownership of a property listing on Dropiti:\n\n` +
    `*${propertyTitle}*\n\n` +
    `Click the link below to verify your identity and claim the listing:\n` +
    `${claimUrl}\n\n` +
    `This invitation link expires in ${INVITATION_EXPIRY_DAYS} days.\n\n` +
    `If you did not expect this message, you can safely ignore it.\n\n` +
    `— Dropiti Admin`
  );
}

/**
 * Send an ownership invitation to an external phone number via WhatsApp.
 * Uses WHATSAPP_PROVIDER to select the implementation (stub by default).
 */
export async function sendOwnershipInvitation(
  externalContact: string,
  propertyTitle: string,
  claimUrl: string
): Promise<WhatsAppSendResult> {
  const provider = process.env.WHATSAPP_PROVIDER ?? "stub";
  const message = buildOwnershipInvitationMessage(propertyTitle, claimUrl);

  if (provider === "stub") {
    console.log("[WhatsAppStub] Would send to:", externalContact);
    console.log("[WhatsAppStub] Message:\n", message);
    return { success: true, messageId: `stub-${Date.now()}` };
  }

  // Phase 2: plug in real provider here
  console.warn(`[WhatsAppService] Unknown provider: ${provider}. Falling back to stub.`);
  console.log("[WhatsAppFallback] To:", externalContact, "\nMessage:", message);
  return { success: true, messageId: `fallback-${Date.now()}` };
}
