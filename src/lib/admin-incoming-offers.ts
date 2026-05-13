/**
 * IDs that count as the "platform landlord" recipient on offers for admin-managed listings.
 * Comma-separated UUIDs in DROPITI_PLATFORM_LANDLORD_USER_IDS; always includes the current admin
 * so /incoming-for-admin–style offers (recipient = logged-in admin) still appear.
 */
export function getAdminIncomingRecipientIds(loggedInAdminUserId: string): string[] {
  const fromEnv = (process.env.DROPITI_PLATFORM_LANDLORD_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([...fromEnv, loggedInAdminUserId])];
}
