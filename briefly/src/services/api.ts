export interface ApiRequestOptions extends RequestInit {
  baseUrl?: string;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { baseUrl = '', ...requestInit } = options;
  const response = await fetch(`${baseUrl}${path}`, requestInit);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}
