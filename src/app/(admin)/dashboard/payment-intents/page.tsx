"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { PencilIcon, TrashBinIcon, DollarLineIcon, PlusIcon, EyeIcon } from "@/icons";
import { PaymentIntentDetail, PaymentIntentsResponse } from "@/types";

export default function PaymentIntents() {
  const router = useRouter();
  const [paymentIntents, setPaymentIntents] = useState<PaymentIntentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentIntent, setSelectedPaymentIntent] = useState<PaymentIntentDetail | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchPaymentIntents();
  }, []);

  const fetchPaymentIntents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/payments");
      
      if (!response.ok) {
        throw new Error("Failed to fetch payment intents");
      }
      
      const data: PaymentIntentsResponse = await response.json();
      setPaymentIntents(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaymentIntent = (paymentIntent: PaymentIntentDetail) => {
    setSelectedPaymentIntent(paymentIntent);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPaymentIntent) return;

    try {
      const response = await fetch(`/api/payments?id=${selectedPaymentIntent.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete payment intent");
      }

      // Remove from local state
      setPaymentIntents(paymentIntents.filter(p => p.id !== selectedPaymentIntent.id));
      setIsDeleteModalOpen(false);
      setSelectedPaymentIntent(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete payment intent");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      "requires_payment_method": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      "requires_confirmation": "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      "requires_action": "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
      "processing": "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      "requires_capture": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
      "canceled": "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      "succeeded": "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    };

    const colorClass = statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  const getCaptureMethodBadge = (method: string) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        method === "automatic" 
          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
          : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      }`}>
        {method === "automatic" ? "Auto" : "Manual"}
      </span>
    );
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100); // Assuming amount is in cents
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading payment intents...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Intents
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage payment intents and their status
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
              <DollarLineIcon />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Payment Intents ({paymentIntents.length})
              </h2>
            </div>
            <Button size="sm">
              <PlusIcon />
              Create Payment Intent
            </Button>
          </div>
        </div>

        {paymentIntents.length > 0 ? (
          <div className="overflow-x-auto max-w-full">
            <table className="min-w-[1200px] w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Payment Intent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Capture Method
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
                {paymentIntents.map((paymentIntent) => (
                  <tr key={paymentIntent.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                                                 <div className="flex-shrink-0 h-10 w-10">
                           <div className="h-10 w-10 rounded-full bg-brand-500 flex items-center justify-center">
                             <DollarLineIcon />
                           </div>
                         </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {paymentIntent.id}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {paymentIntent.merchant_order_id 
                              ? (paymentIntent.merchant_order_id.length > 20 
                                  ? `${paymentIntent.merchant_order_id.substring(0, 20)}...` 
                                  : paymentIntent.merchant_order_id)
                              : "No order ID"
                            }
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatAmount(paymentIntent.amount, paymentIntent.currency)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {paymentIntent.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(paymentIntent.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCaptureMethodBadge(paymentIntent.capture_method)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(paymentIntent.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/payment-intents/${paymentIntent.id}`)}
                          className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300"
                          title="View payment intent"
                        >
                          <EyeIcon />
                        </button>
                        <button
                          className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300"
                          title="Edit payment intent"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          onClick={() => handleDeletePaymentIntent(paymentIntent)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete payment intent"
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
            <DollarLineIcon />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No payment intents</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new payment intent.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedPaymentIntent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3 text-center">
                             <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
                 <DollarLineIcon />
               </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">
                Delete Payment Intent
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to delete this payment intent? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center gap-3 mt-4">
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
