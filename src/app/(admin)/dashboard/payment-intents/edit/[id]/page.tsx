"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, DollarLineIcon, UserIcon } from "@/icons";
import type { PaymentIntentDetail, Customer } from "@/types";
import CustomerInfo from "@/components/CustomerInfo";

interface CustomerOption {
  value: string;
  label: string;
}

export default function EditPaymentIntent() {
  const params = useParams();
  const router = useRouter();
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentDetail | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customer_id: "",
    merchant_order_id: "",
    descriptor: "",
    metadata: {} as Record<string, any>,
  });

  const paymentIntentId = params.id as string;

  useEffect(() => {
    if (paymentIntentId) {
      fetchPaymentIntent();
      fetchCustomers();
    }
  }, [paymentIntentId]);

  const fetchPaymentIntent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payments?id=${paymentIntentId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch payment intent");
      }
      
      const data = await response.json();
      setPaymentIntent(data);
      
      // Populate form data
      setFormData({
        customer_id: data.customer_id || "",
        merchant_order_id: data.merchant_order_id || "",
        descriptor: data.descriptor || "",
        metadata: data.metadata || {},
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customer");
      
      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }
      
      const data = await response.json();
      setCustomers(data.items || []);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updatePayload: any = {};

      // Add fields if they have values
      if (formData.customer_id) {
        updatePayload.customer_id = formData.customer_id;
      }
      if (formData.merchant_order_id) {
        updatePayload.merchant_order_id = formData.merchant_order_id;
      }
      if (formData.descriptor) {
        updatePayload.descriptor = formData.descriptor;
      }
      if (Object.keys(formData.metadata).length > 0) {
        updatePayload.metadata = formData.metadata;
      }

      const response = await fetch(`/api/payments?id=${paymentIntentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update payment intent");
      }

      // Redirect to payment intent detail page
      router.push(`/dashboard/payment-intents/${paymentIntentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update payment intent");
    } finally {
      setSaving(false);
    }
  };

  const getCustomerOptions = (): CustomerOption[] => {
    return customers.map(customer => ({
      value: customer.id,
      label: `${customer.first_name} ${customer.last_name} (${customer.email})`
    }));
  };

  const getSelectedCustomer = () => {
    if (!formData.customer_id) return null;
    return customers.find(customer => customer.id === formData.customer_id);
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading payment intent...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !paymentIntent) {
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

  if (!paymentIntent) {
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
        <div className="text-center py-12">
          <DollarLineIcon />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Payment intent not found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The payment intent you're looking for doesn't exist.
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
          Back
        </Button>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Edit Payment Intent
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update payment intent information
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <DollarLineIcon />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Payment Intent Information
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Intent ID (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Intent ID
                </label>
                <input
                  type="text"
                  value={paymentIntent.id}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                />
              </div>

              {/* Amount and Currency (Read-only) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount
                  </label>
                  <input
                    type="text"
                    value={formatAmount(paymentIntent.amount, paymentIntent.currency)}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={paymentIntent.currency}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  />
                </div>
              </div>

              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer
                </label>
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="">Select a customer</option>
                  {getCustomerOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Merchant Order ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Merchant Order ID
                </label>
                <input
                  type="text"
                  name="merchant_order_id"
                  value={formData.merchant_order_id}
                  onChange={handleInputChange}
                  placeholder="Enter merchant order ID"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              {/* Descriptor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descriptor
                </label>
                <input
                  type="text"
                  name="descriptor"
                  value={formData.descriptor}
                  onChange={handleInputChange}
                  placeholder="Enter payment descriptor"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

                             {/* Submit Button */}
               <div className="flex gap-3 pt-4">
                 <Button
                   disabled={saving}
                 >
                   {saving ? "Saving..." : "Save Changes"}
                 </Button>
                 <Button
                   variant="outline"
                   onClick={() => router.back()}
                 >
                   Cancel
                 </Button>
               </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarLineIcon />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Current Status
              </h2>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {paymentIntent.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Capture Method</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1 capitalize">
                  {paymentIntent.capture_method}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Confirmation Method</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1 capitalize">
                  {paymentIntent.confirmation_method}
                </p>
              </div>
            </div>
          </div>

          {/* Current Customer */}
          <CustomerInfo customer={getSelectedCustomer() || null} title="Current Customer" />
        </div>
      </div>
    </div>
  );
}
