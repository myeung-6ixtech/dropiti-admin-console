"use client";
import React from 'react';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { ImageUploadDnd } from '@/components/ui/image-upload-dnd';
import type { RealEstatePropertyInsertInput } from '@/app/graphql/types';

// Basic Information Section
export const BasicInfoSection: React.FC<{
  formData: Partial<RealEstatePropertyInsertInput>;
  onInputChange: (field: string, value: unknown) => void;
  showActions?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  saving?: boolean;
}> = ({ formData, onInputChange, showActions = false, onSave, onCancel, saving = false }) => {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Basic Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <Label>Listing Name *</Label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => onInputChange('title', e.target.value)}
                placeholder="e.g., Spacious 2BR Apartment in Central"
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
                <option value="serviced-apartment">Serviced Apartment</option>
                <option value="village-house">Village House</option>
                <option value="apartment">Apartment</option>
                <option value="condo">Condominium</option>
              </select>
            </div>

            <div>
              <Label>Rental Space *</Label>
              <select
                value={formData.rental_space || ''}
                onChange={(e) => onInputChange('rental_space', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select Rental Space</option>
                <option value="entire-apartment">Entire Apartment</option>
                <option value="partial-apartment">Partial Apartment</option>
                <option value="shared-space">Shared Space</option>
                <option value="private-room">Private Room</option>
              </select>
            </div>

            <div>
              <Label>Monthly Rental Price (HKD) *</Label>
              <input
                type="number"
                value={formData.rental_price || ''}
                onChange={(e) => onInputChange('rental_price', parseFloat(e.target.value) || null)}
                placeholder="e.g., 25000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <Label>Currency</Label>
              <select
                value={formData.rental_price_currency || 'HKD'}
                onChange={(e) => onInputChange('rental_price_currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="HKD">HKD (HK$)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div className="col-span-2">
              <Label>Description</Label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => onInputChange('description', e.target.value)}
                rows={4}
                placeholder="Describe the property, location benefits, and lease terms..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {showActions && (
          <div className="flex flex-col gap-3 lg:flex-row">
            <Button size="sm" variant="outline" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={onSave} disabled={saving}>
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
        )}
      </div>
    </div>
  );
};

// Property Details Section
export const PropertyDetailsSection: React.FC<{
  formData: Partial<RealEstatePropertyInsertInput>;
  onInputChange: (field: string, value: unknown) => void;
}> = ({ formData, onInputChange }) => {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
        Property Details
      </h4>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
        <div>
          <Label>Gross Area (sq ft)</Label>
          <input
            type="number"
            value={formData.gross_area_size || ''}
            onChange={(e) => onInputChange('gross_area_size', parseFloat(e.target.value) || null)}
            placeholder="e.g., 800"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <p className="text-xs text-gray-500 mt-1">Total area including walls</p>
        </div>

        <div>
          <Label>Area Unit</Label>
          <select
            value={formData.gross_area_size_unit || 'sqft'}
            onChange={(e) => onInputChange('gross_area_size_unit', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="sqft">Square Feet (sq ft)</option>
            <option value="sqm">Square Meters (sq m)</option>
          </select>
        </div>

        <div>
          <Label>Number of Bedrooms *</Label>
          <input
            type="number"
            min="0"
            max="10"
            value={formData.num_bedroom !== undefined ? formData.num_bedroom : ''}
            onChange={(e) => onInputChange('num_bedroom', parseInt(e.target.value) || 0)}
            placeholder="0 for studio"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            required
          />
          <p className="text-xs text-gray-500 mt-1">0 indicates a studio apartment</p>
        </div>

        <div>
          <Label>Number of Bathrooms *</Label>
          <input
            type="number"
            min="0"
            max="10"
            step="0.5"
            value={formData.num_bathroom !== undefined ? formData.num_bathroom : ''}
            onChange={(e) => onInputChange('num_bathroom', parseFloat(e.target.value) || 0)}
            placeholder="e.g., 1.5"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Half bathrooms allowed</p>
        </div>

        <div>
          <Label>Furnished</Label>
          <select
            value={formData.furnished || 'non-furnished'}
            onChange={(e) => onInputChange('furnished', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="non-furnished">Non-Furnished</option>
            <option value="partially">Partially Furnished</option>
            <option value="fully">Fully Furnished</option>
          </select>
        </div>

        <div>
          <Label>Available Date</Label>
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
  );
};

// Address Section
export const AddressSection: React.FC<{
  formData: Partial<RealEstatePropertyInsertInput>;
  onAddressChange: (field: string, value: string | boolean) => void;
}> = ({ formData, onAddressChange }) => {
  const selectedCountry = formData.address?.country || 'HK';
  
  // Hong Kong districts
  const hkDistricts = [
    // Hong Kong Island
    { value: 'central-western', label: 'Central and Western' },
    { value: 'eastern', label: 'Eastern' },
    { value: 'southern', label: 'Southern' },
    { value: 'wan-chai', label: 'Wan Chai' },
    // Kowloon
    { value: 'sham-shui-po', label: 'Sham Shui Po' },
    { value: 'kowloon-city', label: 'Kowloon City' },
    { value: 'kwun-tong', label: 'Kwun Tong' },
    { value: 'wong-tai-sin', label: 'Wong Tai Sin' },
    { value: 'yau-tsim-mong', label: 'Yau Tsim Mong' },
    // New Territories
    { value: 'islands', label: 'Islands' },
    { value: 'kwai-tsing', label: 'Kwai Tsing' },
    { value: 'north', label: 'North' },
    { value: 'sai-kung', label: 'Sai Kung' },
    { value: 'sha-tin', label: 'Sha Tin' },
    { value: 'tai-po', label: 'Tai Po' },
    { value: 'tsuen-wan', label: 'Tsuen Wan' },
    { value: 'tuen-mun', label: 'Tuen Mun' },
    { value: 'yuen-long', label: 'Yuen Long' },
  ];

  // Macau districts
  const moDistricts = [
    { value: 'nossa-senhora-fatima', label: 'Nossa Senhora de Fátima' },
    { value: 'santo-antonio', label: 'Santo António' },
    { value: 'se', label: 'Sé' },
    { value: 'sao-lazaro', label: 'São Lázaro' },
    { value: 'sao-lourenco', label: 'São Lourenço' },
    { value: 'taipa', label: 'Taipa' },
    { value: 'coloane', label: 'Coloane' },
    { value: 'cotai', label: 'Cotai' },
  ];

  const districts = selectedCountry === 'MO' ? moDistricts : hkDistricts;

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
        Location
      </h4>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
        {/* Building Details */}
        <div className="col-span-2">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Building Details
          </h5>
        </div>

        <div>
          <Label>Unit Number</Label>
          <input
            type="text"
            value={formData.address?.unit || ''}
            onChange={(e) => onAddressChange('unit', e.target.value)}
            placeholder="e.g., 1501"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <Label>Floor</Label>
          <input
            type="text"
            value={formData.address?.floor || ''}
            onChange={(e) => onAddressChange('floor', e.target.value)}
            placeholder="e.g., 15th"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <Label>Block</Label>
          <input
            type="text"
            value={formData.address?.block || ''}
            onChange={(e) => onAddressChange('block', e.target.value)}
            placeholder="e.g., Block A"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <Label>Building Name / Estate</Label>
          <input
            type="text"
            value={formData.address?.apartmentEstate || ''}
            onChange={(e) => onAddressChange('apartmentEstate', e.target.value)}
            placeholder="e.g., The Arch, Causeway Bay"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Location Details */}
        <div className="col-span-2 mt-4">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Location Details
          </h5>
        </div>

        <div className="col-span-2">
          <Label>Address Line 1 *</Label>
          <input
            type="text"
            value={formData.address?.street || ''}
            onChange={(e) => onAddressChange('street', e.target.value)}
            placeholder="e.g., 123 Hennessy Road"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div>
          <Label>Country *</Label>
          <select
            value={formData.address?.country || 'HK'}
            onChange={(e) => onAddressChange('country', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            required
          >
            <option value="HK">Hong Kong</option>
            <option value="MO">Macau</option>
          </select>
        </div>

        <div>
          <Label>District *</Label>
          <select
            value={formData.address?.district || ''}
            onChange={(e) => onAddressChange('district', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            required
          >
            <option value="">Select District</option>
            {districts.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>State/Region</Label>
          <input
            type="text"
            value={formData.address?.state || ''}
            onChange={(e) => onAddressChange('state', e.target.value)}
            placeholder="e.g., Hong Kong"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="col-span-2 mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.show_specific_location || false}
              onChange={(e) => onAddressChange('show_specific_location', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Show Specific Location
            </span>
            <span className="ml-2 text-xs text-gray-500">
              (Display full address to clients instead of just district)
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

// Amenities Section
export const AmenitiesSection: React.FC<{
  formData: Partial<RealEstatePropertyInsertInput>;
  onAmenitiesChange: (amenities: unknown) => void;
}> = ({ formData, onAmenitiesChange }) => {
  const amenitiesData = formData.amenities || { additionals: [] };
  const selectedAmenities = amenitiesData.additionals || [];

  const amenityCategories = [
    {
      name: 'Essential',
      items: [
        { value: 'wifi', label: 'WiFi' },
        { value: 'air-conditioning', label: 'Air Conditioning' },
        { value: 'heating', label: 'Heating' },
        { value: 'washer', label: 'Washing Machine' },
        { value: 'dryer', label: 'Dryer' },
      ]
    },
    {
      name: 'Kitchen',
      items: [
        { value: 'fridge', label: 'Fridge' },
        { value: 'microwave', label: 'Microwave' },
        { value: 'oven', label: 'Oven' },
        { value: 'dishwasher', label: 'Dishwasher' },
        { value: 'gas-stove', label: 'Gas Stove' },
        { value: 'induction-stove', label: 'Induction Stove' },
      ]
    },
    {
      name: 'Entertainment & Recreation',
      items: [
        { value: 'tv', label: 'TV' },
        { value: 'gym', label: 'Gym' },
        { value: 'pool', label: 'Swimming Pool' },
      ]
    },
    {
      name: 'Safety & Security',
      items: [
        { value: 'security', label: 'Security System' },
        { value: 'smoke-alarm', label: 'Smoke Alarm' },
      ]
    },
    {
      name: 'Building Features',
      items: [
        { value: 'elevator', label: 'Elevator' },
        { value: 'parking', label: 'Parking' },
        { value: 'balcony', label: 'Balcony' },
      ]
    },
    {
      name: 'Bathroom',
      items: [
        { value: 'bathtub', label: 'Bathtub' },
        { value: 'shower', label: 'Shower' },
        { value: 'hair-dryer', label: 'Hair Dryer' },
        { value: 'exhaust-fan', label: 'Exhaust Fan' },
        { value: 'dehumidifier', label: 'Dehumidifier' },
      ]
    },
  ];

  const toggleAmenity = (value: string) => {
    const newSelected = selectedAmenities.includes(value)
      ? selectedAmenities.filter((a: string) => a !== value)
      : [...selectedAmenities, value];
    
    onAmenitiesChange({ ...amenitiesData, additionals: newSelected });
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
        Amenities
      </h4>

      <div className="space-y-6">
        {amenityCategories.map((category) => (
          <div key={category.name}>
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {category.name}
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {category.items.map((item) => (
                <label
                  key={item.value}
                  className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(item.value)}
                    onChange={() => toggleAmenity(item.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm text-gray-500">
        Selected: {selectedAmenities.length} amenity(ies)
      </p>
    </div>
  );
};

// Photos Section
export const PhotosSection: React.FC<{
  formData: Partial<RealEstatePropertyInsertInput>;
  onInputChange: (field: string, value: unknown) => void;
  mediaPickerOpen: boolean;
  onMediaPickerOpenChange: (open: boolean) => void;
  onMediaSelect: (urls: string[]) => void;
  disabled?: boolean;
}> = ({ 
  formData, 
  onInputChange, 
  disabled = false 
}) => {
  const images = formData.uploaded_images || [];
  const featuredImage = formData.display_image || null;

  const handleImagesChange = (newImages: string[]) => {
    onInputChange('uploaded_images', newImages);
    
    // If featured image is not in the new list, clear it
    if (featuredImage && !newImages.includes(featuredImage)) {
      onInputChange('display_image', null);
    }
  };

  const handleFeaturedImageChange = (url: string | null) => {
    onInputChange('display_image', url || null);
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
            Photos
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Upload into the Media Library, then select images here. Drag to reorder below. Click the star to set a featured image.
          </p>

          <button
            type="button"
            onClick={() => onMediaPickerOpenChange(true)}
            disabled={disabled}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            Choose from Media Library
          </button>

          <ImageUploadDnd
            images={images}
            onImagesChange={handleImagesChange}
            featuredImageUrl={featuredImage || undefined}
            onFeaturedImageChange={handleFeaturedImageChange}
            maxImages={20}
            disabled={disabled}
            hideDropzone={true}
          />

          {images.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              No images selected yet. Click &quot;Choose from Media Library&quot; to add images.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
