import type { FormField, FormStep } from './types'

export interface FormTemplate {
  id: string
  name: string
  description: string
  category: 'contact' | 'survey' | 'onboarding' | 'registration' | 'feedback' | 'application' | 'workflow'
  fields: FormField[]
  steps?: FormStep[]
}

// ─── Contact Form Template ───────────────────────────────────────────────────

const contactFormTemplate: FormTemplate = {
  id: 'contact-form',
  name: 'Contact Form',
  description: 'Simple form for collecting contact information and messages',
  category: 'contact',
  fields: [
    {
      id: 'field_1',
      versionId: 'v1',
      key: 'firstName',
      label: 'First Name',
      type: 'SHORT_TEXT',
      required: true,
      order: 1,
      config: { placeholder: 'John' },
    },
    {
      id: 'field_2',
      versionId: 'v1',
      key: 'lastName',
      label: 'Last Name',
      type: 'SHORT_TEXT',
      required: true,
      order: 2,
      config: { placeholder: 'Doe' },
    },
    {
      id: 'field_3',
      versionId: 'v1',
      key: 'email',
      label: 'Email',
      type: 'EMAIL',
      required: true,
      order: 3,
      config: { placeholder: 'john@example.com' },
    },
    {
      id: 'field_4',
      versionId: 'v1',
      key: 'phone',
      label: 'Phone Number',
      type: 'PHONE',
      required: false,
      order: 4,
      config: { placeholder: '+1 (555) 000-0000' },
    },
    {
      id: 'field_5',
      versionId: 'v1',
      key: 'message',
      label: 'Message',
      type: 'LONG_TEXT',
      required: true,
      order: 5,
      config: { placeholder: 'Tell us how we can help...', maxLength: 1000 },
    },
  ],
}

// ─── Customer Feedback Form Template ─────────────────────────────────────────

const feedbackFormTemplate: FormTemplate = {
  id: 'feedback-form',
  name: 'Customer Feedback',
  description: 'Collect feedback from customers about their experience',
  category: 'feedback',
  fields: [
    {
      id: 'field_1',
      versionId: 'v1',
      key: 'product',
      label: 'Product/Service',
      type: 'SHORT_TEXT',
      required: true,
      order: 1,
      config: { placeholder: 'What product or service is this about?' },
    },
    {
      id: 'field_2',
      versionId: 'v1',
      key: 'rating',
      label: 'Overall Rating',
      type: 'RATING',
      required: true,
      order: 2,
      config: { max: 5, labels: { low: 'Poor', high: 'Excellent' } },
    },
    {
      id: 'field_3',
      versionId: 'v1',
      key: 'category',
      label: 'Feedback Category',
      type: 'SELECT',
      required: true,
      order: 3,
      config: {
        mode: 'static',
        options: [
          { label: 'Quality', value: 'quality' },
          { label: 'Service', value: 'service' },
          { label: 'Price', value: 'price' },
          { label: 'Other', value: 'other' },
        ],
      },
    },
    {
      id: 'field_4',
      versionId: 'v1',
      key: 'comment',
      label: 'Additional Comments',
      type: 'LONG_TEXT',
      required: false,
      order: 4,
      config: { placeholder: 'Tell us more about your experience...', maxLength: 2000 },
    },
    {
      id: 'field_5',
      versionId: 'v1',
      key: 'email',
      label: 'Email (optional)',
      type: 'EMAIL',
      required: false,
      order: 5,
      config: { placeholder: 'your@email.com' },
    },
  ],
}

// ─── Employee Onboarding Template ────────────────────────────────────────────

const employeeOnboardingTemplate: FormTemplate = {
  id: 'employee-onboarding',
  name: 'Employee Onboarding',
  description: 'Onboarding form for new employees',
  category: 'onboarding',
  steps: [
    {
      id: 'step_1',
      versionId: 'v1',
      title: 'Personal Information',
      order: 1,
    },
    {
      id: 'step_2',
      versionId: 'v1',
      title: 'Employment Details',
      order: 2,
    },
    {
      id: 'step_3',
      versionId: 'v1',
      title: 'Emergency Contact',
      order: 3,
    },
  ],
  fields: [
    // Step 1: Personal Information
    {
      id: 'field_1',
      versionId: 'v1',
      stepId: 'step_1',
      key: 'firstName',
      label: 'First Name',
      type: 'SHORT_TEXT',
      required: true,
      order: 1,
      config: {},
    },
    {
      id: 'field_2',
      versionId: 'v1',
      stepId: 'step_1',
      key: 'lastName',
      label: 'Last Name',
      type: 'SHORT_TEXT',
      required: true,
      order: 2,
      config: {},
    },
    {
      id: 'field_3',
      versionId: 'v1',
      stepId: 'step_1',
      key: 'dateOfBirth',
      label: 'Date of Birth',
      type: 'DATE',
      required: true,
      order: 3,
      config: {},
    },
    // Step 2: Employment Details
    {
      id: 'field_4',
      versionId: 'v1',
      stepId: 'step_2',
      key: 'department',
      label: 'Department',
      type: 'SELECT',
      required: true,
      order: 1,
      config: {
        mode: 'static',
        options: [
          { label: 'Engineering', value: 'eng' },
          { label: 'Sales', value: 'sales' },
          { label: 'Marketing', value: 'marketing' },
          { label: 'HR', value: 'hr' },
        ],
      },
    },
    {
      id: 'field_5',
      versionId: 'v1',
      stepId: 'step_2',
      key: 'position',
      label: 'Position',
      type: 'SHORT_TEXT',
      required: true,
      order: 2,
      config: {},
    },
    {
      id: 'field_6',
      versionId: 'v1',
      stepId: 'step_2',
      key: 'startDate',
      label: 'Start Date',
      type: 'DATE',
      required: true,
      order: 3,
      config: {},
    },
    // Step 3: Emergency Contact
    {
      id: 'field_7',
      versionId: 'v1',
      stepId: 'step_3',
      key: 'emergencyName',
      label: 'Emergency Contact Name',
      type: 'SHORT_TEXT',
      required: true,
      order: 1,
      config: {},
    },
    {
      id: 'field_8',
      versionId: 'v1',
      stepId: 'step_3',
      key: 'emergencyPhone',
      label: 'Emergency Contact Phone',
      type: 'PHONE',
      required: true,
      order: 2,
      config: {},
    },
  ],
}

// ─── User Registration Template ──────────────────────────────────────────────

const userRegistrationTemplate: FormTemplate = {
  id: 'user-registration',
  name: 'User Registration',
  description: 'Registration form for new user accounts',
  category: 'registration',
  fields: [
    {
      id: 'field_1',
      versionId: 'v1',
      key: 'username',
      label: 'Username',
      type: 'SHORT_TEXT',
      required: true,
      order: 1,
      config: { minLength: 3, maxLength: 20, pattern: '^[a-zA-Z0-9_]+$' },
    },
    {
      id: 'field_2',
      versionId: 'v1',
      key: 'email',
      label: 'Email Address',
      type: 'EMAIL',
      required: true,
      order: 2,
      config: {},
    },
    {
      id: 'field_3',
      versionId: 'v1',
      key: 'password',
      label: 'Password',
      type: 'PASSWORD',
      required: true,
      order: 3,
      config: { minLength: 8 },
    },
    {
      id: 'field_4',
      versionId: 'v1',
      key: 'confirmPassword',
      label: 'Confirm Password',
      type: 'PASSWORD',
      required: true,
      order: 4,
      config: {},
    },
    {
      id: 'field_5',
      versionId: 'v1',
      key: 'agreeToTerms',
      label: 'I agree to the Terms of Service',
      type: 'CHECKBOX',
      required: true,
      order: 5,
      config: {},
    },
  ],
}

// ─── Customer Survey Template ────────────────────────────────────────────────

const customerSurveyTemplate: FormTemplate = {
  id: 'customer-survey',
  name: 'Customer Survey',
  description: 'Comprehensive customer satisfaction survey',
  category: 'survey',
  fields: [
    {
      id: 'field_1',
      versionId: 'v1',
      key: 'satisfaction',
      label: 'How satisfied are you with our service?',
      type: 'SCALE',
      required: true,
      order: 1,
      config: { min: 1, max: 10, minLabel: 'Very Dissatisfied', maxLabel: 'Very Satisfied' },
    },
    {
      id: 'field_2',
      versionId: 'v1',
      key: 'wouldRecommend',
      label: 'Would you recommend us to a friend?',
      type: 'RADIO',
      required: true,
      order: 2,
      config: {
        mode: 'static',
        options: [
          { label: 'Definitely', value: 'yes' },
          { label: 'Maybe', value: 'maybe' },
          { label: 'Not likely', value: 'no' },
        ],
      },
    },
    {
      id: 'field_3',
      versionId: 'v1',
      key: 'improvements',
      label: 'What could we improve?',
      type: 'LONG_TEXT',
      required: false,
      order: 3,
      config: { maxLength: 1000 },
    },
    {
      id: 'field_4',
      versionId: 'v1',
      key: 'interests',
      label: 'Topics of interest',
      type: 'MULTI_SELECT',
      required: false,
      order: 4,
      config: {
        mode: 'static',
        options: [
          { label: 'Product Updates', value: 'updates' },
          { label: 'New Features', value: 'features' },
          { label: 'Special Offers', value: 'offers' },
          { label: 'Company News', value: 'news' },
        ],
      },
    },
  ],
}

// ─── Job Application Template ────────────────────────────────────────────────

const jobApplicationTemplate: FormTemplate = {
  id: 'job-application',
  name: 'Job Application',
  description: 'Application form for job positions',
  category: 'application',
  fields: [
    {
      id: 'field_1',
      versionId: 'v1',
      key: 'firstName',
      label: 'First Name',
      type: 'SHORT_TEXT',
      required: true,
      order: 1,
      config: {},
    },
    {
      id: 'field_2',
      versionId: 'v1',
      key: 'lastName',
      label: 'Last Name',
      type: 'SHORT_TEXT',
      required: true,
      order: 2,
      config: {},
    },
    {
      id: 'field_3',
      versionId: 'v1',
      key: 'email',
      label: 'Email',
      type: 'EMAIL',
      required: true,
      order: 3,
      config: {},
    },
    {
      id: 'field_4',
      versionId: 'v1',
      key: 'position',
      label: 'Position Applied For',
      type: 'SHORT_TEXT',
      required: true,
      order: 4,
      config: {},
    },
    {
      id: 'field_5',
      versionId: 'v1',
      key: 'experience',
      label: 'Years of Experience',
      type: 'NUMBER',
      required: true,
      order: 5,
      config: { min: 0, max: 70 },
    },
    {
      id: 'field_6',
      versionId: 'v1',
      key: 'resume',
      label: 'Resume/CV',
      type: 'FILE_UPLOAD',
      required: true,
      order: 6,
      config: { maxSizeMB: 5, allowedMimeTypes: ['application/pdf'] },
    },
    {
      id: 'field_7',
      versionId: 'v1',
      key: 'coverLetter',
      label: 'Cover Letter',
      type: 'LONG_TEXT',
      required: false,
      order: 7,
      config: { maxLength: 2000 },
    },
  ],
}

// ─── Event Registration Template ─────────────────────────────────────────────

const eventRegistrationTemplate: FormTemplate = {
  id: 'event-registration',
  name: 'Event Registration',
  description: 'Registration form for events and conferences',
  category: 'registration',
  fields: [
    {
      id: 'field_1',
      versionId: 'v1',
      key: 'firstName',
      label: 'First Name',
      type: 'SHORT_TEXT',
      required: true,
      order: 1,
      config: {},
    },
    {
      id: 'field_2',
      versionId: 'v1',
      key: 'lastName',
      label: 'Last Name',
      type: 'SHORT_TEXT',
      required: true,
      order: 2,
      config: {},
    },
    {
      id: 'field_3',
      versionId: 'v1',
      key: 'email',
      label: 'Email',
      type: 'EMAIL',
      required: true,
      order: 3,
      config: {},
    },
    {
      id: 'field_4',
      versionId: 'v1',
      key: 'company',
      label: 'Company',
      type: 'SHORT_TEXT',
      required: false,
      order: 4,
      config: {},
    },
    {
      id: 'field_5',
      versionId: 'v1',
      key: 'ticketType',
      label: 'Ticket Type',
      type: 'RADIO',
      required: true,
      order: 5,
      config: {
        mode: 'static',
        options: [
          { label: 'General Admission - $50', value: 'general' },
          { label: 'VIP - $100', value: 'vip' },
          { label: 'Student - $25', value: 'student' },
        ],
      },
    },
    {
      id: 'field_6',
      versionId: 'v1',
      key: 'dietaryRestrictions',
      label: 'Dietary Restrictions',
      type: 'LONG_TEXT',
      required: false,
      order: 6,
      config: { placeholder: 'Any allergies or dietary needs?' },
    },
  ],
}

// ─── Bug Report Template ─────────────────────────────────────────────────────

const bugReportTemplate: FormTemplate = {
  id: 'bug-report',
  name: 'Bug Report',
  description: 'Report bugs and issues',
  category: 'feedback',
  fields: [
    {
      id: 'field_1',
      versionId: 'v1',
      key: 'title',
      label: 'Bug Title',
      type: 'SHORT_TEXT',
      required: true,
      order: 1,
      config: { maxLength: 100 },
    },
    {
      id: 'field_2',
      versionId: 'v1',
      key: 'severity',
      label: 'Severity',
      type: 'SELECT',
      required: true,
      order: 2,
      config: {
        mode: 'static',
        options: [
          { label: 'Critical', value: 'critical' },
          { label: 'High', value: 'high' },
          { label: 'Medium', value: 'medium' },
          { label: 'Low', value: 'low' },
        ],
      },
    },
    {
      id: 'field_3',
      versionId: 'v1',
      key: 'description',
      label: 'Description',
      type: 'LONG_TEXT',
      required: true,
      order: 3,
      config: { maxLength: 3000, placeholder: 'What went wrong?' },
    },
    {
      id: 'field_4',
      versionId: 'v1',
      key: 'steps',
      label: 'Steps to Reproduce',
      type: 'LONG_TEXT',
      required: true,
      order: 4,
      config: { maxLength: 2000, placeholder: '1. ... \n2. ... \n3. ...' },
    },
    {
      id: 'field_5',
      versionId: 'v1',
      key: 'expectedVsActual',
      label: 'Expected vs Actual Behavior',
      type: 'LONG_TEXT',
      required: true,
      order: 5,
      config: { maxLength: 1000 },
    },
    {
      id: 'field_6',
      versionId: 'v1',
      key: 'environment',
      label: 'Environment (OS, Browser, etc.)',
      type: 'SHORT_TEXT',
      required: false,
      order: 6,
      config: {},
    },
    {
      id: 'field_7',
      versionId: 'v1',
      key: 'attachment',
      label: 'Screenshot/Attachment',
      type: 'FILE_UPLOAD',
      required: false,
      order: 7,
      config: { maxSizeMB: 10, allowedMimeTypes: ['image/*', 'application/pdf'] },
    },
  ],
}

// ─── M1 Starter: User Onboarding ─────────────────────────────────────────────
// Showcases conditional visibility (business-only fields) across a multi-step flow.

const userOnboardingTemplate: FormTemplate = {
  id: 'user-onboarding',
  name: 'User Onboarding',
  description: 'Multi-step onboarding that adapts to personal vs. business accounts',
  category: 'onboarding',
  steps: [
    { id: 'step_account', versionId: 'v1', title: 'Account', order: 1 },
    { id: 'step_profile', versionId: 'v1', title: 'Profile', order: 2 },
    { id: 'step_preferences', versionId: 'v1', title: 'Preferences', order: 3 },
  ],
  fields: [
    {
      id: 'onb_full_name', versionId: 'v1', stepId: 'step_account',
      key: 'fullName', label: 'Full Name', type: 'SHORT_TEXT', required: true, order: 1,
      config: { placeholder: 'Ada Lovelace' },
    },
    {
      id: 'onb_email', versionId: 'v1', stepId: 'step_account',
      key: 'email', label: 'Work Email', type: 'EMAIL', required: true, order: 2,
      config: { placeholder: 'ada@example.com' },
    },
    {
      id: 'onb_account_type', versionId: 'v1', stepId: 'step_account',
      key: 'accountType', label: 'Account Type', type: 'SELECT', required: true, order: 3,
      config: {
        mode: 'static',
        defaultValue: 'personal',
        options: [
          { label: 'Personal', value: 'personal' },
          { label: 'Business', value: 'business' },
        ],
      },
    },
    {
      id: 'onb_company_name', versionId: 'v1', stepId: 'step_profile',
      key: 'companyName', label: 'Company Name', type: 'SHORT_TEXT', required: true, order: 1,
      config: {},
      conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'accountType', operator: 'eq', value: 'business' }] },
    },
    {
      id: 'onb_team_size', versionId: 'v1', stepId: 'step_profile',
      key: 'teamSize', label: 'Team Size', type: 'NUMBER', required: false, order: 2,
      config: { min: 1 },
      conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'accountType', operator: 'eq', value: 'business' }] },
    },
    {
      id: 'onb_role', versionId: 'v1', stepId: 'step_profile',
      key: 'role', label: 'Your Role', type: 'SHORT_TEXT', required: false, order: 3,
      config: { placeholder: 'e.g. Product Engineer' },
    },
    {
      id: 'onb_use_cases', versionId: 'v1', stepId: 'step_preferences',
      key: 'useCases', label: 'What will you build with DFE?', type: 'MULTI_SELECT', required: false, order: 1,
      config: {
        mode: 'static',
        options: [
          { label: 'Onboarding flows', value: 'onboarding' },
          { label: 'Applications', value: 'applications' },
          { label: 'Internal tools', value: 'internal' },
          { label: 'Approvals', value: 'approvals' },
        ],
      },
    },
    {
      id: 'onb_referral', versionId: 'v1', stepId: 'step_preferences',
      key: 'referralSource', label: 'How did you hear about us?', type: 'SELECT', required: false, order: 2,
      config: {
        mode: 'static',
        options: [
          { label: 'GitHub', value: 'github' },
          { label: 'Hacker News', value: 'hn' },
          { label: 'A friend', value: 'friend' },
          { label: 'Search', value: 'search' },
        ],
      },
    },
  ],
}

// ─── M1 Starter: Loan Application ─────────────────────────────────────────────
// Showcases a conditional employer field, a computed monthly estimate, and a review step.

const loanApplicationTemplate: FormTemplate = {
  id: 'loan-application',
  name: 'Loan Application',
  description: 'Application flow with conditional employer details, a computed monthly estimate, and a review step',
  category: 'application',
  steps: [
    { id: 'step_applicant', versionId: 'v1', title: 'Applicant', order: 1 },
    { id: 'step_financials', versionId: 'v1', title: 'Financials', order: 2 },
    {
      id: 'step_review', versionId: 'v1', title: 'Review & Submit', order: 3,
      config: { review: { editMode: 'navigate' } },
    },
  ],
  fields: [
    {
      id: 'loan_applicant', versionId: 'v1', stepId: 'step_applicant',
      key: 'applicantName', label: 'Applicant Name', type: 'SHORT_TEXT', required: true, order: 1,
      config: {},
    },
    {
      id: 'loan_email', versionId: 'v1', stepId: 'step_applicant',
      key: 'email', label: 'Email', type: 'EMAIL', required: true, order: 2,
      config: {},
    },
    {
      id: 'loan_employment', versionId: 'v1', stepId: 'step_applicant',
      key: 'employmentStatus', label: 'Employment Status', type: 'SELECT', required: true, order: 3,
      config: {
        mode: 'static',
        options: [
          { label: 'Employed', value: 'employed' },
          { label: 'Self-employed', value: 'self-employed' },
          { label: 'Unemployed', value: 'unemployed' },
        ],
      },
    },
    {
      id: 'loan_employer', versionId: 'v1', stepId: 'step_financials',
      key: 'employerName', label: 'Employer Name', type: 'SHORT_TEXT', required: true, order: 1,
      config: {},
      conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'employmentStatus', operator: 'eq', value: 'employed' }] },
    },
    {
      id: 'loan_income', versionId: 'v1', stepId: 'step_financials',
      key: 'annualIncome', label: 'Annual Income', type: 'NUMBER', required: true, order: 2,
      config: { min: 0 },
    },
    {
      id: 'loan_amount', versionId: 'v1', stepId: 'step_financials',
      key: 'loanAmount', label: 'Loan Amount', type: 'NUMBER', required: true, order: 3,
      config: { min: 0 },
    },
    {
      id: 'loan_term', versionId: 'v1', stepId: 'step_financials',
      key: 'loanTermYears', label: 'Loan Term (years)', type: 'NUMBER', required: true, order: 4,
      config: { min: 1 },
    },
    {
      id: 'loan_estimate', versionId: 'v1', stepId: 'step_financials',
      key: 'estimatedMonthly', label: 'Estimated Monthly Payment', type: 'NUMBER', required: false, order: 5,
      config: { helpText: 'Principal divided by the number of months (interest excluded)' },
      computed: { expression: 'loanAmount / (loanTermYears * 12)', dependsOn: ['loanAmount', 'loanTermYears'] },
    },
  ],
}

// ─── M1 Starter: Admin Approval Workflow ─────────────────────────────────────
// Showcases conditional fields, conditional requirement, and step branching.

const adminApprovalWorkflowTemplate: FormTemplate = {
  id: 'admin-approval-workflow',
  name: 'Admin Approval Workflow',
  description: 'Internal request-and-approval workflow with conditional fields, a required-when-rejecting reason, and step branching',
  category: 'workflow',
  steps: [
    { id: 'step_request', versionId: 'v1', title: 'Request', order: 1 },
    {
      id: 'step_decision', versionId: 'v1', title: 'Decision', order: 2,
      branches: [
        {
          condition: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'decision', operator: 'eq', value: 'approve' }] },
          targetStepId: 'step_summary',
        },
      ],
    },
    {
      id: 'step_summary', versionId: 'v1', title: 'Summary', order: 3,
      config: { review: { editMode: 'navigate' } },
    },
  ],
  fields: [
    {
      id: 'adm_request_type', versionId: 'v1', stepId: 'step_request',
      key: 'requestType', label: 'Request Type', type: 'SELECT', required: true, order: 1,
      config: {
        mode: 'static',
        options: [
          { label: 'Access request', value: 'access' },
          { label: 'Purchase', value: 'purchase' },
          { label: 'Time off', value: 'timeoff' },
        ],
      },
    },
    {
      id: 'adm_justification', versionId: 'v1', stepId: 'step_request',
      key: 'justification', label: 'Justification', type: 'LONG_TEXT', required: true, order: 2,
      config: { maxLength: 2000 },
    },
    {
      id: 'adm_amount', versionId: 'v1', stepId: 'step_request',
      key: 'amount', label: 'Amount', type: 'NUMBER', required: false, order: 3,
      config: { min: 0 },
      conditions: { action: 'SHOW', operator: 'and', rules: [{ fieldKey: 'requestType', operator: 'eq', value: 'purchase' }] },
    },
    {
      id: 'adm_decision', versionId: 'v1', stepId: 'step_decision',
      key: 'decision', label: 'Decision', type: 'RADIO', required: true, order: 1,
      config: {
        mode: 'static',
        options: [
          { label: 'Approve', value: 'approve' },
          { label: 'Reject', value: 'reject' },
        ],
      },
    },
    {
      id: 'adm_rejection_reason', versionId: 'v1', stepId: 'step_decision',
      key: 'rejectionReason', label: 'Rejection Reason', type: 'LONG_TEXT', required: false, order: 2,
      config: { helpText: 'Required when rejecting a request' },
      conditions: { action: 'REQUIRE', operator: 'and', rules: [{ fieldKey: 'decision', operator: 'eq', value: 'reject' }] },
    },
  ],
}

// ─── All templates ──────────────────────────────────────────────────────────

export const TEMPLATES: FormTemplate[] = [
  contactFormTemplate,
  feedbackFormTemplate,
  employeeOnboardingTemplate,
  userRegistrationTemplate,
  customerSurveyTemplate,
  jobApplicationTemplate,
  eventRegistrationTemplate,
  bugReportTemplate,
  userOnboardingTemplate,
  loanApplicationTemplate,
  adminApprovalWorkflowTemplate,
]

/**
 * Get a template by its ID
 */
export function getTemplate(id: string): FormTemplate | undefined {
  return TEMPLATES.find(t => t.id === id)
}

/**
 * Get all templates in a specific category
 */
export function getTemplatesByCategory(category: FormTemplate['category']): FormTemplate[] {
  return TEMPLATES.filter(t => t.category === category)
}

/**
 * List all templates with basic info
 */
export function listTemplates(): Array<{ id: string; name: string; description: string; category: string }> {
  return TEMPLATES.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
  }))
}
