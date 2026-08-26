import type { ApiRequest } from '../http.js';
import { jsonResponse } from '../http.js';

export async function healthCheck(_req: ApiRequest) {
  return jsonResponse({ ok: true, service: 'briefly-api' });
}
