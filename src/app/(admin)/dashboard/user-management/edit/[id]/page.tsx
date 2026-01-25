"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, UserIcon, MailIcon } from "@/icons";
import { useToast } from "@/context/ToastContext";
import { MediaLibraryPickerDialog } from "@/components/ui/media-library-picker-dialog";
import Image from "next/image";

interface AdministratorUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  address?: string;
  business_type?: string;
  company_name?: string;
  description?: string;
  status: string;
  role_id?: string;
  permissions?: string[];
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export default function EditUser() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    avatar: "",
    address: "",
    business_type: "",
    company_name: "",
    description: "",
    status: "active",
    role_id: "viewer",
    password: "",
    confirmPassword: "",
  });

  const fetchRoles = useCallback(async () => {
    try {
      const query = `
        query GetRoles {
          real_estate_admin_roles {
            id
            name
          }
        }
      `;

      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      if (data.data?.real_estate_admin_roles) {
        setRoles(data.data.real_estate_admin_roles);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/users/get-user-by-id?id=${userId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch user");
      }

      const user: AdministratorUser = result.data;
      
      setFormData({
        email: user.email || "",
        name: user.name || "",
        phone: user.phone || "",
        avatar: user.avatar || "",
        address: user.address || "",
        business_type: user.business_type || "",
        company_name: user.company_name || "",
        description: user.description || "",
        status: user.status || "active",
        role_id: user.role_id || "viewer",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      showToast('error', err instanceof Error ? err.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, [userId, showToast]);

  useEffect(() => {
    if (userId) {
      fetchUser();
      fetchRoles();
    }
  }, [userId, fetchUser, fetchRoles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Validate password if provided
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setSaving(false);
      return;
    }

    if (formData.password && formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setSaving(false);
      return;
    }

    try {
      const updates: Record<string, unknown> = {
        email: formData.email,
        name: formData.name,
        phone: formData.phone || null,
        avatar: formData.avatar || null,
        address: formData.address || null,
        business_type: formData.business_type || null,
        company_name: formData.company_name || null,
        description: formData.description || null,
        status: formData.status,
        role_id: formData.role_id,
      };

      // Only include password if provided
      if (formData.password) {
        updates.password = formData.password;
      }

      const response = await fetch("/api/v1/users/update-user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: userId,
          updates,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update user");
      }

      showToast('success', 'User updated successfully');
      router.push("/dashboard/user-management");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update user";
      setError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading user...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !formData.email) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ChevronLeftIcon />
            Back
          </Button>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ChevronLeftIcon />
          Back
        </Button>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Edit Administrator User
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update user information and permissions
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <UserIcon />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Basic Information
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Profile Image
              </label>
              <div className="flex items-center gap-4">
                {/* Avatar Preview */}
                <div className="relative">
                  {formData.avatar ? (
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                      <Image
                        src={formData.avatar}
                        alt="Profile avatar"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                      <UserIcon className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Avatar Actions */}
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMediaPickerOpen(true)}
                  >
                    Choose from Media Library
                  </Button>
                  {formData.avatar && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, avatar: "" }));
                      }}
                    >
                      Remove Image
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Business Type
              </label>
              <input
                type="text"
                name="business_type"
                value={formData.business_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <MailIcon />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Account Settings
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role *
              </label>
              <select
                name="role_id"
                value={formData.role_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Password Change (Optional) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Change Password (Optional)
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Leave blank to keep current password
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center font-medium gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Media Library Picker Dialog */}
      <MediaLibraryPickerDialog
        open={isMediaPickerOpen}
        onOpenChange={setIsMediaPickerOpen}
        onSelect={(urls) => {
          if (urls.length > 0) {
            setFormData(prev => ({ ...prev, avatar: urls[0] }));
          }
        }}
        title="Select Profile Image"
        description="Choose an image from the media library or upload a new one"
        maxSelect={1}
        allowUpload={true}
      />
    </div>
  );
}
