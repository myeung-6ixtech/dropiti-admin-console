"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { AdminOfferRow } from "@/components/admin/AdminIncomingOffers";
import { AdminOfferDetailPanel } from "@/components/admin/AdminOfferDetailPanel";

export default function IncomingOfferDetailPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const params = useParams();
  const offerId = params?.id != null ? String(params.id) : null;

  const [offer, setOffer] = useState<AdminOfferRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOffer = useCallback(async () => {
    if (!offerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/offers/incoming/${encodeURIComponent(offerId)}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Failed to load offer");
        setOffer(null);
        return;
      }
      setOffer(json.data as AdminOfferRow);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch offer");
      setOffer(null);
    } finally {
      setLoading(false);
    }
  }, [offerId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      void fetchOffer();
    }
  }, [authLoading, isAuthenticated, fetchOffer]);

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-2 md:p-0">
      <div className="mb-6">
        <Link
          href="/dashboard/incoming-offers"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Incoming offers
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Offer details</h1>
        {offer && (
          <p className="mt-1 font-mono text-xs text-gray-400">
            #{offer.id} · {offer.offer_key}
          </p>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="mb-3 h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading offer…</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <p className="font-medium text-red-700 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => void fetchOffer()}
            className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && offer && <AdminOfferDetailPanel offer={offer} />}
    </div>
  );
}
