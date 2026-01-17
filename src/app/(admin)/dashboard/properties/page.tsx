"use client";
import React, { useState, useEffect } from 'react';
import { EyeIcon, PencilIcon } from '@/icons';
import { RealEstatePropertyService } from '@/app/graphql/services/realEstatePropertyService';
import { RealEstateProperty } from '@/app/graphql/types';

const PropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<RealEstateProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        console.log('Fetching properties...');
        
        // Try the service first
        try {
          const result = await RealEstatePropertyService.getRealEstateProperties({ limit: 10 });
          console.log('Properties result:', result);
          setProperties(result.data);
        } catch (serviceError) {
          console.error('Service error:', serviceError);
          
          // Fallback to direct GraphQL call
          console.log('Trying direct GraphQL call...');
          
          // First test basic connection
          try {
            const testResponse = await fetch('/api/graphql', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                query: `
                  query {
                    __schema {
                      types {
                        name
                      }
                    }
                  }
                `
              }),
            });

            if (testResponse.ok) {
              const testResult = await testResponse.json();
              console.log('Schema test result:', testResult);
            }
          } catch (testError) {
            console.error('Schema test error:', testError);
          }
          
          const response = await fetch('/api/graphql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `
                query {
                  real_estate_property_listing(limit: 10) {
                    id
                    property_uuid
                    title
                    description
                    rental_price
                    rental_price_currency
                  }
                }
              `
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          console.log('Direct GraphQL result:', result);
          
          if (result.data && result.data.real_estate_property_listing) {
            setProperties(result.data.real_estate_property_listing);
          } else {
            setProperties([]);
          }
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch properties');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading properties...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Properties
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and view all real estate properties
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/dashboard/properties/add'}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Property
        </button>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No properties found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There are no properties available at the moment.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {property.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                    {property.description || <span className="italic text-gray-400">No description</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700 dark:text-green-400">
                    {property.rental_price ? (
                      <span>
                        {property.rental_price_currency || '$'}{property.rental_price}
                      </span>
                    ) : (
                      <span className="italic text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const uuid = property.property_uuid || property.id;
                          window.location.href = `/dashboard/properties/${uuid}`;
                        }}
                        className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300"
                        title="View property details"
                      >
                        <EyeIcon />
                      </button>
                      <button
                        onClick={() => {
                          const uuid = property.property_uuid || property.id;
                          window.location.href = `/dashboard/properties/edit/${uuid}`;
                        }}
                        className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300"
                        title="Edit property"
                      >
                        <PencilIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PropertiesPage;
