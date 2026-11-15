export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  searchEngine?: 'meilisearch' | 'mongo-fallback' | 'mongo';
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorDetail {
  path: string;
  message: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorResponse {
  error: ApiErrorPayload;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'viewer';
  permissions: string[];
}
