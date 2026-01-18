"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RealEstatePropertyServiceByUuid } from '@/app/graphql/services/realEstatePropertyServiceByUuid';
import { RealEstateProperty, RealEstatePropertyInsertInput } from '@/app/graphql/types';
import Button from '@/components/ui/button/Button';
import { useToast } from '@/context/ToastContext';
import { MediaLibraryPickerDialog } from '@/components/ui/media-library-picker-dialog';
import {
  BasicInfoSection,
  PropertyDetailsSection,
  AddressSection,
  AmenitiesSection,
  PhotosSection,
} from '@/components/properties/shared/PropertyFormSections';

// Main Property Edit Page Component
const PropertyEditPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [property, setProperty] = useState<RealEstateProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<RealEstatePropertyInsertInput>>({});

  const propertyId = params.id as string;

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const fetchedProperty = await RealEstatePropertyServiceByUuid.getRealEstatePropertyByUuid(propertyId);
        
        if (fetchedProperty) {
          setProperty(fetchedProperty);
          setFormData({
            title: fetchedProperty.title,
            description: fetchedProperty.description,
            property_type: fetchedProperty.property_type,
            rental_space: fetchedProperty.rental_space,
            address: fetchedProperty.address,
            show_specific_location: fetchedProperty.show_specific_location,
            gross_area_size: fetchedProperty.gross_area_size,
            gross_area_size_unit: fetchedProperty.gross_area_size_unit,
            num_bedroom: fetchedProperty.num_bedroom,
            num_bathroom: fetchedProperty.num_bathroom,
            furnished: fetchedProperty.furnished,
            pets_allowed: fetchedProperty.pets_allowed,
            amenities: fetchedProperty.amenities,
            display_image: fetchedProperty.display_image,
            uploaded_images: fetchedProperty.uploaded_images,
            rental_price: fetchedProperty.rental_price,
            rental_price_currency: fetchedProperty.rental_price_currency,
            availability_date: fetchedProperty.availability_date,
          });
        } else {
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

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handleAmenitiesChange = (amenities: {
    kitchen?: string[];
    bathroom?: string[];
    furnitures?: string[];
    additionals?: string[];
    electricalAppliances?: string[];
  }) => {
    setFormData(prev => ({
      ...prev,
      amenities,
    }));
  };

  const handleMediaSelect = useCallback((urls: string[]) => {
    if (!urls || urls.length === 0) return;
    
    // Add URLs to uploaded_images array, preventing duplicates
    setFormData((prev) => {
      const currentImages = prev.uploaded_images || [];
      const newImages = Array.from(new Set([...currentImages, ...urls]));
      
      // Auto-set first image as featured if no featured image exists
      const displayImage = prev.display_image || urls[0];
      
      return {
        ...prev,
        uploaded_images: newImages,
        display_image: displayImage,
      };
    });
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);      
      // Show a loading toast immediately
      showToast('info', 'Updating property...');
      
      const updatedProperty = await RealEstatePropertyServiceByUuid.updateRealEstatePropertyByUuid(propertyId, formData);
      
      console.log('Update result:', updatedProperty);
      
      if (updatedProperty) {
        console.log('Property updated successfully, showing success toast...');
        showToast('success', 'Property has successfully been updated!');
        
        // Redirect immediately after showing success toast
        console.log('Redirecting to property detail page...');
        router.push(`/dashboard/properties/${propertyId}`);
      } else {
        console.log('Update returned null, throwing error...');
        throw new Error('Failed to update property - no data returned');
      }
    } catch (err) {
      console.error('Error updating property:', err);
      setError(err instanceof Error ? err.message : 'Failed to update property');
      showToast('error', 'Failed to update property. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/properties/${propertyId}`);
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
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
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
              Edit Property
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Property ID: {property.property_uuid || property.id}
            </p>
          </div>
        </div>

        {/* Edit Form Cards */}
        <div className="space-y-6">
          <BasicInfoSection
            formData={formData}
            onInputChange={handleInputChange}
            showActions={true}
            onSave={handleSave}
            onCancel={handleCancel}
            saving={saving}
          />

          <AddressSection
            formData={formData}
            onAddressChange={handleAddressChange}
          />

          <PropertyDetailsSection
            formData={formData}
            onInputChange={handleInputChange}
          />

          <AmenitiesSection
            formData={formData}
            onAmenitiesChange={handleAmenitiesChange}
          />

          <PhotosSection
            formData={formData}
            onInputChange={handleInputChange}
            mediaPickerOpen={mediaPickerOpen}
            onMediaPickerOpenChange={setMediaPickerOpen}
            onMediaSelect={handleMediaSelect}
            disabled={saving}
          />
        </div>
      </div>

      {/* Media Library Picker Dialog */}
      <MediaLibraryPickerDialog
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={handleMediaSelect}
        maxSelect={20}
      />
    </div>
  );
};

export default PropertyEditPage;
