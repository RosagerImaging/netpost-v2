// Generic API response wrapper
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: ApiError[];
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

export interface ApiMeta {
  pagination?: PaginationMeta;
  timestamp: string;
  requestId: string;
  version: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Request types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface SearchParams extends PaginationParams {
  q?: string;
  filters?: Record<string, any>;
}

// File upload types
export interface FileUpload {
  file: File | Blob;
  filename: string;
  contentType: string;
}

export interface UploadResponse {
  id: string;
  url: string;
  filename: string;
  size: number;
  contentType: string;
  uploadedAt: string;
}

// Webhook types
export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: string;
  signature: string;
}

// Real-time event types
export interface RealtimeEvent {
  type: string;
  payload: Record<string, any>;
  timestamp: string;
  userId?: string;
}

// Analytics types
export interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: string;
}

// Notification types
export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Health check types
export interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: ServiceHealth[];
  version: string;
  uptime: number;
}

export interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  responseTime?: number;
  error?: string;
  lastChecked: string;
}
