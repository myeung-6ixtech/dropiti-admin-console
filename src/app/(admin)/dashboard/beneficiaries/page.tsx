"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { PencilIcon, TrashBinIcon, UserIcon, PlusIcon } from "@/icons";
import { Beneficiary, BeneficiariesResponse } from "@/types";

export default function Beneficiaries() {
  const router = useRouter();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const fetchBeneficiaries = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/beneficiaries");
      
      if (!response.ok) {
        throw new Error("Failed to fetch beneficiaries");
      }
      
      const data: BeneficiariesResponse = await response.json();
      setBeneficiaries(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBeneficiary = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedBeneficiary) return;

    try {
      const response = await fetch(`/api/beneficiaries?id=${selectedBeneficiary.beneficiary_id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete beneficiary");
      }

      // Remove from local state
      setBeneficiaries(beneficiaries.filter(b => b.beneficiary_id !== selectedBeneficiary.beneficiary_id));
      setIsDeleteModalOpen(false);
      setSelectedBeneficiary(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete beneficiary");
    }
  };

  const getEntityName = (beneficiary: Beneficiary) => {
    if (beneficiary.beneficiary.entity_type === "COMPANY") {
      return beneficiary.beneficiary.company_name || "N/A";
    } else {
      const firstName = beneficiary.beneficiary.first_name || "";
      const lastName = beneficiary.beneficiary.last_name || "";
      return `${firstName} ${lastName}`.trim() || "N/A";
    }
  };

  const getEntityTypeBadge = (entityType: string) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        entityType === "COMPANY" 
          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
          : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      }`}>
        {entityType === "COMPANY" ? "Company" : "Personal"}
      </span>
    );
  };

  const getTransferMethodsBadge = (methods: string[]) => {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
        {methods.join(", ")}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading beneficiaries...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Beneficiaries
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your beneficiaries for international transfers
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
                Beneficiaries ({beneficiaries.length})
              </h2>
            </div>
            <Button size="sm">
              <PlusIcon />
              Add Beneficiary
            </Button>
          </div>
        </div>

        {beneficiaries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Beneficiary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Account Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Payment Methods
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {beneficiaries.map((beneficiary) => (
                  <tr key={beneficiary.beneficiary_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-brand-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {getEntityName(beneficiary).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {beneficiary.nickname || getEntityName(beneficiary)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {beneficiary.beneficiary.additional_info?.personal_mobile_number || "No phone"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getEntityTypeBadge(beneficiary.beneficiary.entity_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div className="font-medium">{beneficiary.beneficiary.bank_details.account_name}</div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {beneficiary.beneficiary.bank_details.account_number || "N/A"} • {beneficiary.beneficiary.bank_details.account_currency}
                        </div>
                        {beneficiary.beneficiary.bank_details.bank_name && (
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {beneficiary.beneficiary.bank_details.bank_name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTransferMethodsBadge(beneficiary.payment_methods)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/beneficiaries/${beneficiary.beneficiary_id}`)}
                          className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300"
                          title="View beneficiary details"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          onClick={() => handleDeleteBeneficiary(beneficiary)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete beneficiary"
                        >
                          <TrashBinIcon />
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
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No beneficiaries</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by adding your first beneficiary.
            </p>
            <div className="mt-6">
              <Button size="sm">
                <PlusIcon />
                Add Beneficiary
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedBeneficiary && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
                <TrashBinIcon />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">
                Delete Beneficiary
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to delete <strong>{selectedBeneficiary.nickname || getEntityName(selectedBeneficiary)}</strong>? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
