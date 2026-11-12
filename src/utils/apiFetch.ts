/**
 * Safe fetch utility that provides a wrapper around native fetch
 * without modifying, polyfilling, or overwriting window.fetch or globalThis.fetch.
 */

export async function safeFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const fetchFn =
    typeof window !== 'undefined' && typeof window.fetch === 'function'
      ? window.fetch.bind(window)
      : typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function'
      ? globalThis.fetch.bind(globalThis)
      : null;

  if (!fetchFn) {
    throw new Error('Fetch API is not available in the current environment.');
  }

  return fetchFn(input, init);
}

export const apiFetch = safeFetch;
export const apiRequest = safeFetch;
