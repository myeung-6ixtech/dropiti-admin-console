"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, UserIcon, MailIcon } from "@/icons";

interface AppUserDetail {
  id: string;
  uuid?: string | null;
  email?: string | null;
  name?: string | null;
  default_role?: string | null;
  avatar?: string | null;
  phone?: string | null;
  address?: Record<string, unknown> | string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

function formatAddress(address: AppUserDetail["address"]): string {
  if (!address) return "—";
  if (typeof address === "string") return address;
  if (typeof address !== "object") return "—";
  const a = address as Record<string, unknown>;
  const parts = [
    a.city,
    a.state,
    a.country,
    a.country_code,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

export default function AppCustomerEditPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<AppUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/v1/users/get-app-user?id=${encodeURIComponent(userId)}`,
        { credentials: "include" }
      );
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Failed to fetch user");
      }
      setUser(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading app customer...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/dashboard/app-customers")}
            className="mb-4"
          >
            <ChevronLeftIcon />
            Back to App Customers
          </Button>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/dashboard/app-customers")}
            className="mb-4"
          >
            <ChevronLeftIcon />
            Back to App Customers
          </Button>
        </div>
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            App customer not found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The user you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  const displayName = user.name?.trim() || user.email || "—";

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push("/dashboard/app-customers")}
          className="mb-4"
        >
          <ChevronLeftIcon />
          Back to App Customers
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            App Customer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View app customer details
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <UserIcon />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Basic Information
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Name
              </label>
              <p className="text-gray-900 dark:text-white">
                {displayName}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Email
              </label>
              <p className="text-gray-900 dark:text-white">
                {user.email ?? "—"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Phone
              </label>
              <p className="text-gray-900 dark:text-white">
                {user.phone ?? "—"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Profile Image
              </label>
              <div className="mt-1">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={displayName}
                    className="h-20 w-20 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                    width={80}
                    height={80}
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                    <UserIcon className="w-10 h-10 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Location / Address
              </label>
              <p className="text-gray-900 dark:text-white">
                {formatAddress(user.address)}
              </p>
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <MailIcon />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Account
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Role
              </label>
              <p className="text-gray-900 dark:text-white">
                {user.default_role ?? "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Metadata
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Created at
              </label>
              <p className="text-gray-900 dark:text-white">
                {user.created_at
                  ? new Date(user.created_at).toLocaleString()
                  : "—"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Updated at
              </label>
              <p className="text-gray-900 dark:text-white">
                {user.updated_at
                  ? new Date(user.updated_at).toLocaleString()
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
