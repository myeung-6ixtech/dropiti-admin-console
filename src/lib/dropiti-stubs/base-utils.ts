// Stub implementation for @dropiti/base/utils
export async function decrypt(token: string): Promise<{ payload: Record<string, unknown> }> {
  console.log('decrypt stub called with token:', token);
  return {
    payload: {}
  };
}
