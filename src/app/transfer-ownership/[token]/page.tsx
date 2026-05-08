"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type PageState =
  | "loading"
  | "invalid"
  | "expired"
  | "used"
  | "cancelled"
  | "unauthenticated"
  | "ready_to_claim"
  | "claiming"
  | "claimed";

type PropertyCard = {
  property_uuid: string;
  title: string | null;
  description: string | null;
  property_type: string | null;
  address: Record<string, unknown> | null;
  num_bedroom: number | null;
  num_bathroom: number | null;
  rental_price: number | null;
  rental_price_currency: string | null;
  display_image: string | null;
};

// ─── Property card UI ─────────────────────────────────────────────────────────

function PropertySummary({ property }: { property: PropertyCard }) {
  const addr = property.address as {
    street?: string;
    district?: string;
    country?: string;
  } | null;
  const addressLine = [addr?.street, addr?.district, addr?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {property.display_image && (
        <img
          src={property.display_image}
          alt={property.title ?? "Property"}
          className="h-48 w-full object-cover"
        />
      )}
      <div className="p-5">
        <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
          {property.title ?? "Untitled listing"}
        </h2>
        {addressLine && (
          <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">{addressLine}</p>
        )}
        <div className="flex flex-wrap gap-3 text-sm text-gray-700 dark:text-gray-300">
          {property.num_bedroom != null && (
            <span>{property.num_bedroom} bed{property.num_bedroom !== 1 ? "s" : ""}</span>
          )}
          {property.num_bathroom != null && (
            <span>{property.num_bathroom} bath{property.num_bathroom !== 1 ? "s" : ""}</span>
          )}
          {property.rental_price != null && (
            <span>
              {property.rental_price_currency ?? "HKD"}{" "}
              {property.rental_price.toLocaleString()} / mo
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TransferOwnershipPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [property, setProperty] = useState<PropertyCard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(async () => {
    setPageState("loading");
    try {
      const res = await fetch(
        `/api/v1/transfer-ownership/validate?token=${encodeURIComponent(token)}`
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        setPageState("invalid");
        return;
      }

      const { tokenStatus, property: prop } = json.data as {
        tokenStatus: string;
        property?: PropertyCard;
      };

      if (prop) setProperty(prop);

      if (tokenStatus === "invalid") {
        setPageState("invalid");
      } else if (tokenStatus === "expired") {
        setPageState("expired");
      } else if (tokenStatus === "used" || tokenStatus === "cancelled") {
        setPageState("used");
      } else if (tokenStatus === "valid") {
        if (!isAuthenticated) {
          setPageState("unauthenticated");
        } else {
          setPageState("ready_to_claim");
        }
      } else {
        setPageState("invalid");
      }
    } catch {
      setPageState("invalid");
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    validate();
  }, [authLoading, validate]);

  const handleClaim = async () => {
    if (!user?.id) return;
    setPageState("claiming");
    setError(null);
    try {
      const res = await fetch("/api/v1/transfer-ownership/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, userId: user.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Failed to claim property. Please try again.");
        setPageState("ready_to_claim");
        return;
      }
      setPageState("claimed");
      setTimeout(() => router.push("/dashboard/properties"), 3000);
    } catch {
      setError("Network error. Please try again.");
      setPageState("ready_to_claim");
    }
  };

  const callbackUrl = `/transfer-ownership/${token}`;

  // ─── Render states ──────────────────────────────────────────────────────────

  if (pageState === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        <p className="text-gray-600 dark:text-gray-400">Validating your invitation…</p>
      </div>
    );
  }

  if (pageState === "invalid") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <p className="text-lg font-semibold text-red-800 dark:text-red-200">
          This invitation link is not valid.
        </p>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          It may have already been used, or the link is incorrect. Please contact your property manager.
        </p>
      </div>
    );
  }

  if (pageState === "expired") {
    return (
      <div className="space-y-4">
        {property && <PropertySummary property={property} />}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-700 dark:bg-amber-900/20">
          <p className="font-semibold text-amber-800 dark:text-amber-200">Invitation expired</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            This invitation has expired. Please contact your property manager to receive a new one.
          </p>
        </div>
      </div>
    );
  }

  if (pageState === "used") {
    return (
      <div className="space-y-4">
        {property && <PropertySummary property={property} />}
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="font-semibold text-gray-900 dark:text-white">
            This property has already been claimed.
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            If you believe this is an error, please contact your property manager.
          </p>
        </div>
      </div>
    );
  }

  if (pageState === "unauthenticated") {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="font-semibold text-blue-900 dark:text-blue-100">
            You have been invited to claim a property listing
          </p>
          <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
            Create an account or sign in to continue and claim ownership of this unit.
          </p>
        </div>
        {property && <PropertySummary property={property} />}
        <div className="flex flex-col gap-3">
          <a
            href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Create Account
          </a>
          <a
            href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (pageState === "ready_to_claim" || pageState === "claiming") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Claim this property
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            You are signed in as <strong>{user?.email}</strong>. Click below to transfer this listing to your account.
          </p>
        </div>
        {property && <PropertySummary property={property} />}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={() => void handleClaim()}
          disabled={pageState === "claiming"}
          className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {pageState === "claiming" ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              Claiming…
            </>
          ) : (
            "Claim This Property"
          )}
        </button>
      </div>
    );
  }

  if (pageState === "claimed") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-700 dark:bg-emerald-900/20">
        <div className="mb-3 text-4xl">🎉</div>
        <p className="text-lg font-semibold text-emerald-800 dark:text-emerald-100">
          Property claimed successfully!
        </p>
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
          Redirecting you to your properties dashboard…
        </p>
      </div>
    );
  }

  return null;
}
