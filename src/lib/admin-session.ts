import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { extractHasuraClaims, getNhostJwtSecret, hasRole } from "@/lib/nhost";

const ACCESS_TOKEN_COOKIE = "nhost_access_token";

/**
 * Resolves the Hasura user id for the current request if a valid admin
 * access token is present. Does not refresh tokens (call /api/v1/auth/check first).
 */
export async function requireAdminHasuraUserId(): Promise<
  | { ok: true; userId: string }
  | { ok: false; status: number; message: string }
> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }
  try {
    const { payload } = await jwtVerify(accessToken, getNhostJwtSecret());
    const decoded = payload as Record<string, unknown>;
    if (!hasRole(decoded, "admin")) {
      return { ok: false, status: 403, message: "Admin role required" };
    }
    const { userId } = extractHasuraClaims(decoded);
    if (!userId) {
      return { ok: false, status: 401, message: "Invalid session" };
    }
    return { ok: true, userId };
  } catch {
    return { ok: false, status: 401, message: "Session expired or invalid" };
  }
}
