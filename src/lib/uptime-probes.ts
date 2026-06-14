/**
 * Endpoint health probes for the uptime monitor.
 */
import { adminRoutes } from "@/lib/admin-routes";
import {
  ACCESS_TOKEN_COOKIE,
  verifyAccessToken,
} from "@/lib/auth-session";
import { getFunctionsBaseUrl } from "@/lib/nhost-functions";
import { cookies } from "next/headers";

export type ProbeSide = "platform" | "admin" | "client";

export type ProbeDefinition = {
  id: string;
  label: string;
  side: ProbeSide;
  method: "GET" | "HEAD";
  /** Relative path under /v1/ for direct Functions calls */
  functionsPath?: string;
  /** Admin BFF path segment (uses session cookie) */
  bffPath?: string;
  /** Treat 401 as degraded (auth required) vs down */
  authRequired?: boolean;
};

export type ProbeResult = {
  id: string;
  label: string;
  side: ProbeSide;
  status: "up" | "down" | "degraded";
  latencyMs: number;
  httpStatus?: number;
  error?: string;
};

export const UPTIME_PROBES: ProbeDefinition[] = [
  {
    id: "platform-health",
    label: "Nhost Functions health",
    side: "platform",
    method: "GET",
    functionsPath: "health",
  },
  {
    id: "admin-analytics",
    label: "Admin analytics dashboard",
    side: "admin",
    method: "GET",
    bffPath: adminRoutes.analyticsDashboard(),
    authRequired: true,
  },
  {
    id: "admin-properties",
    label: "Admin properties list",
    side: "admin",
    method: "GET",
    bffPath: `${adminRoutes.properties()}?limit=1`,
    authRequired: true,
  },
  {
    id: "admin-users",
    label: "Admin users",
    side: "admin",
    method: "GET",
    bffPath: `${adminRoutes.users()}?limit=1`,
    authRequired: true,
  },
  {
    id: "admin-offers",
    label: "Admin incoming offers",
    side: "admin",
    method: "GET",
    bffPath: `${adminRoutes.offersIncoming()}?limit=1`,
    authRequired: true,
  },
  {
    id: "client-listings",
    label: "Client property listings",
    side: "client",
    method: "GET",
    functionsPath: "client/properties/get-listings?limit=1",
  },
  {
    id: "client-health-echo",
    label: "Nhost echo (connectivity)",
    side: "client",
    method: "GET",
    functionsPath: "echo",
  },
];

async function probeDirectFunctions(
  path: string,
  method: "GET" | "HEAD",
  accessToken?: string
): Promise<{ ok: boolean; status: number; error?: string }> {
  const base = getFunctionsBaseUrl();
  if (!base) {
    return { ok: false, status: 503, error: "NEXT_PUBLIC_FUNCTIONS_URL is not configured" };
  }

  const url = `${base}/v1/${path.replace(/^\//, "")}`;
  const headers: HeadersInit = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(url, { method, headers, cache: "no-store" });
    const ok = res.ok || (method === "HEAD" && res.status < 500);
    let error: string | undefined;
    if (!ok) {
      const text = (await res.text()).slice(0, 200);
      error = text || `HTTP ${res.status}`;
    }
    return { ok, status: res.status, error };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : "Request failed",
    };
  }
}

async function probeBff(
  path: string,
  method: "GET" | "HEAD",
  origin: string,
  cookieHeader: string
): Promise<{ ok: boolean; status: number; error?: string }> {
  const url = `${origin}/api/v1/bff/functions/${path.replace(/^\//, "")}`;
  try {
    const res = await fetch(url, {
      method,
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    const ok = res.ok;
    let error: string | undefined;
    if (!ok) {
      const text = (await res.text()).slice(0, 200);
      error = text || `HTTP ${res.status}`;
    }
    return { ok, status: res.status, error };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : "Request failed",
    };
  }
}

export async function runUptimeProbes(origin: string): Promise<{
  checkedAt: string;
  probes: ProbeResult[];
}> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const allCookies = cookieStore.getAll();
  const cookieHeader = allCookies.map((c) => `${c.name}=${c.value}`).join("; ");

  let tokenValid = false;
  if (accessToken) {
    const verified = await verifyAccessToken(accessToken);
    tokenValid = verified.ok;
  }

  const results: ProbeResult[] = [];

  for (const probe of UPTIME_PROBES) {
    const start = Date.now();
    let outcome: { ok: boolean; status: number; error?: string };

    if (probe.bffPath) {
      outcome = await probeBff(probe.bffPath, probe.method, origin, cookieHeader);
    } else if (probe.functionsPath) {
      outcome = await probeDirectFunctions(probe.functionsPath, probe.method);
    } else {
      outcome = { ok: false, status: 0, error: "Misconfigured probe" };
    }

    const latencyMs = Date.now() - start;
    let status: ProbeResult["status"] = "up";
    if (!outcome.ok) {
      if (probe.authRequired && (outcome.status === 401 || !tokenValid)) {
        status = "degraded";
      } else {
        status = "down";
      }
    }

    results.push({
      id: probe.id,
      label: probe.label,
      side: probe.side,
      status,
      latencyMs,
      httpStatus: outcome.status || undefined,
      error: outcome.error,
    });
  }

  return {
    checkedAt: new Date().toISOString(),
    probes: results,
  };
}
