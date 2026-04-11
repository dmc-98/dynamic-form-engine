import type { FormField, FormValues, HydrationResult } from './types'
import { getDefaultValue } from './dag'

/**
 * Merge hydration data (from API response) with field defaults.
 * Returns the merged values and any warnings about missing/extra fields.
 *
 * @param fields - Array of field definitions
 * @param data - Raw data from the API (key → value)
 * @returns Merged values and warnings
 *
 * @example
 * ```ts
 * const { values, warnings } = mergeHydrationData(fields, apiResponse.data)
 * // values has defaults for missing fields, API values for existing ones
 * // warnings lists any data keys that don't match a field
 * ```
 */
export function mergeHydrationData(
  fields: FormField[],
  data: Record<string, unknown> | null | undefined,
): HydrationResult {
  const values: FormValues = {}
  const warnings: string[] = []

  const fieldKeys = new Set(fields.map(f => f.key))

  // Start with defaults for all fields
  for (const field of fields) {
    values[field.key] = getDefaultValue(field)
  }

  // Overlay hydration data
  if (data) {
    for (const [key, value] of Object.entries(data)) {
      if (fieldKeys.has(key)) {
        values[key] = value
      } else {
        warnings.push(`Hydration data contains unknown field key: "${key}"`)
      }
    }
  }

  return { values, warnings }
}

/**
 * Resolve an API endpoint template with context values.
 * Replaces {placeholders} with actual context values.
 *
 * @example
 * ```ts
 * resolveEndpointTemplate('/api/users/{userId}', { userId: 'usr_123' })
 * // → '/api/users/usr_123'
 * ```
 */
export function resolveEndpointTemplate(
  template: string,
  context: Record<string, unknown>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = context[key]
    return value != null ? String(value) : `{${key}}`
  })
}
