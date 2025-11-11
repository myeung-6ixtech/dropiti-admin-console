import { NextRequest } from 'next/server';
import { executeMutation } from '@/app/graphql/client';
import { successResponse, errorResponse } from '../../utils/response';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      offerId,
      offerUuid,
      reviewType,
      rating,
      comment,
      reviewerId,
      reviewedUserId,
    } = body;

    if (!offerId || !reviewType || !rating || !reviewerId || !reviewedUserId) {
      return errorResponse(
        'offerId, reviewType, rating, reviewerId, and reviewedUserId are required',
        undefined,
        400
      );
    }

    if (rating < 1 || rating > 5) {
      return errorResponse('Rating must be between 1 and 5', undefined, 400);
    }

    if (!['tenant_to_landlord', 'landlord_to_tenant'].includes(reviewType)) {
      return errorResponse('reviewType must be "tenant_to_landlord" or "landlord_to_tenant"', undefined, 400);
    }

    // Get property UUID from offer
    const GET_OFFER = `
      query GetOffer($offerId: Int!) {
        real_estate_offer_by_pk(id: $offerId) {
          property_id
        }
      }
    `;

    const { executeQuery } = await import('@/app/graphql/client');
    const offerResult = await executeQuery(GET_OFFER, { offerId: parseInt(offerId) });
    const offer = offerResult.real_estate_offer_by_pk;

    if (!offer) {
      return errorResponse('Offer not found', undefined, 404);
    }

    // Get property UUID
    const GET_PROPERTY = `
      query GetProperty($propertyId: Int!) {
        real_estate_property_listing_by_pk(id: $propertyId) {
          property_uuid
        }
      }
    `;

    const propertyResult = await executeQuery(GET_PROPERTY, { propertyId: offer.property_id });
    const property = propertyResult.real_estate_property_listing_by_pk;

    const review_uuid = randomUUID();

    const INSERT_REVIEW = `
      mutation InsertReview($object: real_estate_review_insert_input!) {
        insert_real_estate_review_one(object: $object) {
          id
          review_uuid
          offer_uuid
          review_type
          rating
          comment
          reviewer_firebase_uid
          reviewee_firebase_uid
          property_uuid
          is_public
          is_verified
          helpful_count
          created_at
        }
      }
    `;

    const reviewObject = {
      review_uuid,
      offer_uuid: offerUuid || offerId.toString(),
      review_type: reviewType,
      rating,
      comment: comment || '',
      reviewer_firebase_uid: reviewerId,
      reviewee_firebase_uid: reviewedUserId,
      property_uuid: property?.property_uuid || '',
      is_public: true,
      is_verified: false,
      helpful_count: 0,
      created_at: new Date().toISOString(),
    };

    const result = await executeMutation(INSERT_REVIEW, { object: reviewObject });

    return successResponse(
      {
        review: result.insert_real_estate_review_one,
      },
      'Review created successfully',
      undefined,
      201
    );
  } catch (error: any) {
    console.error('Error creating review:', error);
    return errorResponse(
      error.message || 'Failed to create review',
      undefined,
      500
    );
  }
}

