"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { PencilIcon, ChevronLeftIcon, UserIcon, BoxIcon, DollarLineIcon, MailIcon } from "@/icons";
import { Beneficiary } from "@/types";

export default function BeneficiaryDetail() {
  const params = useParams();
  const router = useRouter();
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const beneficiaryId = params.id as string;

  useEffect(() => {
    if (beneficiaryId) {
      fetchBeneficiary();
    }
  }, [beneficiaryId]);

  const fetchBeneficiary = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/beneficiaries?id=${beneficiaryId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch beneficiary");
      }
      
      const data = await response.json();
      setBeneficiary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
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

  const getPaymentMethodsBadge = (methods: string[]) => {
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
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading beneficiary details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ChevronLeftIcon />
            Back to Beneficiaries
          </Button>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!beneficiary) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ChevronLeftIcon />
            Back to Beneficiaries
          </Button>
        </div>
        <div className="text-center py-12">
          <UserIcon />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Beneficiary not found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The beneficiary you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ChevronLeftIcon />
          Back to Beneficiaries
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Beneficiary Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage beneficiary information
            </p>
          </div>
          <Button
            onClick={() => router.push(`/dashboard/beneficiaries/edit/${beneficiary.beneficiary_id}`)}
          >
            <PencilIcon />
            Edit Beneficiary
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
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
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {getEntityName(beneficiary)}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</label>
                <div className="mt-1">
                  {getEntityTypeBadge(beneficiary.beneficiary.entity_type)}
                </div>
              </div>
              
              {beneficiary.beneficiary.entity_type === "PERSONAL" && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">First Name</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {beneficiary.beneficiary.first_name || "N/A"}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Name</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {beneficiary.beneficiary.last_name || "N/A"}
                    </p>
                  </div>
                </>
              )}
              
              {beneficiary.beneficiary.entity_type === "COMPANY" && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Company Name</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {beneficiary.beneficiary.company_name || "N/A"}
                  </p>
                </div>
              )}
              
              {beneficiary.beneficiary.date_of_birth && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {new Date(beneficiary.beneficiary.date_of_birth).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Methods</label>
                <div className="mt-1">
                  {getPaymentMethodsBadge(beneficiary.payment_methods)}
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarLineIcon />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bank Details
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Name</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {beneficiary.beneficiary.bank_details.account_name}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Number</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {beneficiary.beneficiary.bank_details.account_number || "N/A"}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Currency</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {beneficiary.beneficiary.bank_details.account_currency}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Bank Country</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {beneficiary.beneficiary.bank_details.bank_country_code}
                </p>
              </div>
              
              {beneficiary.beneficiary.bank_details.bank_name && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Bank Name</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {beneficiary.beneficiary.bank_details.bank_name}
                  </p>
                </div>
              )}
              
              {beneficiary.beneficiary.bank_details.swift_code && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">SWIFT Code</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {beneficiary.beneficiary.bank_details.swift_code}
                  </p>
                </div>
              )}
              
              {beneficiary.beneficiary.bank_details.iban && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">IBAN</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {beneficiary.beneficiary.bank_details.iban}
                  </p>
                </div>
              )}
              
              {beneficiary.beneficiary.bank_details.local_clearing_system && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Clearing System</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {beneficiary.beneficiary.bank_details.local_clearing_system}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Address Information */}
          {beneficiary.beneficiary.address && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <MailIcon />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Address Information
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {beneficiary.beneficiary.address.street_address && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Street Address</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {beneficiary.beneficiary.address.street_address}
                    </p>
                  </div>
                )}
                
                {beneficiary.beneficiary.address.city && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">City</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {beneficiary.beneficiary.address.city}
                    </p>
                  </div>
                )}
                
                {beneficiary.beneficiary.address.state && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">State</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {beneficiary.beneficiary.address.state}
                    </p>
                  </div>
                )}
                
                {beneficiary.beneficiary.address.postcode && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Postcode</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {beneficiary.beneficiary.address.postcode}
                    </p>
                  </div>
                )}
                
                {beneficiary.beneficiary.address.country_code && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Country</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {beneficiary.beneficiary.address.country_code}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Information */}
          {beneficiary.beneficiary.additional_info && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <MailIcon />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Contact Information
                </h2>
              </div>
              
              <div className="space-y-4">
                {beneficiary.beneficiary.additional_info.personal_mobile_number && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Mobile Number</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {beneficiary.beneficiary.additional_info.personal_mobile_number}
                    </p>
                  </div>
                )}
                
                {beneficiary.beneficiary.additional_info.personal_email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {beneficiary.beneficiary.additional_info.personal_email}
                    </p>
                  </div>
                )}
                
                {beneficiary.beneficiary.additional_info.personal_id_number && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">ID Number</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {beneficiary.beneficiary.additional_info.personal_id_number}
                    </p>
                  </div>
                )}
                
                {beneficiary.beneficiary.additional_info.personal_id_type && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">ID Type</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {beneficiary.beneficiary.additional_info.personal_id_type}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* System Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <BoxIcon />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                System Information
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Beneficiary ID</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1 font-mono">
                  {beneficiary.beneficiary_id}
                </p>
              </div>
              
              {beneficiary.payer_entity_type && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Payer Entity Type</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {beneficiary.payer_entity_type}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
