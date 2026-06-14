/**
 * Shared admin session helpers — used by middleware, auth routes, and uptime probes.
 */
import { jwtVerify, type JWTPayload } from "jose";
import {
  extractHasuraClaims,
  getNhostJwtSecret,
  hasRole,
  nhostGetUser,
  nhostRefreshToken,
  type NhostSession,
} from "@/lib/nhost";

export const ACCESS_TOKEN_COOKIE = "nhost_access_token";
export const REFRESH_TOKEN_COOKIE = "nhost_refresh_token";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
  permissions: string[];
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when JWT-only profile would show a raw user id instead of a human-readable label. */
export function adminUserNeedsEnrichment(user: AdminUser): boolean {
  const email = user.email?.trim() ?? "";
  const name = user.name?.trim() ?? "";
  if (!email) return true;
  if (!name) return true;
  if (name === user.id) return true;
  if (UUID_RE.test(name)) return true;
  return false;
}

export function cookieOptions(isProd: boolean) {
  return {
    access: (maxAge: number) => ({
      httpOnly: true,
      secure: isProd,
      sameSite: "strict" as const,
      maxAge,
      path: "/",
    }),
    refresh: {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict" as const,
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    },
  };
}

export function buildAdminUser(
  payload: Record<string, unknown>,
  session?: NhostSession
): AdminUser {
  const { userId } = extractHasuraClaims(payload);
  const email =
    (session?.user.email as string | undefined) ??
    (payload.email as string | undefined) ??
    "";
  const displayName =
    session?.user.displayName?.trim() ||
    (payload.name as string | undefined)?.trim() ||
    email.split("@")[0] ||
    "";

  const resolvedName =
    displayName && displayName !== userId && !UUID_RE.test(displayName)
      ? displayName
      : email.split("@")[0] || "Admin";

  return {
    id: userId || session?.user.id || "",
    email,
    name: resolvedName,
    avatar: session?.user.avatarUrl ?? null,
    role: "admin",
    permissions: ["*"],
  };
}

/** Resolve a complete admin user profile, fetching from Nhost when JWT claims are sparse. */
export async function resolveAdminUser(
  accessToken: string,
  payload: Record<string, unknown>,
  session?: NhostSession
): Promise<AdminUser> {
  let user = buildAdminUser(payload, session);
  if (!adminUserNeedsEnrichment(user)) {
    return user;
  }

  const profile = await nhostGetUser(accessToken);
  if (profile) {
    user = buildAdminUser(payload, {
      accessToken,
      accessTokenExpiresIn: 0,
      refreshToken: "",
      user: profile,
    });
  }

  if (adminUserNeedsEnrichment(user)) {
    user = {
      ...user,
      name: user.email?.split("@")[0]?.trim() || "Admin",
    };
  }

  return user;
}

export async function verifyAccessToken(
  accessToken: string
): Promise<
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; reason: "expired" | "invalid" }
> {
  try {
    const { payload } = await jwtVerify(accessToken, getNhostJwtSecret());
    const decoded = payload as Record<string, unknown>;
    if (!hasRole(decoded, "admin")) {
      return { ok: false, reason: "invalid" };
    }
    return { ok: true, payload: decoded };
  } catch (err) {
    if ((err as { code?: string }).code === "ERR_JWT_EXPIRED") {
      return { ok: false, reason: "expired" };
    }
    return { ok: false, reason: "invalid" };
  }
}

export async function refreshAdminSession(refreshToken: string): Promise<
  | { ok: true; session: NhostSession; payload: Record<string, unknown>; user: AdminUser }
  | { ok: false; error: string }
> {
  const { session, error } = await nhostRefreshToken(refreshToken);
  if (error || !session) {
    return { ok: false, error: error ?? "Session expired" };
  }

  try {
    const { payload } = await jwtVerify(session.accessToken, getNhostJwtSecret());
    const decoded = payload as Record<string, unknown>;
    if (!hasRole(decoded, "admin")) {
      return { ok: false, error: "Admin role required" };
    }
    return {
      ok: true,
      session,
      payload: decoded,
      user: buildAdminUser(decoded, session),
    };
  } catch {
    return { ok: false, error: "Token verification failed" };
  }
}

export function isJwtPayload(value: JWTPayload): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
