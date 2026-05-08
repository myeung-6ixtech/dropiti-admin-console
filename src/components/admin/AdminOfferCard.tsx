"use client";

import React, { useCallback, useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdminOffer = {
  id: number;
  offer_key: string;
  property_uuid: string;
  initiator_user_id: string;
  proposing_rent_price: number;
  proposing_rent_price_currency: string;
  num_leasing_months: number;
  payment_frequency: string;
  move_in_date: string | null;
  offer_status: string;
  created_at: string;
  property: {
    id: number | string;
    property_uuid: string;
    title: string;
    external_contact: string | null;
  } | null;
  initiator: {
    display_name: string;
    phone_number: string | null;
    email: string | null;
  };
};

type InvitationStatus =
  | { status: "none" }
  | {
      status: "pending_fresh" | "pending_stale" | "expired" | "used" | "cancelled";
      daysRemaining: number | null;
      hoursSinceSent: number;
      canResend: boolean;
    };

// ─── Outreach badge ───────────────────────────────────────────────────────────

function OutreachBadge({ inv }: { inv: InvitationStatus }) {
  if (inv.status === "none") return null;

  if (inv.status === "used") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
        ✓ Listing Claimed
      </span>
    );
  }

  if (inv.status === "pending_fresh") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
        Invitation Sent
        {inv.daysRemaining != null ? ` — ${inv.daysRemaining}d remaining` : ""}
      </span>
    );
  }

  if (inv.status === "pending_stale") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
        Invitation Sent (stale)
      </span>
    );
  }

  if (inv.status === "expired") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
        Invitation Expired
      </span>
    );
  }

  if (inv.status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        Cancelled
      </span>
    );
  }

  return null;
}

// ─── Outreach actions panel ────────────────────────────────────────────────────

export function OutreachActions({
  propertyUuid,
  externalContact,
}: {
  propertyUuid: string;
  externalContact: string | null;
}) {
  const [inv, setInv] = useState<InvitationStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch(
        `/api/v1/admin/transfer-ownership/status?propertyUuid=${encodeURIComponent(propertyUuid)}`,
        { credentials: "include" }
      );
      const json = await res.json();
      if (res.ok && json.success) {
        setInv(json.data as InvitationStatus);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingStatus(false);
    }
  }, [propertyUuid]);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const sendInvite = async (endpoint: "invite" | "resend") => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/admin/transfer-ownership/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ propertyUuid }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.error || "Failed to send invitation");
      } else {
        await fetchStatus();
      }
    } catch {
      setActionError("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const noContact = !externalContact;

  return (
    <div className="space-y-3">
      {/* WhatsApp / Ownership invitation */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
            {/* WhatsApp-style icon */}
            <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Send Ownership Invitation
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              WhatsApp message to external contact
            </p>
          </div>
        </div>

        {loadingStatus ? (
          <div className="h-8 w-40 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        ) : (
          <div className="space-y-2">
            {/* Status badge */}
            {inv && <div>{<OutreachBadge inv={inv} />}</div>}

            {/* Error */}
            {actionError && (
              <p className="text-xs text-red-600 dark:text-red-400">{actionError}</p>
            )}

            {/* No external contact warning */}
            {noContact && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                No external contact number — add one in the property edit form first.
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {(!inv || inv.status === "none") && (
                <button
                  type="button"
                  disabled={noContact || actionLoading}
                  onClick={() => void sendInvite("invite")}
                  title={
                    noContact
                      ? "Add an external_contact phone number in the property edit form first"
                      : undefined
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-b border-white" />
                  )}
                  Send Invitation
                </button>
              )}

              {inv &&
                inv.status !== "none" &&
                "canResend" in inv &&
                inv.canResend && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => void sendInvite("resend")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                      inv.status === "expired"
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {actionLoading && (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-b border-white" />
                    )}
                    {inv.status === "expired" ? "Resend (Expired)" : "Resend"}
                  </button>
                )}
            </div>

            {/* External contact display */}
            {externalContact && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Will be sent to{" "}
                <span className="font-mono font-medium text-gray-700 dark:text-gray-300">
                  {externalContact}
                </span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Facebook DM — Phase 2 */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
            <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Facebook DM</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Reach out via Facebook Messenger
            </p>
          </div>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Detail view (used by /dashboard/incoming-offers/[id]) ───────────────────

function statusColor(s: string): string {
  switch (s) {
    case "pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
    case "accepted":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
    case "rejected":
      return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
    case "withdrawn":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
  }
}

export function AdminOfferDetail({ offer }: { offer: AdminOffer }) {
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Left: offer details — 3 cols */}
      <div className="space-y-4 lg:col-span-3">
        {/* Property */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900/40">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Property
          </h2>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {offer.property?.title || "—"}
          </p>
          {offer.property?.property_uuid && (
            <p className="mt-1 font-mono text-xs text-gray-400">
              {offer.property.property_uuid}
            </p>
          )}
          {offer.property?.external_contact && (
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">External contact:</span>{" "}
              {offer.property.external_contact}
            </p>
          )}
          {!offer.property?.external_contact && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
              No external contact set — add one in the property edit form.
            </p>
          )}
        </section>

        {/* Applicant */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900/40">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Applicant
          </h2>
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            {offer.initiator.display_name}
          </p>
          {offer.initiator.email && (
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
              {offer.initiator.email}
            </p>
          )}
          {offer.initiator.phone_number && (
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
              {offer.initiator.phone_number}
            </p>
          )}
        </section>

        {/* Offer terms */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900/40">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Offer terms
            </h2>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColor(offer.offer_status)}`}
            >
              {offer.offer_status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Rent</p>
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
                <p className="text-xs text-gray-500 dark:text-gray-400">Move-in date</p>
                <p className="mt-0.5 font-semibold text-gray-900 dark:text-white">
                  {new Date(offer.move_in_date).toLocaleDateString()}
                </p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Submitted</p>
              <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">
                {new Date(offer.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Right: outreach actions — 2 cols */}
      <div className="lg:col-span-2">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Quick actions
        </h2>
        <OutreachActions
          propertyUuid={offer.property_uuid}
          externalContact={offer.property?.external_contact ?? null}
        />
      </div>
    </div>
  );
}
