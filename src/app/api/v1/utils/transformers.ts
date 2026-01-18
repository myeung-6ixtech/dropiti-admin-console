import { RealEstateProperty } from '@/app/graphql/types';

/**
 * Format address object to location string
 */
export function formatLocation(address: Record<string, unknown>): string {
  if (typeof address === 'string') {
    return address;
  }

  if (!address || typeof address !== 'object') {
    return '';
  }

  const parts: string[] = [];
  
  if (address.street) parts.push(String(address.street));
  if (address.district) parts.push(String(address.district));
  if (address.city) parts.push(String(address.city));
  if (address.state) parts.push(String(address.state));
  if (address.country) parts.push(String(address.country));

  return parts.join(', ') || '';
}

/**
 * Extract amenities array from amenities object
 */
export function extractAmenities(amenities: unknown): string[] {
  if (Array.isArray(amenities)) {
    return amenities;
  }

  if (!amenities || typeof amenities !== 'object') {
    return [];
  }

  const amenitiesObj = amenities as Record<string, unknown>;
  const amenityList: string[] = [];
  
  if (amenitiesObj.kitchen && Array.isArray(amenitiesObj.kitchen)) {
    amenityList.push(...amenitiesObj.kitchen as string[]);
  }
  if (amenitiesObj.bathroom && Array.isArray(amenitiesObj.bathroom)) {
    amenityList.push(...amenitiesObj.bathroom as string[]);
  }
  if (amenitiesObj.furnitures && Array.isArray(amenitiesObj.furnitures)) {
    amenityList.push(...amenitiesObj.furnitures as string[]);
  }
  if (amenitiesObj.additionals && Array.isArray(amenitiesObj.additionals)) {
    amenityList.push(...amenitiesObj.additionals as string[]);
  }
  if (amenitiesObj.electricalAppliances && Array.isArray(amenitiesObj.electricalAppliances)) {
    amenityList.push(...amenitiesObj.electricalAppliances as string[]);
  }

  return amenityList;
}

/**
 * Transform property to API guide format
 */
export function transformProperty(property: RealEstateProperty) {
  return {
    id: property.id?.toString() || '',
    property_uuid: property.property_uuid,
    title: property.title,
    description: property.description || '',
    location: formatLocation(property.address),
    address: property.address,
    price: property.rental_price || 0,
    bedrooms: property.num_bedroom || 0,
    bathrooms: property.num_bathroom || 0,
    imageUrl: property.display_image || '',
    details: {
      type: property.property_type || '',
      furnished: property.furnished || 'none',
      petsAllowed: property.pets_allowed || false,
      parking: extractAmenities(property.amenities).some(a => 
        a.toLowerCase().includes('parking')
      ),
    },
    amenities: extractAmenities(property.amenities),
    minimumLease: 12, // Default, can be added to schema later
    availableDate: property.availability_date || '',
    createdAt: property.created_at || '',
    updatedAt: property.created_at || '', // updated_at field not available, using created_at
  };
}

