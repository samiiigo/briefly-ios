import Constants from 'expo-constants';

export interface CrashReporter {
  captureException(error: unknown, context?: Record<string, unknown>): void;
}

function readDsn(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
  if (fromEnv) return fromEnv;
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const fromExtra = extra?.sentryDsn;
  return typeof fromExtra === 'string' && fromExtra.trim() ? fromExtra.trim() : undefined;
}

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(typeof error === 'string' ? error : JSON.stringify(error));
}

/** Minimal Sentry store transport (JS exceptions). No native SDK required. */
async function sendToSentry(
  dsn: string,
  error: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  const match = /^https:\/\/([^@]+)@([^/]+)\/(.+)$/.exec(dsn);
  if (!match) return;
  const [, publicKey, host, projectId] = match;
  const err = toError(error);
  const url = `https://${host}/api/${projectId}/store/`;
  const payload = {
    event_id: cryptoRandomId(),
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    level: 'error',
    exception: {
      values: [
        {
          type: err.name,
          value: err.message,
          stacktrace: err.stack
            ? {
                frames: err.stack
                  .split('\n')
                  .slice(1)
                  .reverse()
                  .map((line) => ({ filename: line.trim() })),
              }
            : undefined,
        },
      ],
    },
    extra: context ?? {},
    tags: {
      app: 'briefly',
      variant: String(
        (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.appVariant ??
          'unknown',
      ),
    },
  };

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}`,
    },
    body: JSON.stringify(payload),
  });
}

function cryptoRandomId(): string {
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

let initialized = false;
let activeDsn: string | undefined;

export function initCrashReporter(): void {
  if (initialized) return;
  initialized = true;
  activeDsn = readDsn();
  if (activeDsn && __DEV__) {
    console.info('[crashReporter] Sentry DSN configured');
  }
}

export const crashReporter: CrashReporter = {
  captureException(error, context) {
    if (!initialized) initCrashReporter();
    if (__DEV__) {
      console.error('[crashReporter]', error, context);
    }
    if (!activeDsn) return;
    void sendToSentry(activeDsn, error, context).catch(() => {
      // Never throw from crash reporting.
    });
  },
};
