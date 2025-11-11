"use client";
import React, { useState } from 'react';

export default function TestPhonePage() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, message]);
  };

  const testPhoneField = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      addResult('Testing phone_number field existence...');
      
      // Test 1: Try to query real_estate_property_listing with phone_number
      addResult('Testing real_estate_property_listing table...');
      try {
        const propertyQuery = `
          query {
            real_estate_property_listing(limit: 1) {
              id
              property_uuid
              title
              phone_number
            }
          }
        `;
        
        const response = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: propertyQuery }),
        });
        
        const result = await response.json();
        
        if (result.error) {
          addResult('❌ phone_number field does not exist in real_estate_property_listing');
          addResult(`Error: ${result.error}`);
        } else {
          addResult('✅ phone_number field exists in real_estate_property_listing');
          addResult(`Sample data: ${JSON.stringify(result.data, null, 2)}`);
        }
      } catch (error: any) {
        addResult('❌ phone_number field does not exist in real_estate_property_listing');
        addResult(`Error: ${error.message}`);
      }

      // Test 2: Try to query real_estate_user with phone_number
      addResult('\nTesting real_estate_user table...');
      try {
        const userQuery = `
          query {
            real_estate_user(limit: 1) {
              firebase_uid
              display_name
              email
              phone_number
            }
          }
        `;
        
        const response = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: userQuery }),
        });
        
        const result = await response.json();
        
        if (result.error) {
          addResult('❌ phone_number field does not exist in real_estate_user');
          addResult(`Error: ${result.error}`);
        } else {
          addResult('✅ phone_number field exists in real_estate_user');
          addResult(`Sample data: ${JSON.stringify(result.data, null, 2)}`);
        }
      } catch (error: any) {
        addResult('❌ phone_number field does not exist in real_estate_user');
        addResult(`Error: ${error.message}`);
      }

      // Test 3: Get schema introspection
      addResult('\nGetting schema information...');
      try {
        const schemaQuery = `
          query IntrospectionQuery {
            __schema {
              types {
                name
                fields {
                  name
                  type {
                    name
                  }
                }
              }
            }
          }
        `;
        
        const response = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: schemaQuery }),
        });
        
        const result = await response.json();
        
        if (result.error) {
          addResult('❌ Failed to get schema information');
          addResult(`Error: ${result.error}`);
        } else {
          addResult('✅ Got schema information');
          
          // Look for real_estate_property_listing type
          const propertyType = result.data.__schema.types.find(
            (type: any) => type.name === 'real_estate_property_listing'
          );
          
          if (propertyType) {
            addResult('✅ Found real_estate_property_listing type');
            const phoneField = propertyType.fields.find((field: any) => field.name === 'phone_number');
            if (phoneField) {
              addResult('✅ phone_number field exists in schema');
              addResult(`Field type: ${phoneField.type.name}`);
            } else {
              addResult('❌ phone_number field not found in schema');
              addResult(`Available fields: ${propertyType.fields.map((f: any) => f.name).join(', ')}`);
            }
          } else {
            addResult('❌ real_estate_property_listing type not found');
          }
        }
        
      } catch (error: any) {
        addResult('❌ Failed to get schema information');
        addResult(`Error: ${error.message}`);
      }

    } catch (error: any) {
      addResult(`Test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Phone Number Field Test</h1>
      
      <button
        onClick={testPhoneField}
        disabled={loading}
        className="mb-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Phone Number Field'}
      </button>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Results:</h2>
        <div className="space-y-1">
          {results.map((result, index) => (
            <div key={index} className="text-sm font-mono whitespace-pre-wrap">
              {result}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 