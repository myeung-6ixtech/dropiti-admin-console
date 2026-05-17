"use client";

import { NhostClient } from "@nhost/react";

const subdomain = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN;
const region = process.env.NEXT_PUBLIC_NHOST_REGION;

if (!subdomain || !region) {
  console.warn(
    "NEXT_PUBLIC_NHOST_SUBDOMAIN and NEXT_PUBLIC_NHOST_REGION are required for Nhost SDK features."
  );
}

/** Browser Nhost client for optional SDK features (e.g. Storage). Auth session uses httpOnly cookies + BFF. */
export const nhostAppClient = new NhostClient({
  subdomain: subdomain ?? "",
  region: region ?? "",
});
