/**
 * Server-side only: run a GraphQL query against Hasura using an absolute URL.
 * Use this in API routes instead of the client that uses fetch('/api/graphql').
 */

const HASURA_ENDPOINT = process.env.HASURA_ENDPOINT;
const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET;

export async function executeHasuraQuery<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  if (!HASURA_ENDPOINT) {
    throw new Error("HASURA_ENDPOINT is not set");
  }

  const response = await fetch(HASURA_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(HASURA_ADMIN_SECRET && { "x-hasura-admin-secret": HASURA_ADMIN_SECRET }),
    },
    body: JSON.stringify({ query, variables: variables ?? {} }),
  });

  const data = await response.json();

  if (data.errors?.length) {
    const msg = data.errors[0]?.message ?? "Hasura request failed";
    throw new Error(msg);
  }

  return data.data as T;
}
