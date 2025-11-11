"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, DollarLineIcon } from "@/icons";
import type { PaymentIntentDetail } from "@/types";
import CustomerInfo from "@/components/CustomerInfo";
import AirwallexCardElements, { AirwallexCardElementsRef } from "@/components/payment/AirwallexCardElements";

export default function AddPaymentMethod() {
  const params = useParams();
  const router = useRouter();
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState("");
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [creatingPaymentMethod, setCreatingPaymentMethod] = useState(false);
  const [customerPaymentMethods, setCustomerPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [billingAddress, setBillingAddress] = useState({
    line1: "",
    city: "",
    state: "",
    postal_code: "",
    country_code: ""
  });

  // Ref to access AirwallexCardElements methods
  const airwallexRef = useRef<AirwallexCardElementsRef>(null);

  const paymentIntentId = params.id as string;

  const fetchPaymentIntent = useCallback(async () => {
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
  }, [paymentIntentId]);

  // Main initialization effect - handles data fetching
  useEffect(() => {
    const initializePage = async () => {
      if (!paymentIntentId) return;

      try {
        // Step 1: Fetch payment intent data
        await fetchPaymentIntent();
      } catch (error) {
        console.error('Failed to initialize page:', error);
      }
    };

    initializePage();
  }, [paymentIntentId, fetchPaymentIntent]);

  // Fetch customer payment methods when payment intent is loaded
  useEffect(() => {
    if (paymentIntent?.customer?.id) {
      fetchCustomerPaymentMethods();
    }
  }, [paymentIntent?.customer?.id]);

  const fetchCustomerPaymentMethods = async () => {
    try {
      const response = await fetch(`/api/payment-methods?customer_id=${paymentIntent?.customer?.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setCustomerPaymentMethods(data.data || []);
      }
    } catch (err) {
      console.warn("Failed to fetch customer payment methods:", err);
    }
  };

  const handleAirwallexReady = () => {
    setSdkLoaded(true);
  };

  const handleAirwallexError = (error: string) => {
    setError(`Payment form error: ${error}`);
  };

  const createPaymentMethod = async () => {
    // Validate required data
    if (!paymentIntent?.customer) {
      setError('Customer information is required');
      return;
    }

    // Validate customer ID
    if (!paymentIntent.customer.id) {
      setError('Customer ID is missing from payment intent');
      return;
    }

    // If using existing payment method
    if (selectedPaymentMethod) {
      try {
        setCreatingPaymentMethod(true);
        await attachPaymentMethod(selectedPaymentMethod);
        return;
      } catch (err) {
        console.error('Failed to attach existing payment method:', err);
        setError(err instanceof Error ? err.message : 'Failed to attach payment method');
        setCreatingPaymentMethod(false);
        return;
      }
    }

    // If creating new payment method
    if (!cardholderName) {
      setError('Please fill in all required fields');
      return;
    }

    // Check if Airwallex Elements are ready
    if (!airwallexRef.current?.isReady()) {
      setError('Payment form is not ready. Please wait for the form to load.');
      return;
    }

    // Additional check to ensure elements are properly mounted
    console.log('Airwallex ref status:', {
      current: !!airwallexRef.current,
      isReady: airwallexRef.current?.isReady(),
    });

    try {
      setCreatingPaymentMethod(true);
      
      // Use the existing client secret from the payment intent
      // The Airwallex elements are already initialized with this client secret
      const client_secret = (paymentIntent as any)?.client_secret;
      
      if (!client_secret) {
        throw new Error('Payment intent does not have a client secret. Please ensure the payment intent is properly configured.');
      }
      
      console.log('Using payment intent client secret:', client_secret);
      
      // Step 1: Create Payment Method using Airwallex SDK
      console.log('Creating Payment Method using Airwallex SDK...');
      console.log('Client secret:', client_secret);
      console.log('Airwallex ref ready:', airwallexRef.current?.isReady());
      
      let paymentMethod;
      try {
        paymentMethod = await airwallexRef.current.createPaymentMethod(client_secret);
        console.log('Payment Method created successfully:', paymentMethod);
        console.log('Payment Method type:', typeof paymentMethod);
        console.log('Payment Method keys:', paymentMethod ? Object.keys(paymentMethod) : 'null/undefined');
      } catch (methodError) {
        console.error('Error creating payment method:', methodError);
        throw new Error(`Failed to create payment method: ${methodError instanceof Error ? methodError.message : 'Unknown error'}`);
      }
      
      if (!paymentMethod) {
        throw new Error('Payment method creation failed - no data returned');
      }
      
      // Step 2: Store the Payment Method data in our system
      console.log('Storing Payment Method data...');
      
      const requestBody = {
        payment_method_data: paymentMethod,
        customer_id: paymentIntent.customer.id,
        metadata: {
          cardholder_name: cardholderName,
          billing_address: billingAddress.line1 ? billingAddress : undefined,
          admin_created: true,
          purpose: 'immediate_payment',
        },
      };
      
      console.log('Request body for storing payment method:', requestBody);
      
      let storeResponse;
      try {
        storeResponse = await fetch('/api/payment-methods', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        console.log('Store response status:', storeResponse.status);
      } catch (storeError) {
        console.error('Error storing payment method:', storeError);
        throw new Error(`Failed to store payment method: ${storeError instanceof Error ? storeError.message : 'Unknown error'}`);
      }

      if (!storeResponse.ok) {
        const errorData = await storeResponse.json();
        console.error('Store payment method error:', errorData);
        throw new Error(errorData.error || 'Failed to store payment method');
      }

      const storeResult = await storeResponse.json();
      console.log('Payment Method stored successfully:', storeResult);
      
      // Step 3: Attach the payment method to the payment intent
      console.log('Attaching payment method to payment intent...');
      console.log('Payment method ID:', paymentMethod.id);
      
      try {
        await attachPaymentMethod(paymentMethod.id);
        console.log('Payment method attached successfully');
      } catch (attachError) {
        console.error('Error attaching payment method:', attachError);
        throw new Error(`Failed to attach payment method: ${attachError instanceof Error ? attachError.message : 'Unknown error'}`);
      }
      
    } catch (err) {
      console.error('Failed to create payment method:', err);
      setError(err instanceof Error ? err.message : 'Failed to create payment method');
    } finally {
      setCreatingPaymentMethod(false);
    }
  };

  const attachPaymentMethod = async (paymentMethodId: string) => {
    try {
      console.log('attachPaymentMethod called with ID:', paymentMethodId);
      console.log('Payment intent ID:', paymentIntentId);
      
      const requestBody = {
        payment_intent_id: paymentIntentId,
        payment_method_id: paymentMethodId,
        // Note: This could be either a PaymentMethod ID or PaymentConsent ID
        // The API should handle both cases
      };
      
      console.log('Attach payment method request body:', requestBody);
      
      const response = await fetch(`/api/payments/attach-method`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('Attach payment method response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Attach payment method error:', errorData);
        throw new Error(errorData.error || "Failed to attach payment method");
      }
      
      const responseData = await response.json();
      console.log('Attach payment method success:', responseData);
      
      // Redirect back to payment intent details
      console.log('Redirecting to payment intent details...');
      router.push(`/dashboard/payment-intents/${paymentIntentId}`);
    } catch (err) {
      console.error('attachPaymentMethod error:', err);
      setError(err instanceof Error ? err.message : "Failed to attach payment method");
    }
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

  // Safeguard: Ensure payment intent exists and has required data
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

  // Safeguard: Ensure customer exists
  if (!paymentIntent.customer) {
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
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Customer information missing</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            This payment intent doesn't have associated customer information.
          </p>
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
          Back to Payment Intent
        </Button>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Add Payment Method
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create payment method for immediate payments using Airwallex Elements
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <DollarLineIcon />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Credit Card Information
              </h2>
            </div>
            
            <div className="space-y-6">
              {/* Payment Intent Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Intent ID</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1 font-mono">
                    {paymentIntent.id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1 font-semibold">
                    {formatAmount(paymentIntent.amount, paymentIntent.currency)}
                  </p>
                </div>
              </div>

              {/* Existing Payment Methods */}
              {customerPaymentMethods.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Use Existing Payment Method
                  </label>
                  <div className="space-y-2">
                    {customerPaymentMethods.map((method) => (
                      <label key={method.id} className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={selectedPaymentMethod === method.id}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="mr-3"
                        />
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-6 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center">
                            <span className="text-xs font-mono">••••</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Payment Method
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {method.id}
                            </p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Select an existing payment method or add a new one below
                  </p>
                </div>
              )}

              {/* Divider */}
              {customerPaymentMethods.length > 0 && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or add a new payment method</span>
                  </div>
                </div>
              )}

              {/* New Payment Method Form - Only show if no existing method is selected */}
              {!selectedPaymentMethod && (
                <>
                  {/* Airwallex Card Elements Component */}
                  <AirwallexCardElements
                    customerId={paymentIntent.customer.id}
                    clientSecret={(paymentIntent as any)?.client_secret}
                    onReady={handleAirwallexReady}
                    onError={handleAirwallexError}
                    ref={airwallexRef}
                  />
                  
                  {/* Cardholder Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cardholder Name *
                    </label>
                    <input
                      type="text"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="Enter cardholder name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>
                  
                  {/* Billing Address */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Billing Address (Optional)
                    </label>
                    <input
                      type="text"
                      value={billingAddress.line1}
                      onChange={(e) => setBillingAddress(prev => ({ ...prev, line1: e.target.value }))}
                      placeholder="Street address"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={billingAddress.city}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="City"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      />
                      <input
                        type="text"
                        value={billingAddress.state}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="State"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={billingAddress.postal_code}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                        placeholder="Postal code"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      />
                      <input
                        type="text"
                        value={billingAddress.country_code}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, country_code: e.target.value }))}
                        placeholder="Country code (e.g., US)"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      />
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={createPaymentMethod}
                      disabled={
                        (!selectedPaymentMethod && (!cardholderName || !sdkLoaded || !(paymentIntent as any)?.client_secret)) || 
                        creatingPaymentMethod
                      }
                      className="flex-1"
                    >
                      {creatingPaymentMethod 
                        ? "Creating Payment Method..." 
                        : selectedPaymentMethod 
                          ? "Attach Selected Payment Method"
                          : "Create & Attach Payment Method"
                      }
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={creatingPaymentMethod}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}

              {/* Submit Button for Existing Payment Methods */}
              {selectedPaymentMethod && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={createPaymentMethod}
                    disabled={creatingPaymentMethod}
                    className="flex-1"
                  >
                    {creatingPaymentMethod ? "Creating Payment Method..." : "Attach Selected Payment Method"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={creatingPaymentMethod}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <CustomerInfo customer={paymentIntent.customer || null} title="Customer" />
          
          {/* Payment Intent Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarLineIcon />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Payment Intent Status
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
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Currency</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {paymentIntent.currency}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
