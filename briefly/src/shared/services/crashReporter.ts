export interface CrashReporter {
  captureException(error: unknown, context?: Record<string, unknown>): void;
}

export const crashReporter: CrashReporter = {
  captureException(error, context) {
    if (__DEV__) {
      console.error('[crashReporter]', error, context);
    }
  },
};
