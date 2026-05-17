"use client";

import { NhostProvider } from "@nhost/react";
import { nhostAppClient } from "@/lib/nhost-app-client";

/**
 * Provides Nhost SDK context for components that need Storage or other client APIs.
 * Sign-in remains via /api/v1/auth/* (httpOnly cookies) + BFF for admin Functions.
 */
export function NhostAppProvider({ children }: { children: React.ReactNode }) {
  return <NhostProvider nhost={nhostAppClient}>{children}</NhostProvider>;
}
