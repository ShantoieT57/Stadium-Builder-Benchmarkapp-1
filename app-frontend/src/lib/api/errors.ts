import type { APIError } from '@/types/api';

/** Type guard for the APIError objects apiClient rejects with. */
export function isAPIError(error: unknown): error is APIError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'statusCode' in error
  );
}
