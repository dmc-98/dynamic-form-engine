import type { FormField, FieldType } from '../types'

export interface FieldSuggestion {
  key: string
  label: string
  type: FieldType
  description: string
  reason: string
  confidence: number
}

/**
 * Suggest additional fields based on existing form fields.
 * Analyzes the form's purpose and suggests missing common fields.
 *
 * @example
 * const existingFields: FormField[] = [
 *   { key: 'name', label: 'Name', type: 'SHORT_TEXT', ... },
 * ]
 * const suggestions = suggestAdditionalFields(existingFields)
 * // Returns: [{ key: 'email', label: 'Email', type: 'EMAIL', reason: '...' }]
 */
export function suggestAdditionalFields(existingFields: FormField[]): FieldSuggestion[] {
  const existingKeys = new Set(existingFields.map(f => f.key.toLowerCase()))
  const existingLabels = new Set(existingFields.map(f => f.label.toLowerCase()))
  const suggestions: FieldSuggestion[] = []

  // Analyze what fields we already have
  const hasName = existingKeys.has('name') || existingLabels.has('name') || hasAnyKey(['first_name', 'last_name', 'full_name'])
  const hasEmail = existingKeys.has('email') || existingLabels.has('email')
  const hasPhone = existingKeys.has('phone') || existingLabels.has('phone') || existingLabels.has('phone number')
  const hasAddress = existingKeys.has('address') || existingLabels.has('address')
  const hasDateOfBirth = existingKeys.has('dob') || existingLabels.has('date of birth')
  const hasPassword = existingKeys.has('password') || existingLabels.has('password')
  const hasTerms = existingLabels.has('terms') || existingLabels.has('agree') || existingLabels.has('consent')
  const hasMessage = existingLabels.has('message') || existingLabels.has('comments') || existingLabels.has('feedback')
  const hasRating = existingFields.some(f => f.type === 'RATING')

  // Helper to check if key exists
  function hasAnyKey(keys: string[]): boolean {
    return keys.some(k => existingKeys.has(k))
  }

  // Rule: If we have name but no email, suggest email
  if (hasName && !hasEmail) {
    suggestions.push({
      key: 'email',
      label: 'Email',
      type: 'EMAIL',
      description: 'Email address for contact and communication',
      reason: 'You have a name field but no email field. Email is a common contact method.',
      confidence: 0.95,
    })
  }

  // Rule: If we have email but no phone, suggest phone
  if (hasEmail && !hasPhone && !existingFields.some(f => f.type === 'PHONE')) {
    suggestions.push({
      key: 'phone',
      label: 'Phone Number',
      type: 'PHONE',
      description: 'Phone number for contact',
      reason: 'Email is present but no phone field. Consider adding phone for additional contact options.',
      confidence: 0.70,
    })
  }

  // Rule: If we have email but no name, suggest name
  if (!hasName && hasEmail) {
    suggestions.push({
      key: 'full_name',
      label: 'Full Name',
      type: 'SHORT_TEXT',
      description: 'Your full name',
      reason: 'You have an email field but no name field. Name is typically collected with email.',
      confidence: 0.85,
    })
  }

  // Rule: If we have name and email but no address, suggest address for onboarding/registration
  if (hasName && hasEmail && !hasAddress) {
    suggestions.push({
      key: 'address',
      label: 'Address',
      type: 'ADDRESS',
      description: 'Your mailing address',
      reason: 'Typical registration forms include name, email, and address for profile completion.',
      confidence: 0.60,
    })
  }

  // Rule: Onboarding pattern detection
  if ((existingLabels.has('start') || existingLabels.has('onboard')) && hasName) {
    if (!existingLabels.has('emergency')) {
      suggestions.push({
        key: 'emergency_contact_name',
        label: 'Emergency Contact Name',
        type: 'SHORT_TEXT',
        description: 'Name of emergency contact person',
        reason: 'Onboarding forms typically include emergency contact information.',
        confidence: 0.80,
      })
    }

    if (!existingLabels.has('department')) {
      suggestions.push({
        key: 'department',
        label: 'Department',
        type: 'SELECT',
        description: 'Your department or team',
        reason: 'Employee onboarding forms should include department assignment.',
        confidence: 0.85,
      })
    }

    if (!existingLabels.has('start date')) {
      suggestions.push({
        key: 'start_date',
        label: 'Start Date',
        type: 'DATE',
        description: 'Your employment start date',
        reason: 'Employee onboarding forms need a start date.',
        confidence: 0.90,
      })
    }
  }

  // Rule: Contact form pattern (message without email)
  if (hasMessage && !hasEmail) {
    suggestions.push({
      key: 'email',
      label: 'Email',
      type: 'EMAIL',
      description: 'Your email address',
      reason: 'Contact forms with messages should include email for response.',
      confidence: 0.90,
    })
  }

  // Rule: Contact form pattern (without subject)
  if (hasMessage && !existingLabels.has('subject')) {
    suggestions.push({
      key: 'subject',
      label: 'Subject',
      type: 'SHORT_TEXT',
      description: 'Message subject',
      reason: 'Contact forms with messages benefit from a subject line.',
      confidence: 0.75,
    })
  }

  // Rule: Survey form pattern (has rating, suggest follow-up)
  if (hasRating && !hasMessage) {
    suggestions.push({
      key: 'feedback',
      label: 'Additional Feedback',
      type: 'LONG_TEXT',
      description: 'Your additional comments and feedback',
      reason: 'Survey forms with ratings often include a feedback field for detailed comments.',
      confidence: 0.70,
    })
  }

  // Rule: Registration pattern (has password, suggest password confirmation)
  if (hasPassword && !existingKeys.has('password_confirm')) {
    suggestions.push({
      key: 'password_confirm',
      label: 'Confirm Password',
      type: 'PASSWORD',
      description: 'Confirm your password',
      reason: 'Registration forms with passwords should include password confirmation.',
      confidence: 0.95,
    })
  }

  // Rule: Registration pattern (has password, suggest terms agreement)
  if (hasPassword && !hasTerms) {
    suggestions.push({
      key: 'agree_terms',
      label: 'I agree to the Terms and Conditions',
      type: 'CHECKBOX',
      description: 'Acknowledge acceptance of terms',
      reason: 'Registration forms typically require terms and conditions acceptance.',
      confidence: 0.85,
    })
  }

  // Rule: Application form pattern
  if ((existingLabels.has('resume') || existingLabels.has('application')) && !hasName) {
    suggestions.push({
      key: 'full_name',
      label: 'Full Name',
      type: 'SHORT_TEXT',
      description: 'Your full name',
      reason: 'Application forms should collect the applicant\'s name.',
      confidence: 0.95,
    })
  }

  // Rule: Application form pattern (has name, suggest email)
  if ((existingLabels.has('resume') || existingLabels.has('application')) && hasName && !hasEmail) {
    suggestions.push({
      key: 'email',
      label: 'Email',
      type: 'EMAIL',
      description: 'Your email address',
      reason: 'Job application forms should include contact email.',
      confidence: 0.95,
    })
  }

  // Rule: Application form pattern (has name/email, suggest phone)
  if ((existingLabels.has('resume') || existingLabels.has('application')) && hasEmail && !hasPhone) {
    suggestions.push({
      key: 'phone',
      label: 'Phone Number',
      type: 'PHONE',
      description: 'Your phone number',
      reason: 'Job application forms typically request phone number for contact.',
      confidence: 0.85,
    })
  }

  // Rule: If we have date of birth, check if age is also present (likely redundant)
  if (hasDateOfBirth && existingKeys.has('age')) {
    // Don't suggest anything here - both existing
  } else if (hasDateOfBirth && !existingKeys.has('age')) {
    suggestions.push({
      key: 'age',
      label: 'Age',
      type: 'NUMBER',
      description: 'Your age',
      reason: 'Alternative to date of birth, or can be computed from DOB.',
      confidence: 0.40, // Low confidence as DOB is sufficient
    })
  }

  // Rule: If we have many fields, suggest confirmation/review
  if (existingFields.length > 5 && !existingLabels.has('confirm') && !existingLabels.has('review')) {
    suggestions.push({
      key: 'confirm_info',
      label: 'I confirm the above information is correct',
      type: 'CHECKBOX',
      description: 'Confirm accuracy of submitted information',
      reason: 'Forms with many fields benefit from a confirmation checkbox.',
      confidence: 0.60,
    })
  }

  // Sort by confidence descending
  suggestions.sort((a, b) => b.confidence - a.confidence)

  return suggestions
}

/**
 * Detect the likely form type based on existing fields
 */
export function detectFormType(fields: FormField[]): string {
  const labels = new Set(fields.map(f => f.label.toLowerCase()))

  // Onboarding detection
  if (labels.has('start date') || labels.has('department') || labels.has('emergency contact')) {
    return 'onboarding'
  }

  // Registration detection
  if (fields.some(f => f.type === 'PASSWORD') && labels.has('password')) {
    return 'registration'
  }

  // Application detection
  if (labels.has('resume') || labels.has('cover letter')) {
    return 'application'
  }

  // Survey detection
  if (fields.some(f => f.type === 'RATING') && labels.has('feedback')) {
    return 'survey'
  }

  // Contact form detection
  if (labels.has('message') || labels.has('subject')) {
    return 'contact'
  }

  // Feedback form detection
  if (labels.has('rating') && labels.has('feedback')) {
    return 'feedback'
  }

  return 'custom'
}

/**
 * Get field suggestions grouped by category
 */
export function groupSuggestionsByCategory(
  suggestions: FieldSuggestion[]
): Record<string, FieldSuggestion[]> {
  const grouped: Record<string, FieldSuggestion[]> = {
    'Contact Information': [],
    'Personal Information': [],
    'Employment': [],
    'Account Settings': [],
    'Feedback & Survey': [],
    'Legal & Compliance': [],
    'Other': [],
  }

  for (const suggestion of suggestions) {
    const key = suggestion.key.toLowerCase()
    const label = suggestion.label.toLowerCase()

    if (key.includes('email') || key.includes('phone') || key.includes('address')) {
      grouped['Contact Information'].push(suggestion)
    } else if (key.includes('name') || key.includes('dob') || key.includes('age')) {
      grouped['Personal Information'].push(suggestion)
    } else if (key.includes('department') || key.includes('start') || key.includes('emergency')) {
      grouped['Employment'].push(suggestion)
    } else if (key.includes('password') || key.includes('confirm')) {
      grouped['Account Settings'].push(suggestion)
    } else if (key.includes('rating') || key.includes('feedback')) {
      grouped['Feedback & Survey'].push(suggestion)
    } else if (key.includes('agree') || key.includes('terms') || key.includes('consent')) {
      grouped['Legal & Compliance'].push(suggestion)
    } else {
      grouped['Other'].push(suggestion)
    }
  }

  // Remove empty categories
  return Object.fromEntries(Object.entries(grouped).filter(([_, v]) => v.length > 0))
}
