import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdminHasuraUserId } from "@/lib/admin-session";
import { previewListingCoordinates } from "@/lib/resolve-coordinates-preview";
import { getFunctionsBaseUrl } from "@/lib/nhost-functions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACCESS_TOKEN_COOKIE = "nhost_access_token";

/** POST — preview lat/lng without saving. Proxies to Nhost when deployed; local fallback otherwise. */
export async function POST(request: NextRequest) {
  const auth = await requireAdminHasuraUserId();
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.message },
      { status: auth.status },
    );
  }

  let body: {
    address?: unknown;
    show_specific_location?: boolean;
    property_uuid?: string;
    enableGeocode?: boolean;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const base = getFunctionsBaseUrl();
  if (base) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    if (accessToken) {
      try {
        const upstream = await fetch(
          `${base}/v1/admin/properties/preview-coordinates`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          },
        );
        const text = await upstream.text();
        const isNotFound =
          upstream.status === 404 ||
          upstream.status === 500 ||
          text.toLowerCase().includes("item not found");

        if (upstream.ok && text.trim()) {
          return new NextResponse(text, {
            status: upstream.status,
            headers: {
              "Content-Type":
                upstream.headers.get("content-type") ?? "application/json",
            },
          });
        }

        if (!isNotFound && text.trim()) {
          return new NextResponse(text, {
            status: upstream.status,
            headers: {
              "Content-Type":
                upstream.headers.get("content-type") ?? "application/json",
            },
          });
        }
      } catch (err) {
        console.warn("[preview-coordinates] Nhost proxy failed, using local fallback:", err);
      }
    }
  }

  const resolved = await previewListingCoordinates({
    address: body.address ?? {},
    show_specific_location: body.show_specific_location,
    property_uuid: body.property_uuid,
    enableGeocode: body.enableGeocode ?? true,
  });

  if (!resolved) {
    return NextResponse.json(
      { ok: false, error: "Could not resolve coordinates from address" },
      { status: 422 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      latitude: resolved.latitude,
      longitude: resolved.longitude,
      tier: resolved.tier,
      pinPrecision: resolved.pinPrecision,
    },
  });
}
