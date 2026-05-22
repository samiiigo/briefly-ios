import { RateLimitError } from '@/security/RateLimitError';
import { secureFetch } from '@/security/secureFetch';

export interface ApiRequestOptions extends RequestInit {
  baseUrl?: string;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { baseUrl = '', ...requestInit } = options;
  const url = `${baseUrl}${path}`;

  try {
    const response = await secureFetch(url, requestInit);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw new Error(error.message);
    }
    throw error;
  }
}
