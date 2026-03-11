"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { RealEstateProperty, RealEstatePropertyInsertInput } from "@/app/graphql/types";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/context/ToastContext";
import { MediaLibraryPickerDialog } from "@/components/ui/media-library-picker-dialog";
import {
  BasicInfoSection,
  PropertyDetailsSection,
  AddressSection,
  AmenitiesSection,
  PhotosSection,
} from "@/components/properties/shared/PropertyFormSections";

/** Map API get-property-by-uuid property to form data shape */
function apiPropertyToFormData(apiProperty: Record<string, unknown>): Partial<RealEstatePropertyInsertInput> {
  const amenities = apiProperty.amenities;
  const amenitiesObj =
    Array.isArray(amenities)
      ? { additionals: amenities as string[] }
      : (amenities as RealEstatePropertyInsertInput["amenities"]) || {};
  return {
    title: String(apiProperty.title ?? ""),
    description: String(apiProperty.description ?? ""),
    property_type: String(apiProperty.property_type ?? ""),
    rental_space: String(apiProperty.rental_space ?? ""),
    address: (apiProperty.address as RealEstatePropertyInsertInput["address"]) || {},
    show_specific_location: Boolean(apiProperty.show_specific_location),
    gross_area_size: apiProperty.gross_area_size as number | undefined,
    gross_area_size_unit: String(apiProperty.gross_area_size_unit ?? "sqft"),
    num_bedroom: Number(apiProperty.num_bedroom ?? 0),
    num_bathroom: Number(apiProperty.num_bathroom ?? 0),
    furnished: String(apiProperty.furnished ?? "none"),
    pets_allowed: Boolean(apiProperty.pets_allowed),
    amenities: amenitiesObj,
    display_image: String(apiProperty.display_image ?? ""),
    uploaded_images: (apiProperty.uploaded_images as string[]) || [],
    rental_price: Number(apiProperty.rental_price ?? 0),
    rental_price_currency: String(apiProperty.rental_price_currency ?? "HKD"),
    availability_date: String(apiProperty.availability_date ?? ""),
  };
}

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
      if (!propertyId) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/v1/properties/get-property-by-uuid?property_uuid=${encodeURIComponent(propertyId)}`,
          { credentials: "include" }
        );
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error || "Property not found");
          setProperty(null);
          return;
        }

        const apiProperty = json.data?.property;
        if (apiProperty) {
          const form = apiPropertyToFormData(apiProperty);
          setFormData(form);
          setProperty({
            id: String(apiProperty.id ?? ""),
            property_uuid: String(apiProperty.property_uuid ?? ""),
            landlord_firebase_uid: "",
            ...form,
          } as RealEstateProperty);
        } else {
          setError("Property not found");
          setProperty(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch property");
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
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
      showToast("info", "Updating property...");

      const res = await fetch("/api/v1/properties/update-property", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: propertyId, updates: formData }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update property");
      }

      showToast("success", "Property has successfully been updated!");
      router.push(`/dashboard/properties/${propertyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update property");
      showToast("error", "Failed to update property. Please try again.");
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
