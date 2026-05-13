"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

export type AdminOfferRow = {
  id: number;
  offer_key: string;
  property_uuid: string;
  initiator_user_id: string;
  recipient_user_id: string;
  proposing_rent_price: number;
  proposing_rent_price_currency: string;
  num_leasing_months: number;
  payment_frequency: string;
  move_in_date: string | null;
  offer_status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  property: {
    id: number | string;
    property_uuid: string;
    title: string;
    external_contact: string | null;
    rental_price: number | null;
  } | null;
  initiator: {
    display_name: string;
    phone_number: string | null;
    email: string | null;
  };
};

function OfferStatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    pending:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    accepted:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    rejected:
      "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    withdrawn:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        classes[status] ??
        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      }`}
    >
      {status}
    </span>
  );
}

type Props = {
  propertyUuid?: string;
  statusFilter?: string;
  title?: string;
};

export function AdminIncomingOffers({ propertyUuid, statusFilter, title }: Props) {
  const [offers, setOffers] = useState<AdminOfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  } | null>(null);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50", offset: "0" });
      if (propertyUuid) params.set("propertyUuid", propertyUuid);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/v1/admin/offers/incoming?${params.toString()}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Failed to load incoming offers");
        setOffers([]);
        return;
      }
      setOffers(Array.isArray(json.data) ? (json.data as AdminOfferRow[]) : []);
      setPagination(json.pagination ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch offers");
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, [propertyUuid, statusFilter]);

  useEffect(() => {
    void fetchOffers();
  }, [fetchOffers]);

  const empty = useMemo(
    () => !loading && offers.length === 0 && !error,
    [loading, offers.length, error]
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        {title && (
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
        )}
        {pagination && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {pagination.total} offer{pagination.total === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-3 h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading offers…</p>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => void fetchOffers()}
            className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {empty && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900/40">
          <p className="font-medium text-gray-900 dark:text-white">No incoming offers</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Offers where <code className="text-xs">recipient_user_id</code> is your admin user or
            an id in{" "}
            <code className="text-xs">DROPITI_PLATFORM_LANDLORD_USER_IDS</code> appear here.
          </p>
        </div>
      )}

      {!loading && !error && offers.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900/30">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/70">
              <tr>
                {[
                  "Property",
                  "Applicant",
                  "Offer",
                  "Status",
                  "Ext. contact",
                  "Submitted",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {offers.map((offer) => (
                <tr
                  key={offer.id}
                  className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                >
                  <td className="px-4 py-3 align-middle">
                    <p className="max-w-[180px] truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {offer.property?.title || "—"}
                    </p>
                    {offer.property?.property_uuid && (
                      <p className="mt-0.5 max-w-[180px] truncate font-mono text-[10px] text-gray-400">
                        {offer.property.property_uuid}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {offer.initiator.display_name}
                    </p>
                    {offer.initiator.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {offer.initiator.email}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 align-middle">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {offer.proposing_rent_price_currency}{" "}
                      {offer.proposing_rent_price.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {offer.num_leasing_months} mo · {offer.payment_frequency}
                    </p>
                    {offer.move_in_date && (
                      <p className="text-xs text-gray-400">
                        {new Date(offer.move_in_date).toLocaleDateString()}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <OfferStatusBadge status={offer.offer_status} />
                  </td>
                  <td className="px-4 py-3 align-middle">
                    {offer.property?.external_contact ? (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {offer.property.external_contact}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        Not set
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 align-middle text-xs text-gray-500 dark:text-gray-400">
                    {new Date(offer.created_at).toLocaleDateString()}
                    <br />
                    <span className="text-gray-400">
                      {new Date(offer.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <Link
                      href={`/dashboard/incoming-offers/${offer.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      View
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
