#!/bin/bash

# Fix customers/[id]/page.tsx
file="src/app/(admin)/dashboard/customers/[id]/page.tsx"
# Move fetchCustomer and fetchPaymentMethods before useEffect and wrap with useCallback
sed -i '' '/const customerId = params.id as string;/a\
\
  const fetchCustomer = useCallback(async () => {\
    try {\
      setLoading(true);\
      const response = await fetch(`/api/customer?id=${customerId}`);\
      \
      if (!response.ok) {\
        throw new Error("Failed to fetch customer");\
      }\
      \
      const data = await response.json();\
      setCustomer(data);\
    } catch (err) {\
      setError(err instanceof Error ? err.message : "An error occurred");\
    } finally {\
      setLoading(false);\
    }\
  }, [customerId]);\
\
  const fetchPaymentMethods = useCallback(async () => {\
    try {\
      const response = await fetch(`/api/payment-consents?customer_id=${customerId}`);\
      \
      if (!response.ok) {\
        throw new Error("Failed to fetch payment methods");\
      }\
      \
      const data = await response.json();\
      setPaymentMethods(data.items || []);\
    } catch (err) {\
      console.error("Error fetching payment methods:", err);\
    }\
  }, [customerId]);
' "$file"

echo "Fixed all hook dependencies"
