"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RealEstatePropertyServiceByUuid } from '@/app/graphql/services/realEstatePropertyServiceByUuid';
import { RealEstatePropertyService } from '@/app/graphql/services/realEstatePropertyService';
import { RealEstateProperty, RealEstatePropertyInsertInput } from '@/app/graphql/types';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import { useToast } from '@/context/ToastContext';
import { DEFAULT_PROPERTY_CONFIG } from '@/utils/propertyConfig';

// Editable Basic Info Card Component
const EditableBasicInfoCard: React.FC<{ 
  formData: Partial<RealEstatePropertyInsertInput>; 
  onInputChange: (field: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}> = ({ formData, onInputChange, onSave, onCancel, saving }) => {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Basic Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <Label>Title *</Label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => onInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <Label>Property Type *</Label>
              <select
                value={formData.property_type || ''}
                onChange={(e) => onInputChange('property_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select Property Type</option>
                {DEFAULT_PROPERTY_CONFIG.propertyTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Rental Space *</Label>
              <input
                type="text"
                value={formData.rental_space || ''}
                onChange={(e) => onInputChange('rental_space', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <Label>Rental Price</Label>
              <input
                type="number"
                value={formData.rental_price || ''}
                onChange={(e) => onInputChange('rental_price', parseFloat(e.target.value) || null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <Label>Currency</Label>
              <select
                value={formData.rental_price_currency || '$'}
                onChange={(e) => onInputChange('rental_price_currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="$">USD ($)</option>
                <option value="€">EUR (€)</option>
                <option value="£">GBP (£)</option>
                <option value="¥">JPY (¥)</option>
              </select>
            </div>

            <div>
              <Label>Status</Label>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={formData.is_public || false}
                  onChange={(e) => onInputChange('is_public', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Public Listing
                </span>
              </div>
            </div>
          </div>

          {formData.description !== undefined && (
            <div className="mt-6">
              <Label>Description</Label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => onInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row">
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};


// Editable Property Details Card Component
const EditablePropertyDetailsCard: React.FC<{ 
  formData: Partial<RealEstatePropertyInsertInput>; 
  onInputChange: (field: string, value: any) => void;
}> = ({ formData, onInputChange }) => {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div>
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
          Property Details
        </h4>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
          <div>
            <Label>Bedrooms</Label>
            <input
              type="number"
              value={formData.num_bedroom || ''}
              onChange={(e) => onInputChange('num_bedroom', parseInt(e.target.value) || null)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <Label>Bathrooms</Label>
            <input
              type="number"
              value={formData.num_bathroom || ''}
              onChange={(e) => onInputChange('num_bathroom', parseInt(e.target.value) || null)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <Label>Area Size</Label>
            <input
              type="number"
              value={formData.gross_area_size || ''}
              onChange={(e) => onInputChange('gross_area_size', parseFloat(e.target.value) || null)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <Label>Area Unit</Label>
            <select
              value={formData.gross_area_size_unit || 'sq ft'}
              onChange={(e) => onInputChange('gross_area_size_unit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="sq ft">Square Feet</option>
              <option value="sq m">Square Meters</option>
              <option value="sq yd">Square Yards</option>
            </select>
          </div>

          <div>
            <Label>Furnished</Label>
            <select
              value={formData.furnished || 'none'}
              onChange={(e) => onInputChange('furnished', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="none">None</option>
              <option value="partial">Partial</option>
              <option value="full">Full</option>
            </select>
          </div>

          <div>
            <Label>Availability Date</Label>
            <input
              type="date"
              value={formData.availability_date ? formData.availability_date.split('T')[0] : ''}
              onChange={(e) => onInputChange('availability_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="col-span-2">
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.pets_allowed || false}
                  onChange={(e) => onInputChange('pets_allowed', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Pets Allowed
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Editable Address Card Component
const EditableAddressCard: React.FC<{ 
  formData: Partial<RealEstatePropertyInsertInput>; 
  onAddressChange: (field: string, value: string) => void;
}> = ({ formData, onAddressChange }) => {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div>
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
          Address
        </h4>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
          <div>
            <Label>Unit</Label>
            <input
              type="text"
              value={formData.address?.unit || ''}
              onChange={(e) => onAddressChange('unit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <Label>Floor</Label>
            <input
              type="text"
              value={formData.address?.floor || ''}
              onChange={(e) => onAddressChange('floor', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <Label>Street</Label>
            <input
              type="text"
              value={formData.address?.street || ''}
              onChange={(e) => onAddressChange('street', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <Label>District</Label>
            <input
              type="text"
              value={formData.address?.district || ''}
              onChange={(e) => onAddressChange('district', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <Label>State</Label>
            <input
              type="text"
              value={formData.address?.state || ''}
              onChange={(e) => onAddressChange('state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <Label>Country</Label>
            <input
              type="text"
              value={formData.address?.country || ''}
              onChange={(e) => onAddressChange('country', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Editable Images Card Component
const EditableImagesCard: React.FC<{ 
  formData: Partial<RealEstatePropertyInsertInput>; 
  onInputChange: (field: string, value: any) => void;
}> = ({ formData, onInputChange }) => {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div>
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
          Images
        </h4>

        <div className="space-y-4">
          <div>
            <Label>Display Image URL</Label>
            <input
              type="url"
              value={formData.display_image || ''}
              onChange={(e) => onInputChange('display_image', e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <Label>Additional Images (comma-separated URLs)</Label>
            <textarea
              value={formData.uploaded_images?.join(', ') || ''}
              onChange={(e) => onInputChange('uploaded_images', e.target.value.split(',').map(url => url.trim()).filter(url => url))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Property Edit Page Component
const PropertyEditPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [property, setProperty] = useState<RealEstateProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
            is_public: fetchedProperty.is_public,
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);      
      // Show a loading toast immediately
      showToast('info', 'Updating property...', 2000);
      
      const updatedProperty = await RealEstatePropertyServiceByUuid.updateRealEstatePropertyByUuid(propertyId, formData);
      
      console.log('Update result:', updatedProperty);
      
      if (updatedProperty) {
        console.log('Property updated successfully, showing success toast...');
        showToast('success', 'Property has successfully been updated!', 2000);
        
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
      showToast('error', 'Failed to update property. Please try again.', 5000);
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
            The property you're looking for doesn't exist.
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
            <button
              onClick={() => showToast('success', 'Test toast - Property edit system is working!')}
              className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Toast
            </button>
          </div>
        </div>

        {/* Edit Form Cards */}
        <div className="space-y-6">
          <EditableBasicInfoCard 
            formData={formData} 
            onInputChange={handleInputChange}
            onSave={handleSave}
            onCancel={handleCancel}
            saving={saving}
          />
          <EditablePropertyDetailsCard 
            formData={formData} 
            onInputChange={handleInputChange}
          />
          <EditableAddressCard 
            formData={formData} 
            onAddressChange={handleAddressChange}
          />
          <EditableImagesCard 
            formData={formData} 
            onInputChange={handleInputChange}
          />
        </div>
      </div>
    </div>
  );
};

export default PropertyEditPage;
