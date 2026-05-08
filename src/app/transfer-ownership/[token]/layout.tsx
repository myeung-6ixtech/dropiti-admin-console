/**
 * Minimal layout for the transfer-ownership claim page.
 * Intentionally has no sidebar / nav / bottom-bar — this page is
 * typically entered directly from a WhatsApp link.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Claim Property — Dropiti",
};

export default function TransferOwnershipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <span className="text-base font-semibold text-gray-900 dark:text-white">Dropiti</span>
      </header>
      <main className="mx-auto max-w-lg px-4 py-10">{children}</main>
    </div>
  );
}
