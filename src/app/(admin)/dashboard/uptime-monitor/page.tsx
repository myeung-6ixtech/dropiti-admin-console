"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProbeResult } from "@/lib/uptime-probes";
import Button from "@/components/ui/button/Button";

type UptimeReport = {
  checkedAt: string;
  probes: ProbeResult[];
};

const STATUS_STYLES: Record<ProbeResult["status"], string> = {
  up: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  degraded: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  down: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const SIDE_LABELS: Record<ProbeResult["side"], string> = {
  platform: "Platform",
  admin: "Admin",
  client: "Client",
};

export default function UptimeMonitorPage() {
  const [report, setReport] = useState<UptimeReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runChecks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/health/uptime", { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Health check failed (HTTP ${res.status})`);
      }
      const data = (await res.json()) as UptimeReport;
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run health checks");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void runChecks();
    const interval = setInterval(() => void runChecks(), 60_000);
    return () => clearInterval(interval);
  }, [runChecks]);

  const grouped = report?.probes.reduce(
    (acc, probe) => {
      if (!acc[probe.side]) acc[probe.side] = [];
      acc[probe.side].push(probe);
      return acc;
    },
    {} as Record<string, ProbeResult[]>
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Health</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Live health of Nhost Functions — admin (via BFF) and client endpoints.
          </p>
          {report?.checkedAt && (
            <p className="mt-2 text-xs text-gray-400">
              Last checked: {new Date(report.checkedAt).toLocaleString()}
            </p>
          )}
        </div>
        <Button onClick={() => void runChecks()} disabled={loading} size="sm">
          {loading ? "Checking…" : "Run checks"}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {grouped &&
        (["platform", "admin", "client"] as const).map((side) => {
          const probes = grouped[side];
          if (!probes?.length) return null;
          return (
            <section key={side} className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                {SIDE_LABELS[side]} endpoints
              </h2>
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        Endpoint
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        Latency
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        HTTP
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                    {probes.map((probe) => (
                      <tr key={probe.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {probe.label}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[probe.status]}`}
                          >
                            {probe.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {probe.latencyMs} ms
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {probe.httpStatus ?? "—"}
                        </td>
                        <td className="max-w-xs truncate px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                          {probe.error ?? "OK"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
    </div>
  );
}
