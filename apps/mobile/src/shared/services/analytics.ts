export interface AnalyticsClient {
  track(event: string, properties?: Record<string, unknown>): void;
}

export const analytics: AnalyticsClient = {
  track(_event, _properties) {
    // Integration point for production analytics.
  },
};
