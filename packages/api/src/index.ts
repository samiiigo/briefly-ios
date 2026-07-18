/**
 * Shared API client factory (scaffold).
 * Platform apps inject storage/fetch; do not call network APIs from UI components.
 */
export type BrieflyApiClientOptions = {
  baseUrl?: string;
  getAccessToken?: () => Promise<string | null>;
};

export function createApiClient(_options: BrieflyApiClientOptions = {}) {
  return {
    // Placeholder — wire services/queries/mutations as the backend expands.
  };
}
