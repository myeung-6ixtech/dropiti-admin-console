// Stub implementation for @dropiti/sdk
export interface RealEstateOffer {
  id: string;
  initiator_firebase_uid: string;
  offer_key: string;
  property_id: string;
  [key: string]: unknown;
}

export interface RealEstateOfferByActionInsertInput {
  created_at: string;
  offer_id: string;
  offer_key: string;
  property_id: string;
  action: string;
  [key: string]: unknown;
}

export interface RealEstateOfferInsertInput {
  created_at?: string;
  property_id?: string;
  offer_key?: string;
  [key: string]: unknown;
}

export interface RealEstatePropertyListingInsertInput {
  [key: string]: unknown;
}

export interface RealEstateUserInsertInput {
  [key: string]: unknown;
}

export function getHasuraGraphqlSDK(): {
  sdk: {
    updateRealEstateOfferStatus: (args: Record<string, unknown>) => Promise<unknown>;
    insertRealEstateOfferByActionOne: (args: Record<string, unknown>) => Promise<unknown>;
    insertRealEstatePropertyListingOne: (args: Record<string, unknown>) => Promise<unknown>;
    insertRealEstateUserByIds: (args: Record<string, unknown>) => Promise<unknown>;
    getRealEstatePropertyListings: (args?: Record<string, unknown>) => Promise<unknown>;
    getRealEstatePropertyListingsById: (args: Record<string, unknown>) => Promise<unknown>;
    getRealEstatePropertyListingsByIdDetailed: (args: Record<string, unknown>) => Promise<unknown>;
    getRealEstatePropertyListingsByLandlord: (args: Record<string, unknown>) => Promise<unknown>;
    getRealEstateOffersByInitiatorIdDetailed: (args: Record<string, unknown>) => Promise<unknown>;
    getRealEstateOffersByRecipientIdDetailed: (args: Record<string, unknown>) => Promise<unknown>;
    getRealEstateOffersByPropertyIds: (args: Record<string, unknown>) => Promise<unknown>;
    updateRealEstateOffer: (args: Record<string, unknown>) => Promise<unknown>;
    insertRealEstateOffer: (args: Record<string, unknown>) => Promise<unknown>;
    insertRealEstateOfferOne: (args: Record<string, unknown>) => Promise<{ insert_real_estate_offer_one?: { id: string; [key: string]: unknown } }>;
    getRealEstateUsersByIds: (args: Record<string, unknown>) => Promise<unknown>;
    [key: string]: unknown;
  };
} {
  throw new Error('getHasuraGraphqlSDK not implemented - @dropiti/sdk package not available');
}
