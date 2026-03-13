"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, UserIcon } from "@/icons";

/** User row from GET /api/v1/users */
interface AppUser {
  id: string | number;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  avatar?: string | null;
  address?: Record<string, unknown> | string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface UsersListResponse {
  success: boolean;
  data?: AppUser[];
  pagination?: { total: number; limit: number; offset: number; hasMore: boolean };
  error?: string;
}

function formatLocation(address: AppUser["address"]): string {
  if (!address) return "—";
  if (typeof address === "string") return address;
  if (typeof address !== "object") return "—";
  const parts = [
    (address as Record<string, unknown>).city,
    (address as Record<string, unknown>).state,
    (address as Record<string, unknown>).country,
    (address as Record<string, unknown>).country_code,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

function getDisplayName(user: AppUser): string {
  const name = user.name?.trim();
  if (name) return name;
  if (user.email) return user.email;
  return "N/A";
}

export default function AppCustomersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/v1/users?limit=50&offset=0&role=user", {
        credentials: "include",
      });
      const json: UsersListResponse = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to fetch users");
        setUsers([]);
        setTotal(0);
        return;
      }

      setUsers(json.data ?? []);
      setTotal(json.pagination?.total ?? (json.data ?? []).length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading app customers...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          App Customers
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Users that exist in the application
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserIcon />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                App Customers ({total})
              </h2>
            </div>
          </div>
        </div>

        {users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr
                    key={String(user.id)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-brand-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {getDisplayName(user).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getDisplayName(user)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email ?? "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div>{user.email ?? "—"}</div>
                        {user.phone && (
                          <div className="text-gray-500 dark:text-gray-400">
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatLocation(user.address)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/user-management/edit/${user.id}`
                            )
                          }
                          className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300"
                          title="View / Edit user"
                        >
                          <PencilIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <UserIcon />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No app customers
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Users from the application will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
