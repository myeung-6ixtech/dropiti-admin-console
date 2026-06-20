"use client";

import React, { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import { adminRoutes } from "@/lib/admin-routes";

type QualityStats = {
  total: number;
  published: number;
  missingCoordinates: number;
  publishedMissingCoordinates: number;
  geocodeEligibleSample: number;
  missingDistrictSample: number;
};

type BackfillSummary = {
  total: number;
  updated: number;
  skipped: number;
  byTier: Record<string, number>;
  mode: string;
};

export default function DataQualityPage() {
  const [stats, setStats] = useState<QualityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<"centroid" | "geocode" | null>(null);
  const [lastBackfill, setLastBackfill] = useState<BackfillSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { adminFetch } = await import("@/lib/admin-api");
      const result = await adminFetch<QualityStats>(
        adminRoutes.propertiesCoordinateQuality(),
      );
      if (!result.ok || !result.data) {
        throw new Error(result.error || "Failed to load stats");
      }
      setStats(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const runBackfill = async (mode: "centroid" | "geocode") => {
    setRunning(mode);
    setError(null);
    try {
      const { adminFetch } = await import("@/lib/admin-api");
      const path = `${adminRoutes.propertiesBackfillCoordinates()}?mode=${mode === "geocode" ? "geocode" : "centroid"}`;
      const result = await adminFetch<BackfillSummary>(path, { method: "POST" });
      if (!result.ok || !result.data) {
        throw new Error(result.error || "Backfill failed");
      }
      setLastBackfill(result.data);
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backfill failed");
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Map data quality
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Coordinate backfill and quality metrics for property listings.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading stats…</p>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {[
            { label: "Total listings", value: stats.total },
            { label: "Published", value: stats.published },
            { label: "Missing coordinates", value: stats.missingCoordinates },
            {
              label: "Published missing coords",
              value: stats.publishedMissingCoordinates,
            },
            {
              label: "Geocode-eligible (sample)",
              value: stats.geocodeEligibleSample,
            },
            { label: "Missing district (sample)", value: stats.missingDistrictSample },
          ].map((row) => (
            <div
              key={row.label}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">{row.label}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {row.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 mb-8">
        <Button
          onClick={() => runBackfill("centroid")}
          disabled={running !== null}
        >
          {running === "centroid" ? "Running…" : "Fill district pins"}
        </Button>
        <Button
          variant="outline"
          onClick={() => runBackfill("geocode")}
          disabled={running !== null}
        >
          {running === "geocode" ? "Running…" : "Geocode street addresses"}
        </Button>
        <Button variant="outline" onClick={loadStats} disabled={loading}>
          Refresh stats
        </Button>
      </div>

      {lastBackfill && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Last backfill ({lastBackfill.mode})
          </h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-500">Updated</dt>
            <dd>{lastBackfill.updated}</dd>
            <dt className="text-gray-500">Skipped</dt>
            <dd>{lastBackfill.skipped}</dd>
            <dt className="text-gray-500">Remaining (start)</dt>
            <dd>{lastBackfill.total}</dd>
          </dl>
          <pre className="mt-3 text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-x-auto">
            {JSON.stringify(lastBackfill.byTier, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
