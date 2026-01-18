"use client";
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/button/Button';
import { MediaLibraryPickerDialog } from '@/components/ui/media-library-picker-dialog';
import type { RealEstatePropertyInsertInput } from '@/app/graphql/types';
import {
  BasicInfoSection,
  PropertyDetailsSection,
  AddressSection,
  AmenitiesSection,
  PhotosSection,
} from '@/components/properties/shared/PropertyFormSections';

const AddPropertyPage: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<RealEstatePropertyInsertInput>>({
    // Set defaults
    rental_price_currency: 'HKD',
    gross_area_size_unit: 'sqft',
    furnished: 'non-furnished',
    pets_allowed: false,
    show_specific_location: false,
    uploaded_images: [],
    address: {
      country: 'HK',
    },
    amenities: {
      additionals: [],
    },
  });

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  const handleAmenitiesChange = (amenities: {
    kitchen?: string[];
    bathroom?: string[];
    furnitures?: string[];
    additionals?: string[];
    electricalAppliances?: string[];
  }) => {
    setFormData((prev) => ({
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

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.title) errors.push('Listing name is required');
    if (!formData.property_type) errors.push('Property type is required');
    if (!formData.rental_space) errors.push('Rental space is required');
    if (!formData.rental_price) errors.push('Rental price is required');
    if (!formData.address?.street) errors.push('Address is required');
    if (!formData.address?.district) errors.push('District is required');
    if (formData.num_bedroom === undefined) errors.push('Number of bedrooms is required');
    if (formData.num_bathroom === undefined) errors.push('Number of bathrooms is required');
    if (!formData.display_image) errors.push('At least one photo is required');

    if (errors.length > 0) {
      showToast('error', errors[0]);
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      showToast('info', 'Creating property...');

      const response = await fetch('/api/v1/properties/create-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          landlord_firebase_uid: 'admin-user', // Replace with actual admin user ID
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create property');
      }

      const result = await response.json();
      showToast('success', 'Property created successfully!');
      
      // Redirect to property detail page
      if (result.data?.property_uuid) {
        router.push(`/dashboard/properties/${result.data.property_uuid}`);
      } else if (result.data?.id) {
        router.push(`/dashboard/properties/${result.data.id}`);
      } else {
        router.push('/dashboard/properties');
      }
    } catch (err) {
      console.error('Error creating property:', err);
      showToast(
        'error',
        err instanceof Error ? err.message : 'Failed to create property'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      router.push('/dashboard/properties');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/properties')}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Properties
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Add New Property
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Fill in all required fields to create a new property listing
          </p>
        </div>

        {/* Form Sections */}
        <div className="space-y-6">
          <BasicInfoSection
            formData={formData}
            onInputChange={handleInputChange}
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

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end gap-4">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </div>
            ) : (
              'Create Property'
            )}
          </Button>
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

export default AddPropertyPage;
