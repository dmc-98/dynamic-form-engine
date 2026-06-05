import type { FormField, FieldType } from './types'

// Map DFE field types to JSON Schema types
const TYPE_MAP: Record<string, { type: string; format?: string }> = {
  SHORT_TEXT: { type: 'string' },
  LONG_TEXT: { type: 'string' },
  NUMBER: { type: 'number' },
  EMAIL: { type: 'string', format: 'email' },
  PHONE: { type: 'string', format: 'phone' },
  DATE: { type: 'string', format: 'date' },
  DATE_RANGE: { type: 'object' },
  TIME: { type: 'string', format: 'time' },
  DATE_TIME: { type: 'string', format: 'date-time' },
  SELECT: { type: 'string' },
  MULTI_SELECT: { type: 'array' },
  RADIO: { type: 'string' },
  CHECKBOX: { type: 'boolean' },
  FILE_UPLOAD: { type: 'string', format: 'uri' },
  RATING: { type: 'integer' },
  SCALE: { type: 'integer' },
  URL: { type: 'string', format: 'uri' },
  PASSWORD: { type: 'string' },
  HIDDEN: { type: 'string' },
  RICH_TEXT: { type: 'string' },
  SIGNATURE: { type: 'string', format: 'data-url' },
  ADDRESS: { type: 'object' },
}

export interface JsonSchema {
  $schema: string
  type: 'object'
  properties: Record<string, any>
  required: string[]
  title?: string
  description?: string
}

/**
 * Convert DFE fields to JSON Schema (draft-07).
 */
export function toJsonSchema(fields: FormField[], title?: string): JsonSchema {
  const properties: Record<string, any> = {}
  const required: string[] = []

  for (const field of fields) {
    if (field.type === 'SECTION_BREAK' || field.type === 'FIELD_GROUP') continue

    const mapping = TYPE_MAP[field.type] ?? { type: 'string' }
    const prop: any = { ...mapping, title: field.label, 'x-dfe-type': field.type }

    if (field.description) prop.description = field.description

    // Add constraints from config
    const cfg = field.config as any
    if (cfg?.minLength !== undefined) prop.minLength = cfg.minLength
    if (cfg?.maxLength !== undefined) prop.maxLength = cfg.maxLength
    if (cfg?.min !== undefined) prop.minimum = cfg.min
    if (cfg?.max !== undefined) prop.maximum = cfg.max
    if (cfg?.pattern) prop.pattern = cfg.pattern

    // Select options as enum
    if ((field.type === 'SELECT' || field.type === 'RADIO') && cfg?.options) {
      prop.enum = cfg.options.map((o: any) => o.value)
    }

    // Multi-select
    if (field.type === 'MULTI_SELECT' && cfg?.options) {
      prop.items = { type: 'string', enum: cfg.options.map((o: any) => o.value) }
    }

    properties[field.key] = prop
    if (field.required) required.push(field.key)
  }

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties,
    required,
    ...(title ? { title } : {}),
  }
}

/**
 * Import a JSON Schema and convert to DFE FormField array.
 */
export function fromJsonSchema(schema: JsonSchema): FormField[] {
  const fields: FormField[] = []
  const requiredSet = new Set(schema.required ?? [])
  let order = 0

  // Reverse map: JSON Schema type+format → FieldType
  function inferFieldType(prop: any): FieldType {
    // Use DFE-specific extension if available (preserves round-trip fidelity)
    if (prop['x-dfe-type']) return prop['x-dfe-type'] as FieldType
    if (prop.enum) return 'SELECT'
    if (prop.type === 'boolean') return 'CHECKBOX'
    if (prop.type === 'integer') return 'NUMBER'
    if (prop.type === 'number') return 'NUMBER'
    if (prop.type === 'array') return 'MULTI_SELECT'
    if (prop.type === 'object') return 'FIELD_GROUP'
    if (prop.format === 'email') return 'EMAIL'
    if (prop.format === 'uri') return 'URL'
    if (prop.format === 'date') return 'DATE'
    if (prop.format === 'time') return 'TIME'
    if (prop.format === 'date-time') return 'DATE_TIME'
    if (prop.format === 'phone') return 'PHONE'
    if (prop.format === 'data-url') return 'SIGNATURE'
    if (prop.maxLength && prop.maxLength > 255) return 'LONG_TEXT'
    return 'SHORT_TEXT'
  }

  for (const [key, prop] of Object.entries(schema.properties ?? {})) {
    const fieldType = inferFieldType(prop)
    const config: any = {}

    if (prop.minLength !== undefined) config.minLength = prop.minLength
    if (prop.maxLength !== undefined) config.maxLength = prop.maxLength
    if (prop.minimum !== undefined) config.min = prop.minimum
    if (prop.maximum !== undefined) config.max = prop.maximum
    if (prop.pattern) config.pattern = prop.pattern
    if (prop.placeholder) config.placeholder = prop.placeholder

    // Handle enum → options
    if (prop.enum) {
      config.mode = 'static'
      config.options = prop.enum.map((v: string) => ({ label: v, value: v }))
    }

    // Handle array items enum
    if (prop.items?.enum) {
      config.mode = 'static'
      config.options = prop.items.enum.map((v: string) => ({ label: v, value: v }))
    }

    fields.push({
      id: `field_${key}`,
      versionId: 'v1',
      key,
      label: prop.title ?? key,
      description: prop.description ?? null,
      type: fieldType,
      required: requiredSet.has(key),
      order: order++,
      config,
    })
  }

  return fields
}
