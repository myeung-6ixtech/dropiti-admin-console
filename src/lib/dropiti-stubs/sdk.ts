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
    updateRealEstateOfferStatus: (args: any) => Promise<unknown>;
    insertRealEstateOfferByActionOne: (args: any) => Promise<unknown>;
    insertRealEstatePropertyListingOne: (args: any) => Promise<unknown>;
    insertRealEstateUserByIds: (args: any) => Promise<unknown>;
    getRealEstatePropertyListings: (args?: any) => Promise<unknown>;
    getRealEstatePropertyListingsById: (args: any) => Promise<unknown>;
    getRealEstatePropertyListingsByLandlord: (args: any) => Promise<unknown>;
    getRealEstateOffersByInitiatorIdDetailed: (args: any) => Promise<unknown>;
    getRealEstateOffersByRecipientIdDetailed: (args: any) => Promise<unknown>;
    getRealEstateOffersByPropertyIds: (args: any) => Promise<unknown>;
    updateRealEstateOffer: (args: any) => Promise<unknown>;
    insertRealEstateOffer: (args: any) => Promise<unknown>;
    [key: string]: unknown;
  };
} {
  throw new Error('getHasuraGraphqlSDK not implemented - @dropiti/sdk package not available');
}
