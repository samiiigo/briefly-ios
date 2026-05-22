/**
 * Lightweight strict schema validation (OWASP input validation).
 *
 * - Rejects unknown object keys when `strict` is true
 * - Type checks, length limits, enums, regex patterns
 * - No dependency on runtime JSON Schema servers
 */

export class ValidationError extends Error {
  readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export type SchemaField =
  | { type: 'string'; minLength?: number; maxLength?: number; pattern?: RegExp; trim?: boolean }
  | { type: 'number'; min?: number; max?: number; integer?: boolean }
  | { type: 'boolean' }
  | { type: 'enum'; values: readonly string[] }
  | { type: 'array'; items: SchemaField; maxItems?: number }
  | { type: 'object'; fields: Record<string, SchemaField>; strict?: boolean };

export interface ObjectSchema {
  type: 'object';
  fields: Record<string, SchemaField>;
  /** When true (default), unknown keys cause rejection. */
  strict?: boolean;
}

const CONTROL_CHAR = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/;

export function containsControlCharacters(value: string): boolean {
  return CONTROL_CHAR.test(value);
}

export function assertNoControlCharacters(value: string, field: string): void {
  if (containsControlCharacters(value)) {
    throw new ValidationError(`${field} contains invalid control characters`, field);
  }
}

function validateField(value: unknown, schema: SchemaField, path: string): unknown {
  switch (schema.type) {
    case 'string': {
      if (typeof value !== 'string') {
        throw new ValidationError(`${path} must be a string`, path);
      }
      const normalized = schema.trim === false ? value : value.trim();
      if (schema.minLength != null && normalized.length < schema.minLength) {
        throw new ValidationError(`${path} is too short`, path);
      }
      if (schema.maxLength != null && normalized.length > schema.maxLength) {
        throw new ValidationError(`${path} is too long`, path);
      }
      assertNoControlCharacters(normalized, path);
      if (schema.pattern && !schema.pattern.test(normalized)) {
        throw new ValidationError(`${path} has an invalid format`, path);
      }
      return normalized;
    }
    case 'number': {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        throw new ValidationError(`${path} must be a number`, path);
      }
      if (schema.integer && !Number.isInteger(value)) {
        throw new ValidationError(`${path} must be an integer`, path);
      }
      if (schema.min != null && value < schema.min) {
        throw new ValidationError(`${path} is below minimum`, path);
      }
      if (schema.max != null && value > schema.max) {
        throw new ValidationError(`${path} exceeds maximum`, path);
      }
      return value;
    }
    case 'boolean': {
      if (typeof value !== 'boolean') {
        throw new ValidationError(`${path} must be a boolean`, path);
      }
      return value;
    }
    case 'enum': {
      if (typeof value !== 'string' || !schema.values.includes(value)) {
        throw new ValidationError(`${path} must be one of: ${schema.values.join(', ')}`, path);
      }
      return value;
    }
    case 'array': {
      if (!Array.isArray(value)) {
        throw new ValidationError(`${path} must be an array`, path);
      }
      if (schema.maxItems != null && value.length > schema.maxItems) {
        throw new ValidationError(`${path} has too many items`, path);
      }
      return value.map((item, index) => validateField(item, schema.items, `${path}[${index}]`));
    }
    case 'object': {
      return validateObject(value, schema, path);
    }
    default: {
      const _exhaustive: never = schema;
      return _exhaustive;
    }
  }
}

export function validateObject<T extends Record<string, unknown>>(
  input: unknown,
  schema: ObjectSchema,
  path = 'input'
): T {
  if (input == null || typeof input !== 'object' || Array.isArray(input)) {
    throw new ValidationError(`${path} must be an object`, path);
  }

  const raw = input as Record<string, unknown>;
  const strict = schema.strict !== false;
  const allowed = new Set(Object.keys(schema.fields));

  if (strict) {
    for (const key of Object.keys(raw)) {
      if (!allowed.has(key)) {
        throw new ValidationError(`${path}.${key} is not allowed`, `${path}.${key}`);
      }
    }
  }

  const out: Record<string, unknown> = {};
  for (const [key, fieldSchema] of Object.entries(schema.fields)) {
    if (!(key in raw)) continue;
    const fieldPath = `${path}.${key}`;
    out[key] = validateField(raw[key], fieldSchema, fieldPath);
  }

  return out as T;
}

/** Parses JSON then validates; rejects malformed JSON. */
export function parseAndValidateJson<T extends Record<string, unknown>>(
  raw: string,
  schema: ObjectSchema,
  path = 'body'
): T {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ValidationError(`${path} is not valid JSON`, path);
  }
  return validateObject<T>(parsed, schema, path);
}
