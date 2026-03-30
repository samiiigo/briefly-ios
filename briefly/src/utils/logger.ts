type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

type LogContext = Record<string, unknown>;

const APP_TAG = 'BRIEFLY';

/** Key on `globalThis` for idempotent fetch patching. */
const FETCH_PATCH_FLAG = '__briefly_fetch_patch_installed__';

function ts(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

function isSensitiveKey(key: string): boolean {
  return /key|token|secret|password|authorization/i.test(key);
}

function maskValue(value: unknown): unknown {
  if (typeof value === 'string') {
    // Fully redact sensitive string values. For Authorization-style headers,
    // keep only the non-sensitive prefix (e.g., "Bearer") and redact the credential.
    const bearerPrefix = /^Bearer\s+/i;
    if (bearerPrefix.test(value)) {
      return 'Bearer ***';
    }
    return '***';
  }
  return '***';
}

function sanitizeObject(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sanitizeObject);

  const input = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (isSensitiveKey(k)) {
      out[k] = maskValue(v);
    } else {
      out[k] = sanitizeObject(v);
    }
  }
  return out;
}

function sanitizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const sensitiveParams = new Set(['key', 'api_key', 'token', 'access_token', 'apikey']);
    for (const [key] of url.searchParams.entries()) {
      if (sensitiveParams.has(key.toLowerCase())) {
        url.searchParams.set(key, '***');
      }
    }
    return url.toString();
  } catch {
    return rawUrl.replace(
      /([?&](?:key|api_key|token|access_token|apikey)=)[^&]+/gi,
      '$1***'
    );
  }
}

function shortUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

function ctxToString(ctx?: LogContext): string {
  if (!ctx || Object.keys(ctx).length === 0) return '';
  try {
    return ` | ${JSON.stringify(sanitizeObject(ctx))}`;
  } catch {
    return ' | {"context":"unserializable"}';
  }
}

function write(level: LogLevel, scope: string, message: string, ctx?: LogContext): void {
  const line = `[${ts()}][${level}][${scope}] ${message}${ctxToString(ctx)}`;
  if (level === 'ERROR') {
    console.error(line);
    return;
  }
  if (level === 'WARN') {
    console.warn(line);
    return;
  }
  console.log(line);
}

export const logger = {
  info(scope: string, message: string, ctx?: LogContext): void {
    write('INFO', scope, message, ctx);
  },
  warn(scope: string, message: string, ctx?: LogContext): void {
    write('WARN', scope, message, ctx);
  },
  error(scope: string, message: string, ctx?: LogContext): void {
    write('ERROR', scope, message, ctx);
  },
  debug(scope: string, message: string, ctx?: LogContext): void {
    write('DEBUG', scope, message, ctx);
  },
};

function getUrlFromFetchInput(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  const request = input as Request;
  return request.url;
}

function getMethodFromFetchInput(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method.toUpperCase();
  if (typeof input === 'object' && 'method' in input) {
    const request = input as Request;
    return request.method?.toUpperCase?.() ?? 'GET';
  }
  return 'GET';
}

function sanitizeHeaders(init?: RequestInit): Record<string, unknown> | undefined {
  if (!init?.headers) return undefined;

  const out: Record<string, unknown> = {};
  if (init.headers instanceof Headers) {
    init.headers.forEach((value, key) => {
      out[key] = isSensitiveKey(key) ? maskValue(value) : value;
    });
    return out;
  }

  if (Array.isArray(init.headers)) {
    for (const [key, value] of init.headers) {
      out[key] = isSensitiveKey(key) ? maskValue(value) : value;
    }
    return out;
  }

  const plain = init.headers as Record<string, unknown>;
  for (const [key, value] of Object.entries(plain)) {
    out[key] = isSensitiveKey(key) ? maskValue(value) : value;
  }
  return out;
}

export function installRealtimeTerminalLogs(): void {
  if ((globalThis as any)[FETCH_PATCH_FLAG]) {
    return;
  }

  const originalFetch = globalThis.fetch?.bind(globalThis);
  if (!originalFetch) {
    logger.warn('SYSTEM', 'Global fetch is unavailable; API interception disabled');
    return;
  }

  // Mark fetch logging as installed before patching to ensure strict idempotence.
  (globalThis as any)[FETCH_PATCH_FLAG] = true;

  let requestId = 0;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requestId += 1;
    const id = requestId;
    const method = getMethodFromFetchInput(input, init);
    const rawUrl = getUrlFromFetchInput(input);
    const safeUrl = sanitizeUrl(rawUrl);
    const startedAt = Date.now();

    logger.info('API', `#${id} ${method} ${shortUrl(safeUrl)} -> request`, {
      method,
      url: safeUrl,
      headers: sanitizeHeaders(init),
    });

    try {
      const response = await originalFetch(input, init);
      const elapsedMs = Date.now() - startedAt;
      logger.info(
        'API',
        `#${id} ${method} ${shortUrl(safeUrl)} <- ${response.status} (${elapsedMs}ms)`,
        {
          status: response.status,
          ok: response.ok,
          elapsedMs,
          contentType: response.headers.get('content-type') ?? undefined,
        }
      );
      return response;
    } catch (error: any) {
      const elapsedMs = Date.now() - startedAt;
      logger.error('API', `#${id} ${method} ${shortUrl(safeUrl)} <- network error`, {
        elapsedMs,
        error: error?.message ?? String(error),
      });
      throw error;
    }
  }) as typeof fetch;

  logger.info('SYSTEM', 'Realtime terminal logging enabled');
}