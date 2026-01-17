"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, UserIcon, MailIcon, BoxIcon, DollarLineIcon } from "@/icons";
import { Customer } from "@/types";

export default function CustomerDetail() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const customerId = params.id as string;

  useEffect(() => {
    if (customerId) {
      fetchCustomer();
      fetchPaymentMethods();
    }
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customer?id=${customerId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch customer");
      }
      
      const data = await response.json();
      setCustomer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(`/api/payment-consents?customer_id=${customerId}`);
      
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.data || []);
      }
    } catch (err) {
      console.warn("Failed to fetch payment consents:", err);
    }
  };

  const getCustomerName = (customer: Customer) => {
    return `${customer.first_name} ${customer.last_name}`.trim() || "N/A";
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading customer details...</p>
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
            Back to Customers
          </Button>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!customer) {
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
            Back to Customers
          </Button>
        </div>
        <div className="text-center py-12">
          <UserIcon />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Customer not found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The customer you&apos;re looking for doesn&apos;t exist.
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
          Back to Customers
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Customer Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage customer information
            </p>
          </div>
          <Button
            onClick={() => router.push(`/dashboard/customers/edit/${customer.id}`)}
          >
            Edit Customer
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
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {getCustomerName(customer)}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {customer.email}
                </p>
              </div>
              
              {customer.phone_number && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {customer.phone_number}
                  </p>
                </div>
              )}
              
              {customer.date_of_birth && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {new Date(customer.date_of_birth).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Address Information */}
          {customer.address && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <MailIcon />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Address Information
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Street Address</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {customer.address.street}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">City</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {customer.address.city}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">State</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {customer.address.state}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Postcode</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {customer.address.postcode}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Country</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {customer.address.country_code}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <DollarLineIcon />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Payment Consents
                </h2>
              </div>
              <Button
                size="sm"
                onClick={() => router.push(`/dashboard/customers/add-payment-method/${customer.id}`)}
              >
                Add Payment Consent
              </Button>
            </div>
            
            {paymentMethods.length > 0 ? (
              <div className="space-y-3">
                {paymentMethods.map((consent) => (
                  <div key={consent.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-6 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center">
                        <span className="text-xs font-mono">••••</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Payment Consent
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {consent.id}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {consent.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <DollarLineIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  No payment consents found
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Add a payment consent to enable merchant-initiated payments for this customer
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer ID</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1 font-mono">
                  {customer.id}
                </p>
              </div>
              
              {customer.created_at && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {customer.updated_at && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {new Date(customer.updated_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Information */}
          {customer.metadata && Object.keys(customer.metadata).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <BoxIcon />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Additional Information
                </h2>
              </div>
              
              <div className="space-y-4">
                {Object.entries(customer.metadata).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <BoxIcon />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Quick Actions
              </h2>
            </div>
            
            <div className="space-y-3">
              <Button
                size="sm"
                onClick={() => router.push(`/dashboard/customers/add-payment-method/${customer.id}`)}
                className="w-full justify-center"
              >
                <DollarLineIcon />
                Add Payment Consent
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/dashboard/customers/edit/${customer.id}`)}
                className="w-full justify-center"
              >
                <UserIcon />
                Edit Customer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
