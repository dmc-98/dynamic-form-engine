import type { FormField, FormStep, SelectOption } from './types'

export interface ExportOptions {
  format: 'json' | 'yaml' | 'csv'
  includeMetadata?: boolean
}

export interface FormExportData {
  metadata?: {
    exportedAt: string
    version: string
  }
  fields: FormField[]
  steps?: FormStep[]
}

/**
 * Export form fields and steps to JSON format
 */
export function exportForm(
  fields: FormField[],
  steps: FormStep[] = [],
  options?: Omit<ExportOptions, 'format'> & { format?: 'json' },
): string {
  const exportData: FormExportData = {
    fields,
    steps: steps.length > 0 ? steps : undefined,
  }

  if (options?.includeMetadata !== false) {
    exportData.metadata = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Export form to YAML format
 */
export function exportFormToYaml(
  fields: FormField[],
  steps: FormStep[] = [],
  options?: Omit<ExportOptions, 'format'>,
): string {
  const exportData: FormExportData = {
    fields,
    steps: steps.length > 0 ? steps : undefined,
  }

  if (options?.includeMetadata !== false) {
    exportData.metadata = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }
  }

  // Simple YAML serialization (not using external deps)
  return serializeToYaml(exportData)
}

/**
 * Simple YAML serializer without external dependencies
 */
function serializeToYaml(obj: unknown, indent = 0): string {
  const spaces = ' '.repeat(indent)

  if (obj === null || obj === undefined) {
    return 'null'
  }

  if (typeof obj === 'string') {
    // Escape quotes if needed
    if (obj.includes('\n') || obj.includes('"') || obj.includes("'")) {
      return `"${obj.replace(/"/g, '\\"')}"`
    }
    return obj
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj)
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]'
    return obj
      .map((item, idx) => {
        const prefix = idx === 0 ? '- ' : '  - '
        const content = serializeToYaml(item, indent + 4)
        return prefix + content
      })
      .join('\n')
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj)
    if (entries.length === 0) return '{}'
    return entries
      .map(([key, value]) => {
        const content = serializeToYaml(value, indent + 2)
        if (content.includes('\n')) {
          return `${spaces}${key}:\n${spaces}  ${content}`
        }
        return `${spaces}${key}: ${content}`
      })
      .join('\n')
  }

  return String(obj)
}

/**
 * Import form from JSON or YAML data
 */
export function importForm(
  data: string,
  format: 'json' | 'yaml' = 'json',
): { fields: FormField[]; steps: FormStep[] } {
  let parsed: unknown

  if (format === 'json') {
    try {
      parsed = JSON.parse(data)
    } catch (err) {
      throw new Error(`Invalid JSON: ${err instanceof Error ? err.message : String(err)}`)
    }
  } else if (format === 'yaml') {
    // Simple YAML parser (basic support)
    parsed = parseSimpleYaml(data)
  } else {
    throw new Error(`Unsupported format: ${format}`)
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid form data: root must be an object')
  }

  const obj = parsed as Record<string, unknown>
  const fields = Array.isArray(obj.fields) ? (obj.fields as FormField[]) : []
  const steps = Array.isArray(obj.steps) ? (obj.steps as FormStep[]) : []

  return { fields, steps }
}

/**
 * Simple YAML parser (basic support for DFE use cases)
 */
function parseSimpleYaml(yaml: string): unknown {
  const lines = yaml.split('\n')
  const root: Record<string, unknown> = {}
  const stack: Array<{ obj: Record<string, unknown>; indent: number }> = [{ obj: root, indent: -1 }]

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) {
      continue
    }

    const indent = line.search(/\S/)
    const trimmed = line.trim()

    // Pop stack if we're at a lower indent
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop()
    }

    if (trimmed.startsWith('-')) {
      // Array item
      const value = trimmed.slice(1).trim()
      const currentObj = stack[stack.length - 1].obj
      const lastKey = Object.keys(currentObj)[Object.keys(currentObj).length - 1]
      if (lastKey && Array.isArray(currentObj[lastKey])) {
        ;(currentObj[lastKey] as unknown[]).push(parseValue(value))
      }
    } else if (trimmed.includes(':')) {
      // Key-value pair
      const [key, ...valueParts] = trimmed.split(':')
      const value = valueParts.join(':').trim()
      const currentObj = stack[stack.length - 1].obj
      const parsed = parseValue(value)

      currentObj[key.trim()] = parsed

      // If value is an object or array, add to stack
      if (parsed && typeof parsed === 'object') {
        stack.push({ obj: currentObj, indent })
      }
    }
  }

  return root
}

/**
 * Parse a YAML value
 */
function parseValue(value: string): unknown {
  if (!value) return null
  if (value === 'null') return null
  if (value === 'true') return true
  if (value === 'false') return false
  if (!Number.isNaN(Number(value))) return Number(value)
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  if (value === '[]') return []
  if (value === '{}') return {}
  return value
}

/**
 * Import form from Typeform API data
 */
export function importFromTypeform(data: unknown): { fields: FormField[]; steps: FormStep[] } {
  const typeformData = data as Record<string, unknown>

  if (typeof typeformData.fields !== 'object' || !Array.isArray(typeformData.fields)) {
    throw new Error('Invalid Typeform data: missing fields array')
  }

  const fields: FormField[] = (typeformData.fields as any[]).map((field, idx) => {
    const config: Record<string, unknown> = {}

    // Map common Typeform field properties
    if (field.properties?.description) {
      config.placeholder = field.properties.description
    }

    let type: string = 'SHORT_TEXT'
    switch (field.type) {
      case 'short_text':
        type = 'SHORT_TEXT'
        break
      case 'long_text':
        type = 'LONG_TEXT'
        break
      case 'email':
        type = 'EMAIL'
        break
      case 'phone_number':
        type = 'PHONE'
        break
      case 'number':
        type = 'NUMBER'
        break
      case 'multiple_choice':
        type = 'RADIO'
        config.mode = 'static'
        config.options = (field.properties?.choices || []).map((c: any) => ({
          label: c.label,
          value: c.ref || c.label,
        }))
        break
      case 'checkbox':
        type = 'MULTI_SELECT'
        config.mode = 'static'
        config.options = (field.properties?.choices || []).map((c: any) => ({
          label: c.label,
          value: c.ref || c.label,
        }))
        break
      case 'date':
        type = 'DATE'
        break
      case 'rating':
        type = 'RATING'
        config.max = field.properties?.steps || 5
        break
    }

    return {
      id: field.id || `field_${idx}`,
      versionId: 'v1',
      key: field.ref || `field_${idx}`,
      label: field.title || '',
      type: type as any,
      required: field.validations?.required || false,
      order: idx + 1,
      config,
    }
  })

  return { fields, steps: [] }
}

/**
 * Import form from Google Forms export data
 */
export function importFromGoogleForms(data: unknown): { fields: FormField[]; steps: FormStep[] } {
  const googleData = data as Record<string, unknown>

  if (typeof googleData.items !== 'object' || !Array.isArray(googleData.items)) {
    throw new Error('Invalid Google Forms data: missing items array')
  }

  const fields: FormField[] = []

  for (let idx = 0; idx < (googleData.items as any[]).length; idx++) {
    const item = (googleData.items as any[])[idx]
    if (!item?.questionItem) continue

    const question = item.questionItem?.question
    if (!question) continue

    const config: any = {}
    let type: any = 'SHORT_TEXT'

    // Map question type
    const questionType = question.questionType
    switch (questionType) {
      case 'SHORT_ANSWER':
        type = 'SHORT_TEXT'
        break
      case 'PARAGRAPH':
        type = 'LONG_TEXT'
        break
      case 'MULTIPLE_CHOICE':
        type = 'RADIO'
        config.mode = 'static'
        config.options = (question.choiceQuestion?.options || []).map((opt: any, i: number) => ({
          label: opt.value || `Option ${i + 1}`,
          value: opt.value || `option_${i}`,
        }))
        break
      case 'CHECKBOX':
        type = 'MULTI_SELECT'
        config.mode = 'static'
        config.options = (question.choiceQuestion?.options || []).map((opt: any, i: number) => ({
          label: opt.value || `Option ${i + 1}`,
          value: opt.value || `option_${i}`,
        }))
        break
      case 'DROPDOWN':
        type = 'SELECT'
        config.mode = 'static'
        config.options = (question.choiceQuestion?.options || []).map((opt: any, i: number) => ({
          label: opt.value || `Option ${i + 1}`,
          value: opt.value || `option_${i}`,
        }))
        break
      case 'LINEAR_SCALE':
        type = 'SCALE'
        config.min = question.scaleQuestion?.lowValue || 1
        config.max = question.scaleQuestion?.highValue || 5
        if (question.scaleQuestion?.lowValueLabel) {
          config.minLabel = question.scaleQuestion.lowValueLabel
        }
        if (question.scaleQuestion?.highValueLabel) {
          config.maxLabel = question.scaleQuestion.highValueLabel
        }
        break
      case 'DATE':
        type = 'DATE'
        break
      case 'TIME':
        type = 'TIME'
        break
    }

    fields.push({
      id: item.itemId || `field_${idx}`,
      versionId: 'v1',
      key: `field_${idx}`,
      label: question.questionText || '',
      type,
      required: question.required || false,
      order: idx + 1,
      config,
    } as FormField)
  }

  return { fields, steps: [] }
}

/**
 * Export form fields to CSV (simplified: headers + rows)
 */
export function exportFormToCsv(fields: FormField[]): string {
  const headers = ['Field Key', 'Label', 'Type', 'Required', 'Order', 'Description']
  const rows = fields.map(f => [f.key, f.label, f.type, f.required ? 'Yes' : 'No', f.order, f.description || ''])

  const csvRows = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ]

  return csvRows.join('\n')
}
