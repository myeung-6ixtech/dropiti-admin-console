/**
 * District centroids for admin map preview — synced with dropiti-nhost `_lib/geo/centroids.json`.
 * Used for instant approximate prefill when district/country changes (server resolver is canonical on Generate / recalculate save).
 */

type DistrictRow = { code: string; name: string; lat: number; lng: number };

const HK: DistrictRow[] = [
  { code: "central-western", name: "Central and Western", lat: 22.286, lng: 114.154 },
  { code: "eastern", name: "Eastern", lat: 22.284, lng: 114.224 },
  { code: "southern", name: "Southern", lat: 22.247, lng: 114.16 },
  { code: "wan-chai", name: "Wan Chai", lat: 22.28, lng: 114.173 },
  { code: "sham-shui-po", name: "Sham Shui Po", lat: 22.33, lng: 114.162 },
  { code: "kowloon-city", name: "Kowloon City", lat: 22.328, lng: 114.191 },
  { code: "kwun-tong", name: "Kwun Tong", lat: 22.313, lng: 114.225 },
  { code: "wong-tai-sin", name: "Wong Tai Sin", lat: 22.341, lng: 114.193 },
  { code: "yau-tsim-mong", name: "Yau Tsim Mong", lat: 22.306, lng: 114.171 },
  { code: "islands", name: "Islands", lat: 22.261, lng: 113.946 },
  { code: "kwai-tsing", name: "Kwai Tsing", lat: 22.354, lng: 114.126 },
  { code: "north", name: "North", lat: 22.494, lng: 114.138 },
  { code: "sai-kung", name: "Sai Kung", lat: 22.381, lng: 114.273 },
  { code: "sha-tin", name: "Sha Tin", lat: 22.387, lng: 114.195 },
  { code: "tai-po", name: "Tai Po", lat: 22.45, lng: 114.164 },
  { code: "tsuen-wan", name: "Tsuen Wan", lat: 22.371, lng: 114.114 },
  { code: "tuen-mun", name: "Tuen Mun", lat: 22.391, lng: 113.977 },
  { code: "yuen-long", name: "Yuen Long", lat: 22.445, lng: 114.022 },
];

const MO: DistrictRow[] = [
  { code: "nossa-senhora-de-fatima", name: "Nossa Senhora de Fátima", lat: 22.198, lng: 113.549 },
  { code: "nossa-senhora-fatima", name: "Nossa Senhora de Fátima", lat: 22.198, lng: 113.549 },
  { code: "santo-antonio", name: "Santo António", lat: 22.193, lng: 113.539 },
  { code: "se", name: "Sé", lat: 22.192, lng: 113.541 },
  { code: "sao-lazaro", name: "São Lázaro", lat: 22.194, lng: 113.548 },
  { code: "sao-lourenco", name: "São Lourenço", lat: 22.189, lng: 113.536 },
  { code: "taipa", name: "Taipa", lat: 22.157, lng: 113.559 },
  { code: "coloane", name: "Coloane", lat: 22.127, lng: 113.563 },
  { code: "cotai", name: "Cotai", lat: 22.142, lng: 113.561 },
];

const COUNTRY_CENTroids: Record<string, { lat: number; lng: number }> = {
  HK: { lat: 22.3193, lng: 114.1694 },
  MO: { lat: 22.1987, lng: 113.5439 },
};

function districtsFor(countryCode: string): DistrictRow[] {
  return countryCode === "MO" ? MO : HK;
}

/** Approximate district centroid for instant form prefill (no jitter). */
export function getDistrictCentroid(
  countryCode: string,
  districtCodeOrName: string,
): { lat: number; lng: number } | null {
  const districts = districtsFor(countryCode);
  const key = districtCodeOrName.trim().toLowerCase();
  const match =
    districts.find((d) => d.code === key) ??
    districts.find((d) => d.name.toLowerCase() === key);
  if (match) return { lat: match.lat, lng: match.lng };
  return COUNTRY_CENTroids[countryCode] ?? null;
}
