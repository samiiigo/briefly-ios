import { healthCheck } from './routes/health.js';
import { getSettings, listFolders, listRecordings } from './routes/library.js';

export type { ApiRequest, ApiResponse } from './http.js';
export { jsonResponse } from './http.js';
export { healthCheck } from './routes/health.js';
export { getSettings, listFolders, listRecordings } from './routes/library.js';

/** Factory for route handler groups. Mount in Hono/Express when ready. */
export function createBrieflyApi() {
  return {
    health: {
      check: healthCheck,
    },
    library: {
      listRecordings,
      listFolders,
      getSettings,
    },
  };
}
