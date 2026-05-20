"use client";

import React, { useCallback, useEffect, useState } from "react";
import type { AdminOfferRow } from "./AdminIncomingOffers";
import { adminFetch } from "@/lib/admin-api";
import { adminRoutes } from "@/lib/admin-routes";

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

export type TransferInvitationStatusData = {
  invitationId: number;
  tokenUuid: string;
  /** Full claim URL; may be empty until Functions returns it or fallback origin is configured. */
  invitationUrl: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  usedAt: string | null;
  resendCount: number;
  claimedByUserId: string | null;
  externalContact: string;
  daysRemaining: number;
  hoursSinceSent: number;
  canResend: boolean;
};

type TransferInvitationStatusPayload = {
  hasInvitation: boolean;
  data: TransferInvitationStatusData | null;
};

/** Public web app origin for `/transfer-ownership/:token` when API omits `invitationUrl` (older Functions). */
function getPublicClientOriginForInvites(): string {
  return (process.env.NEXT_PUBLIC_DROPITI_CLIENT_ORIGIN ?? "").replace(/\/$/, "").trim();
}

/**
 * Normalize status `data` from GET transfer-ownership/status: accept snake_case, fill invitationUrl from token + env when needed.
 */
function normalizeTransferInvitationRow(raw: Record<string, unknown>): TransferInvitationStatusData {
  const pickStr = (camel: string, snake: string): string => {
    const a = raw[camel];
    const b = raw[snake];
    if (typeof a === "string" && a.trim()) return a.trim();
    if (typeof b === "string" && b.trim()) return b.trim();
    return "";
  };

  const pickNum = (camel: string, snake: string): number => {
    const a = raw[camel];
    const b = raw[snake];
    if (typeof a === "number" && Number.isFinite(a)) return a;
    if (typeof b === "number" && Number.isFinite(b)) return b;
    if (typeof a === "string" && a.trim() && Number.isFinite(Number(a))) return Number(a);
    if (typeof b === "string" && b.trim() && Number.isFinite(Number(b))) return Number(b);
    return 0;
  };

  const tokenUuid = pickStr("tokenUuid", "token_uuid");
  let invitationUrl = pickStr("invitationUrl", "invitation_url");
  const origin = getPublicClientOriginForInvites();
  if (!invitationUrl && tokenUuid && origin) {
    invitationUrl = `${origin}/transfer-ownership/${tokenUuid}`;
  }

  const usedRaw = raw.usedAt ?? raw.used_at;
  const usedAt =
    usedRaw === null || usedRaw === undefined
      ? null
      : typeof usedRaw === "string"
        ? usedRaw
        : null;

  const claimedRaw = raw.claimedByUserId ?? raw.claimed_by_user_id;
  const claimedByUserId =
    typeof claimedRaw === "string" && claimedRaw.trim() ? claimedRaw.trim() : null;

  return {
    invitationId: pickNum("invitationId", "invitation_id"),
    tokenUuid,
    invitationUrl,
    status: typeof raw.status === "string" ? raw.status.trim() : "",
    expiresAt: pickStr("expiresAt", "expires_at"),
    createdAt: pickStr("createdAt", "created_at"),
    usedAt,
    resendCount: pickNum("resendCount", "resend_count"),
    claimedByUserId,
    externalContact: pickStr("externalContact", "external_contact"),
    daysRemaining: pickNum("daysRemaining", "days_remaining"),
    hoursSinceSent: pickNum("hoursSinceSent", "hours_since_sent"),
    canResend: Boolean(raw.canResend ?? raw.can_resend),
  };
}

function normalizeTransferStatusPayload(
  payload: TransferInvitationStatusPayload
): TransferInvitationStatusPayload {
  if (!payload.data || typeof payload.data !== "object") {
    return payload;
  }
  return {
    ...payload,
    data: normalizeTransferInvitationRow(payload.data as unknown as Record<string, unknown>),
  };
}

/** Resolved HTTPS URL for copy / WhatsApp; null if token missing or URL cannot be built. */
function resolveInvitationUrl(d: TransferInvitationStatusData | null | undefined): string | null {
  if (!d?.tokenUuid?.trim()) return null;
  const u = d.invitationUrl?.trim();
  if (u) return u;
  const origin = getPublicClientOriginForInvites();
  if (!origin) return null;
  return `${origin}/transfer-ownership/${d.tokenUuid.trim()}`;
}

function buildOutreachWhatsAppUrl(
  externalContact: string | null | undefined,
  offer: AdminOfferRow,
  claim?: { invitationUrl: string; expiresAt: string } | null
): string | null {
  if (!externalContact?.trim()) return null;
  const d = digitsOnly(externalContact);
  if (!d) return null;
  const propTitle = offer.property?.title || "your listing";
  const lines = [
    `Hi — I'm reaching out from Dropiti regarding "${propTitle}".`,
    `There is a rental offer: ${offer.proposing_rent_price_currency} ${offer.proposing_rent_price.toLocaleString()}, ${offer.num_leasing_months} mo (${offer.payment_frequency}).`,
    `Applicant: ${offer.initiator.display_name}.`,
    `I'd like to connect you with this lead.`,
  ];
  if (claim?.invitationUrl) {
    const expLabel = new Date(claim.expiresAt).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
    lines.push(`Claim your listing on Dropiti: ${claim.invitationUrl}`);
    lines.push(`(This link expires ${expLabel}.)`);
  }
  const text = lines.join(" ");
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

/** Active pending invitation: not used/cancelled and not past expires_at. */
function claimForWhatsApp(
  inv: TransferInvitationStatusData | null | undefined
): { invitationUrl: string; expiresAt: string } | null {
  if (!inv) return null;
  if (inv.status === "used" || inv.status === "cancelled") return null;
  if (inv.status !== "pending") return null;
  if (new Date(inv.expiresAt) <= new Date()) return null;
  const url = resolveInvitationUrl(inv);
  if (!url) return null;
  return { invitationUrl: url, expiresAt: inv.expiresAt };
}

export function AdminOfferDetailPanel({ offer }: { offer: AdminOfferRow }) {
  const propertyUuid = offer.property?.property_uuid ?? null;
  const externalContact = offer.property?.external_contact ?? null;

  const [statusLoading, setStatusLoading] = useState(false);
  const [transferInvite, setTransferInvite] = useState<TransferInvitationStatusPayload | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!propertyUuid) return;
    setStatusLoading(true);
    setStatusError(null);
    try {
      const res = await adminFetch<TransferInvitationStatusPayload>(
        adminRoutes.transferOwnershipStatus(),
        { searchParams: { propertyUuid } }
      );
      if (!res.ok || res.error || res.data == null) {
        setTransferInvite(null);
        setStatusError(res.error ?? "Failed to load invitation status");
        return;
      }
      setTransferInvite(normalizeTransferStatusPayload(res.data));
    } catch (e) {
      setTransferInvite(null);
      setStatusError(e instanceof Error ? e.message : "Failed to load invitation status");
    } finally {
      setStatusLoading(false);
    }
  }, [propertyUuid]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const invData = transferInvite?.data ?? undefined;
  const waClaim = claimForWhatsApp(invData);
  const waUrl = buildOutreachWhatsAppUrl(externalContact, offer, waClaim);

  const handleGenerate = async () => {
    if (!propertyUuid) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await adminFetch<Record<string, unknown>>(adminRoutes.transferOwnershipInvite(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyUuid,
          offerId: String(offer.id),
          skipWhatsApp: true,
        }),
      });
      if (!res.ok || res.error) {
        setActionError(res.error ?? "Failed to generate claim link");
        return;
      }
      await loadStatus();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to generate claim link");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    if (!propertyUuid) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await adminFetch<Record<string, unknown>>(adminRoutes.transferOwnershipResend(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyUuid,
          skipWhatsApp: true,
        }),
      });
      if (!res.ok || res.error) {
        setActionError(res.error ?? "Could not refresh token");
        return;
      }
      await loadStatus();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not refresh token");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyLink = async (url: string | null | undefined) => {
    const text = typeof url === "string" ? url.trim() : "";
    if (!text) {
      setActionError(
        "No invitation URL to copy. Deploy Functions with invitationUrl on status, or set NEXT_PUBLIC_DROPITI_CLIENT_ORIGIN (public Dropiti web origin)."
      );
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setActionError("Could not copy to clipboard");
    }
  };

  const renderClaimCard = () => {
    if (!propertyUuid) {
      return (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
          This offer has no linked property UUID. Claim links require a property record.
        </p>
      );
    }

    if (!externalContact?.trim()) {
      return (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
          Set <strong>external contact</strong> on the property to generate a claim link.
        </p>
      );
    }

    if (statusLoading && !transferInvite) {
      return <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Loading invitation…</p>;
    }

    if (statusError && !transferInvite) {
      return (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-red-600 dark:text-red-400">{statusError}</p>
          <button
            type="button"
            onClick={() => void loadStatus()}
            className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Retry
          </button>
        </div>
      );
    }

    const d = invData;
    const hasInv = transferInvite?.hasInvitation && d;

    if (!hasInv) {
      return (
        <>
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => void handleGenerate()}
            className="mt-3 w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {actionLoading ? "Generating…" : "Generate claim link"}
          </button>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Creates a time-limited link for the landlord/agent to claim this listing on Dropiti. No automated
            WhatsApp is sent; use Open WhatsApp below after the link is ready.
          </p>
        </>
      );
    }

    if (d.status === "used") {
      return (
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
          This invitation was already used (listing claimed). Generate a new outreach flow from the property
          if needed.
        </p>
      );
    }

    if (d.status === "cancelled") {
      return (
        <>
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">The last invitation was cancelled.</p>
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => void handleGenerate()}
            className="mt-3 w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {actionLoading ? "Generating…" : "Generate new claim link"}
          </button>
        </>
      );
    }

    const isExpired = d.status === "expired";
    const showActiveLink = d.status === "pending" && !isExpired && new Date(d.expiresAt) > new Date();
    const displayUrl = resolveInvitationUrl(d);

    return (
      <div className="mt-3 space-y-3">
        {showActiveLink && (
          <>
            <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800/80">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Invitation URL</p>
              {displayUrl ? (
                <p className="mt-1 break-all font-mono text-xs text-gray-800 dark:text-gray-200">{displayUrl}</p>
              ) : (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  Token <span className="font-mono">{d.tokenUuid}</span> — set{" "}
                  <span className="font-mono">NEXT_PUBLIC_DROPITI_CLIENT_ORIGIN</span> in this app to build the
                  full link, or redeploy Functions so status returns <span className="font-mono">invitationUrl</span>.
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Expires {new Date(d.expiresAt).toLocaleString()} · {d.daysRemaining} day(s) left
              </p>
            </div>
            <button
              type="button"
              disabled={!displayUrl}
              onClick={() => void handleCopyLink(displayUrl)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          </>
        )}

        {isExpired && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            This claim link has expired. Refresh to issue a new token.
          </p>
        )}

        {d.canResend && (
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => void handleRefreshToken()}
            className="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {actionLoading ? "Refreshing…" : "Refresh token"}
          </button>
        )}

        {!d.canResend && d.status === "pending" && !isExpired && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Refresh is available after 24 hours or when the link expires.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900/40">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Listing
          </h2>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {offer.property?.title || "—"}
          </p>
          {offer.property?.property_uuid && (
            <p className="mt-1 font-mono text-xs text-gray-400">{offer.property.property_uuid}</p>
          )}
          {offer.property?.rental_price != null && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Listed rent: {Number(offer.property.rental_price).toLocaleString()}
            </p>
          )}
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">External contact</p>
            {offer.property?.external_contact ? (
              <p className="mt-0.5 font-mono text-sm text-gray-800 dark:text-gray-200">
                {offer.property.external_contact}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                Not set — add on the property edit form for WhatsApp outreach.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900/40">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Applicant
          </h2>
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            {offer.initiator.display_name}
          </p>
          {offer.initiator.email && (
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">{offer.initiator.email}</p>
          )}
          {offer.initiator.phone_number && (
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
              {offer.initiator.phone_number}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900/40">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Offer terms
            </h2>
            <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {offer.offer_status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Rent proposed</p>
              <p className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">
                {offer.proposing_rent_price_currency}{" "}
                {offer.proposing_rent_price.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
              <p className="mt-0.5 font-semibold text-gray-900 dark:text-white">
                {offer.num_leasing_months} months
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Payment</p>
              <p className="mt-0.5 font-semibold capitalize text-gray-900 dark:text-white">
                {offer.payment_frequency}
              </p>
            </div>
            {offer.move_in_date && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Move-in</p>
                <p className="mt-0.5 font-semibold text-gray-900 dark:text-white">
                  {new Date(offer.move_in_date).toLocaleDateString()}
                </p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Offer key</p>
              <p className="mt-0.5 font-mono text-xs text-gray-600 dark:text-gray-300">
                {offer.offer_key}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Submitted</p>
              <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">
                {new Date(offer.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="lg:col-span-2">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Outreach
        </h2>
        <div className="space-y-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Ownership claim link</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Generate a Dropiti link so the listing contact can claim the property.
            </p>
            {actionError && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">{actionError}</p>
            )}
            {renderClaimCard()}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">WhatsApp</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Open a pre-filled message to the listing external contact. If you have an active claim link, it
              is included in the message.
            </p>
            {waUrl ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Open WhatsApp
              </a>
            ) : (
              <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
                Add a valid external phone on the property to enable WhatsApp.
              </p>
            )}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 opacity-80 dark:border-gray-700 dark:bg-gray-900/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Facebook DM</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Phase 2</p>
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                Soon
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
