import { NextRequest } from 'next/server';
import { RealEstatePropertyServiceByUuid } from '@/app/graphql/services/realEstatePropertyServiceByUuid';
import { RealEstateUserService } from '@/app/graphql/services/realEstateUserService';
import { successResponse, errorResponse } from '../../utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const property_uuid = searchParams.get('property_uuid');

    if (!property_uuid) {
      return errorResponse('property_uuid is required', undefined, 400);
    }

    const property = await RealEstatePropertyServiceByUuid.getRealEstatePropertyByUuidDetailed(property_uuid);

    if (!property) {
      return errorResponse('Property not found', undefined, 404);
    }

    // Get landlord information
    let landlord = null;
    if (property.landlord_firebase_uid) {
      const landlordData = await RealEstateUserService.getRealEstateUserByUid(property.landlord_firebase_uid);
      if (landlordData) {
        // Get additional landlord stats (rating, review_count) - placeholder for now
        landlord = {
          id: landlordData.firebase_uid,
          firebase_uid: landlordData.firebase_uid,
          name: landlordData.display_name,
          email: landlordData.email,
          avatar: landlordData.photo_url || '',
          verified: true, // Can be added to schema
          rating: 0, // Placeholder - needs to be calculated from reviews
          review_count: 0, // Placeholder - needs to be calculated from reviews
        };
      }
    }

    // Transform property
    const transformedProperty = {
      id: property.id?.toString() || '',
      property_uuid: property.property_uuid,
      title: property.title,
      description: property.description || '',
      address: property.address,
      location: typeof property.address === 'string' 
        ? property.address 
        : [property.address?.street, property.address?.district, property.address?.state, property.address?.country].filter(Boolean).join(', '),
      rental_price: property.rental_price || 0,
      num_bedroom: property.num_bedroom || 0,
      num_bathroom: property.num_bathroom || 0,
      display_image: property.display_image || '',
      uploaded_images: property.uploaded_images || [],
      property_type: property.property_type || '',
      furnished: property.furnished || 'none',
      pets_allowed: property.pets_allowed || false,
      amenities: Array.isArray(property.amenities) 
        ? property.amenities 
        : property.amenities 
          ? Object.values(property.amenities).flat().filter(Boolean) 
          : [],
      availability_date: property.availability_date || '',
      status: 'published', // Default to published (is_public field not available)
      created_at: property.created_at || '',
      updated_at: property.created_at || '', // updated_at field not available, using created_at
    };

    return successResponse({
      property: transformedProperty,
      landlord,
    });
  } catch (error: unknown) {
    console.error('Error fetching property by UUID:', error);
    return errorResponse(
      error.message || 'Failed to fetch property',
      undefined,
      500
    );
  }
}

