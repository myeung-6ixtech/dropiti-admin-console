"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { AdminIncomingOffers } from "@/components/admin/AdminIncomingOffers";

const IncomingOffersPage: React.FC = () => {
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-2 md:p-0">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Incoming offers
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          All incoming offers on your listings. Click <strong>View</strong> on any row to open the
          deal detail and send an ownership invitation or reach out via other channels.
        </p>
      </div>

      <AdminIncomingOffers title="All incoming offers" />
    </div>
  );
};

export default IncomingOffersPage;
