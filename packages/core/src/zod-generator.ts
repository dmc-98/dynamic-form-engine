import { z } from 'zod'
import type {
  FormField, TextFieldConfig, NumberFieldConfig,
  SelectFieldConfig, FileUploadConfig, RatingConfig, ScaleConfig,
} from './types'

// ─── Regex Safety ───────────────────────────────────────────────────────────

/**
 * Maximum allowed length for user-supplied regex patterns.
 * Prevents excessively complex patterns that could cause ReDoS.
 */
const MAX_REGEX_LENGTH = 500

/**
 * Patterns commonly associated with ReDoS (catastrophic backtracking).
 * We reject patterns containing nested quantifiers like (a+)+ or (a*)*
 */
const REDOS_PATTERNS = /(\+|\*|\{)\s*\)(\+|\*|\{|\?)|\(\?[^)]*\)\+/

/**
 * Safely create a RegExp from a user-supplied pattern string.
 * Validates length and rejects known ReDoS-prone patterns.
 * Returns null if the pattern is unsafe or invalid.
 */
function safeRegex(pattern: string): RegExp | null {
  if (pattern.length > MAX_REGEX_LENGTH) return null
  if (REDOS_PATTERNS.test(pattern)) return null
  try {
    return new RegExp(pattern)
  } catch {
    return null
  }
}

// ─── Per-Type Schema Builders ────────────────────────────────────────────────

function buildTextSchema(field: FormField): z.ZodTypeAny {
  const cfg = field.config as TextFieldConfig
  let s: z.ZodString = z.string()
  // Ensure required text fields reject empty strings
  const minLen = cfg.minLength ?? (field.required ? 1 : 0)
  if (minLen > 0) s = s.min(minLen, minLen === 1 ? 'Required' : `Minimum ${minLen} characters`)
  if (cfg.maxLength) s = s.max(cfg.maxLength, `Maximum ${cfg.maxLength} characters`)
  if (cfg.pattern) {
    const regex = safeRegex(cfg.pattern)
    if (regex) {
      s = s.regex(regex, 'Invalid format')
    }
    // If regex is unsafe, we skip validation rather than throwing.
    // This is a deliberate choice: invalid config shouldn't crash the form.
  }
  return s
}

function buildNumberSchema(field: FormField): z.ZodTypeAny {
  const cfg = field.config as NumberFieldConfig
  let n = z.number({ invalid_type_error: 'Must be a number' })
  if (cfg.min !== undefined) n = n.min(cfg.min, `Minimum value is ${cfg.min}`)
  if (cfg.max !== undefined) n = n.max(cfg.max, `Maximum value is ${cfg.max}`)
  if (cfg.format === 'integer') n = n.int('Must be a whole number')
  return n
}

function buildSelectSchema(field: FormField): z.ZodTypeAny {
  const cfg = field.config as SelectFieldConfig
  if (cfg.mode === 'static' && cfg.options?.length) {
    const values = cfg.options.map(o => o.value) as [string, ...string[]]
    return z.enum(values, { errorMap: () => ({ message: 'Select a valid option' }) })
  }
  return z.string().min(1, 'Please select an option')
}

function buildFileSchema(field: FormField): z.ZodTypeAny {
  const cfg = field.config as FileUploadConfig
  const maxBytes = (cfg.maxSizeMB ?? 10) * 1024 * 1024
  const fileShape = z.object({
    name: z.string(),
    size: z.number().max(maxBytes, `File must be under ${cfg.maxSizeMB ?? 10}MB`),
    type: cfg.allowedMimeTypes?.length
      ? z.string().refine(t => cfg.allowedMimeTypes!.includes(t), 'File type not allowed')
      : z.string(),
    url: z.string().url(),
  })
  return z.array(fileShape).max(cfg.maxFiles ?? 1, `Max ${cfg.maxFiles ?? 1} file(s) allowed`)
}

/** Map of field types to their Zod schema builder functions */
const SCHEMA_MAP: Record<string, (field: FormField) => z.ZodTypeAny> = {
  SHORT_TEXT: buildTextSchema,
  LONG_TEXT: buildTextSchema,
  EMAIL: () => z.string().email('Enter a valid email address'),
  PHONE: () => z.string().regex(/^\+?[\d\s\-().]{7,}$/, 'Enter a valid phone number'),
  URL: () => z.string().url('Enter a valid URL'),
  PASSWORD: () => z.string().min(1, 'Password is required'),
  NUMBER: buildNumberSchema,
  DATE: () => z.string().min(1, 'Date is required'),
  TIME: () => z.string().min(1, 'Time is required'),
  DATE_TIME: () => z.string().min(1, 'Date and time are required'),
  DATE_RANGE: () => z.object({
    from: z.string().min(1, 'Start date required'),
    to: z.string().min(1, 'End date required'),
  }),
  SELECT: buildSelectSchema,
  MULTI_SELECT: (field) => {
    const cfg = field.config as SelectFieldConfig
    if (cfg.mode === 'static' && cfg.options?.length) {
      const values = cfg.options.map(o => o.value) as [string, ...string[]]
      return z.array(z.enum(values)).min(1, 'Select at least one option')
    }
    return z.array(z.string()).min(1, 'Select at least one option')
  },
  RADIO: buildSelectSchema,
  CHECKBOX: () => z.boolean(),
  FILE_UPLOAD: buildFileSchema,
  RATING: (field) => {
    const cfg = field.config as RatingConfig
    return z.number().min(1).max(cfg.max ?? 5)
  },
  SCALE: (field) => {
    const cfg = field.config as ScaleConfig
    return z.number().min(cfg.min ?? 1).max(cfg.max ?? 10)
  },
  SECTION_BREAK: () => z.never(),
  FIELD_GROUP: () => z.never(),
  HIDDEN: () => z.string(),
  RICH_TEXT: () => z.string(),
  SIGNATURE: () => z.string().regex(/^data:/, 'Must be a data URL'),
  ADDRESS: () => z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }),
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Generate a Zod object schema from an array of FormFields.
 * Layout fields (SECTION_BREAK, FIELD_GROUP) are excluded.
 * Optional fields accept undefined, empty string, or null.
 *
 * @example
 * ```ts
 * const schema = generateZodSchema(fields)
 * const result = schema.safeParse(values)
 * if (!result.success) console.log(result.error.issues)
 * ```
 */
export function generateZodSchema(
  fields: FormField[],
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {}
  const excluded = new Set(['SECTION_BREAK', 'FIELD_GROUP'])

  for (const field of fields) {
    if (excluded.has(field.type)) continue

    const builder = SCHEMA_MAP[field.type]
    if (!builder) continue

    let schema = builder(field)

    if (!field.required && field.type !== 'HIDDEN') {
      // Optional fields accept: the typed value, undefined, empty string, or null.
      // Using z.union for clarity instead of chained .or()
      schema = z.union([schema, z.literal(''), z.null(), z.undefined()])
    }

    shape[field.key] = schema
  }

  return z.object(shape)
}

/**
 * Generate a Zod schema scoped to a single step's fields.
 * Used for per-step validation during multi-step form submission.
 */
export function generateStepZodSchema(
  stepFields: FormField[],
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  return generateZodSchema(stepFields)
}

/**
 * Generate a strict submission schema that strips unknown keys.
 * Use this for backend validation of the final form submission.
 */
export function generateStrictSubmissionSchema(
  fields: FormField[],
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  return generateZodSchema(fields).strict()
}

/**
 * Register a custom schema builder for a field type.
 * Use this to add support for custom field types.
 *
 * @example
 * ```ts
 * registerSchemaBuilder('COLOR_PICKER', (field) => z.string().regex(/^#[0-9a-f]{6}$/i))
 * ```
 */
export function registerSchemaBuilder(
  fieldType: string,
  builder: (field: FormField) => z.ZodTypeAny,
): void {
  SCHEMA_MAP[fieldType] = builder
}
