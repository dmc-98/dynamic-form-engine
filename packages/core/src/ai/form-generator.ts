import type { FormField, FormStep, FieldType } from '../types'

export interface FormGenerationPrompt {
  description: string
  formType?: 'contact' | 'survey' | 'onboarding' | 'registration' | 'feedback' | 'application' | 'custom'
  maxFields?: number
  includeSteps?: boolean
}

export interface GeneratedFormConfig {
  fields: FormField[]
  steps?: FormStep[]
  title: string
  description: string
}

/**
 * Parse a natural language form description into DFE config.
 * Uses heuristic rules for common patterns. For production,
 * integrate with an actual LLM API.
 *
 * @example
 * const config = generateFormFromDescription({
 *   description: "Employee onboarding form with personal info, emergency contacts, and bank details",
 *   includeSteps: true,
 * })
 */
export function generateFormFromDescription(prompt: FormGenerationPrompt): GeneratedFormConfig {
  const description = prompt.description.toLowerCase()
  const maxFields = prompt.maxFields ?? 20
  const includeSteps = prompt.includeSteps ?? false

  // Generate title from description (first 50 chars or first sentence)
  const titleMatch = prompt.description.match(/^([^.!?]+)[.!?]?/)
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled Form'

  const fields: FormField[] = []
  const fieldMap = new Map<string, string>() // label → key mapping for deduplication
  let fieldOrder = 0

  // Helper to add field if not already present
  const addField = (label: string, type: FieldType, required: boolean = false) => {
    const lowerLabel = label.toLowerCase()
    if (fieldMap.has(lowerLabel)) return

    const key = lowerLabel.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    fieldMap.set(lowerLabel, key)

    const field: FormField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      versionId: 'v1',
      key,
      label,
      type,
      required,
      order: fieldOrder++,
      config: getDefaultConfigForType(type),
    }

    fields.push(field)
  }

  // Pattern matching for common fields
  const patterns = [
    // Names
    { pattern: /\b(first\s+name|given\s+name|forename)\b/, label: 'First Name', type: 'SHORT_TEXT' as FieldType, required: true },
    { pattern: /\b(last\s+name|surname|family\s+name)\b/, label: 'Last Name', type: 'SHORT_TEXT' as FieldType, required: true },
    { pattern: /\b(full\s+name|name)\b/, label: 'Full Name', type: 'SHORT_TEXT' as FieldType, required: true },

    // Contact info
    { pattern: /\b(email|e-mail|electronic\s+mail)\b/, label: 'Email', type: 'EMAIL' as FieldType, required: true },
    { pattern: /\b(phone|telephone|mobile|cell|contact\s+number)\b/, label: 'Phone Number', type: 'PHONE' as FieldType, required: false },
    { pattern: /\b(website|url|web\s+address|homepage)\b/, label: 'Website', type: 'URL' as FieldType, required: false },

    // Address fields
    { pattern: /\b(address|street|location)\b/, label: 'Address', type: 'ADDRESS' as FieldType, required: false },
    { pattern: /\b(zip|postal|postcode|zip\s+code)\b/, label: 'Zip Code', type: 'SHORT_TEXT' as FieldType, required: false },
    { pattern: /\b(city|town|municipality)\b/, label: 'City', type: 'SHORT_TEXT' as FieldType, required: false },
    { pattern: /\b(state|province|region)\b/, label: 'State', type: 'SHORT_TEXT' as FieldType, required: false },
    { pattern: /\b(country|nation)\b/, label: 'Country', type: 'SHORT_TEXT' as FieldType, required: false },

    // Dates
    { pattern: /\b(birth|dob|date\s+of\s+birth|birthday)\b/, label: 'Date of Birth', type: 'DATE' as FieldType, required: false },
    { pattern: /\b(start\s+date|begin|commence)\b/, label: 'Start Date', type: 'DATE' as FieldType, required: false },
    { pattern: /\b(end\s+date|finish|completion)\b/, label: 'End Date', type: 'DATE' as FieldType, required: false },
    { pattern: /\b(date\s+range)\b/, label: 'Date Range', type: 'DATE_RANGE' as FieldType, required: false },

    // Numeric fields
    { pattern: /\b(age|years\s+old)\b/, label: 'Age', type: 'NUMBER' as FieldType, required: false },
    { pattern: /\b(salary|income|wage|compensation|pay)\b/, label: 'Salary', type: 'NUMBER' as FieldType, required: false },
    { pattern: /\b(price|cost|amount|fee|rate)\b/, label: 'Amount', type: 'NUMBER' as FieldType, required: false },
    { pattern: /\b(quantity|number|count)\b/, label: 'Quantity', type: 'NUMBER' as FieldType, required: false },

    // Authentication
    { pattern: /\b(password|pass|pwd)\b/, label: 'Password', type: 'PASSWORD' as FieldType, required: true },
    { pattern: /\b(ssn|social\s+security|tax\s+id|id\s+number)\b/, label: 'SSN', type: 'SHORT_TEXT' as FieldType, required: false },

    // Selection fields
    { pattern: /\b(department|division|team|group|category|type|classification)\b/, label: 'Department', type: 'SELECT' as FieldType, required: false },
    { pattern: /\b(role|position|title|job|occupation)\b/, label: 'Role', type: 'SELECT' as FieldType, required: false },
    { pattern: /\b(status|state|condition)\b/, label: 'Status', type: 'SELECT' as FieldType, required: false },
    { pattern: /\b(priority|urgency|importance)\b/, label: 'Priority', type: 'SELECT' as FieldType, required: false },

    // Binary fields
    { pattern: /\b(agree|accept|consent|terms|checkbox)\b/, label: 'I agree to the terms and conditions', type: 'CHECKBOX' as FieldType, required: false },
    { pattern: /\b(subscribe|notification|newsletter|opt.in)\b/, label: 'Subscribe to newsletter', type: 'CHECKBOX' as FieldType, required: false },

    // Text areas
    { pattern: /\b(message|comment|notes|description|feedback|remarks|bio|biography)\b/, label: 'Comments', type: 'LONG_TEXT' as FieldType, required: false },
    { pattern: /\b(reason|explanation|details|additional)\b/, label: 'Additional Information', type: 'LONG_TEXT' as FieldType, required: false },

    // File fields
    { pattern: /\b(file|document|upload|attachment|resume|cv|image|photo|avatar)\b/, label: 'File Upload', type: 'FILE_UPLOAD' as FieldType, required: false },
    { pattern: /\b(signature|sign)\b/, label: 'Signature', type: 'SIGNATURE' as FieldType, required: false },

    // Ratings/scales
    { pattern: /\b(rating|star|score|satisfaction)\b/, label: 'Rating', type: 'RATING' as FieldType, required: false },
    { pattern: /\b(scale|level|intensity)\b/, label: 'Scale', type: 'SCALE' as FieldType, required: false },
  ]

  // Apply patterns
  for (const { pattern, label, type, required } of patterns) {
    if (pattern.test(description)) {
      addField(label, type, required)
      if (fields.length >= maxFields) break
    }
  }

  // If no fields found, create a default set based on form type
  if (fields.length === 0) {
    const formType = prompt.formType ?? 'custom'
    const defaultFields = getDefaultFieldsForFormType(formType)
    for (const { label, type, required } of defaultFields) {
      addField(label, type, required)
      if (fields.length >= maxFields) break
    }
  }

  // Build steps if requested
  const steps: FormStep[] = []
  if (includeSteps && fields.length > 0) {
    const fieldsPerStep = Math.ceil(fields.length / 3) // 3 steps max
    let stepOrder = 0

    for (let i = 0; i < fields.length; i += fieldsPerStep) {
      const stepFields = fields.slice(i, i + fieldsPerStep)
      const stepId = `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const fieldKeys = stepFields.map(f => f.key)

      steps.push({
        id: stepId,
        versionId: 'v1',
        title: `Step ${stepOrder + 1}`,
        description: `Please fill in ${stepFields.length} field(s)`,
        order: stepOrder++,
        fields: stepFields,
      })

      // Update field stepIds
      stepFields.forEach(f => {
        f.stepId = stepId
      })
    }
  }

  return {
    title,
    description: prompt.description,
    fields,
    steps: includeSteps ? steps : undefined,
  }
}

/**
 * Generate a DFE-compatible prompt for an LLM to create form config.
 * Returns a structured prompt that can be sent to any LLM API.
 */
export function buildLlmPrompt(description: string): string {
  return `You are a form builder assistant. Generate a JSON configuration for a dynamic form based on this description:

"${description}"

Output format:
{
  "title": "Form Title",
  "description": "Form description",
  "fields": [
    {
      "key": "field_key",
      "label": "Field Label",
      "type": "SHORT_TEXT|LONG_TEXT|NUMBER|EMAIL|PHONE|DATE|SELECT|MULTI_SELECT|RADIO|CHECKBOX|FILE_UPLOAD|RATING|URL|PASSWORD|SIGNATURE|ADDRESS|RICH_TEXT",
      "required": true|false,
      "config": { ... type-specific config },
      "description": "Help text"
    }
  ],
  "steps": [
    {
      "title": "Step Title",
      "description": "Step description",
      "fieldKeys": ["field1", "field2"]
    }
  ]
}

Rules:
- Use descriptive, snake_case field keys
- Mark fields as required when they are essential
- Group related fields into steps
- Add help text for complex fields
- Use appropriate field types (EMAIL for emails, PHONE for phones, etc.)
- For SELECT fields, include common options`
}

/**
 * Get default field configuration for a specific field type
 */
function getDefaultConfigForType(type: FieldType) {
  switch (type) {
    case 'EMAIL':
      return { placeholder: 'your@email.com' }
    case 'PHONE':
      return { placeholder: '(123) 456-7890' }
    case 'NUMBER':
      return { step: 1 }
    case 'DATE':
      return {}
    case 'SELECT':
      return { mode: 'static' as const, options: [] }
    case 'MULTI_SELECT':
      return { mode: 'static' as const, options: [] }
    case 'CHECKBOX':
      return {}
    case 'FILE_UPLOAD':
      return { maxSizeMB: 10, maxFiles: 1 }
    case 'RATING':
      return { max: 5 }
    case 'SCALE':
      return { min: 1, max: 10 }
    case 'SIGNATURE':
      return { canvasWidth: 500, canvasHeight: 200 }
    case 'ADDRESS':
      return { provider: 'manual' as const, components: ['street', 'city', 'state', 'zip', 'country'] }
    case 'RICH_TEXT':
      return { toolbar: ['bold', 'italic', 'underline', 'link'] }
    default:
      return {}
  }
}

/**
 * Get default fields for a specific form type
 */
function getDefaultFieldsForFormType(formType: string) {
  const defaults: Record<string, Array<{ label: string; type: FieldType; required: boolean }>> = {
    contact: [
      { label: 'Full Name', type: 'SHORT_TEXT', required: true },
      { label: 'Email', type: 'EMAIL', required: true },
      { label: 'Phone Number', type: 'PHONE', required: false },
      { label: 'Message', type: 'LONG_TEXT', required: true },
    ],
    survey: [
      { label: 'Your Name', type: 'SHORT_TEXT', required: false },
      { label: 'Email', type: 'EMAIL', required: false },
      { label: 'Overall Satisfaction', type: 'RATING', required: true },
      { label: 'Additional Feedback', type: 'LONG_TEXT', required: false },
    ],
    onboarding: [
      { label: 'First Name', type: 'SHORT_TEXT', required: true },
      { label: 'Last Name', type: 'SHORT_TEXT', required: true },
      { label: 'Email', type: 'EMAIL', required: true },
      { label: 'Start Date', type: 'DATE', required: true },
      { label: 'Department', type: 'SELECT', required: true },
    ],
    registration: [
      { label: 'Email', type: 'EMAIL', required: true },
      { label: 'Password', type: 'PASSWORD', required: true },
      { label: 'Full Name', type: 'SHORT_TEXT', required: true },
      { label: 'I agree to the terms', type: 'CHECKBOX', required: true },
    ],
    feedback: [
      { label: 'Email', type: 'EMAIL', required: false },
      { label: 'Rating', type: 'RATING', required: true },
      { label: 'Feedback', type: 'LONG_TEXT', required: true },
    ],
    application: [
      { label: 'Full Name', type: 'SHORT_TEXT', required: true },
      { label: 'Email', type: 'EMAIL', required: true },
      { label: 'Phone Number', type: 'PHONE', required: true },
      { label: 'Resume', type: 'FILE_UPLOAD', required: true },
      { label: 'Cover Letter', type: 'LONG_TEXT', required: false },
    ],
    custom: [
      { label: 'Name', type: 'SHORT_TEXT', required: true },
      { label: 'Email', type: 'EMAIL', required: true },
      { label: 'Message', type: 'LONG_TEXT', required: false },
    ],
  }

  return defaults[formType] ?? defaults.custom
}
