"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, DollarLineIcon, MailIcon, EyeIcon, PencilIcon } from "@/icons";
import type { PaymentIntentDetail } from "@/types";
import CustomerInfo from "@/components/CustomerInfo";

export default function PaymentIntentDetail() {
  const params = useParams();
  const router = useRouter();
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paymentIntentId = params.id as string;

  useEffect(() => {
    if (paymentIntentId) {
      fetchPaymentIntent();
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
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

  const getPaymentStage = (status: string) => {
    const stages = [
      { id: 'created', name: 'Created', description: 'Payment intent created' },
      { id: 'requires_payment_method', name: 'Payment Method', description: 'Waiting for payment method' },
      { id: 'requires_confirmation', name: 'Confirmation', description: 'Payment method attached, awaiting confirmation' },
      { id: 'requires_action', name: 'Action Required', description: 'Additional action needed (3D Secure, etc.)' },
      { id: 'processing', name: 'Processing', description: 'Payment is being processed' },
      { id: 'requires_capture', name: 'Capture', description: 'Ready for capture' },
      { id: 'succeeded', name: 'Completed', description: 'Payment successfully captured' },
      { id: 'canceled', name: 'Canceled', description: 'Payment was canceled' },
    ];

    const currentStageIndex = stages.findIndex(stage => stage.id === status);
    return { stages, currentStageIndex: currentStageIndex >= 0 ? currentStageIndex : 0 };
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
      month: 'long',
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
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading payment intent details...</p>
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
            Back to Payment Intents
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
            Back to Payment Intents
          </Button>
        </div>
        <div className="text-center py-12">
          <DollarLineIcon />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Payment intent not found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The payment intent you&apos;re looking for doesn&apos;t exist.
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
          Back to Payment Intents
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Intent Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage payment intent information
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push(`/dashboard/payment-intents/edit/${paymentIntent.id}`)}
            >
              <PencilIcon />
              Edit Payment Intent
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Progress */}
      {paymentIntent && (
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarLineIcon />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Payment Progress
              </h2>
            </div>
            
            <div className="relative">
              {(() => {
                const { stages, currentStageIndex } = getPaymentStage(paymentIntent.status);
                return (
                  <div className="flex items-center justify-between">
                    {stages.map((stage, index) => {
                      const isCompleted = index < currentStageIndex;
                      const isCurrent = index === currentStageIndex;
                      
                      return (
                        <div key={stage.id} className="flex flex-col items-center flex-1">
                          {/* Stage Circle */}
                          <div className="relative">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                              isCompleted 
                                ? "bg-green-500 text-white" 
                                : isCurrent 
                                  ? "bg-brand-500 text-white" 
                                  : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                            }`}>
                              {isCompleted ? "✓" : index + 1}
                            </div>
                            
                            {/* Connecting Line */}
                            {index < stages.length - 1 && (
                              <div className={`absolute top-4 left-8 w-full h-0.5 ${
                                isCompleted ? "bg-green-500" : "bg-gray-200 dark:bg-gray-600"
                              }`}></div>
                            )}
                          </div>
                          
                          {/* Stage Label */}
                          <div className="mt-2 text-center">
                            <div className={`text-xs font-medium ${
                              isCompleted 
                                ? "text-green-600 dark:text-green-400" 
                                : isCurrent 
                                  ? "text-brand-600 dark:text-brand-400" 
                                  : "text-gray-500 dark:text-gray-400"
                            }`}>
                              {stage.name}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {stage.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            
            {/* Current Status Summary */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Current Status
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {(() => {
                      const { stages, currentStageIndex } = getPaymentStage(paymentIntent.status);
                      const currentStage = stages[currentStageIndex];
                      return currentStage ? currentStage.description : "Unknown status";
                    })()}
                  </p>
                </div>
                <div className="text-right">
                  {getStatusBadge(paymentIntent.status)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarLineIcon />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Basic Information
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Intent ID</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1 font-mono">
                  {paymentIntent.id}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                <div className="mt-1">
                  {getStatusBadge(paymentIntent.status)}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1 font-semibold">
                  {formatAmount(paymentIntent.amount, paymentIntent.currency)}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Currency</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {paymentIntent.currency}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Capture Method</label>
                <div className="mt-1">
                  {getCaptureMethodBadge(paymentIntent.capture_method)}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Confirmation Method</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1 capitalize">
                  {paymentIntent.confirmation_method}
                </p>
              </div>
            </div>
          </div>

          {/* Order Information */}
          {paymentIntent.merchant_order_id && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <EyeIcon />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Order Information
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Merchant Order ID</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {paymentIntent.merchant_order_id}
                  </p>
                </div>
                
                {paymentIntent.descriptor && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Descriptor</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {paymentIntent.descriptor}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Method Information */}
          {paymentIntent.payment_method && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <DollarLineIcon />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Payment Method
                </h2>
              </div>
              
              <div className="text-sm text-gray-900 dark:text-white">
                <pre className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(paymentIntent.payment_method, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Metadata */}
          {paymentIntent.metadata && Object.keys(paymentIntent.metadata).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <EyeIcon />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Metadata
                </h2>
              </div>
              
              <div className="text-sm text-gray-900 dark:text-white">
                <pre className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(paymentIntent.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <CustomerInfo customer={paymentIntent.customer || null} />

          {/* Timestamps */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <MailIcon />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Timestamps
              </h2>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {formatDate(paymentIntent.created_at)}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Updated</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {formatDate(paymentIntent.updated_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarLineIcon />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Actions
              </h2>
            </div>
            
            <div className="space-y-2">
              {paymentIntent.status === "REQUIRES_PAYMENT_METHOD" && (
                <Button size="sm" className="w-full">
                  Capture Payment
                </Button>
              )}
              
              {paymentIntent.status === "requires_confirmation" && (
                <Button size="sm" className="w-full">
                  Confirm Payment
                </Button>
              )}
              
              {paymentIntent.status === "REQUIRES_PAYMENT_METHOD" && paymentIntent.customer && (
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => router.push(`/dashboard/payment-intents/add-payment-method/${paymentIntentId}`)}
                >
                  Add Payment Method
                </Button>
              )}
              
              {["requires_payment_method", "requires_confirmation", "requires_action"].includes(paymentIntent.status) && (
                <Button size="sm" variant="outline" className="w-full">
                  Cancel Payment
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
