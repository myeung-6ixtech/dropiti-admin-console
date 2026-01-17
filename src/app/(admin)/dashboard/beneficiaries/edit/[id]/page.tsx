"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, UserIcon, DollarLineIcon, MailIcon, BoxIcon } from "@/icons";
import { Beneficiary } from "@/types";

export default function EditBeneficiary() {
  const params = useParams();
  const router = useRouter();
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    company_name: "",
    entity_type: "PERSONAL",
    account_name: "",
    account_number: "",
    account_currency: "",
    bank_country_code: "",
    bank_name: "",
    swift_code: "",
    iban: "",
    personal_email: "",
    personal_mobile_number: "",
    street_address: "",
    city: "",
    state: "",
    postcode: "",
    country_code: "",
    payment_methods: [] as string[],
  });

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
      
      // Populate form data
      setFormData({
        first_name: data.beneficiary.first_name || "",
        last_name: data.beneficiary.last_name || "",
        company_name: data.beneficiary.company_name || "",
        entity_type: data.beneficiary.entity_type || "PERSONAL",
        account_name: data.beneficiary.bank_details.account_name || "",
        account_number: data.beneficiary.bank_details.account_number || "",
        account_currency: data.beneficiary.bank_details.account_currency || "",
        bank_country_code: data.beneficiary.bank_details.bank_country_code || "",
        bank_name: data.beneficiary.bank_details.bank_name || "",
        swift_code: data.beneficiary.bank_details.swift_code || "",
        iban: data.beneficiary.bank_details.iban || "",
        personal_email: data.beneficiary.additional_info?.personal_email || "",
        personal_mobile_number: data.beneficiary.additional_info?.personal_mobile_number || "",
        street_address: data.beneficiary.address?.street_address || "",
        city: data.beneficiary.address?.city || "",
        state: data.beneficiary.address?.state || "",
        postcode: data.beneficiary.address?.postcode || "",
        country_code: data.beneficiary.address?.country_code || "",
        payment_methods: data.payment_methods || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentMethodChange = (method: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      payment_methods: checked 
        ? [...prev.payment_methods, method]
        : prev.payment_methods.filter(m => m !== method)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Prepare update payload
      const updatePayload: Record<string, unknown> = {
        beneficiary: {
          entity_type: formData.entity_type,
          bank_details: {
            account_name: formData.account_name,
            account_currency: formData.account_currency,
            bank_country_code: formData.bank_country_code,
          }
        },
        payment_methods: formData.payment_methods
      };

      // Add entity-specific fields
      if (formData.entity_type === "PERSONAL") {
        updatePayload.beneficiary.first_name = formData.first_name;
        updatePayload.beneficiary.last_name = formData.last_name;
      } else {
        updatePayload.beneficiary.company_name = formData.company_name;
      }

      // Add optional bank details
      if (formData.account_number) {
        updatePayload.beneficiary.bank_details.account_number = formData.account_number;
      }
      if (formData.bank_name) {
        updatePayload.beneficiary.bank_details.bank_name = formData.bank_name;
      }
      if (formData.swift_code) {
        updatePayload.beneficiary.bank_details.swift_code = formData.swift_code;
      }
      if (formData.iban) {
        updatePayload.beneficiary.bank_details.iban = formData.iban;
      }

      // Add address if provided
      if (formData.street_address || formData.city) {
        updatePayload.beneficiary.address = {};
        if (formData.street_address) updatePayload.beneficiary.address.street_address = formData.street_address;
        if (formData.city) updatePayload.beneficiary.address.city = formData.city;
        if (formData.state) updatePayload.beneficiary.address.state = formData.state;
        if (formData.postcode) updatePayload.beneficiary.address.postcode = formData.postcode;
        if (formData.country_code) updatePayload.beneficiary.address.country_code = formData.country_code;
      }

      // Add additional info if provided
      if (formData.personal_email || formData.personal_mobile_number) {
        updatePayload.beneficiary.additional_info = {};
        if (formData.personal_email) updatePayload.beneficiary.additional_info.personal_email = formData.personal_email;
        if (formData.personal_mobile_number) updatePayload.beneficiary.additional_info.personal_mobile_number = formData.personal_mobile_number;
      }

      const response = await fetch(`/api/beneficiaries?id=${beneficiaryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update beneficiary");
      }

      // Redirect to beneficiary detail page
      router.push(`/dashboard/beneficiaries/${beneficiaryId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update beneficiary");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading beneficiary...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !beneficiary) {
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
            Back
          </Button>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
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
          Back
        </Button>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Edit Beneficiary
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update beneficiary information
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Entity Type
              </label>
              <select
                name="entity_type"
                value={formData.entity_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="PERSONAL">Personal</option>
                <option value="COMPANY">Company</option>
              </select>
            </div>
            
            {formData.entity_type === "PERSONAL" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </>
            ) : (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            )}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Name *
              </label>
              <input
                type="text"
                name="account_name"
                value={formData.account_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Number
              </label>
              <input
                type="text"
                name="account_number"
                value={formData.account_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Currency *
              </label>
              <input
                type="text"
                name="account_currency"
                value={formData.account_currency}
                onChange={handleInputChange}
                required
                placeholder="USD, EUR, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bank Country Code *
              </label>
              <input
                type="text"
                name="bank_country_code"
                value={formData.bank_country_code}
                onChange={handleInputChange}
                required
                placeholder="US, GB, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SWIFT Code
              </label>
              <input
                type="text"
                name="swift_code"
                value={formData.swift_code}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                IBAN
              </label>
              <input
                type="text"
                name="iban"
                value={formData.iban}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <MailIcon />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Contact Information
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                name="personal_email"
                value={formData.personal_email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                name="personal_mobile_number"
                value={formData.personal_mobile_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <MailIcon />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Address Information
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Street Address
              </label>
              <input
                type="text"
                name="street_address"
                value={formData.street_address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Postcode
              </label>
              <input
                type="text"
                name="postcode"
                value={formData.postcode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Country Code
              </label>
              <input
                type="text"
                name="country_code"
                value={formData.country_code}
                onChange={handleInputChange}
                placeholder="US, GB, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <BoxIcon />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Payment Methods
            </h2>
          </div>
          
          <div className="space-y-3">
            {["LOCAL", "SWIFT"].map((method) => (
              <label key={method} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.payment_methods.includes(method)}
                  onChange={(e) => handlePaymentMethodChange(method, e.target.checked)}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {method}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center font-medium gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
