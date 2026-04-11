import type { FormField, FieldType } from '../types'

export interface ValidationSuggestion {
  fieldKey: string
  fieldType: FieldType
  suggestions: Array<{
    rule: string
    description: string
    config: Record<string, unknown>
    confidence: number  // 0-1
  }>
}

/**
 * Suggest validation rules based on field labels, types, and keys.
 * Uses heuristic patterns without requiring an LLM.
 *
 * @example
 * const fields: FormField[] = [
 *   { key: 'email', label: 'Email', type: 'EMAIL', ... },
 *   { key: 'age', label: 'Age', type: 'NUMBER', ... },
 * ]
 * const suggestions = suggestValidationRules(fields)
 */
export function suggestValidationRules(fields: FormField[]): ValidationSuggestion[] {
  return fields.map(field => {
    const suggestions = collectSuggestionsForField(field)
    return {
      fieldKey: field.key,
      fieldType: field.type,
      suggestions,
    }
  })
}

/**
 * Collect validation suggestions for a single field
 */
function collectSuggestionsForField(field: FormField): ValidationSuggestion['suggestions'] {
  const label = field.label.toLowerCase()
  const key = field.key.toLowerCase()
  const type = field.type
  const suggestions: ValidationSuggestion['suggestions'] = []

  // Email patterns
  if (type === 'EMAIL' || label.includes('email') || key.includes('email')) {
    suggestions.push({
      rule: 'email_format',
      description: 'Validate email format using standard regex pattern',
      config: {
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      },
      confidence: 0.95,
    })
  }

  // Phone patterns
  if (type === 'PHONE' || label.includes('phone') || key.includes('phone') || key.includes('contact')) {
    suggestions.push({
      rule: 'phone_length',
      description: 'Require minimum phone length (10 digits)',
      config: { minLength: 10 },
      confidence: 0.85,
    })
    suggestions.push({
      rule: 'phone_pattern',
      description: 'Validate phone format (digits, spaces, hyphens, parentheses)',
      config: {
        pattern: '^[\\d\\s\\-()]+$',
      },
      confidence: 0.80,
    })
  }

  // URL patterns
  if (type === 'URL' || label.includes('website') || label.includes('url') || key.includes('url') || key.includes('website')) {
    suggestions.push({
      rule: 'url_pattern',
      description: 'Validate URL format',
      config: {
        pattern: '^https?://.+',
      },
      confidence: 0.90,
    })
  }

  // Zip code patterns (US)
  if (label.includes('zip') || key.includes('zip') || key.includes('postal')) {
    suggestions.push({
      rule: 'zip_pattern',
      description: 'Validate US zip code (5 or 9 digits)',
      config: {
        pattern: '^\\d{5}(-\\d{4})?$',
      },
      confidence: 0.75,
    })
  }

  // SSN patterns
  if (label.includes('ssn') || label.includes('social') || key.includes('ssn') || key.includes('tax_id')) {
    suggestions.push({
      rule: 'sensitive_data_warning',
      description: 'WARNING: This field collects sensitive SSN data - ensure proper security',
      config: { sensitiveData: true },
      confidence: 0.95,
    })
    suggestions.push({
      rule: 'ssn_pattern',
      description: 'Validate SSN format (XXX-XX-XXXX)',
      config: {
        pattern: '^\\d{3}-\\d{2}-\\d{4}$',
      },
      confidence: 0.80,
    })
  }

  // Password patterns
  if (type === 'PASSWORD' || label.includes('password') || key.includes('password')) {
    suggestions.push({
      rule: 'password_minlength',
      description: 'Require minimum password length (8 characters)',
      config: { minLength: 8 },
      confidence: 0.90,
    })
    suggestions.push({
      rule: 'password_complexity',
      description: 'Require password to contain uppercase, lowercase, and numbers',
      config: {
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$',
      },
      confidence: 0.85,
    })
  }

  // Name patterns
  if (label.includes('name') && !label.includes('username')) {
    suggestions.push({
      rule: 'name_minlength',
      description: 'Require minimum name length (2 characters)',
      config: { minLength: 2 },
      confidence: 0.80,
    })
    suggestions.push({
      rule: 'name_maxlength',
      description: 'Limit name length (max 100 characters)',
      config: { maxLength: 100 },
      confidence: 0.75,
    })
  }

  // Age patterns
  if (label.includes('age') || key.includes('age')) {
    if (type === 'NUMBER') {
      suggestions.push({
        rule: 'age_min',
        description: 'Minimum age requirement (0)',
        config: { min: 0 },
        confidence: 0.85,
      })
      suggestions.push({
        rule: 'age_max',
        description: 'Maximum age limit (150)',
        config: { max: 150 },
        confidence: 0.80,
      })
    }
  }

  // Numeric ranges
  if (type === 'NUMBER') {
    if (label.includes('salary') || label.includes('income') || label.includes('wage')) {
      suggestions.push({
        rule: 'amount_min',
        description: 'Salary should be positive',
        config: { min: 0 },
        confidence: 0.90,
      })
    }
    if (label.includes('quantity') || label.includes('count')) {
      suggestions.push({
        rule: 'quantity_min',
        description: 'Quantity must be at least 1',
        config: { min: 1 },
        confidence: 0.85,
      })
    }
  }

  // Date patterns
  if (type === 'DATE' || type === 'DATE_TIME') {
    if (label.includes('birth') || key.includes('dob')) {
      suggestions.push({
        rule: 'date_reasonable_past',
        description: 'Birth date should be in the past',
        config: { maxDate: 'today', minDate: '1900-01-01' },
        confidence: 0.90,
      })
    }
    if (label.includes('start') && !label.includes('end')) {
      suggestions.push({
        rule: 'date_not_future',
        description: 'Start date should not be in the future',
        config: { maxDate: 'today' },
        confidence: 0.85,
      })
    }
  }

  // Select fields - require value if field is required
  if (type === 'SELECT' || type === 'MULTI_SELECT' || type === 'RADIO') {
    if (field.required) {
      suggestions.push({
        rule: 'not_empty_select',
        description: 'Require a selection to be made',
        config: {},
        confidence: 0.95,
      })
    }
  }

  // File upload patterns
  if (type === 'FILE_UPLOAD') {
    suggestions.push({
      rule: 'file_required',
      description: 'File upload must be provided',
      config: {},
      confidence: 0.90,
    })
    if (label.includes('resume') || label.includes('cv')) {
      suggestions.push({
        rule: 'file_types_document',
        description: 'Allow PDF, DOC, DOCX formats',
        config: {
          allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        },
        confidence: 0.85,
      })
      suggestions.push({
        rule: 'file_size_limit',
        description: 'Limit file size to 5MB',
        config: { maxSizeMB: 5 },
        confidence: 0.80,
      })
    }
    if (label.includes('image') || label.includes('photo') || label.includes('avatar')) {
      suggestions.push({
        rule: 'file_types_image',
        description: 'Allow image formats (JPG, PNG, GIF)',
        config: {
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        },
        confidence: 0.90,
      })
      suggestions.push({
        rule: 'file_size_limit',
        description: 'Limit image file size to 2MB',
        config: { maxSizeMB: 2 },
        confidence: 0.85,
      })
    }
  }

  // Long text patterns
  if (type === 'LONG_TEXT' || type === 'RICH_TEXT') {
    if (label.includes('message') || label.includes('comment')) {
      suggestions.push({
        rule: 'text_minlength',
        description: 'Require at least 10 characters',
        config: { minLength: 10 },
        confidence: 0.70,
      })
    }
    suggestions.push({
      rule: 'text_maxlength',
      description: 'Limit text to 5000 characters',
      config: { maxLength: 5000 },
      confidence: 0.75,
    })
  }

  // Required field validation
  if (field.required && !suggestions.some(s => s.rule.includes('required'))) {
    suggestions.push({
      rule: 'field_required',
      description: 'Field is required and cannot be empty',
      config: {},
      confidence: 0.95,
    })
  }

  // Sort by confidence descending
  suggestions.sort((a, b) => b.confidence - a.confidence)

  return suggestions
}
