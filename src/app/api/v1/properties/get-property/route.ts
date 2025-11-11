import { NextRequest } from 'next/server';
import { RealEstatePropertyServiceByUuid } from '@/app/graphql/services/realEstatePropertyServiceByUuid';
import { successResponse, errorResponse } from '../../utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const property_uuid = searchParams.get('property_uuid');

    if (!property_uuid) {
      return errorResponse('property_uuid is required', undefined, 400);
    }

    const property = await RealEstatePropertyServiceByUuid.getRealEstatePropertyByUuid(property_uuid);

    if (!property) {
      return errorResponse('Property not found', undefined, 404);
    }

    // Transform to API guide format
    const transformedData = {
      id: property.id?.toString() || '',
      property_uuid: property.property_uuid,
      title: property.title,
      description: property.description || '',
      address: property.address,
      location: typeof property.address === 'string' 
        ? property.address 
        : [property.address?.street, property.address?.district, property.address?.city, property.address?.state, property.address?.country].filter(Boolean).join(', '),
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
      is_public: property.is_public || false,
      status: property.is_public ? 'published' : 'draft',
      created_at: property.created_at || '',
      updated_at: property.updated_at || property.created_at || '',
    };

    return successResponse(transformedData);
  } catch (error: any) {
    console.error('Error fetching property:', error);
    return errorResponse(
      error.message || 'Failed to fetch property',
      undefined,
      500
    );
  }
}

