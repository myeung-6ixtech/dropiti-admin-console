"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { useEffect, useState } from "react";

export type AdminDashboardKpis = {
  users: number;
  properties: number;
  activeOffers: number;
  pendingOffers: number;
  draftProperties: number;
};

export default function Dashboard() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [kpis, setKpis] = useState<AdminDashboardKpis | null>(null);
  const [kpisError, setKpisError] = useState<string | null>(null);
  const [kpisLoading, setKpisLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    const loadKpis = async () => {
      setKpisLoading(true);
      setKpisError(null);
      try {
        const { adminFetch } = await import("@/lib/admin-api");
        const { adminRoutes } = await import("@/lib/admin-routes");
        const result = await adminFetch<AdminDashboardKpis>(adminRoutes.analyticsDashboard());
        if (!result.ok || !result.data) {
          setKpisError(result.error ?? "Failed to load dashboard stats");
          setKpis(null);
          return;
        }
        setKpis(result.data);
      } catch (e) {
        setKpisError(e instanceof Error ? e.message : "Failed to load dashboard stats");
        setKpis(null);
      } finally {
        setKpisLoading(false);
      }
    };

    void loadKpis();
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome, Super Admin!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                You are logged in as the system administrator
              </p>
            </div>
            <Button onClick={logout} variant="outline" size="sm">
              Logout
            </Button>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Platform overview
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              From <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">GET /v1/admin/analytics/dashboard</code>{" "}
              (api-doc-v1 §11)
            </p>
            {kpisLoading && (
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading stats…</p>
            )}
            {kpisError && (
              <p className="text-sm text-amber-700 dark:text-amber-300">{kpisError}</p>
            )}
            {kpis && !kpisLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {[
                  { label: "Users", value: kpis.users },
                  { label: "Properties", value: kpis.properties },
                  { label: "Active offers", value: kpis.activeOffers },
                  { label: "Pending offers", value: kpis.pendingOffers },
                  { label: "Draft listings", value: kpis.draftProperties },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700/50"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {card.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                      {card.value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                User Information
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white">{user?.email}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Role:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {user?.role === "super_admin"
                      ? "Super Administrator"
                      : user?.role === "system_admin"
                        ? "System Administrator"
                        : user?.role === "user_admin"
                          ? "User Administrator"
                          : user?.role === "content_admin"
                            ? "Content Administrator"
                            : user?.role === "analytics_admin"
                              ? "Analytics Administrator"
                              : user?.role === "support_admin"
                                ? "Support Administrator"
                                : user?.role === "viewer"
                                  ? "Viewer"
                                  : user?.role || "No role assigned"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button
                  onClick={() => router.push("/customers")}
                  size="sm"
                  className="w-full justify-start"
                >
                  Manage Customers
                </Button>
                <Button
                  onClick={() => router.push("/payments")}
                  size="sm"
                  className="w-full justify-start"
                >
                  View Payments
                </Button>
                <Button
                  onClick={() => router.push("/transfers")}
                  size="sm"
                  className="w-full justify-start"
                >
                  Manage Transfers
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-brand-50 dark:bg-brand-500/10 rounded-lg">
            <h3 className="text-lg font-semibold text-brand-900 dark:text-brand-100 mb-2">
              System Status
            </h3>
            <p className="text-brand-700 dark:text-brand-300">
              Authentication system is working correctly. You have full access to the admin console.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
