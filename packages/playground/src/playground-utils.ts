import type {
  FieldSuggestion,
  FieldType,
  FormField,
  FormTemplate,
  GeneratedFormConfig,
  ValidationSuggestion,
} from '@dmc--98/dfe-core'
import type { PlaygroundFormConfig } from './validateConfig'

export function parsePlaygroundConfig(jsonText: string): {
  config: PlaygroundFormConfig | null
  parseError: string | null
} {
  try {
    const parsed = JSON.parse(jsonText) as PlaygroundFormConfig

    if (!Array.isArray(parsed.fields)) {
      return {
        config: null,
        parseError: 'Configuration must include a "fields" array.',
      }
    }

    return {
      config: {
        title: parsed.title,
        description: parsed.description,
        category: parsed.category,
        fields: parsed.fields,
        steps: parsed.steps ?? [],
      },
      parseError: null,
    }
  } catch (error) {
    return {
      config: null,
      parseError: `Invalid JSON: ${(error as Error).message}`,
    }
  }
}

export function stringifyPlaygroundConfig(config: PlaygroundFormConfig): string {
  return `${JSON.stringify(config, null, 2)}\n`
}

export function createTemplateConfig(template: FormTemplate): PlaygroundFormConfig {
  return {
    title: template.name,
    description: template.description,
    category: template.category,
    fields: template.fields,
    steps: template.steps ?? [],
  }
}

export function createGeneratedConfig(config: GeneratedFormConfig): PlaygroundFormConfig {
  return {
    title: config.title,
    description: config.description,
    category: config.category,
    fields: config.fields,
    steps: config.steps ?? [],
  }
}

export function canApplyValidationSuggestion(suggestion: ValidationSuggestion): boolean {
  return getAppliedSuggestionPatch(suggestion) !== null
}

export function applyValidationSuggestion(
  config: PlaygroundFormConfig,
  suggestion: ValidationSuggestion,
): PlaygroundFormConfig {
  const patch = getAppliedSuggestionPatch(suggestion)
  if (!patch) {
    return config
  }

  const nextConfig = cloneConfig(config)
  const targetField = nextConfig.fields?.find((field) => field.key === suggestion.fieldKey)
  if (!targetField) {
    return config
  }

  targetField.config = {
    ...(targetField.config ?? {}),
    ...patch,
  }

  return nextConfig
}

export function appendFieldSuggestion(
  config: PlaygroundFormConfig,
  suggestion: FieldSuggestion,
): PlaygroundFormConfig {
  const nextConfig = cloneConfig(config)
  const fields = nextConfig.fields ?? []
  const steps = nextConfig.steps ?? []
  const fieldKeys = new Set(fields.map((field) => field.key))
  const fieldIds = new Set(fields.map((field) => field.id))

  const key = createUniqueIdentifier(suggestion.key, fieldKeys)
  const id = createUniqueIdentifier(`field_${suggestion.key}`, fieldIds)
  const stepId = steps.length > 0 ? steps[steps.length - 1]?.id : undefined

  const field: FormField = {
    id,
    versionId: 'v1',
    key,
    label: suggestion.label,
    description: suggestion.description || suggestion.reason,
    type: suggestion.type,
    required: suggestion.required,
    order: fields.length,
    stepId,
    config: getDefaultSuggestedFieldConfig(suggestion),
  }

  nextConfig.fields = [...fields, field]
  return nextConfig
}

function cloneConfig(config: PlaygroundFormConfig): PlaygroundFormConfig {
  return JSON.parse(JSON.stringify(config)) as PlaygroundFormConfig
}

function createUniqueIdentifier(base: string, existingValues: Set<string>): string {
  if (!existingValues.has(base)) {
    return base
  }

  let suffix = 2
  while (existingValues.has(`${base}_${suffix}`)) {
    suffix += 1
  }

  return `${base}_${suffix}`
}

function getAppliedSuggestionPatch(
  suggestion: ValidationSuggestion,
): Record<string, unknown> | null {
  if (suggestion.rule.startsWith('minLength:')) {
    return { minLength: Number.parseInt(suggestion.rule.slice('minLength:'.length), 10) }
  }

  if (suggestion.rule.startsWith('maxLength:')) {
    return { maxLength: Number.parseInt(suggestion.rule.slice('maxLength:'.length), 10) }
  }

  if (suggestion.rule === 'pattern:email' || suggestion.rule === 'format:email') {
    return { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' }
  }

  if (suggestion.rule === 'pattern:uppercase') {
    return { pattern: mergeLookaheadPattern(undefined, '(?=.*[A-Z])') }
  }

  if (suggestion.rule === 'pattern:number') {
    return { pattern: mergeLookaheadPattern(undefined, '(?=.*\\d)') }
  }

  if (suggestion.rule === 'pattern:special') {
    return { pattern: mergeLookaheadPattern(undefined, '(?=.*[^A-Za-z0-9])') }
  }

  if (suggestion.rule === 'format:url') {
    return { pattern: '^https?://.+' }
  }

  if (suggestion.rule.startsWith('min:')) {
    const numericValue = Number.parseInt(suggestion.rule.slice('min:'.length), 10)
    return Number.isFinite(numericValue) ? { min: numericValue } : null
  }

  if (suggestion.rule.startsWith('range:')) {
    const [minValue, maxValue] = suggestion.rule
      .slice('range:'.length)
      .split('-')
      .map((value) => Number.parseInt(value, 10))
    return Number.isFinite(minValue) && Number.isFinite(maxValue)
      ? { min: minValue, max: maxValue }
      : null
  }

  if (suggestion.rule === 'maxSize:10MB') {
    return { maxSizeMB: 10 }
  }

  if (suggestion.rule === 'allowedTypes') {
    return {
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/png',
        'image/jpeg',
      ],
    }
  }

  return null
}

function mergeLookaheadPattern(existingPattern: string | undefined, nextLookahead: string): string {
  const lookaheads = new Set(existingPattern?.match(/\(\?\=.*?\)/g) ?? [])
  lookaheads.add(nextLookahead)
  return `^${Array.from(lookaheads).join('')}.+$`
}

function getDefaultSuggestedFieldConfig(suggestion: FieldSuggestion): Record<string, unknown> {
  if (suggestion.type === 'SELECT') {
    return {
      mode: 'static',
      options: getSuggestedFieldOptions(suggestion.key),
    }
  }

  if (suggestion.type === 'LONG_TEXT') {
    return {
      placeholder: suggestion.description || suggestion.label,
      maxLength: 1000,
    }
  }

  if (suggestion.type === 'PHONE') {
    return { placeholder: '+1 555 0100' }
  }

  if (suggestion.type === 'EMAIL') {
    return { placeholder: 'name@example.com' }
  }

  return {}
}

function getSuggestedFieldOptions(key: string): Array<{ label: string; value: string }> {
  const optionPresets: Record<string, Array<{ label: string; value: string }>> = {
    preferred_contact: [
      { label: 'Email', value: 'email' },
      { label: 'Phone', value: 'phone' },
      { label: 'SMS', value: 'sms' },
    ],
    tshirt_size: [
      { label: 'XS', value: 'xs' },
      { label: 'S', value: 's' },
      { label: 'M', value: 'm' },
      { label: 'L', value: 'l' },
      { label: 'XL', value: 'xl' },
    ],
    pronouns: [
      { label: 'She / Her', value: 'she_her' },
      { label: 'He / Him', value: 'he_him' },
      { label: 'They / Them', value: 'they_them' },
      { label: 'Prefer not to say', value: 'no_answer' },
    ],
    how_heard: [
      { label: 'Search', value: 'search' },
      { label: 'Friend', value: 'friend' },
      { label: 'Social media', value: 'social' },
      { label: 'Event', value: 'event' },
      { label: 'Other', value: 'other' },
    ],
  }

  return optionPresets[key] ?? genericOptionsForKey(key)
}

function genericOptionsForKey(key: string): Array<{ label: string; value: string }> {
  const normalized = normalizeIdentifier(key)

  if (normalized.includes('department')) {
    return [
      { label: 'Engineering', value: 'engineering' },
      { label: 'Design', value: 'design' },
      { label: 'People Operations', value: 'people_ops' },
    ]
  }

  return [
    { label: 'Option A', value: 'option_a' },
    { label: 'Option B', value: 'option_b' },
    { label: 'Option C', value: 'option_c' },
  ]
}

function normalizeIdentifier(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
