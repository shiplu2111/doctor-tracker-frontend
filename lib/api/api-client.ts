import { ApiResponse, ApiErrorResponse } from '@doctor-tracker/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  public readonly code: string;
  public readonly details?: Array<{ path: string; message: string }>;
  public readonly status: number;

  constructor(status: number, errorPayload: { code: string; message: string; details?: Array<{ path: string; message: string }> }) {
    super(errorPayload.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = errorPayload.code;
    this.details = errorPayload.details;
  }
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

export const apiClient = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers || {});
  headers.set('X-Requested-With', 'XMLHttpRequest');
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // sends and receives httpOnly cookies
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch {
    throw new ApiError(0, {
      code: 'NETWORK_ERROR',
      message: 'Failed to connect to the server. Please check your network.',
    });
  }

  // Handle 401 TOKEN_EXPIRED with silent token refresh
  if (
    response.status === 401 &&
    !endpoint.includes('/auth/login') &&
    !endpoint.includes('/auth/refresh') &&
    !endpoint.includes('/auth/logout')
  ) {
    const errorClone = response.clone();
    try {
      const errJson = (await errorClone.json()) as ApiErrorResponse;
      if (errJson.error?.code === 'TOKEN_EXPIRED') {
        if (!isRefreshing) {
          isRefreshing = true;

          try {
            await apiClient('/auth/refresh', { method: 'POST' });
            isRefreshing = false;
            processQueue(null);
            // Retry the original request
            return await apiClient<T>(endpoint, options);
          } catch (refreshErr) {
            isRefreshing = false;
            processQueue(refreshErr as Error);
            if (typeof window !== 'undefined') {
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
            }
            throw refreshErr;
          }
        }

        // If a refresh is already in progress, wait for it
        return new Promise<ApiResponse<T>>((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(apiClient<T>(endpoint, options)),
            reject: (err) => reject(err),
          });
        });
      }
    } catch {
      // Continue to normal error handling if not JSON
    }
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return { data: null as unknown as T };
  }

  // Parse JSON response
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    const errPayload = (json as ApiErrorResponse)?.error || {
      code: 'HTTP_ERROR',
      message: response.statusText || 'Request failed',
    };
    throw new ApiError(response.status, errPayload);
  }

  return json as ApiResponse<T>;
};
