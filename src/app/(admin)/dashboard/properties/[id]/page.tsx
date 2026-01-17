"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RealEstatePropertyServiceByUuid } from '@/app/graphql/services/realEstatePropertyServiceByUuid';
import { RealEstateProperty } from '@/app/graphql/types';
import Button from '@/components/ui/button/Button';

// Property Basic Info Card Component
const PropertyBasicInfoCard: React.FC<{ property: RealEstateProperty; onEdit: () => void }> = ({ property, onEdit }) => {
  return (
    <div>
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
        Basic Information
      </h4>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
        <div>
          <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
            Title
          </p>
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            {property.title}
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
            Property Type
          </p>
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            {property.property_type}
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
            Rental Space
          </p>
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            {property.rental_space}
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
            Rental Price
          </p>
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            {property.rental_price ? (
              `${property.rental_price_currency || '$'}${property.rental_price}`
            ) : (
              'Not specified'
            )}
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
            Status
          </p>
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            Published
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
            Created Date
          </p>
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            {new Date(property.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {property.description && (
        <div className="mt-6">
          <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
            Description
          </p>
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            {property.description}
          </p>
        </div>
      )}

      <div className="mt-6">
        <Button
          size="sm"
          variant="outline"
          startIcon={
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
          }
          onClick={onEdit}
        >
          Edit
        </Button>
      </div>
    </div>
  );
};

// Property Details Card Component
const PropertyDetailsCard: React.FC<{ property: RealEstateProperty }> = ({ property }) => {
  return (
    <div>
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
        Property Details
      </h4>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
        <div>
          <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
            Bedrooms
          </p>
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            {property.num_bedroom || 'N/A'}
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
            Bathrooms
          </p>
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            {property.num_bathroom || 'N/A'}
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
            Area Size
          </p>
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            {property.gross_area_size ? (
              `${property.gross_area_size} ${property.gross_area_size_unit || 'sq ft'}`
            ) : (
              'Not specified'
            )}
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
            Furnished
          </p>
          <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
            {property.furnished || 'Not specified'}
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
            Pets Allowed
          </p>
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            {property.pets_allowed ? 'Yes' : 'No'}
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
            Availability Date
          </p>
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            {property.availability_date ? (
              new Date(property.availability_date).toLocaleDateString()
            ) : (
              'Not specified'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

// Property Address Card Component
const PropertyAddressCard: React.FC<{ property: RealEstateProperty }> = ({ property }) => {
  const address = property.address || {};
  const hasAddress = Object.values(address).some(value => value);

  return (
    <div>
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
        Address
      </h4>

      {hasAddress ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
          {address.unit && (
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Unit
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {address.unit}
              </p>
            </div>
          )}

          {address.floor && (
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Floor
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {address.floor}
              </p>
            </div>
          )}

          {address.street && (
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Street
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {address.street}
              </p>
            </div>
          )}

          {address.district && (
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                District
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {address.district}
              </p>
            </div>
          )}

          {address.state && (
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                State
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {address.state}
              </p>
            </div>
          )}

          {address.country && (
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Country
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {address.country}
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No address information available
        </p>
      )}
    </div>
  );
};

// Property Amenities Card Component
const PropertyAmenitiesCard: React.FC<{ property: RealEstateProperty }> = ({ property }) => {
  const amenities = property.amenities || {};
  const hasAmenities = Object.values(amenities).some(items => items && items.length > 0);

  return (
    <div>
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
        Amenities
      </h4>

      {hasAmenities ? (
        <div className="space-y-4">
          {Object.entries(amenities).map(([category, items]) => (
            items && items.length > 0 && (
              <div key={category}>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400 capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <div className="flex flex-wrap gap-2">
                  {items.map((item, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded dark:bg-blue-900 dark:text-blue-200"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No amenities listed
        </p>
      )}
    </div>
  );
};

// Main Property Detail Page Component
const PropertyDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<RealEstateProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const propertyId = params.id as string;

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        console.log('Fetching property with UUID:', propertyId);
        
        const property = await RealEstatePropertyServiceByUuid.getRealEstatePropertyByUuid(propertyId);
        
        if (property) {
          console.log('Property found by UUID:', property);
          setProperty(property);
        } else {
          console.log('Property not found by UUID');
          setError('Property not found');
        }
      } catch (err) {
        console.error('Error fetching property:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch property');
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  const handleEdit = () => {
    router.push(`/dashboard/properties/edit/${propertyId}`);
  };

  const handleBack = () => {
    router.push('/dashboard/properties');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-900/20 lg:p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
            Property not found
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error}
          </p>
          <Button onClick={handleBack}>
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Property not found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The property you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button onClick={handleBack}>
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

    return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={handleBack}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Properties
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {property.title}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Property ID: {property.property_uuid || property.id}
          </p>
        </div>
      </div>

      {/* Property Cards with White Background Wrapper */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Property Details
        </h3>
        <div className="space-y-6">
          <PropertyBasicInfoCard property={property} onEdit={handleEdit} />
          <PropertyDetailsCard property={property} />
          <PropertyAddressCard property={property} />
          <PropertyAmenitiesCard property={property} />
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;
