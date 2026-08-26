/** Minimal HTTP types for framework-agnostic route handlers (Hono, Express, etc.). */

export interface ApiRequest {
  method: string;
  path: string;
  headers: Record<string, string | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export interface ApiResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

export function jsonResponse(body: unknown, status = 200): ApiResponse {
  return {
    status,
    headers: { 'Content-Type': 'application/json' },
    body,
  };
}
