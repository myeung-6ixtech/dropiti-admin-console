# Hasura GraphQL Client

> **Deprecated for this app:** Dashboard data must use **Nhost Functions** via `src/lib/admin-api.ts` (BFF). Do not point this client at Hasura using an **admin** role secret from the console.

This directory contains legacy GraphQL client setup. **Prefer `admin-api.ts` + `api-doc-v1.md` for all dashboard data.**

## Environment Variables

**Admin console:** Do not set GraphQL admin credentials here. Use `NEXT_PUBLIC_FUNCTIONS_URL` and the BFF (see root `.env.example`).

**Standalone scripts (optional):** If you run one-off scripts outside Nhost Functions, supply your own Hasura URL and role-appropriate token in a **non-committed** env file — never commit admin secrets.

## Usage

### Basic Usage

```typescript
import { hasuraClient, executeQuery, executeMutation } from '@/app/graphql';

// Execute a query
const result = await executeQuery(`
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`);

// Execute a mutation
const result = await executeMutation(`
  mutation CreateUser($object: users_insert_input!) {
    insert_users_one(object: $object) {
      id
      name
      email
    }
  }
`, { object: { name: 'John Doe', email: 'john@example.com' } });
```

### Using the Real Estate Service

```typescript
import { RealEstateService } from '@/app/graphql';

// Get all properties with pagination
const properties = await RealEstateService.getPropertyListings({
  limit: 10,
  offset: 0
});

// Get a single property
const property = await RealEstateService.getPropertyById('property-id');

// Create a new property
const newProperty = await RealEstateService.createProperty({
  title: 'Beautiful House',
  description: 'A lovely 3-bedroom house',
  price: 500000,
  address: '123 Main St'
});

// Update a property
const updatedProperty = await RealEstateService.updateProperty('property-id', {
  price: 550000
});

// Delete a property
const deletedProperty = await RealEstateService.deleteProperty('property-id');

// Search properties
const searchResults = await RealEstateService.searchProperties('house');
```

### User-Specific Client

For operations that require user authentication:

```typescript
import { createUserClient } from '@/app/graphql';

const userClient = createUserClient('user-jwt-token');

const result = await userClient.request(`
  query GetUserProfile {
    users_by_pk(id: "user-id") {
      id
      name
      email
    }
  }
`);
```

## File Structure

```
src/app/graphql/
├── client.ts          # Main GraphQL client configuration
├── types.ts           # TypeScript type definitions
├── services/
│   └── realEstateService.ts  # Example service for real estate operations
├── index.ts           # Export all modules
└── README.md          # This documentation
```

## Error Handling

The client includes built-in error handling:

```typescript
try {
  const result = await executeQuery(query, variables);
  // Handle success
} catch (error) {
  console.error('GraphQL error:', error);
  // Handle error
}
```

## Adding New Services

To add a new service for different entities:

1. Create a new service file in `services/`
2. Define your GraphQL queries and mutations
3. Create service methods using `executeQuery` and `executeMutation`
4. Export the service from `index.ts`

Example:

```typescript
// services/userService.ts
import { executeQuery, executeMutation } from '../client';

export class UserService {
  static async getUsers() {
    return await executeQuery(`
      query GetUsers {
        users {
          id
          name
          email
        }
      }
    `);
  }
}
```

## Security Notes

- The `hasuraClient` uses the admin secret for server-side operations
- Use `createUserClient` with user tokens for client-side operations
- Never expose the admin secret in client-side code
- Always validate user permissions in your Hasura rules 