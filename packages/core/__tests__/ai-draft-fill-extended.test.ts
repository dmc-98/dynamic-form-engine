import { describe, expect, it } from 'vitest'
import type { FormField } from '../src/types'
import { generateAutofillDraft } from '../src/ai'

const draftFields: FormField[] = [
  {
    id: 'field_phone',
    versionId: 'v1',
    key: 'phone',
    label: 'Phone Number',
    type: 'PHONE',
    required: false,
    order: 0,
    config: {},
  },
  {
    id: 'field_website',
    versionId: 'v1',
    key: 'website',
    label: 'Portfolio URL',
    type: 'URL',
    required: false,
    order: 1,
    config: {},
  },
  {
    id: 'field_start_date',
    versionId: 'v1',
    key: 'start_date',
    label: 'Start Date',
    type: 'DATE',
    required: false,
    order: 2,
    config: {},
  },
  {
    id: 'field_last_seen_at',
    versionId: 'v1',
    key: 'last_seen_at',
    label: 'Last Seen At',
    type: 'DATE_TIME',
    required: false,
    order: 3,
    config: {},
  },
  {
    id: 'field_years_experience',
    versionId: 'v1',
    key: 'years_experience',
    label: 'Years of Experience',
    type: 'NUMBER',
    required: false,
    order: 4,
    config: {},
  },
  {
    id: 'field_skills',
    versionId: 'v1',
    key: 'skills',
    label: 'Skills',
    type: 'MULTI_SELECT',
    required: false,
    order: 5,
    config: {
      options: [
        { label: 'TypeScript', value: 'typescript' },
        { label: 'React', value: 'react' },
        { label: 'Node.js', value: 'nodejs' },
      ],
    },
  },
  {
    id: 'field_bio',
    versionId: 'v1',
    key: 'bio',
    label: 'Professional Summary',
    type: 'LONG_TEXT',
    required: false,
    order: 6,
    config: {},
  },
  {
    id: 'field_address',
    versionId: 'v1',
    key: 'address',
    label: 'Address',
    type: 'ADDRESS',
    required: false,
    order: 7,
    config: {},
  },
  {
    id: 'field_subscribe',
    versionId: 'v1',
    key: 'newsletter_opt_in',
    label: 'Subscribe to newsletter',
    type: 'CHECKBOX',
    required: false,
    order: 8,
    config: {},
  },
]

describe('generateAutofillDraft extended coverage', () => {
  it('coerces structured values across supported field types', () => {
    const result = generateAutofillDraft({
      fields: draftFields,
      sourceText: [
        'Phone: +1 415 555 0123',
        'Website: https://ada.example.dev',
        'Start Date: 2026-03-12',
        'Last Seen At: 2026-03-12T08:30:00Z',
        'Years Experience: 9 years',
        'Skills: TypeScript, React',
        'Professional Summary: Building developer tools and form platforms.',
        'Street: 123 Analytical Engine Way',
        'City: London',
        'State: Greater London',
        'Postal Code: NW1 6XE',
        'Country: UK',
        'Subscribe to newsletter: yes',
      ].join('\n'),
    })

    expect(result.values.phone).toBe('+1 415 555 0123')
    expect(result.values.website).toBe('https://ada.example.dev')
    expect(result.values.start_date).toBe('2026-03-12')
    expect(result.values.last_seen_at).toBe('2026-03-12T08:30:00.000Z')
    expect(result.values.years_experience).toBe(9)
    expect(result.values.skills).toEqual(['typescript', 'react'])
    expect(result.values.bio).toBe('Building developer tools and form platforms.')
    expect(result.values.address).toEqual({
      street: '123 Analytical Engine Way',
      city: 'London',
      state: 'Greater London',
      zip: 'NW1 6XE',
      country: 'UK',
    })
    expect(result.values.newsletter_opt_in).toBe(true)
  })

  it('falls back to inferred matches, inline dates, and low-confidence warnings', () => {
    const result = generateAutofillDraft({
      fields: [
        {
          id: 'field_department',
          versionId: 'v1',
          key: 'department',
          label: 'Department',
          type: 'SELECT',
          required: false,
          order: 0,
          config: {
            options: [
              { label: 'Engineering', value: 'engineering' },
              { label: 'Design', value: 'design' },
            ],
          },
        },
        {
          id: 'field_available_from',
          versionId: 'v1',
          key: 'available_from',
          label: 'Available From',
          type: 'DATE',
          required: false,
          order: 1,
          config: {},
        },
      ],
      sourceText: 'I work with the engineering team and can start on 2026-04-01.',
    })

    expect(result.values.department).toBe('engineering')
    expect(result.values.available_from).toBe('2026-04-01')
    expect(result.warnings).not.toContain(
      'Review "Department" carefully because the draft confidence is low.',
    )
    expect(result.warnings).toContain(
      'Review "Available From" carefully because the draft confidence is low.',
    )
  })

  it('handles empty source text without attempting to fill values', () => {
    const result = generateAutofillDraft({
      fields: draftFields.slice(0, 2),
      sourceText: '   ',
    })

    expect(result.values).toEqual({})
    expect(result.matches).toEqual([])
    expect(result.unmatchedFieldKeys).toEqual(['phone', 'website'])
    expect(result.warnings).toEqual([
      'Provide profile text or key/value pairs before generating a draft.',
    ])
  })

  it('covers alias resolution, inline inference, raw fallbacks, and unmatched binary fields', () => {
    const result = generateAutofillDraft({
      fields: [
        {
          id: 'field_first_name',
          versionId: 'v1',
          key: 'first_name',
          label: 'First Name',
          type: 'SHORT_TEXT',
          required: false,
          order: 0,
          config: {},
        },
        {
          id: 'field_company_name',
          versionId: 'v1',
          key: 'company_name',
          label: 'Company Name',
          type: 'SHORT_TEXT',
          required: false,
          order: 1,
          config: {},
        },
        {
          id: 'field_zip_code',
          versionId: 'v1',
          key: 'zip_code',
          label: 'ZIP Code',
          type: 'SHORT_TEXT',
          required: false,
          order: 2,
          config: {},
        },
        {
          id: 'field_bank_account',
          versionId: 'v1',
          key: 'bank_account',
          label: 'Bank Account Number',
          type: 'SHORT_TEXT',
          required: false,
          order: 3,
          config: {},
        },
        {
          id: 'field_tax_id',
          versionId: 'v1',
          key: 'tax_id',
          label: 'Tax ID',
          type: 'SHORT_TEXT',
          required: false,
          order: 4,
          config: {
            compliance: {
              classification: 'financial',
            },
          },
        },
        {
          id: 'field_support_email',
          versionId: 'v1',
          key: 'support_email',
          label: 'Support Email',
          type: 'EMAIL',
          required: false,
          order: 5,
          config: {},
        },
        {
          id: 'field_hotline',
          versionId: 'v1',
          key: 'hotline',
          label: 'Hotline',
          type: 'PHONE',
          required: false,
          order: 6,
          config: {},
        },
        {
          id: 'field_portfolio',
          versionId: 'v1',
          key: 'portfolio_link',
          label: 'Portfolio Link',
          type: 'URL',
          required: false,
          order: 7,
          config: {},
        },
        {
          id: 'field_satisfaction',
          versionId: 'v1',
          key: 'satisfaction_score',
          label: 'Satisfaction Score',
          type: 'SCALE',
          required: false,
          order: 8,
          config: {},
        },
        {
          id: 'field_available_on',
          versionId: 'v1',
          key: 'available_on',
          label: 'Available On',
          type: 'DATE',
          required: false,
          order: 9,
          config: {},
        },
        {
          id: 'field_contact_method',
          versionId: 'v1',
          key: 'contact_method',
          label: 'Contact Method',
          type: 'RADIO',
          required: false,
          order: 10,
          config: {},
        },
        {
          id: 'field_home_address',
          versionId: 'v1',
          key: 'home_address',
          label: 'Home Address',
          type: 'ADDRESS',
          required: false,
          order: 11,
          config: {},
        },
        {
          id: 'field_updates',
          versionId: 'v1',
          key: 'newsletter_updates',
          label: 'Newsletter Updates',
          type: 'CHECKBOX',
          required: false,
          order: 12,
          config: {},
        },
        {
          id: 'field_consent',
          versionId: 'v1',
          key: 'consent_to_share',
          label: 'Consent to share',
          type: 'CHECKBOX',
          required: false,
          order: 13,
          config: {},
        },
        {
          id: 'field_resume',
          versionId: 'v1',
          key: 'resume_upload',
          label: 'Resume Upload',
          type: 'FILE_UPLOAD',
          required: false,
          order: 14,
          config: {},
        },
      ],
      sourceText: [
        'Name: Prince',
        'Organization: Analytical Engines Ltd',
        'Postal Code: 94107',
        'Account Number: 123456789',
        'SSN: 111-22-3333',
        'Email: prince@example.com',
        'Phone: +1 628 555 0000',
        'Portfolio https://prince.example.dev',
        'Satisfaction Score: 4',
        'Available On: March 21, 2026 12:00:00 UTC',
        'Contact Method: sms',
        'Home Address: 221B Baker Street',
        'Newsletter Updates: no',
        'I consent to share these details.',
        'Resume Upload: resume.pdf',
      ].join('\n'),
    })

    expect(result.values.first_name).toBe('Prince')
    expect(result.values.company_name).toBe('Analytical Engines Ltd')
    expect(result.values.zip_code).toBe('94107')
    expect(result.values.bank_account).toBe('123456789')
    expect(result.values.tax_id).toBe('111-22-3333')
    expect(result.values.support_email).toBe('prince@example.com')
    expect(result.values.hotline).toBe('+1 628 555 0000')
    expect(result.values.portfolio_link).toBe('https://prince.example.dev')
    expect(result.values.satisfaction_score).toBe(4)
    expect(result.values.available_on).toBe('2026-03-21')
    expect(result.values.contact_method).toBe('sms')
    expect(result.values.home_address).toEqual({
      street: '',
      city: '',
      state: '',
      zip: '94107',
      country: '',
    })
    expect(result.values.newsletter_updates).toBe(false)
    expect(result.values.consent_to_share).toBe(true)
    expect(result.unmatchedFieldKeys).toContain('resume_upload')
    expect(result.warnings).toContain(
      '"Tax ID" may contain sensitive data. Review it before applying the draft.',
    )
  })
})
