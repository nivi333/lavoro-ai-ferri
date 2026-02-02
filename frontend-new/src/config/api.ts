/**
 * API Configuration
 *
 * This module provides a centralized way to access the API base URL
 * with proper normalization to prevent double slashes and missing paths.
 */

// Get the base URL from environment variables
const envBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Normalize the API base URL:
 * - Remove trailing slashes
 * - Ensure /api/v1 is present
 */
function normalizeApiBaseUrl(url: string): string {
  // Default to localhost if empty
  if (!url) {
    return 'http://localhost:3000/api/v1';
  }

  // Remove trailing slashes
  let normalized = url.replace(/\/+$/, '');

  // If URL doesn't end with /api/v1, append it
  if (!normalized.endsWith('/api/v1')) {
    // Check if it ends with /api/v1/ (shouldn't happen after above, but be safe)
    if (!normalized.includes('/api/v1')) {
      normalized = `${normalized}/api/v1`;
    }
  }

  return normalized;
}

/**
 * The normalized API base URL.
 * Always use this instead of directly accessing import.meta.env.VITE_API_BASE_URL
 *
 * @example
 * // Correct usage:
 * fetch(`${API_BASE_URL}/auth/login`, { ... })
 *
 * // This will always produce: https://backend.onrender.com/api/v1/auth/login
 * // Even if VITE_API_BASE_URL is set to:
 * // - https://backend.onrender.com (missing /api/v1)
 * // - https://backend.onrender.com/ (trailing slash)
 * // - https://backend.onrender.com/api/v1/ (trailing slash)
 */
export const API_BASE_URL = normalizeApiBaseUrl(envBaseUrl);

/**
 * Helper function to construct API endpoint URLs
 * @param endpoint - The API endpoint path (e.g., '/auth/login', 'users/me')
 * @returns The full API URL
 */
export function apiUrl(endpoint: string): string {
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${API_BASE_URL}/${cleanEndpoint}`;
}

// Log the configured API URL in development
if (import.meta.env.DEV) {
  console.log('[API Config] Base URL:', API_BASE_URL);
  console.log('[API Config] Raw env value:', envBaseUrl);
}
