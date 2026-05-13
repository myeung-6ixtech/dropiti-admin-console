"use client";

import React from "react";
import type { AdminOfferRow } from "./AdminIncomingOffers";

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

function buildOutreachWhatsAppUrl(
  externalContact: string | null | undefined,
  offer: AdminOfferRow
): string | null {
  if (!externalContact?.trim()) return null;
  const d = digitsOnly(externalContact);
  if (!d) return null;
  const propTitle = offer.property?.title || "your listing";
  const text = [
    `Hi — I'm reaching out from Dropiti regarding "${propTitle}".`,
    `There is a rental offer: ${offer.proposing_rent_price_currency} ${offer.proposing_rent_price.toLocaleString()}, ${offer.num_leasing_months} mo (${offer.payment_frequency}).`,
    `Applicant: ${offer.initiator.display_name}.`,
    `I'd like to connect you with this lead.`,
  ].join(" ");
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

export function AdminOfferDetailPanel({ offer }: { offer: AdminOfferRow }) {
  const waUrl = buildOutreachWhatsAppUrl(offer.property?.external_contact ?? null, offer);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900/40">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Listing
          </h2>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {offer.property?.title || "—"}
          </p>
          {offer.property?.property_uuid && (
            <p className="mt-1 font-mono text-xs text-gray-400">
              {offer.property.property_uuid}
            </p>
          )}
          {offer.property?.rental_price != null && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Listed rent: {Number(offer.property.rental_price).toLocaleString()}
            </p>
          )}
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">External contact</p>
            {offer.property?.external_contact ? (
              <p className="mt-0.5 font-mono text-sm text-gray-800 dark:text-gray-200">
                {offer.property.external_contact}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                Not set — add on the property edit form for WhatsApp outreach.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900/40">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Applicant
          </h2>
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            {offer.initiator.display_name}
          </p>
          {offer.initiator.email && (
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
              {offer.initiator.email}
            </p>
          )}
          {offer.initiator.phone_number && (
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
              {offer.initiator.phone_number}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900/40">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Offer terms
            </h2>
            <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {offer.offer_status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Rent proposed</p>
              <p className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">
                {offer.proposing_rent_price_currency}{" "}
                {offer.proposing_rent_price.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
              <p className="mt-0.5 font-semibold text-gray-900 dark:text-white">
                {offer.num_leasing_months} months
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Payment</p>
              <p className="mt-0.5 font-semibold capitalize text-gray-900 dark:text-white">
                {offer.payment_frequency}
              </p>
            </div>
            {offer.move_in_date && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Move-in</p>
                <p className="mt-0.5 font-semibold text-gray-900 dark:text-white">
                  {new Date(offer.move_in_date).toLocaleDateString()}
                </p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Offer key</p>
              <p className="mt-0.5 font-mono text-xs text-gray-600 dark:text-gray-300">
                {offer.offer_key}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Submitted</p>
              <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">
                {new Date(offer.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="lg:col-span-2">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Outreach
        </h2>
        <div className="space-y-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">WhatsApp</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Open a pre-filled message to the listing external contact.
            </p>
            {waUrl ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Open WhatsApp
              </a>
            ) : (
              <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
                Add a valid external phone on the property to enable WhatsApp.
              </p>
            )}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 opacity-80 dark:border-gray-700 dark:bg-gray-900/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Facebook DM</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Phase 2</p>
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                Soon
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
