/**
 * Server-only Airwallex token helper for webhook route.
 * Prefer admin Functions BFF for UI; this remains for inbound webhooks until migrated.
 */
export async function getAirwallexBearerToken(): Promise<string | null> {
  const clientId = process.env.AIRWALLEX_CLIENT_ID;
  const apiKey = process.env.AIRWALLEX_API_KEY;
  if (!clientId || !apiKey) return null;

  const base =
    process.env.NEXT_PUBLIC_AIRWALLEX_ENV === "prod"
      ? "https://api.airwallex.com/api/v1"
      : "https://api-demo.airwallex.com/api/v1";

  const res = await fetch(`${base}/authentication/login`, {
    method: "POST",
    headers: {
      "x-client-id": clientId,
      "x-api-key": apiKey,
    },
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { token?: string };
  return data.token ?? null;
}
