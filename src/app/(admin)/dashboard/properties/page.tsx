"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, PencilIcon } from "@/icons";

/** Shape returned by GET /api/v1/properties/get-listings (API guide format) */
interface PropertyListing {
  id: string;
  property_uuid: string;
  title: string;
  description: string;
  price: number;
  priceCurrency?: string;
  bedrooms?: number;
  bathrooms?: number;
  imageUrl?: string;
}

const PropertiesPage: React.FC = () => {
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/v1/properties/get-listings?limit=50&offset=0", {
          credentials: "include",
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error || "Failed to load properties");
          setProperties([]);
          return;
        }

        setProperties(Array.isArray(json.data) ? json.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch properties");
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Properties
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and view all real estate properties
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/properties/add")}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Property
        </button>
      </div>

      {properties.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-4 text-6xl">🏠</div>
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
            No properties found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            There are no properties available at the moment.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full rounded-lg bg-white shadow-md dark:bg-gray-800">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr
                  key={property.id}
                  className="border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {property.title}
                  </td>
                  <td className="max-w-xs truncate whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {property.description || (
                      <span className="italic text-gray-400">No description</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-green-700 dark:text-green-400">
                    {property.price != null ? (
                      <span>
                        {property.priceCurrency || "HKD"}
                        {property.price.toLocaleString()}
                      </span>
                    ) : (
                      <span className="italic text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/properties/${property.property_uuid || property.id}`
                          )
                        }
                        className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300"
                        title="View property details"
                      >
                        <EyeIcon />
                      </button>
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/properties/edit/${property.property_uuid || property.id}`
                          )
                        }
                        className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300"
                        title="Edit property"
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
      )}
    </div>
  );
};

export default PropertiesPage;
