/**
 * Coordinate preview resolver for admin-console (mirrors dropiti-nhost geo waterfall).
 * Used when Nhost `preview-coordinates` is not yet deployed; also used as BFF fallback.
 */
import { createHash } from "crypto";
import { getDistrictCentroid } from "@/lib/location-centroids";

export type CoordinateTier = "geocoded" | "district" | "region" | "country" | "failed";

export type PreviewCoordinatesInput = {
  address: unknown;
  show_specific_location?: boolean;
  property_uuid?: string;
  enableGeocode?: boolean;
};

export type PreviewCoordinatesResult = {
  latitude: number;
  longitude: number;
  tier: CoordinateTier;
  pinPrecision: "exact" | "approximate";
};

type ParsedAddress = {
  street?: string;
  district?: string;
  country?: string;
  state?: string;
};

function parseAddress(address: unknown): ParsedAddress | null {
  if (!address || typeof address !== "object" || Array.isArray(address)) {
    return null;
  }
  const row = address as Record<string, unknown>;
  const pick = (keys: string[]) => {
    for (const key of keys) {
      const v = row[key];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return undefined;
  };
  return {
    street: pick(["addressLine1", "street"]),
    district: pick(["district"]),
    country: pick(["country"]),
    state: pick(["state"]),
  };
}

function normalizeCountry(country: string | undefined): string {
  const c = (country ?? "").trim().toLowerCase();
  if (c === "hk" || c === "hong kong") return "HK";
  if (c === "mo" || c === "macau" || c === "macao") return "MO";
  return (country ?? "HK").trim().toUpperCase();
}

function hasStreet(addr: ParsedAddress | null): boolean {
  return Boolean(addr?.street?.trim());
}

function jitter(
  lat: number,
  lng: number,
  seed: string | undefined,
  tier: CoordinateTier,
): { lat: number; lng: number } {
  if (tier === "geocoded" || !seed) return { lat, lng };
  const hash = createHash("sha256").update(seed).digest();
  const latOffset = ((hash[0] / 255) * 2 - 1) * 0.0012;
  const lngOffset = ((hash[1] / 255) * 2 - 1) * 0.0012;
  return { lat: lat + latOffset, lng: lng + lngOffset };
}

async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey =
    process.env.GOOGLE_MAPS_GEOCODING_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey || !query.trim()) return null;

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", query.trim());
    url.searchParams.set("key", apiKey);
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const json = (await res.json()) as {
      status?: string;
      results?: Array<{ geometry?: { location?: { lat?: number; lng?: number } } }>;
    };
    if (json.status !== "OK" || !json.results?.length) return null;
    const loc = json.results[0]?.geometry?.location;
    if (typeof loc?.lat !== "number" || typeof loc?.lng !== "number") return null;
    return { lat: loc.lat, lng: loc.lng };
  } catch {
    return null;
  }
}

function buildGeocodeQuery(addr: ParsedAddress): string {
  const parts: string[] = [];
  if (addr.street) parts.push(addr.street);
  if (addr.district) parts.push(addr.district);
  const country = normalizeCountry(addr.country);
  parts.push(country === "HK" ? "Hong Kong" : country === "MO" ? "Macau" : addr.country ?? "");
  return parts.filter(Boolean).join(", ");
}

export function inferPinPrecision(
  showSpecific: boolean | undefined,
  addr: ParsedAddress | null,
): "exact" | "approximate" {
  if (showSpecific && hasStreet(addr)) return "exact";
  return "approximate";
}

export async function previewListingCoordinates(
  input: PreviewCoordinatesInput,
): Promise<PreviewCoordinatesResult | null> {
  const addr = parseAddress(input.address);
  const countryCode = normalizeCountry(addr?.country);
  const showSpecific = Boolean(input.show_specific_location);

  if (showSpecific && hasStreet(addr) && input.enableGeocode !== false) {
    const geocoded = await geocodeAddress(buildGeocodeQuery(addr!));
    if (geocoded) {
      return {
        latitude: geocoded.lat,
        longitude: geocoded.lng,
        tier: "geocoded",
        pinPrecision: "exact",
      };
    }
  }

  if (addr?.district) {
    const district = getDistrictCentroid(countryCode, addr.district);
    if (district) {
      const p = jitter(district.lat, district.lng, input.property_uuid, "district");
      return {
        latitude: p.lat,
        longitude: p.lng,
        tier: "district",
        pinPrecision: inferPinPrecision(showSpecific, addr),
      };
    }
  }

  const countryFallback =
    countryCode === "HK"
      ? { lat: 22.3193, lng: 114.1694 }
      : countryCode === "MO"
        ? { lat: 22.1987, lng: 113.5439 }
        : null;

  if (countryFallback) {
    const p = jitter(
      countryFallback.lat,
      countryFallback.lng,
      input.property_uuid,
      "country",
    );
    return {
      latitude: p.lat,
      longitude: p.lng,
      tier: "country",
      pinPrecision: "approximate",
    };
  }

  return null;
}
