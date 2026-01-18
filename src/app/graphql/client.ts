// Client-side GraphQL client that uses the server-side API route
const executeGraphQLRequest = async <T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T> => {
  try {
    const response = await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'GraphQL request failed');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('GraphQL request error:', error);
    throw error;
  }
};

// Export the client getter function
export const getHasuraClientInstance = () => {
  return {
    request: executeGraphQLRequest,
  };
};

// For backward compatibility, export a getter that calls the function
export const hasuraClient = {
  request: executeGraphQLRequest,
};

// Create a client for user operations (if you need user-specific authentication)
export const createUserClient = (userToken?: string) => {
  return {
    request: async <T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }

      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'GraphQL request failed');
      }

      const result = await response.json();
      return result.data;
    }
  };
};

// Export the base URL for other uses
export const hasuraEndpoint = '/api/graphql';

// Helper function to execute queries
export const executeQuery = async <T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T> => {
  try {
    return await executeGraphQLRequest<T>(query, variables);
  } catch (error) {
    console.error('GraphQL query error:', error);
    throw error;
  }
};

// Helper function to execute mutations
export const executeMutation = async <T = unknown>(mutation: string, variables?: Record<string, unknown>): Promise<T> => {
  try {
    return await executeGraphQLRequest<T>(mutation, variables);
  } catch (error) {
    console.error('GraphQL mutation error:', error);
    throw error;
  }
};

// Helper function to execute subscriptions (if using WebSocket)
export const executeSubscription = async <T = unknown>(subscription: string, variables?: Record<string, unknown>): Promise<T> => {
  try {
    return await executeGraphQLRequest<T>(subscription, variables);
  } catch (error) {
    console.error('GraphQL subscription error:', error);
    throw error;
  }
};
