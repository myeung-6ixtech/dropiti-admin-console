"use client";

import React from "react";
import { AdminIncomingOffers } from "@/components/admin/AdminIncomingOffers";

const IncomingOffersPage: React.FC = () => {
  return (
    <div className="p-2 md:p-0">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Incoming offers
        </h1>
      </div>

      <AdminIncomingOffers title="All incoming offers (admin listings)" />
    </div>
  );
};

export default IncomingOffersPage;
