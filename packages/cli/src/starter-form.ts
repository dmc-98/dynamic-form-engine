import { ORG_SCOPE } from './constants'

// ─── Starter Forms ───────────────────────────────────────────────────────────
// Self-contained starter form definitions for `dfe init --template <id>`.
//
// These mirror the M1 starter templates shipped in @dmc--98/dfe-core
// (user-onboarding, loan-application, admin-approval-workflow). They are
// embedded here so the scaffolder has no runtime dependency on dfe-core and
// can generate ready-to-edit form modules offline. The payloads are generated
// from the dfe-core template definitions and kept in sync via the core tests.

interface StarterDefinition {
  id: string
  name: string
  description: string
  category: string
  fields: unknown[]
  steps: unknown[]
}

/** Friendly alias → dfe-core template id. */
const STARTER_ALIASES: Record<string, string> = {
  onboarding: 'user-onboarding',
  application: 'loan-application',
  workflow: 'admin-approval-workflow',
}

// Embedded definitions (generated from dfe-core templates).
const STARTERS: Record<string, StarterDefinition> = {
  'user-onboarding': {
    id: 'user-onboarding',
    name: 'User Onboarding',
    description: 'Multi-step onboarding that adapts to personal vs. business accounts',
    category: 'onboarding',
    fields: [
      { id: 'onb_full_name', versionId: 'v1', stepId: 'step_account', key: 'fullName', label: 'Full Name', type: 'SHORT_TEXT', required: true, order: 1, config: { placeholder: 'Ada Lovelace' } },
      { id: 'onb_email', versionId: 'v1', stepId: 'step_account', key: 'email', label: 'Work Email', type: 'EMAIL', required: true, order: 2, config: { placeholder: 'ada@example.com' } },
      { id: 'onb_account_type', versionId: 'v1', stepId: 'step_account', key: 'accountType', label: 'Account Type', type: 'SELECT', required: true, order: 3, config: { mode: 'static', defaultValue: 'personal', options: [{ label: 'Personal', value: 'personal' }, { label: 'Business', value: 'business' }] } },
      { id: 'onb_company_name', versionId: 'v1', stepId: 'step_profile', key: 'companyName', label: 'Company Name', type: 'SHORT_TEXT', required: true, order: 1, config: {}, conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'accountType', operator: 'eq', value: 'business' }] } },
      { id: 'onb_team_size', versionId: 'v1', stepId: 'step_profile', key: 'teamSize', label: 'Team Size', type: 'NUMBER', required: false, order: 2, config: { min: 1 }, conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'accountType', operator: 'eq', value: 'business' }] } },
      { id: 'onb_role', versionId: 'v1', stepId: 'step_profile', key: 'role', label: 'Your Role', type: 'SHORT_TEXT', required: false, order: 3, config: { placeholder: 'e.g. Product Engineer' } },
      { id: 'onb_use_cases', versionId: 'v1', stepId: 'step_preferences', key: 'useCases', label: 'What will you build with DFE?', type: 'MULTI_SELECT', required: false, order: 1, config: { mode: 'static', options: [{ label: 'Onboarding flows', value: 'onboarding' }, { label: 'Applications', value: 'applications' }, { label: 'Internal tools', value: 'internal' }, { label: 'Approvals', value: 'approvals' }] } },
      { id: 'onb_referral', versionId: 'v1', stepId: 'step_preferences', key: 'referralSource', label: 'How did you hear about us?', type: 'SELECT', required: false, order: 2, config: { mode: 'static', options: [{ label: 'GitHub', value: 'github' }, { label: 'Hacker News', value: 'hn' }, { label: 'A friend', value: 'friend' }, { label: 'Search', value: 'search' }] } },
    ],
    steps: [
      { id: 'step_account', versionId: 'v1', title: 'Account', order: 1 },
      { id: 'step_profile', versionId: 'v1', title: 'Profile', order: 2 },
      { id: 'step_preferences', versionId: 'v1', title: 'Preferences', order: 3 },
    ],
  },
  'loan-application': {
    id: 'loan-application',
    name: 'Loan Application',
    description: 'Application flow with conditional employer details, a computed monthly estimate, and a review step',
    category: 'application',
    fields: [
      { id: 'loan_applicant', versionId: 'v1', stepId: 'step_applicant', key: 'applicantName', label: 'Applicant Name', type: 'SHORT_TEXT', required: true, order: 1, config: {} },
      { id: 'loan_email', versionId: 'v1', stepId: 'step_applicant', key: 'email', label: 'Email', type: 'EMAIL', required: true, order: 2, config: {} },
      { id: 'loan_employment', versionId: 'v1', stepId: 'step_applicant', key: 'employmentStatus', label: 'Employment Status', type: 'SELECT', required: true, order: 3, config: { mode: 'static', options: [{ label: 'Employed', value: 'employed' }, { label: 'Self-employed', value: 'self-employed' }, { label: 'Unemployed', value: 'unemployed' }] } },
      { id: 'loan_employer', versionId: 'v1', stepId: 'step_financials', key: 'employerName', label: 'Employer Name', type: 'SHORT_TEXT', required: true, order: 1, config: {}, conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'employmentStatus', operator: 'eq', value: 'employed' }] } },
      { id: 'loan_income', versionId: 'v1', stepId: 'step_financials', key: 'annualIncome', label: 'Annual Income', type: 'NUMBER', required: true, order: 2, config: { min: 0 } },
      { id: 'loan_amount', versionId: 'v1', stepId: 'step_financials', key: 'loanAmount', label: 'Loan Amount', type: 'NUMBER', required: true, order: 3, config: { min: 0 } },
      { id: 'loan_term', versionId: 'v1', stepId: 'step_financials', key: 'loanTermYears', label: 'Loan Term (years)', type: 'NUMBER', required: true, order: 4, config: { min: 1 } },
      { id: 'loan_estimate', versionId: 'v1', stepId: 'step_financials', key: 'estimatedMonthly', label: 'Estimated Monthly Payment', type: 'NUMBER', required: false, order: 5, config: { helpText: 'Principal divided by the number of months (interest excluded)' }, computed: { expression: 'loanAmount / (loanTermYears * 12)', dependsOn: ['loanAmount', 'loanTermYears'] } },
    ],
    steps: [
      { id: 'step_applicant', versionId: 'v1', title: 'Applicant', order: 1 },
      { id: 'step_financials', versionId: 'v1', title: 'Financials', order: 2 },
      { id: 'step_review', versionId: 'v1', title: 'Review & Submit', order: 3, config: { review: { editMode: 'navigate' } } },
    ],
  },
  'admin-approval-workflow': {
    id: 'admin-approval-workflow',
    name: 'Admin Approval Workflow',
    description: 'Internal request-and-approval workflow with conditional fields, a required-when-rejecting reason, and step branching',
    category: 'workflow',
    fields: [
      { id: 'adm_request_type', versionId: 'v1', stepId: 'step_request', key: 'requestType', label: 'Request Type', type: 'SELECT', required: true, order: 1, config: { mode: 'static', options: [{ label: 'Access request', value: 'access' }, { label: 'Purchase', value: 'purchase' }, { label: 'Time off', value: 'timeoff' }] } },
      { id: 'adm_justification', versionId: 'v1', stepId: 'step_request', key: 'justification', label: 'Justification', type: 'LONG_TEXT', required: true, order: 2, config: { maxLength: 2000 } },
      { id: 'adm_amount', versionId: 'v1', stepId: 'step_request', key: 'amount', label: 'Amount', type: 'NUMBER', required: false, order: 3, config: { min: 0 }, conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'requestType', operator: 'eq', value: 'purchase' }] } },
      { id: 'adm_decision', versionId: 'v1', stepId: 'step_decision', key: 'decision', label: 'Decision', type: 'RADIO', required: true, order: 1, config: { mode: 'static', options: [{ label: 'Approve', value: 'approve' }, { label: 'Reject', value: 'reject' }] } },
      { id: 'adm_rejection_reason', versionId: 'v1', stepId: 'step_decision', key: 'rejectionReason', label: 'Rejection Reason', type: 'LONG_TEXT', required: false, order: 2, config: { helpText: 'Required when rejecting a request' }, conditions: { action: 'REQUIRE', operator: 'and', rules: [{ fieldKey: 'decision', operator: 'eq', value: 'reject' }] } },
    ],
    steps: [
      { id: 'step_request', versionId: 'v1', title: 'Request', order: 1 },
      { id: 'step_decision', versionId: 'v1', title: 'Decision', order: 2, branches: [{ condition: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'decision', operator: 'eq', value: 'approve' }] }, targetStepId: 'step_summary' }] },
      { id: 'step_summary', versionId: 'v1', title: 'Summary', order: 3, config: { review: { editMode: 'navigate' } } },
    ],
  },
}

export interface StarterFormInfo {
  alias: string
  templateId: string
  name: string
  description: string
}

export interface StarterFormScaffold {
  templateId: string
  filename: string
  code: string
}

/** List the available starter forms with their friendly aliases. */
export function listStarterForms(): StarterFormInfo[] {
  return Object.entries(STARTER_ALIASES).map(([alias, templateId]) => {
    const def = STARTERS[templateId]
    return { alias, templateId, name: def.name, description: def.description }
  })
}

/**
 * Resolve a user-supplied choice (friendly alias or full template id) to a
 * known dfe-core template id. Returns null for unknown choices.
 */
export function resolveStarterTemplateId(choice: string): string | null {
  const normalized = choice.trim().toLowerCase()
  if (STARTER_ALIASES[normalized]) {
    return STARTER_ALIASES[normalized]
  }
  if (STARTERS[normalized]) {
    return STARTERS[normalized].id
  }
  return null
}

/** Convert a template id like "user-onboarding" into a JS identifier base. */
function toIdentifierBase(templateId: string): string {
  return templateId
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('')
}

/**
 * Generate a ready-to-edit TypeScript form module for a starter form.
 * Returns null if the choice does not map to a known starter.
 */
export function getStarterFormScaffold(choice: string): StarterFormScaffold | null {
  const templateId = resolveStarterTemplateId(choice)
  if (!templateId) {
    return null
  }

  const def = STARTERS[templateId]
  const base = toIdentifierBase(templateId)
  const payload = JSON.stringify({ fields: def.fields, steps: def.steps })

  const code = `// ${def.name} — generated by \`dfe init --template ${templateId}\`
// ${def.description}
import type { FormField, FormStep } from '${ORG_SCOPE}/dfe-core'

const definition = JSON.parse(\`${payload}\`) as { fields: FormField[]; steps: FormStep[] }

export const ${base}Fields: FormField[] = definition.fields
export const ${base}Steps: FormStep[] = definition.steps
`

  return { templateId, filename: `${templateId}.ts`, code }
}
