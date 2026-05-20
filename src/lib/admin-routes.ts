/**
 * REST-style path segments for admin BFF → `/v1/admin/...`
 * See documentation/guides/decouple-plan-v2.md §10.
 */

function seg(id: string | number): string {
  return encodeURIComponent(String(id));
}

export const adminRoutes = {
  users: () => "admin/users",
  user: (userId: string) => `admin/users/${seg(userId)}`,

  properties: () => "admin/properties",
  property: (uuid: string) => `admin/properties/${seg(uuid)}`,

  offersIncoming: () => "admin/offers/incoming",
  offerIncoming: (offerId: string | number) =>
    `admin/offers/incoming/${seg(offerId)}`,

  media: () => "admin/media",
  uploadBatch: () => "admin/upload/batch",

  customers: () => "admin/customers",
  customer: (id: string) => `admin/customers/${seg(id)}`,
  customerClientSecret: (customerId: string) =>
    `admin/customers/${seg(customerId)}/client-secret`,

  paymentMethods: () => "admin/payment-methods",
  paymentConsents: () => "admin/payment-consents",

  paymentIntents: () => "admin/payment-intents",
  paymentIntent: (id: string) => `admin/payment-intents/${seg(id)}`,

  payment: (id: string) => `admin/payments/${seg(id)}`,
  paymentCancel: (id: string) => `admin/payments/${seg(id)}/cancel`,
  paymentAttachMethod: (id: string) =>
    `admin/payments/${seg(id)}/attach-method`,

  beneficiaries: () => "admin/beneficiaries",
  beneficiary: (id: string) => `admin/beneficiaries/${seg(id)}`,

  transfers: () => "admin/transfers",
  transferCancel: (id: string) => `admin/transfers/${seg(id)}/cancel`,

  transferOwnershipTransfer: () => "admin/transfer-ownership/transfer",

  /** GET /v1/admin/analytics/dashboard — KPI aggregates (see api-doc-v1.md §11). */
  analyticsDashboard: () => "admin/analytics/dashboard",

  administratorUser: (id: string) => `admin/administrator-users/${seg(id)}`,
} as const;
