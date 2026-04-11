import type { FormField, FormStep, FieldType, FieldKey, FormValues } from './types'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FormGenerationPrompt {
  /** Natural language description of the form */
  description: string
  /** Desired form category (auto-detected if not provided) */
  category?: string
  /** Maximum number of fields to generate */
  maxFields?: number
  /** Whether to include multi-step layout */
  multiStep?: boolean
}

export interface GeneratedFormConfig {
  title: string
  description: string
  fields: FormField[]
  steps: FormStep[]
  category: string
}

export interface ValidationSuggestion {
  fieldKey: FieldKey
  fieldLabel: string
  rule: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

export interface FieldSuggestion {
  type: FieldType
  key: string
  label: string
  description: string
  required: boolean
  reason: string
  category: string
}

export interface AutofillDraftRequest {
  fields: FormField[]
  sourceText: string
}

export interface AutofillDraftMatch {
  fieldKey: FieldKey
  fieldLabel: string
  value: unknown
  confidence: number
  source: string
  reason: string
}

export interface AutofillDraftResult {
  values: FormValues
  matches: AutofillDraftMatch[]
  warnings: string[]
  unmatchedFieldKeys: FieldKey[]
  requiresReview: true
}

// ─── Form Type Detection ────────────────────────────────────────────────────

const FORM_TYPE_PATTERNS: Record<string, string[]> = {
  contact: ['contact', 'inquiry', 'reach out', 'get in touch', 'message us'],
  registration: ['register', 'sign up', 'signup', 'create account', 'enrollment'],
  onboarding: ['onboarding', 'onboard', 'new employee', 'new hire', 'welcome'],
  survey: ['survey', 'feedback', 'opinion', 'satisfaction', 'questionnaire'],
  order: ['order', 'purchase', 'checkout', 'buy', 'cart'],
  application: ['application', 'apply', 'job', 'position', 'candidate'],
  medical: ['medical', 'health', 'patient', 'clinical', 'intake'],
  event: ['event', 'rsvp', 'registration', 'conference', 'workshop'],
  support: ['support', 'ticket', 'issue', 'help', 'bug report'],
  booking: ['booking', 'reservation', 'appointment', 'schedule'],
}

/**
 * Detect the form type/category from a natural language description.
 */
export function detectFormType(description: string): string {
  const lower = description.toLowerCase()
  for (const [type, patterns] of Object.entries(FORM_TYPE_PATTERNS)) {
    if (patterns.some(p => lower.includes(p))) {
      return type
    }
  }
  return 'general'
}

// ─── LLM Prompt Builder ─────────────────────────────────────────────────────

/**
 * Build a structured prompt for an LLM to generate DFE form configuration.
 * The output prompt is designed to produce JSON that matches the DFE schema.
 */
export function buildLlmPrompt(input: FormGenerationPrompt): string {
  const category = input.category ?? detectFormType(input.description)
  const maxFields = input.maxFields ?? 15

  return `You are a form designer. Generate a JSON form configuration for the Dynamic Form Engine (DFE).

DESCRIPTION: ${input.description}
CATEGORY: ${category}
MAX FIELDS: ${maxFields}
MULTI-STEP: ${input.multiStep !== false ? 'yes' : 'no'}

Generate a JSON object with this structure:
{
  "title": "Form Title",
  "description": "Form description",
  "fields": [
    {
      "id": "field_<key>",
      "versionId": "v1",
      "key": "<snake_case_key>",
      "label": "Human Readable Label",
      "description": "Optional help text",
      "type": "<FIELD_TYPE>",
      "required": true/false,
      "order": 0,
      "stepId": "step_1",
      "config": { ... type-specific config ... }
    }
  ],
  "steps": [
    {
      "id": "step_1",
      "versionId": "v1",
      "title": "Step Title",
      "order": 0
    }
  ]
}

Available field types: SHORT_TEXT, LONG_TEXT, NUMBER, EMAIL, PHONE, DATE, DATE_RANGE, TIME, DATE_TIME, SELECT, MULTI_SELECT, RADIO, CHECKBOX, FILE_UPLOAD, RATING, SCALE, URL, PASSWORD, HIDDEN, SECTION_BREAK, FIELD_GROUP, RICH_TEXT, SIGNATURE, ADDRESS

For SELECT/RADIO fields, include: { "mode": "static", "options": [{ "label": "...", "value": "..." }] }
For NUMBER fields, include: { "min": ..., "max": ..., "format": "integer"|"decimal"|"currency" }
For TEXT fields, include: { "minLength": ..., "maxLength": ... }

Respond ONLY with the JSON object. No explanations.`
}

// ─── Form Generation (template-based) ──────────────────────────────────────

const FIELD_TEMPLATES: Record<string, Array<{ key: string; label: string; type: FieldType; required: boolean; config?: any }>> = {
  contact: [
    { key: 'full_name', label: 'Full Name', type: 'SHORT_TEXT', required: true },
    { key: 'email', label: 'Email Address', type: 'EMAIL', required: true },
    { key: 'phone', label: 'Phone Number', type: 'PHONE', required: false },
    { key: 'subject', label: 'Subject', type: 'SHORT_TEXT', required: true },
    { key: 'message', label: 'Message', type: 'LONG_TEXT', required: true, config: { maxLength: 2000 } },
  ],
  registration: [
    { key: 'first_name', label: 'First Name', type: 'SHORT_TEXT', required: true },
    { key: 'last_name', label: 'Last Name', type: 'SHORT_TEXT', required: true },
    { key: 'email', label: 'Email', type: 'EMAIL', required: true },
    { key: 'password', label: 'Password', type: 'PASSWORD', required: true, config: { minLength: 8 } },
    { key: 'date_of_birth', label: 'Date of Birth', type: 'DATE', required: false },
    { key: 'agree_terms', label: 'I agree to the Terms and Conditions', type: 'CHECKBOX', required: true },
  ],
  onboarding: [
    { key: 'first_name', label: 'First Name', type: 'SHORT_TEXT', required: true },
    { key: 'last_name', label: 'Last Name', type: 'SHORT_TEXT', required: true },
    { key: 'email', label: 'Work Email', type: 'EMAIL', required: true },
    { key: 'phone', label: 'Phone', type: 'PHONE', required: true },
    { key: 'department', label: 'Department', type: 'SELECT', required: true, config: { mode: 'static', options: [{ label: 'Engineering', value: 'engineering' }, { label: 'Marketing', value: 'marketing' }, { label: 'Sales', value: 'sales' }, { label: 'HR', value: 'hr' }, { label: 'Finance', value: 'finance' }] } },
    { key: 'start_date', label: 'Start Date', type: 'DATE', required: true },
    { key: 'address', label: 'Home Address', type: 'ADDRESS', required: true },
    { key: 'emergency_contact_name', label: 'Emergency Contact Name', type: 'SHORT_TEXT', required: true },
    { key: 'emergency_contact_phone', label: 'Emergency Contact Phone', type: 'PHONE', required: true },
    { key: 'id_document', label: 'ID Document Upload', type: 'FILE_UPLOAD', required: true, config: { maxSizeMB: 10, allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf'] } },
  ],
  survey: [
    { key: 'overall_rating', label: 'Overall Satisfaction', type: 'RATING', required: true, config: { max: 5 } },
    { key: 'recommend', label: 'How likely are you to recommend us?', type: 'SCALE', required: true, config: { min: 0, max: 10, minLabel: 'Not likely', maxLabel: 'Very likely' } },
    { key: 'best_feature', label: 'What do you like most?', type: 'SELECT', required: false, config: { mode: 'static', options: [{ label: 'Product Quality', value: 'quality' }, { label: 'Customer Service', value: 'service' }, { label: 'Pricing', value: 'pricing' }, { label: 'Ease of Use', value: 'ease' }] } },
    { key: 'improvements', label: 'What could we improve?', type: 'LONG_TEXT', required: false },
    { key: 'contact_follow_up', label: 'May we contact you for follow-up?', type: 'CHECKBOX', required: false },
    { key: 'email', label: 'Email (optional)', type: 'EMAIL', required: false },
  ],
  support: [
    { key: 'name', label: 'Your Name', type: 'SHORT_TEXT', required: true },
    { key: 'email', label: 'Email', type: 'EMAIL', required: true },
    { key: 'category', label: 'Issue Category', type: 'SELECT', required: true, config: { mode: 'static', options: [{ label: 'Bug Report', value: 'bug' }, { label: 'Feature Request', value: 'feature' }, { label: 'Account Issue', value: 'account' }, { label: 'Billing', value: 'billing' }, { label: 'Other', value: 'other' }] } },
    { key: 'priority', label: 'Priority', type: 'RADIO', required: true, config: { mode: 'static', options: [{ label: 'Low', value: 'low' }, { label: 'Medium', value: 'medium' }, { label: 'High', value: 'high' }, { label: 'Critical', value: 'critical' }] } },
    { key: 'description', label: 'Describe the Issue', type: 'LONG_TEXT', required: true },
    { key: 'screenshot', label: 'Screenshot (optional)', type: 'FILE_UPLOAD', required: false, config: { maxSizeMB: 5, allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif'] } },
  ],
}

/**
 * Generate a form configuration from a natural language description.
 * Uses template-based generation (no LLM required).
 * For LLM-based generation, use `buildLlmPrompt()` and pass to your LLM.
 */
export function generateFormFromDescription(prompt: FormGenerationPrompt): GeneratedFormConfig {
  const category = prompt.category ?? detectFormType(prompt.description)
  const templates = FIELD_TEMPLATES[category] ?? FIELD_TEMPLATES.contact!
  const maxFields = prompt.maxFields ?? templates.length

  const fields: FormField[] = templates.slice(0, maxFields).map((t, i) => ({
    id: `field_${t.key}`,
    versionId: 'v1',
    key: t.key,
    label: t.label,
    type: t.type,
    required: t.required,
    order: i,
    config: t.config ?? {},
    stepId: prompt.multiStep ? `step_${Math.floor(i / 4) + 1}` : undefined,
  }))

  const steps: FormStep[] = []
  if (prompt.multiStep) {
    const stepCount = Math.ceil(fields.length / 4)
    const stepTitles: Record<string, string[]> = {
      contact: ['Contact Information', 'Message Details'],
      registration: ['Account Details', 'Personal Info', 'Confirmation'],
      onboarding: ['Personal Information', 'Work Details', 'Emergency & Documents'],
      survey: ['Rating', 'Feedback Details'],
      support: ['Issue Details', 'Description & Evidence'],
    }
    const titles = stepTitles[category] ?? Array.from({ length: stepCount }, (_, i) => `Step ${i + 1}`)
    for (let i = 0; i < stepCount; i++) {
      steps.push({
        id: `step_${i + 1}`,
        versionId: 'v1',
        title: titles[i] ?? `Step ${i + 1}`,
        order: i,
      })
    }
  }

  // Extract title from description
  const title = prompt.description.length > 60
    ? prompt.description.slice(0, 57) + '...'
    : prompt.description

  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    description: prompt.description,
    fields,
    steps,
    category,
  }
}

// ─── Validation Suggestions ─────────────────────────────────────────────────

const VALIDATION_RULES: Record<string, Array<{ rule: string; description: string; priority: 'high' | 'medium' | 'low' }>> = {
  EMAIL: [
    { rule: 'format:email', description: 'Validate email format', priority: 'high' },
    { rule: 'async:unique', description: 'Check email uniqueness via API', priority: 'medium' },
  ],
  PHONE: [
    { rule: 'format:phone', description: 'Validate phone number format', priority: 'high' },
    { rule: 'minLength:10', description: 'Minimum 10 digits', priority: 'medium' },
  ],
  PASSWORD: [
    { rule: 'minLength:8', description: 'Minimum 8 characters', priority: 'high' },
    { rule: 'pattern:uppercase', description: 'Require at least one uppercase letter', priority: 'medium' },
    { rule: 'pattern:number', description: 'Require at least one number', priority: 'medium' },
    { rule: 'pattern:special', description: 'Require at least one special character', priority: 'low' },
  ],
  URL: [
    { rule: 'format:url', description: 'Validate URL format', priority: 'high' },
  ],
  NUMBER: [
    { rule: 'min:0', description: 'Ensure non-negative value', priority: 'medium' },
  ],
  DATE: [
    { rule: 'min:today', description: 'Must be today or in the future', priority: 'low' },
  ],
  FILE_UPLOAD: [
    { rule: 'maxSize:10MB', description: 'Limit file size to 10MB', priority: 'high' },
    { rule: 'allowedTypes', description: 'Restrict allowed file types', priority: 'high' },
  ],
}

/**
 * Suggest validation rules based on field types and labels.
 */
export function suggestValidationRules(fields: FormField[]): ValidationSuggestion[] {
  const suggestions: ValidationSuggestion[] = []

  for (const field of fields) {
    const rules = VALIDATION_RULES[field.type]
    if (rules) {
      for (const rule of rules) {
        suggestions.push({
          fieldKey: field.key,
          fieldLabel: field.label,
          rule: rule.rule,
          description: rule.description,
          priority: rule.priority,
        })
      }
    }

    // Label-based suggestions
    const lower = field.label.toLowerCase()
    if (lower.includes('age') && field.type === 'NUMBER') {
      suggestions.push({ fieldKey: field.key, fieldLabel: field.label, rule: 'range:0-150', description: 'Valid age range (0-150)', priority: 'medium' })
    }
    if (lower.includes('zip') || lower.includes('postal')) {
      suggestions.push({ fieldKey: field.key, fieldLabel: field.label, rule: 'pattern:zip', description: 'Validate ZIP/postal code format', priority: 'medium' })
    }
    if (lower.includes('confirm') && (lower.includes('email') || lower.includes('password'))) {
      suggestions.push({ fieldKey: field.key, fieldLabel: field.label, rule: 'match:original', description: 'Must match the original field', priority: 'high' })
    }
  }

  return suggestions.sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 }
    return p[a.priority] - p[b.priority]
  })
}

// ─── Smart Field Suggestions ────────────────────────────────────────────────

const FIELD_SUGGESTIONS_BY_TYPE: Record<string, FieldSuggestion[]> = {
  contact: [
    { type: 'SHORT_TEXT', key: 'company', label: 'Company Name', description: 'Organization name', required: false, reason: 'Common for business contacts', category: 'contact' },
    { type: 'SELECT', key: 'preferred_contact', label: 'Preferred Contact Method', description: '', required: false, reason: 'Helps prioritize follow-up', category: 'contact' },
  ],
  onboarding: [
    { type: 'SHORT_TEXT', key: 'dietary_restrictions', label: 'Dietary Restrictions', description: 'For office events', required: false, reason: 'Useful for office planning', category: 'personal' },
    { type: 'SELECT', key: 'tshirt_size', label: 'T-Shirt Size', description: 'For company swag', required: false, reason: 'Common onboarding field', category: 'personal' },
    { type: 'SHORT_TEXT', key: 'preferred_name', label: 'Preferred Name', description: 'What should we call you?', required: false, reason: 'Inclusive onboarding practice', category: 'personal' },
    { type: 'SELECT', key: 'pronouns', label: 'Pronouns', description: '', required: false, reason: 'Inclusive onboarding practice', category: 'personal' },
    { type: 'SHORT_TEXT', key: 'bank_account', label: 'Bank Account Number', description: 'For payroll', required: true, reason: 'Required for payroll setup', category: 'financial' },
    { type: 'SHORT_TEXT', key: 'tax_id', label: 'Tax ID / SSN', description: '', required: true, reason: 'Required for tax documentation', category: 'financial' },
  ],
  survey: [
    { type: 'LONG_TEXT', key: 'additional_comments', label: 'Additional Comments', description: 'Any other thoughts?', required: false, reason: 'Captures open-ended feedback', category: 'feedback' },
    { type: 'DATE', key: 'last_interaction', label: 'Last Interaction Date', description: '', required: false, reason: 'Provides context for feedback', category: 'context' },
  ],
  registration: [
    { type: 'PHONE', key: 'phone', label: 'Phone Number', description: '', required: false, reason: 'Alternative contact method', category: 'contact' },
    { type: 'SELECT', key: 'how_heard', label: 'How did you hear about us?', description: '', required: false, reason: 'Marketing attribution', category: 'marketing' },
    { type: 'CHECKBOX', key: 'newsletter', label: 'Subscribe to newsletter', description: '', required: false, reason: 'Marketing opt-in', category: 'marketing' },
  ],
}

/**
 * Suggest additional fields based on existing form fields and detected form type.
 */
export function suggestAdditionalFields(fields: FormField[], formType?: string): FieldSuggestion[] {
  const type = formType ?? detectFormType(fields.map(f => f.label).join(' '))
  const existingKeys = new Set(fields.map(f => f.key))

  const suggestions = FIELD_SUGGESTIONS_BY_TYPE[type] ?? []
  return suggestions.filter(s => !existingKeys.has(s.key))
}

/**
 * Group field suggestions by category for display.
 */
export function groupSuggestionsByCategory(suggestions: FieldSuggestion[]): Record<string, FieldSuggestion[]> {
  const grouped: Record<string, FieldSuggestion[]> = {}
  for (const s of suggestions) {
    if (!grouped[s.category]) grouped[s.category] = []
    grouped[s.category].push(s)
  }
  return grouped
}

// ─── AI-assisted Draft Fill ─────────────────────────────────────────────────

interface StructuredEntry {
  key: string
  normalizedKey: string
  value: string
  source: string
}

interface ParsedSignals {
  fullName?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  url?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  street?: string
}

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
const PHONE_PATTERN = /(?:\+\d{1,3}[\s-]*)?(?:\(\d{2,4}\)[\s-]*)?(?:\d[\s-]*){7,14}\d/
const URL_PATTERN = /\bhttps?:\/\/[^\s]+/i
const ISO_DATE_PATTERN = /\b\d{4}-\d{2}-\d{2}\b/
const SENSITIVE_CLASSIFICATIONS = new Set([
  'phi',
  'financial',
  'credential',
  'restricted',
])

/**
 * Build a review-first draft answer set from pasted profile text.
 * This helper is deterministic and local-only; it never auto-submits.
 */
export function generateAutofillDraft(input: AutofillDraftRequest): AutofillDraftResult {
  const sourceText = input.sourceText.trim()

  if (!sourceText) {
    return {
      values: {},
      matches: [],
      warnings: ['Provide profile text or key/value pairs before generating a draft.'],
      unmatchedFieldKeys: input.fields.map((field) => field.key),
      requiresReview: true,
    }
  }

  const structuredEntries = extractStructuredEntries(sourceText)
  const signals = extractSignals(sourceText, structuredEntries)
  const values: FormValues = {}
  const matches: AutofillDraftMatch[] = []
  const warnings = new Set<string>()
  const unmatchedFieldKeys: FieldKey[] = []

  for (const field of input.fields) {
    const match = buildAutofillMatch(field, sourceText, structuredEntries, signals)
    if (!match) {
      unmatchedFieldKeys.push(field.key)
      continue
    }

    values[field.key] = match.value
    matches.push(match)

    if (match.confidence < 0.75) {
      warnings.add(`Review "${field.label}" carefully because the draft confidence is low.`)
    }

    if (isSensitiveField(field)) {
      warnings.add(`"${field.label}" may contain sensitive data. Review it before applying the draft.`)
    }
  }

  if (matches.length === 0) {
    warnings.add('No draft answers could be inferred from the provided text.')
  }

  return {
    values,
    matches,
    warnings: Array.from(warnings),
    unmatchedFieldKeys,
    requiresReview: true,
  }
}

function extractStructuredEntries(sourceText: string): StructuredEntry[] {
  const entries: StructuredEntry[] = []
  const lines = sourceText
    .split(/\n|;/)
    .map((line) => line.trim())
    .filter(Boolean)

  for (const line of lines) {
    const match = line.match(/^(?:[-*]\s*)?([^:=]+?)\s*[:=]\s*(.+)$/)
    if (!match) continue

    const rawKey = match[1].trim()
    const rawValue = match[2].trim()
    if (!rawKey || !rawValue) continue

    entries.push({
      key: rawKey,
      normalizedKey: normalizeText(rawKey),
      value: rawValue,
      source: line,
    })
  }

  return entries
}

function extractSignals(sourceText: string, entries: StructuredEntry[]): ParsedSignals {
  const fullName = findEntryValue(entries, ['full name', 'name']) ?? undefined
  const firstName = findEntryValue(entries, ['first name', 'given name']) ?? splitName(fullName).firstName
  const lastName = findEntryValue(entries, ['last name', 'surname', 'family name']) ?? splitName(fullName).lastName

  return {
    fullName,
    firstName,
    lastName,
    email: findEntryValue(entries, ['email', 'email address', 'work email']) ?? sourceText.match(EMAIL_PATTERN)?.[0],
    phone: findEntryValue(entries, ['phone', 'phone number', 'mobile', 'mobile number']) ?? sourceText.match(PHONE_PATTERN)?.[0]?.trim(),
    url: findEntryValue(entries, ['website', 'url', 'portfolio']) ?? sourceText.match(URL_PATTERN)?.[0],
    street: findEntryValue(entries, ['street', 'street address', 'address line 1', 'address']),
    city: findEntryValue(entries, ['city', 'town']),
    state: findEntryValue(entries, ['state', 'province', 'region']),
    zip: findEntryValue(entries, ['zip', 'zip code', 'postal code', 'postcode']),
    country: findEntryValue(entries, ['country', 'nation']),
  }
}

function buildAutofillMatch(
  field: FormField,
  sourceText: string,
  entries: StructuredEntry[],
  signals: ParsedSignals,
): AutofillDraftMatch | null {
  const aliases = getFieldAliases(field)
  const directEntry = findStructuredEntry(entries, aliases)
  const directValue = directEntry ? coerceDraftValue(field, directEntry.value, entries, signals, sourceText) : undefined

  if (directEntry && directValue !== undefined) {
    return {
      fieldKey: field.key,
      fieldLabel: field.label,
      value: directValue,
      confidence: 0.95,
      source: directEntry.source,
      reason: 'Matched an explicit profile key/value pair.',
    }
  }

  const inferredValue = inferDraftValue(field, entries, signals, sourceText)
  if (inferredValue === undefined) {
    return null
  }

  return {
    fieldKey: field.key,
    fieldLabel: field.label,
    value: inferredValue.value,
    confidence: inferredValue.confidence,
    source: inferredValue.source,
    reason: inferredValue.reason,
  }
}

function inferDraftValue(
  field: FormField,
  entries: StructuredEntry[],
  signals: ParsedSignals,
  sourceText: string,
): Omit<AutofillDraftMatch, 'fieldKey' | 'fieldLabel'> | undefined {
  const normalizedLabel = normalizeText(field.label)
  const normalizedKey = normalizeText(field.key)

  if (field.type === 'EMAIL' && signals.email) {
    return {
      value: signals.email,
      confidence: 0.88,
      source: signals.email,
      reason: 'Detected an email address in the source text.',
    }
  }

  if (field.type === 'PHONE' && signals.phone) {
    return {
      value: signals.phone,
      confidence: 0.84,
      source: signals.phone,
      reason: 'Detected a phone number in the source text.',
    }
  }

  if (field.type === 'URL' && signals.url) {
    return {
      value: signals.url,
      confidence: 0.84,
      source: signals.url,
      reason: 'Detected a URL in the source text.',
    }
  }

  if ((normalizedKey.includes('first name') || normalizedLabel.includes('first name')) && signals.firstName) {
    return {
      value: signals.firstName,
      confidence: 0.82,
      source: signals.fullName ?? signals.firstName,
      reason: 'Split the detected full name into first and last name.',
    }
  }

  if ((normalizedKey.includes('last name') || normalizedLabel.includes('last name')) && signals.lastName) {
    return {
      value: signals.lastName,
      confidence: 0.82,
      source: signals.fullName ?? signals.lastName,
      reason: 'Split the detected full name into first and last name.',
    }
  }

  if ((normalizedKey === 'name' || normalizedKey === 'full name' || normalizedLabel === 'name' || normalizedLabel === 'full name') && signals.fullName) {
    return {
      value: signals.fullName,
      confidence: 0.86,
      source: signals.fullName,
      reason: 'Detected a full name in the source text.',
    }
  }

  if (field.type === 'ADDRESS') {
    const addressValue = buildAddressValue(entries, signals)
    if (addressValue) {
      return {
        value: addressValue,
        confidence: 0.8,
        source: formatAddressSource(addressValue),
        reason: 'Built an address object from structured profile details.',
      }
    }
  }

  const optionMatch = matchOptionValue(field, sourceText)
  if (optionMatch !== undefined) {
    return {
      value: optionMatch.value,
      confidence: optionMatch.confidence,
      source: optionMatch.source,
      reason: optionMatch.reason,
    }
  }

  if (field.type === 'CHECKBOX') {
    const checkboxValue = inferCheckboxValue(field, sourceText)
    if (checkboxValue !== undefined) {
      return {
        value: checkboxValue,
        confidence: 0.68,
        source: checkboxValue ? 'yes' : 'no',
        reason: 'Inferred a boolean choice from the source text.',
      }
    }
  }

  if (field.type === 'NUMBER' || field.type === 'RATING' || field.type === 'SCALE') {
    const numericEntry = findStructuredEntry(entries, getFieldAliases(field))
    if (numericEntry) {
      const numericValue = parseNumericValue(numericEntry.value)
      if (numericValue !== undefined) {
        return {
          value: numericValue,
          confidence: 0.84,
          source: numericEntry.source,
          reason: 'Parsed a numeric value from the profile text.',
        }
      }
    }
  }

  if (field.type === 'DATE' || field.type === 'DATE_TIME') {
    const dateEntry = findStructuredEntry(entries, getFieldAliases(field))
    if (dateEntry) {
      const dateValue = parseDateValue(dateEntry.value, field.type === 'DATE_TIME')
      if (dateValue !== undefined) {
        return {
          value: dateValue,
          confidence: 0.84,
          source: dateEntry.source,
          reason: 'Parsed a date value from the profile text.',
        }
      }
    }

    const inlineDate = sourceText.match(ISO_DATE_PATTERN)?.[0]
    if (inlineDate) {
      return {
        value: inlineDate,
        confidence: 0.6,
        source: inlineDate,
        reason: 'Detected an ISO date in the source text.',
      }
    }
  }

  if (field.type === 'LONG_TEXT') {
    const textEntry = findStructuredEntry(entries, getFieldAliases(field))
    if (textEntry) {
      return {
        value: textEntry.value,
        confidence: 0.78,
        source: textEntry.source,
        reason: 'Used an explicit long-text profile entry.',
      }
    }
  }

  if (field.type === 'SHORT_TEXT') {
    const textEntry = findStructuredEntry(entries, getFieldAliases(field))
    if (textEntry) {
      return {
        value: textEntry.value,
        confidence: 0.78,
        source: textEntry.source,
        reason: 'Used an explicit profile entry.',
      }
    }
  }

  return undefined
}

function coerceDraftValue(
  field: FormField,
  rawValue: string,
  entries: StructuredEntry[],
  signals: ParsedSignals,
  sourceText: string,
): unknown {
  switch (field.type) {
    case 'NUMBER':
    case 'RATING':
    case 'SCALE':
      return parseNumericValue(rawValue)
    case 'DATE':
      return parseDateValue(rawValue, false)
    case 'DATE_TIME':
      return parseDateValue(rawValue, true)
    case 'EMAIL':
      return rawValue.match(EMAIL_PATTERN)?.[0]
    case 'PHONE':
      return rawValue.match(PHONE_PATTERN)?.[0]?.trim()
    case 'URL':
      return rawValue.match(URL_PATTERN)?.[0] ?? rawValue
    case 'CHECKBOX':
      return parseCheckboxValue(rawValue)
    case 'SELECT':
    case 'RADIO':
      return coerceOptionValue(field, rawValue)
    case 'MULTI_SELECT':
      return rawValue
        .split(',')
        .map((part) => coerceOptionValue(field, part.trim()))
        .filter((value): value is string => typeof value === 'string')
    case 'ADDRESS':
      return buildAddressValue(entries, signals) ?? rawValue
    case 'FILE_UPLOAD':
    case 'SIGNATURE':
      return undefined
    default:
      return rawValue
  }
}

function parseNumericValue(value: string): number | undefined {
  const numeric = Number.parseFloat(value.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(numeric) ? numeric : undefined
}

function parseDateValue(value: string, includeTime: boolean): string | undefined {
  if (includeTime && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString()
  }

  if (ISO_DATE_PATTERN.test(value)) {
    return value.match(ISO_DATE_PATTERN)?.[0]
  }

  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return undefined
  return new Date(parsed).toISOString().slice(0, 10)
}

function parseCheckboxValue(value: string): boolean | undefined {
  const normalized = normalizeText(value)

  if (
    normalized === 'yes'
    || normalized === 'true'
    || normalized === 'agree'
    || normalized === 'agreed'
    || normalized === 'accept'
    || normalized === 'accepted'
    || normalized === 'subscribed'
    || normalized === 'opt in'
  ) {
    return true
  }

  if (
    normalized === 'no'
    || normalized === 'false'
    || normalized === 'decline'
    || normalized === 'declined'
    || normalized === 'opt out'
  ) {
    return false
  }

  return undefined
}

function inferCheckboxValue(field: FormField, sourceText: string): boolean | undefined {
  const explicit = parseCheckboxValue(sourceText)
  if (explicit !== undefined) {
    return explicit
  }

  const normalizedField = `${normalizeText(field.key)} ${normalizeText(field.label)}`
  if (
    normalizedField.includes('agree')
    || normalizedField.includes('consent')
    || normalizedField.includes('terms')
  ) {
    if (/\b(agree|agreed|accept|accepted|consent)\b/i.test(sourceText)) {
      return true
    }
  }

  if (normalizedField.includes('newsletter') || normalizedField.includes('subscribe')) {
    if (/\b(subscribe|subscribed|opt in)\b/i.test(sourceText)) {
      return true
    }
  }

  return undefined
}

function matchOptionValue(
  field: FormField,
  sourceText: string,
): { value: string; confidence: number; source: string; reason: string } | undefined {
  const options = getFieldOptions(field)
  if (options.length === 0) return undefined

  const normalizedSource = normalizeText(sourceText)
  for (const option of options) {
    const normalizedLabel = normalizeText(option.label)
    const normalizedValue = normalizeText(option.value)

    if (normalizedSource.includes(normalizedLabel) || normalizedSource.includes(normalizedValue)) {
      return {
        value: option.value,
        confidence: 0.76,
        source: option.label,
        reason: 'Matched one of the configured field options.',
      }
    }
  }

  return undefined
}

function coerceOptionValue(field: FormField, rawValue: string): string | undefined {
  const options = getFieldOptions(field)
  if (options.length === 0) return rawValue

  const normalizedValue = normalizeText(rawValue)
  const option = options.find(
    (candidate) =>
      normalizeText(candidate.label) === normalizedValue
      || normalizeText(candidate.value) === normalizedValue,
  )

  return option?.value
}

function getFieldOptions(field: FormField): Array<{ label: string; value: string }> {
  const config = field.config as { options?: Array<{ label: string; value: string }> }
  return Array.isArray(config.options) ? config.options : []
}

function buildAddressValue(entries: StructuredEntry[], signals: ParsedSignals) {
  const streetEntry = findStructuredEntry(entries, new Set(['street', 'street address', 'address', 'address line 1']))
  const cityEntry = findStructuredEntry(entries, new Set(['city', 'town']))
  const stateEntry = findStructuredEntry(entries, new Set(['state', 'province', 'region']))
  const zipEntry = findStructuredEntry(entries, new Set(['zip', 'zip code', 'postal code', 'postcode']))
  const countryEntry = findStructuredEntry(entries, new Set(['country', 'nation']))

  const address = {
    street: streetEntry?.value ?? signals.street ?? '',
    city: cityEntry?.value ?? signals.city ?? '',
    state: stateEntry?.value ?? signals.state ?? '',
    zip: zipEntry?.value ?? signals.zip ?? '',
    country: countryEntry?.value ?? signals.country ?? '',
  }

  return Object.values(address).some(Boolean) ? address : undefined
}

function formatAddressSource(address: {
  street: string
  city: string
  state: string
  zip: string
  country: string
}) {
  return [address.street, address.city, address.state, address.zip, address.country]
    .filter(Boolean)
    .join(', ')
}

function findStructuredEntry(entries: StructuredEntry[], aliases: Set<string>): StructuredEntry | undefined {
  return entries.find((entry) => aliases.has(entry.normalizedKey))
}

function findEntryValue(entries: StructuredEntry[], aliases: string[]): string | undefined {
  return findStructuredEntry(entries, new Set(aliases.map(normalizeText)))?.value
}

function getFieldAliases(field: FormField): Set<string> {
  const aliases = new Set<string>([
    normalizeText(field.key),
    normalizeText(field.label),
  ])
  const combined = `${normalizeText(field.key)} ${normalizeText(field.label)}`

  if (combined.includes('first name')) {
    aliases.add('given name')
  }
  if (combined.includes('last name')) {
    aliases.add('surname')
    aliases.add('family name')
  }
  if (combined.includes('name')) {
    aliases.add('full name')
  }
  if (combined.includes('email')) {
    aliases.add('email address')
    aliases.add('work email')
  }
  if (combined.includes('phone')) {
    aliases.add('phone number')
    aliases.add('mobile')
    aliases.add('mobile number')
  }
  if (combined.includes('company')) {
    aliases.add('organization')
  }
  if (combined.includes('zip')) {
    aliases.add('postal code')
  }
  if (combined.includes('tax id')) {
    aliases.add('ssn')
    aliases.add('tax id')
  }
  if (combined.includes('bank account')) {
    aliases.add('account number')
  }

  return aliases
}

function splitName(fullName?: string) {
  if (!fullName) {
    return { firstName: undefined, lastName: undefined }
  }

  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return { firstName: undefined, lastName: undefined }
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: undefined }
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

function normalizeText(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function isSensitiveField(field: FormField): boolean {
  const config = field.config as {
    compliance?: {
      classification?: string
      protected?: boolean
    }
  }
  const classification = config.compliance?.classification

  return Boolean(
    config.compliance?.protected
    || (classification && SENSITIVE_CLASSIFICATIONS.has(classification)),
  )
}
