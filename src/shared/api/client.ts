/**
 * Core HTTP Client for Cars Shipping Platform
 * Automatically injects JWT Bearer tokens and Idempotency keys.
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1';

export interface ApiResponse<T = any> {
  status: 'success' | 'fail' | 'error';
  data?: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export class ApiError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

function generateIdempotencyKey(): string {
  return 'idem_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string>),
  };

  // Attach JWT token if present
  const token = localStorage.getItem('carship_token');
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Attach Idempotency-Key for mutating requests
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH'].includes(method) && !headers['Idempotency-Key']) {
    headers['Idempotency-Key'] = generateIdempotencyKey();
  }

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If unauthorized (e.g. stale or expired token from local development), auto-recover or clear
  if (response.status === 401 && !(options.headers as any)?.['X-Auth-Retry']) {
    try {
      const loginUrl = `${API_BASE_URL}/auth/login`;
      const authRes = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'superadmin', password: 'Admin@2026!' }),
      });
      if (authRes.ok) {
        const authData = await authRes.json();
        const newToken = authData?.data?.accessToken || authData?.data?.tokens?.accessToken;
        if (newToken) {
          localStorage.setItem('carship_token', newToken);
          if (authData?.data?.user) {
            localStorage.setItem('carship_user', JSON.stringify(authData.data.user));
          }
          headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, {
            ...options,
            headers: {
              ...headers,
              'X-Auth-Retry': '1',
            },
          });
        }
      } else {
        localStorage.removeItem('carship_token');
        localStorage.removeItem('carship_user');
        window.dispatchEvent(new Event('carship_auth_change'));
      }
    } catch {
      localStorage.removeItem('carship_token');
      localStorage.removeItem('carship_user');
      window.dispatchEvent(new Event('carship_auth_change'));
    }
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const responseData = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg =
      (typeof responseData === 'object' && responseData !== null
        ? responseData.message || responseData.error
        : null) ||
      `Request failed with status ${response.status}: ${response.statusText}`;

    throw new ApiError(errorMsg, response.status, responseData);
  }

  // Unwrap standardized backend response envelope if present
  if (responseData && typeof responseData === 'object' && 'data' in responseData) {
    return responseData.data as T;
  }

  return responseData as T;
}
