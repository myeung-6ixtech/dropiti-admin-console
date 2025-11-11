import { RealEstateProperty } from '@/app/graphql/types';

/**
 * Format address object to location string
 */
export function formatLocation(address: any): string {
  if (typeof address === 'string') {
    return address;
  }

  if (!address || typeof address !== 'object') {
    return '';
  }

  const parts: string[] = [];
  
  if (address.street) parts.push(address.street);
  if (address.district) parts.push(address.district);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.country) parts.push(address.country);

  return parts.join(', ') || '';
}

/**
 * Extract amenities array from amenities object
 */
export function extractAmenities(amenities: any): string[] {
  if (Array.isArray(amenities)) {
    return amenities;
  }

  if (!amenities || typeof amenities !== 'object') {
    return [];
  }

  const amenityList: string[] = [];
  
  if (amenities.kitchen && Array.isArray(amenities.kitchen)) {
    amenityList.push(...amenities.kitchen);
  }
  if (amenities.bathroom && Array.isArray(amenities.bathroom)) {
    amenityList.push(...amenities.bathroom);
  }
  if (amenities.furnitures && Array.isArray(amenities.furnitures)) {
    amenityList.push(...amenities.furnitures);
  }
  if (amenities.additionals && Array.isArray(amenities.additionals)) {
    amenityList.push(...amenities.additionals);
  }
  if (amenities.electricalAppliances && Array.isArray(amenities.electricalAppliances)) {
    amenityList.push(...amenities.electricalAppliances);
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
    updatedAt: property.updated_at || property.created_at || '',
  };
}

