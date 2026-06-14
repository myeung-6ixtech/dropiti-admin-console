/**
 * Nhost auth helpers — thin wrappers over Nhost's REST auth API.
 * All calls are server-side only; no Nhost client SDK needed.
 */

const NHOST_SUBDOMAIN = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN!;
const NHOST_REGION = process.env.NEXT_PUBLIC_NHOST_REGION!;

const nhostAuthBase = () =>
  `https://${NHOST_SUBDOMAIN}.auth.${NHOST_REGION}.nhost.run/v1`;

/**
 * Returns the HS256 JWT signing key as a Uint8Array for use with jose.
 * Set NHOST_JWT_SECRET to the "key" value from your Nhost JWT config
 * (Nhost Dashboard → Settings → Hasura → JWT Secret).
 */
export function getNhostJwtSecret(): Uint8Array {
  const secret = process.env.NHOST_JWT_SECRET;
  if (!secret) throw new Error("NHOST_JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export interface NhostSession {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export interface NhostSignInResult {
  session: NhostSession | null;
  error: string | null;
}

export interface NhostRefreshResult {
  session: NhostSession | null;
  error: string | null;
}

/** Sign in with email/password via Nhost REST auth API. */
export async function nhostSignIn(
  email: string,
  password: string
): Promise<NhostSignInResult> {
  const res = await fetch(`${nhostAuthBase()}/signin/email-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const body = await res.json();

  if (!res.ok) {
    return { session: null, error: body?.error?.message ?? "Sign-in failed" };
  }

  return { session: body.session ?? null, error: null };
}

/** Refresh an access token using a valid refresh token. */
export async function nhostRefreshToken(
  refreshToken: string
): Promise<NhostRefreshResult> {
  const res = await fetch(`${nhostAuthBase()}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const body = await res.json();

  if (!res.ok) {
    return { session: null, error: body?.error?.message ?? "Token refresh failed" };
  }

  return { session: body ?? null, error: null };
}

/** Sign out — revokes the refresh token on Nhost side. */
export async function nhostSignOut(refreshToken: string): Promise<void> {
  await fetch(`${nhostAuthBase()}/signout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => {
    // Best-effort — clear cookies regardless
  });
}

/** Fetch authenticated user profile (displayName, email, avatar) using an access token. */
export async function nhostGetUser(
  accessToken: string
): Promise<NhostSession["user"] | null> {
  const res = await fetch(`${nhostAuthBase()}/user`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  const body = (await res.json()) as {
    id?: string;
    email?: string;
    displayName?: string;
    avatarUrl?: string;
  };

  if (!body.id || !body.email) {
    return null;
  }

  return {
    id: body.id,
    email: body.email,
    displayName: body.displayName?.trim() || body.email.split("@")[0] || body.email,
    avatarUrl: body.avatarUrl,
  };
}

/** Extract Hasura JWT claims from a decoded JWT payload. */
export function extractHasuraClaims(payload: Record<string, unknown>) {
  const claims = payload["https://hasura.io/jwt/claims"] as
    | Record<string, unknown>
    | undefined;
  return {
    allowedRoles: (claims?.["x-hasura-allowed-roles"] as string[]) ?? [],
    defaultRole: (claims?.["x-hasura-default-role"] as string) ?? "",
    userId: (claims?.["x-hasura-user-id"] as string) ?? "",
  };
}

/** Returns true if the JWT payload grants the given role. */
export function hasRole(payload: Record<string, unknown>, role: string): boolean {
  const { allowedRoles } = extractHasuraClaims(payload);
  return allowedRoles.includes(role);
}
