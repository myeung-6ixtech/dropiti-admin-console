import React from "react";
import { UserIcon } from "@/icons";
import type { Customer } from "@/types";

interface CustomerInfoProps {
  customer: Customer | null;
  title?: string;
}

const CustomerInfo: React.FC<CustomerInfoProps> = ({ customer, title = "Customer" }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <UserIcon />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
          <p className="text-sm text-gray-900 dark:text-white mt-1">
            {customer ? `${customer.first_name} ${customer.last_name}` : '---'}
          </p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
          <p className="text-sm text-gray-900 dark:text-white mt-1">
            {customer ? customer.email : '---'}
          </p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer ID</label>
          <p className="text-sm text-gray-900 dark:text-white mt-1 font-mono">
            {customer ? customer.id : '---'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerInfo; 