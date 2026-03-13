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
import { UserIcon } from "@/icons";

interface LandlordInfo {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
}

interface UserOption {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
}

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
  const [landlord, setLandlord] = useState<LandlordInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<RealEstatePropertyInsertInput>>({});
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferUsers, setTransferUsers] = useState<UserOption[]>([]);
  const [transferSearch, setTransferSearch] = useState("");
  const [transferSelectedId, setTransferSelectedId] = useState<string | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  const propertyId = params.id as string;

  const fetchProperty = useCallback(async () => {
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
        setLandlord(null);
        return;
      }

      const apiProperty = json.data?.property;
      const landlordData = json.data?.landlord as LandlordInfo | undefined;
      if (apiProperty) {
        const form = apiPropertyToFormData(apiProperty);
        setFormData(form);
        setProperty({
          id: String(apiProperty.id ?? ""),
          property_uuid: String(apiProperty.property_uuid ?? ""),
          landlord_firebase_uid: "",
          ...form,
        } as RealEstateProperty);
        setLandlord(landlordData ?? null);
      } else {
        setError("Property not found");
        setProperty(null);
        setLandlord(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch property");
      setProperty(null);
      setLandlord(null);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

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

  useEffect(() => {
    if (!transferModalOpen) return;
    const fetchUsers = async () => {
      setTransferLoading(true);
      try {
        const q = transferSearch ? `&search=${encodeURIComponent(transferSearch)}` : "";
        const res = await fetch(`/api/v1/users?limit=50&offset=0${q}`, {
          credentials: "include",
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTransferUsers(
            json.data.map((u: { id: string; name?: string | null; email?: string | null; avatar?: string | null }) => ({
              id: u.id,
              name: u.name ?? null,
              email: u.email ?? null,
              avatar: u.avatar ?? null,
            }))
          );
        } else {
          setTransferUsers([]);
        }
      } catch {
        setTransferUsers([]);
      } finally {
        setTransferLoading(false);
      }
    };
    fetchUsers();
  }, [transferModalOpen, transferSearch]);

  const handleTransferOwnership = async () => {
    if (!transferSelectedId) {
      showToast("error", "Please select a user");
      return;
    }
    setTransferSubmitting(true);
    try {
      const res = await fetch("/api/v1/properties/transfer-ownership", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          property_uuid: propertyId,
          new_owner_id: transferSelectedId,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Transfer failed");
      }
      showToast("success", "Ownership transferred successfully");
      setTransferModalOpen(false);
      setTransferSelectedId(null);
      setTransferSearch("");
      await fetchProperty();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to transfer ownership");
    } finally {
      setTransferSubmitting(false);
    }
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

        {/* Current Landlord & Transfer Ownership */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Landlord
                </h3>
                {landlord ? (
                  <div className="mt-1 flex items-center gap-2">
                    {landlord.avatar ? (
                      <img
                        src={landlord.avatar}
                        alt={landlord.name ?? "Landlord"}
                        className="h-8 w-8 rounded-full object-cover"
                        width={32}
                        height={32}
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                        <UserIcon className="h-4 w-4 text-gray-500" />
                      </div>
                    )}
                    <span className="text-gray-900 dark:text-white">
                      {landlord.name ?? landlord.email ?? "Unknown"}
                    </span>
                    {landlord.email && landlord.name && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({landlord.email})
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    No landlord assigned
                  </p>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setTransferSelectedId(null);
                setTransferSearch("");
                setTransferModalOpen(true);
              }}
            >
              Transfer Ownership
            </Button>
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

      {/* Transfer Ownership Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Transfer Ownership
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select a user to become the new owner of this property.
              </p>
            </div>
            <div className="p-4">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={transferSearch}
                onChange={(e) => setTransferSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600">
                {transferLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                  </div>
                ) : transferUsers.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    No users found
                  </p>
                ) : (
                  transferUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setTransferSelectedId(u.id)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        transferSelectedId === u.id
                          ? "bg-brand-50 dark:bg-brand-900/20"
                          : ""
                      }`}
                    >
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt=""
                          className="h-9 w-9 rounded-full object-cover"
                          width={36}
                          height={36}
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600">
                          <UserIcon className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {u.name ?? u.email ?? "Unknown"}
                        </p>
                        {u.email && u.name && (
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {u.email}
                          </p>
                        )}
                      </div>
                      {transferSelectedId === u.id && (
                        <span className="text-brand-600 dark:text-brand-400">✓</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setTransferModalOpen(false);
                  setTransferSelectedId(null);
                  setTransferSearch("");
                }}
                disabled={transferSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleTransferOwnership}
                disabled={!transferSelectedId || transferSubmitting}
              >
                {transferSubmitting ? "Transferring..." : "Transfer"}
              </Button>
            </div>
          </div>
        </div>
      )}

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
