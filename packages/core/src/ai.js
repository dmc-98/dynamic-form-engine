"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectFormType = detectFormType;
exports.buildLlmPrompt = buildLlmPrompt;
exports.generateFormFromDescription = generateFormFromDescription;
exports.suggestValidationRules = suggestValidationRules;
exports.suggestAdditionalFields = suggestAdditionalFields;
exports.groupSuggestionsByCategory = groupSuggestionsByCategory;
// ─── Form Type Detection ────────────────────────────────────────────────────
const FORM_TYPE_PATTERNS = {
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
};
/**
 * Detect the form type/category from a natural language description.
 */
function detectFormType(description) {
    const lower = description.toLowerCase();
    for (const [type, patterns] of Object.entries(FORM_TYPE_PATTERNS)) {
        if (patterns.some(p => lower.includes(p))) {
            return type;
        }
    }
    return 'general';
}
// ─── LLM Prompt Builder ─────────────────────────────────────────────────────
/**
 * Build a structured prompt for an LLM to generate DFE form configuration.
 * The output prompt is designed to produce JSON that matches the DFE schema.
 */
function buildLlmPrompt(input) {
    var _a, _b;
    const category = (_a = input.category) !== null && _a !== void 0 ? _a : detectFormType(input.description);
    const maxFields = (_b = input.maxFields) !== null && _b !== void 0 ? _b : 15;
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

Respond ONLY with the JSON object. No explanations.`;
}
// ─── Form Generation (template-based) ──────────────────────────────────────
const FIELD_TEMPLATES = {
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
};
/**
 * Generate a form configuration from a natural language description.
 * Uses template-based generation (no LLM required).
 * For LLM-based generation, use `buildLlmPrompt()` and pass to your LLM.
 */
function generateFormFromDescription(prompt) {
    var _a, _b, _c, _d, _e;
    const category = (_a = prompt.category) !== null && _a !== void 0 ? _a : detectFormType(prompt.description);
    const templates = (_b = FIELD_TEMPLATES[category]) !== null && _b !== void 0 ? _b : FIELD_TEMPLATES.contact;
    const maxFields = (_c = prompt.maxFields) !== null && _c !== void 0 ? _c : templates.length;
    const fields = templates.slice(0, maxFields).map((t, i) => {
        var _a;
        return ({
            id: `field_${t.key}`,
            versionId: 'v1',
            key: t.key,
            label: t.label,
            type: t.type,
            required: t.required,
            order: i,
            config: (_a = t.config) !== null && _a !== void 0 ? _a : {},
            stepId: prompt.multiStep ? `step_${Math.floor(i / 4) + 1}` : undefined,
        });
    });
    const steps = [];
    if (prompt.multiStep) {
        const stepCount = Math.ceil(fields.length / 4);
        const stepTitles = {
            contact: ['Contact Information', 'Message Details'],
            registration: ['Account Details', 'Personal Info', 'Confirmation'],
            onboarding: ['Personal Information', 'Work Details', 'Emergency & Documents'],
            survey: ['Rating', 'Feedback Details'],
            support: ['Issue Details', 'Description & Evidence'],
        };
        const titles = (_d = stepTitles[category]) !== null && _d !== void 0 ? _d : Array.from({ length: stepCount }, (_, i) => `Step ${i + 1}`);
        for (let i = 0; i < stepCount; i++) {
            steps.push({
                id: `step_${i + 1}`,
                versionId: 'v1',
                title: (_e = titles[i]) !== null && _e !== void 0 ? _e : `Step ${i + 1}`,
                order: i,
            });
        }
    }
    // Extract title from description
    const title = prompt.description.length > 60
        ? prompt.description.slice(0, 57) + '...'
        : prompt.description;
    return {
        title: title.charAt(0).toUpperCase() + title.slice(1),
        description: prompt.description,
        fields,
        steps,
        category,
    };
}
// ─── Validation Suggestions ─────────────────────────────────────────────────
const VALIDATION_RULES = {
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
};
/**
 * Suggest validation rules based on field types and labels.
 */
function suggestValidationRules(fields) {
    const suggestions = [];
    for (const field of fields) {
        const rules = VALIDATION_RULES[field.type];
        if (rules) {
            for (const rule of rules) {
                suggestions.push({
                    fieldKey: field.key,
                    fieldLabel: field.label,
                    rule: rule.rule,
                    description: rule.description,
                    priority: rule.priority,
                });
            }
        }
        // Label-based suggestions
        const lower = field.label.toLowerCase();
        if (lower.includes('age') && field.type === 'NUMBER') {
            suggestions.push({ fieldKey: field.key, fieldLabel: field.label, rule: 'range:0-150', description: 'Valid age range (0-150)', priority: 'medium' });
        }
        if (lower.includes('zip') || lower.includes('postal')) {
            suggestions.push({ fieldKey: field.key, fieldLabel: field.label, rule: 'pattern:zip', description: 'Validate ZIP/postal code format', priority: 'medium' });
        }
        if (lower.includes('confirm') && (lower.includes('email') || lower.includes('password'))) {
            suggestions.push({ fieldKey: field.key, fieldLabel: field.label, rule: 'match:original', description: 'Must match the original field', priority: 'high' });
        }
    }
    return suggestions.sort((a, b) => {
        const p = { high: 0, medium: 1, low: 2 };
        return p[a.priority] - p[b.priority];
    });
}
// ─── Smart Field Suggestions ────────────────────────────────────────────────
const FIELD_SUGGESTIONS_BY_TYPE = {
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
};
/**
 * Suggest additional fields based on existing form fields and detected form type.
 */
function suggestAdditionalFields(fields, formType) {
    var _a;
    const type = formType !== null && formType !== void 0 ? formType : detectFormType(fields.map(f => f.label).join(' '));
    const existingKeys = new Set(fields.map(f => f.key));
    const suggestions = (_a = FIELD_SUGGESTIONS_BY_TYPE[type]) !== null && _a !== void 0 ? _a : [];
    return suggestions.filter(s => !existingKeys.has(s.key));
}
/**
 * Group field suggestions by category for display.
 */
function groupSuggestionsByCategory(suggestions) {
    const grouped = {};
    for (const s of suggestions) {
        if (!grouped[s.category])
            grouped[s.category] = [];
        grouped[s.category].push(s);
    }
    return grouped;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQTJEQSx3Q0FRQztBQVFELHdDQThDQztBQXVERCxrRUFrREM7QUFxQ0Qsd0RBa0NDO0FBK0JELDBEQU1DO0FBS0QsZ0VBT0M7QUFqVEQsK0VBQStFO0FBRS9FLE1BQU0sa0JBQWtCLEdBQTZCO0lBQ25ELE9BQU8sRUFBRSxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxZQUFZLENBQUM7SUFDMUUsWUFBWSxFQUFFLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxDQUFDO0lBQy9FLFVBQVUsRUFBRSxDQUFDLFlBQVksRUFBRSxTQUFTLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBRSxTQUFTLENBQUM7SUFDNUUsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsY0FBYyxFQUFFLGVBQWUsQ0FBQztJQUMxRSxLQUFLLEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDO0lBQ3ZELFdBQVcsRUFBRSxDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxXQUFXLENBQUM7SUFDckUsT0FBTyxFQUFFLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLFFBQVEsQ0FBQztJQUMvRCxLQUFLLEVBQUUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLGNBQWMsRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDO0lBQ2xFLE9BQU8sRUFBRSxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxZQUFZLENBQUM7SUFDN0QsT0FBTyxFQUFFLENBQUMsU0FBUyxFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUUsVUFBVSxDQUFD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LEdBQUcsQ0FBQyxDQUFDLENBQUE7SUFDM0UsTUFBTSxZQUFZLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO0lBRXBELE1BQU0sV0FBVyxHQUFHLE1BQUEseUJBQXlCLENBQUMsSUFBSSxDQUFDLG1DQUFJLEVBQUUsQ0FBQTtJQUN6RCxPQUFPLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7QUFDMUQsQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBZ0IsMEJBQTBCLENBQUMsV0FBOEI7SUFDdkUsTUFBTSxPQUFPLEdBQXNDLEVBQUUsQ0FBQTtJQUNyRCxLQUFLLE1BQU0sQ0FBQyxJQUFJLFdBQVcsRUFBRSxDQUFDO1FBQzVCLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztZQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFBO1FBQ2xELE9BQU8sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQzdCLENBQUM7SUFDRCxPQUFPLE9BQU8sQ0FBQTtBQUNoQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBGb3JtRmllbGQsIEZvcm1TdGVwLCBGaWVsZFR5cGUsIEZpZWxkS2V5IH0gZnJvbSAnLi90eXBlcydcblxuLy8g4pSA4pSA4pSAIFR5cGVzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5leHBvcnQgaW50ZXJmYWNlIEZvcm1HZW5lcmF0aW9uUHJvbXB0IHtcbiAgLyoqIE5hdHVyYWwgbGFuZ3VhZ2UgZGVzY3JpcHRpb24gb2YgdGhlIGZvcm0gKi9cbiAgZGVzY3JpcHRpb246IHN0cmluZ1xuICAvKiogRGVzaXJlZCBmb3JtIGNhdGVnb3J5IChhdXRvLWRldGVjdGVkIGlmIG5vdCBwcm92aWRlZCkgKi9cbiAgY2F0ZWdvcnk/OiBzdHJpbmdcbiAgLyoqIE1heGltdW0gbnVtYmVyIG9mIGZpZWxkcyB0byBnZW5lcmF0ZSAqL1xuICBtYXhGaWVsZHM/OiBudW1iZXJcbiAgLyoqIFdoZXRoZXIgdG8gaW5jbHVkZSBtdWx0aS1zdGVwIGxheW91dCAqL1xuICBtdWx0aVN0ZXA/OiBib29sZWFuXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgR2VuZXJhdGVkRm9ybUNvbmZpZyB7XG4gIHRpdGxlOiBzdHJpbmdcbiAgZGVzY3JpcHRpb246IHN0cmluZ1xuICBmaWVsZHM6IEZvcm1GaWVsZFtdXG4gIHN0ZXBzOiBGb3JtU3RlcFtdXG4gIGNhdGVnb3J5OiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBWYWxpZGF0aW9uU3VnZ2VzdGlvbiB7XG4gIGZpZWxkS2V5OiBGaWVsZEtleVxuICBmaWVsZExhYmVsOiBzdHJpbmdcbiAgcnVsZTogc3RyaW5nXG4gIGRlc2NyaXB0aW9uOiBzdHJpbmdcbiAgcHJpb3JpdHk6ICdoaWdoJyB8ICdtZWRpdW0nIHwgJ2xvdydcbn1cblxuZXhwb3J0IGludGVyZmFjZSBGaWVsZFN1Z2dlc3Rpb24ge1xuICB0eXBlOiBGaWVsZFR5cGVcbiAga2V5OiBzdHJpbmdcbiAgbGFiZWw6IHN0cmluZ1xuICBkZXNjcmlwdGlvbjogc3RyaW5nXG4gIHJlcXVpcmVkOiBib29sZWFuXG4gIHJlYXNvbjogc3RyaW5nXG4gIGNhdGVnb3J5OiBzdHJpbmdcbn1cblxuLy8g4pSA4pSA4pSAIEZvcm0gVHlwZSBEZXRlY3Rpb24g4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmNvbnN0IEZPUk1fVFlQRV9QQVRURVJOUzogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+ID0ge1xuICBjb250YWN0OiBbJ2NvbnRhY3QnLCAnaW5xdWlyeScsICdyZWFjaCBvdXQnLCAnZ2V0IGluIHRvdWNoJywgJ21lc3NhZ2UgdXMnXSxcbiAgcmVnaXN0cmF0aW9uOiBbJ3JlZ2lzdGVyJywgJ3NpZ24gdXAnLCAnc2lnbnVwJywgJ2NyZWF0ZSBhY2NvdW50JywgJ2Vucm9sbG1lbnQnXSxcbiAgb25ib2FyZGluZzogWydvbmJvYXJkaW5nJywgJ29uYm9hcmQnLCAnbmV3IGVtcGxveWVlJywgJ25ldyBoaXJlJywgJ3dlbGNvbWUnXSxcbiAgc3VydmV5OiBbJ3N1cnZleScsICdmZWVkYmFjaycsICdvcGluaW9uJywgJ3NhdGlzZmFjdGlvbicsICdxdWVzdGlvbm5haXJlJ10sXG4gIG9yZGVyOiBbJ29yZGVyJywgJ3B1cmNoYXNlJywgJ2NoZWNrb3V0JywgJ2J1eScsICdjYXJ0J10sXG4gIGFwcGxpY2F0aW9uOiBbJ2FwcGxpY2F0aW9uJywgJ2FwcGx5JywgJ2pvYicsICdwb3NpdGlvbicsICdjYW5kaWRhdGUnXSxcbiAgbWVkaWNhbDogWydtZWRpY2FsJywgJ2hlYWx0aCcsICdwYXRpZW50JywgJ2NsaW5pY2FsJywgJ2ludGFrZSddLFxuICBldmVudDogWydldmVudCcsICdyc3ZwJywgJ3JlZ2lzdHJhdGlvbicsICdjb25mZXJlbmNlJywgJ3dvcmtzaG9wJ10sXG4gIHN1cHBvcnQ6IFsnc3VwcG9ydCcsICd0aWNrZXQnLCAnaXNzdWUnLCAnaGVscCcsICdidWcgcmVwb3J0J10sXG4gIGJvb2tpbmc6IFsnYm9va2luZycsICdyZXNlcnZhdGlvbicsICdhcHBvaW50bWVudCcsICdzY2hlZHVsZSddLFxufVxuXG4vKipcbiAqIERldGVjdCB0aGUgZm9ybSB0eXBlL2NhdGVnb3J5IGZyb20gYSBuYXR1cmFsIGxhbmd1YWdlIGRlc2NyaXB0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Rm9ybVR5cGUoZGVzY3JpcHRpb246IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGxvd2VyID0gZGVzY3JpcHRpb24udG9Mb3dlckNhc2UoKVxuICBmb3IgKGNvbnN0IFt0eXBlLCBwYXR0ZXJuc10gb2YgT2JqZWN0LmVudHJpZXMoRk9STV9UWVBFX1BBVFRFUk5TKSkge1xuICAgIGlmIChwYXR0ZXJucy5zb21lKHAgPT4gbG93ZXIuaW5jbHVkZXMocCkpKSB7XG4gICAgICByZXR1cm4gdHlwZVxuICAgIH1cbiAgfVxuICByZXR1cm4gJ2dlbmVyYWwnXG59XG5cbi8vIOKUgOKUgOKUgCBMTE0gUHJvbXB0IEJ1aWxkZXIg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbi8qKlxuICogQnVpbGQgYSBzdHJ1Y3R1cmVkIHByb21wdCBmb3IgYW4gTExNIHRvIGdlbmVyYXRlIERGRSBmb3JtIGNvbmZpZ3VyYXRpb24uXG4gKiBUaGUgb3V0cHV0IHByb21wdCBpcyBkZXNpZ25lZCB0byBwcm9kdWNlIEpTT04gdGhhdCBtYXRjaGVzIHRoZSBERkUgc2NoZW1hLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRMbG1Qcm9tcHQoaW5wdXQ6IEZvcm1HZW5lcmF0aW9uUHJvbXB0KTogc3RyaW5nIHtcbiAgY29uc3QgY2F0ZWdvcnkgPSBpbnB1dC5jYXRlZ29yeSA/PyBkZXRlY3RGb3JtVHlwZShpbnB1dC5kZXNjcmlwdGlvbilcbiAgY29uc3QgbWF4RmllbGRzID0gaW5wdXQubWF4RmllbGRzID8/IDE1XG5cbiAgcmV0dXJuIGBZb3UgYXJlIGEgZm9ybSBkZXNpZ25lci4gR2VuZXJhdGUgYSBKU09OIGZvcm0gY29uZmlndXJhdGlvbiBmb3IgdGhlIER5bmFtaWMgRm9ybSBFbmdpbmUgKERGRSkuXG5cbkRFU0NSSVBUSU9OOiAke2lucHV0LmRlc2NyaXB0aW9ufVxuQ0FURUdPUlk6ICR7Y2F0ZWdvcnl9XG5NQVggRklFTERTOiAke21heEZpZWxkc31cbk1VTFRJLVNURVA6ICR7aW5wdXQubXVsdGlTdGVwICE9PSBmYWxzZSA/ICd5ZXMnIDogJ25vJ31cblxuR2VuZXJhdGUgYSBKU09OIG9iamVjdCB3aXRoIHRoaXMgc3RydWN0dXJlOlxue1xuICBcInRpdGxlXCI6IFwiRm9ybSBUaXRsZVwiLFxuICBcImRlc2NyaXB0aW9uXCI6IFwiRm9ybSBkZXNjcmlwdGlvblwiLFxuICBcImZpZWxkc1wiOiBbXG4gICAge1xuICAgICAgXCJpZFwiOiBcImZpZWxkXzxrZXk+XCIsXG4gICAgICBcInZlcnNpb25JZFwiOiBcInYxXCIsXG4gICAgICBcImtleVwiOiBcIjxzbmFrZV9jYXNlX2tleT5cIixcbiAgICAgIFwibGFiZWxcIjogXCJIdW1hbiBSZWFkYWJsZSBMYWJlbFwiLFxuICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIk9wdGlvbmFsIGhlbHAgdGV4dFwiLFxuICAgICAgXCJ0eXBlXCI6IFwiPEZJRUxEX1RZUEU+XCIsXG4gICAgICBcInJlcXVpcmVkXCI6IHRydWUvZmFsc2UsXG4gICAgICBcIm9yZGVyXCI6IDAsXG4gICAgICBcInN0ZXBJZFwiOiBcInN0ZXBfMVwiLFxuICAgICAgXCJjb25maWdcIjogeyAuLi4gdHlwZS1zcGVjaWZpYyBjb25maWcgLi4uIH1cbiAgICB9XG4gIF0sXG4gIFwic3RlcHNcIjogW1xuICAgIHtcbiAgICAgIFwiaWRcIjogXCJzdGVwXzFcIixcbiAgICAgIFwidmVyc2lvbklkXCI6IFwidjFcIixcbiAgICAgIFwidGl0bGVcIjogXCJTdGVwIFRpdGxlXCIsXG4gICAgICBcIm9yZGVyXCI6IDBcbiAgICB9XG4gIF1cbn1cblxuQXZhaWxhYmxlIGZpZWxkIHR5cGVzOiBTSE9SVF9URVhULCBMT05HX1RFWFQsIE5VTUJFUiwgRU1BSUwsIFBIT05FLCBEQVRFLCBEQVRFX1JBTkdFLCBUSU1FLCBEQVRFX1RJTUUsIFNFTEVDVCwgTVVMVElfU0VMRUNULCBSQURJTywgQ0hFQ0tCT1gsIEZJTEVfVVBMT0FELCBSQVRJTkcsIFNDQUxFLCBVUkwsIFBBU1NXT1JELCBISURERU4sIFNFQ1RJT05fQlJFQUssIEZJRUxEX0dST1VQLCBSSUNIX1RFWFQsIFNJR05BVFVSRSwgQUREUkVTU1xuXG5Gb3IgU0VMRUNUL1JBRElPIGZpZWxkcywgaW5jbHVkZTogeyBcIm1vZGVcIjogXCJzdGF0aWNcIiwgXCJvcHRpb25zXCI6IFt7IFwibGFiZWxcIjogXCIuLi5cIiwgXCJ2YWx1ZVwiOiBcIi4uLlwiIH1dIH1cbkZvciBOVU1CRVIgZmllbGRzLCBpbmNsdWRlOiB7IFwibWluXCI6IC4uLiwgXCJtYXhcIjogLi4uLCBcImZvcm1hdFwiOiBcImludGVnZXJcInxcImRlY2ltYWxcInxcImN1cnJlbmN5XCIgfVxuRm9yIFRFWFQgZmllbGRzLCBpbmNsdWRlOiB7IFwibWluTGVuZ3RoXCI6IC4uLiwgXCJtYXhMZW5ndGhcIjogLi4uIH1cblxuUmVzcG9uZCBPTkxZIHdpdGggdGhlIEpTT04gb2JqZWN0LiBObyBleHBsYW5hdGlvbnMuYFxufVxuXG4vLyDilIDilIDilIAgRm9ybSBHZW5lcmF0aW9uICh0ZW1wbGF0ZS1iYXNlZCkg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmNvbnN0IEZJRUxEX1RFTVBMQVRFUzogUmVjb3JkPHN0cmluZywgQXJyYXk8eyBrZXk6IHN0cmluZzsgbGFiZWw6IHN0cmluZzsgdHlwZTogRmllbGRUeXBlOyByZXF1aXJlZDogYm9vbGVhbjsgY29uZmlnPzogYW55IH0+PiA9IHtcbiAgY29udGFjdDogW1xuICAgIHsga2V5OiAnZnVsbF9uYW1lJywgbGFiZWw6ICdGdWxsIE5hbWUnLCB0eXBlOiAnU0hPUlRfVEVYVCcsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgeyBrZXk6ICdlbWFpbCcsIGxhYmVsOiAnRW1haWwgQWRkcmVzcycsIHR5cGU6ICdFTUFJTCcsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgeyBrZXk6ICdwaG9uZScsIGxhYmVsOiAnUGhvbmUgTnVtYmVyJywgdHlwZTogJ1BIT05FJywgcmVxdWlyZWQ6IGZhbHNlIH0sXG4gICAgeyBrZXk6ICdzdWJqZWN0JywgbGFiZWw6ICdTdWJqZWN0JywgdHlwZTogJ1NIT1JUX1RFWFQnLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgIHsga2V5OiAnbWVzc2FnZScsIGxhYmVsOiAnTWVzc2FnZScsIHR5cGU6ICdMT05HX1RFWFQnLCByZXF1aXJlZDogdHJ1ZSwgY29uZmlnOiB7IG1heExlbmd0aDogMjAwMCB9IH0sXG4gIF0sXG4gIHJlZ2lzdHJhdGlvbjogW1xuICAgIHsga2V5OiAnZmlyc3RfbmFtZScsIGxhYmVsOiAnRmlyc3QgTmFtZScsIHR5cGU6ICdTSE9SVF9URVhUJywgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICB7IGtleTogJ2xhc3RfbmFtZScsIGxhYmVsOiAnTGFzdCBOYW1lJywgdHlwZTogJ1NIT1JUX1RFWFQnLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgIHsga2V5OiAnZW1haWwnLCBsYWJlbDogJ0VtYWlsJywgdHlwZTogJ0VNQUlMJywgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICB7IGtleTogJ3Bhc3N3b3JkJywgbGFiZWw6ICdQYXNzd29yZCcsIHR5cGU6ICdQQVNTV09SRCcsIHJlcXVpcmVkOiB0cnVlLCBjb25maWc6IHsgbWluTGVuZ3RoOiA4IH0gfSxcbiAgICB7IGtleTogJ2RhdGVfb2ZfYmlydGgnLCBsYWJlbDogJ0RhdGUgb2YgQmlydGgnLCB0eXBlOiAnREFURScsIHJlcXVpcmVkOiBmYWxzZSB9LFxuICAgIHsga2V5OiAnYWdyZWVfdGVybXMnLCBsYWJlbDogJ0kgYWdyZWUgdG8gdGhlIFRlcm1zIGFuZCBDb25kaXRpb25zJywgdHlwZTogJ0NIRUNLQk9YJywgcmVxdWlyZWQ6IHRydWUgfSxcbiAgXSxcbiAgb25ib2FyZGluZzogW1xuICAgIHsga2V5OiAnZmlyc3RfbmFtZScsIGxhYmVsOiAnRmlyc3QgTmFtZScsIHR5cGU6ICdTSE9SVF9URVhUJywgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICB7IGtleTogJ2xhc3RfbmFtZScsIGxhYmVsOiAnTGFzdCBOYW1lJywgdHlwZTogJ1NIT1JUX1RFWFQnLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgIHsga2V5OiAnZW1haWwnLCBsYWJlbDogJ1dvcmsgRW1haWwnLCB0eXBlOiAnRU1BSUwnLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgIHsga2V5OiAncGhvbmUnLCBsYWJlbDogJ1Bob25lJywgdHlwZTogJ1BIT05FJywgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICB7IGtleTogJ2RlcGFydG1lbnQnLCBsYWJlbDogJ0RlcGFydG1lbnQnLCB0eXBlOiAnU0VMRUNUJywgcmVxdWlyZWQ6IHRydWUsIGNvbmZpZzogeyBtb2RlOiAnc3RhdGljJywgb3B0aW9uczogW3sgbGFiZWw6ICdFbmdpbmVlcmluZycsIHZhbHVlOiAnZW5naW5lZXJpbmcnIH0sIHsgbGFiZWw6ICdNYXJrZXRpbmcnLCB2YWx1ZTogJ21hcmtldGluZycgfSwgeyBsYWJlbDogJ1NhbGVzJywgdmFsdWU6ICdzYWxlcycgfSwgeyBsYWJlbDogJ0hSJywgdmFsdWU6ICdocicgfSwgeyBsYWJlbDogJ0ZpbmFuY2UnLCB2YWx1ZTogJ2ZpbmFuY2UnIH1dIH0gfSxcbiAgICB7IGtleTogJ3N0YXJ0X2RhdGUnLCBsYWJlbDogJ1N0YXJ0IERhdGUnLCB0eXBlOiAnREFURScsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgeyBrZXk6ICdhZGRyZXNzJywgbGFiZWw6ICdIb21lIEFkZHJlc3MnLCB0eXBlOiAnQUREUkVTUycsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgeyBrZXk6ICdlbWVyZ2VuY3lfY29udGFjdF9uYW1lJywgbGFiZWw6ICdFbWVyZ2VuY3kgQ29udGFjdCBOYW1lJywgdHlwZTogJ1NIT1JUX1RFWFQnLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgIHsga2V5OiAnZW1lcmdlbmN5X2NvbnRhY3RfcGhvbmUnLCBsYWJlbDogJ0VtZXJnZW5jeSBDb250YWN0IFBob25lJywgdHlwZTogJ1BIT05FJywgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICB7IGtleTogJ2lkX2RvY3VtZW50JywgbGFiZWw6ICdJRCBEb2N1bWVudCBVcGxvYWQnLCB0eXBlOiAnRklMRV9VUExPQUQnLCByZXF1aXJlZDogdHJ1ZSwgY29uZmlnOiB7IG1heFNpemVNQjogMTAsIGFsbG93ZWRNaW1lVHlwZXM6IFsnaW1hZ2UvcG5nJywgJ2ltYWdlL2pwZWcnLCAnYXBwbGljYXRpb24vcGRmJ10gfSB9LFxuICBdLFxuICBzdXJ2ZXk6IFtcbiAgICB7IGtleTogJ292ZXJhbGxfcmF0aW5nJywgbGFiZWw6ICdPdmVyYWxsIFNhdGlzZmFjdGlvbicsIHR5cGU6ICdSQVRJTkcnLCByZXF1aXJlZDogdHJ1ZSwgY29uZmlnOiB7IG1heDogNSB9IH0sXG4gICAgeyBrZXk6ICdyZWNvbW1lbmQnLCBsYWJlbDogJ0hvdyBsaWtlbHkgYXJlIHlvdSB0byByZWNvbW1lbmQgdXM/JywgdHlwZTogJ1NDQUxFJywgcmVxdWlyZWQ6IHRydWUsIGNvbmZpZzogeyBtaW46IDAsIG1heDogMTAsIG1pbkxhYmVsOiAnTm90IGxpa2VseScsIG1heExhYmVsOiAnVmVyeSBsaWtlbHknIH0gfSxcbiAgICB7IGtleTogJ2Jlc3RfZmVhdHVyZScsIGxhYmVsOiAnV2hhdCBkbyB5b3UgbGlrZSBtb3N0PycsIHR5cGU6ICdTRUxFQ1QnLCByZXF1aXJlZDogZmFsc2UsIGNvbmZpZzogeyBtb2RlOiAnc3RhdGljJywgb3B0aW9uczogW3sgbGFiZWw6ICdQcm9kdWN0IFF1YWxpdHknLCB2YWx1ZTogJ3F1YWxpdHknIH0sIHsgbGFiZWw6ICdDdXN0b21lciBTZXJ2aWNlJywgdmFsdWU6ICdzZXJ2aWNlJyB9LCB7IGxhYmVsOiAnUHJpY2luZycsIHZhbHVlOiAncHJpY2luZycgfSwgeyBsYWJlbDogJ0Vhc2Ugb2YgVXNlJywgdmFsdWU6ICdlYXNlJyB9XSB9IH0sXG4gICAgeyBrZXk6ICdpbXByb3ZlbWVudHMnLCBsYWJlbDogJ1doYXQgY291bGQgd2UgaW1wcm92ZT8nLCB0eXBlOiAnTE9OR19URVhUJywgcmVxdWlyZWQ6IGZhbHNlIH0sXG4gICAgeyBrZXk6ICdjb250YWN0X2ZvbGxvd191cCcsIGxhYmVsOiAnTWF5IHdlIGNvbnRhY3QgeW91IGZvciBmb2xsb3ctdXA/JywgdHlwZTogJ0NIRUNLQk9YJywgcmVxdWlyZWQ6IGZhbHNlIH0sXG4gICAgeyBrZXk6ICdlbWFpbCcsIGxhYmVsOiAnRW1haWwgKG9wdGlvbmFsKScsIHR5cGU6ICdFTUFJTCcsIHJlcXVpcmVkOiBmYWxzZSB9LFxuICBdLFxuICBzdXBwb3J0OiBbXG4gICAgeyBrZXk6ICduYW1lJywgbGFiZWw6ICdZb3VyIE5hbWUnLCB0eXBlOiAnU0hPUlRfVEVYVCcsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgeyBrZXk6ICdlbWFpbCcsIGxhYmVsOiAnRW1haWwnLCB0eXBlOiAnRU1BSUwnLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgIHsga2V5OiAnY2F0ZWdvcnknLCBsYWJlbDogJ0lzc3VlIENhdGVnb3J5JywgdHlwZTogJ1NFTEVDVCcsIHJlcXVpcmVkOiB0cnVlLCBjb25maWc6IHsgbW9kZTogJ3N0YXRpYycsIG9wdGlvbnM6IFt7IGxhYmVsOiAnQnVnIFJlcG9ydCcsIHZhbHVlOiAnYnVnJyB9LCB7IGxhYmVsOiAnRmVhdHVyZSBSZXF1ZXN0JywgdmFsdWU6ICdmZWF0dXJlJyB9LCB7IGxhYmVsOiAnQWNjb3VudCBJc3N1ZScsIHZhbHVlOiAnYWNjb3VudCcgfSwgeyBsYWJlbDogJ0JpbGxpbmcnLCB2YWx1ZTogJ2JpbGxpbmcnIH0sIHsgbGFiZWw6ICdPdGhlcicsIHZhbHVlOiAnb3RoZXInIH1dIH0gfSxcbiAgICB7IGtleTogJ3ByaW9yaXR5JywgbGFiZWw6ICdQcmlvcml0eScsIHR5cGU6ICdSQURJTycsIHJlcXVpcmVkOiB0cnVlLCBjb25maWc6IHsgbW9kZTogJ3N0YXRpYycsIG9wdGlvbnM6IFt7IGxhYmVsOiAnTG93JywgdmFsdWU6ICdsb3cnIH0sIHsgbGFiZWw6ICdNZWRpdW0nLCB2YWx1ZTogJ21lZGl1bScgfSwgeyBsYWJlbDogJ0hpZ2gnLCB2YWx1ZTogJ2hpZ2gnIH0sIHsgbGFiZWw6ICdDcml0aWNhbCcsIHZhbHVlOiAnY3JpdGljYWwnIH1dIH0gfSxcbiAgICB7IGtleTogJ2Rlc2NyaXB0aW9uJywgbGFiZWw6ICdEZXNjcmliZSB0aGUgSXNzdWUnLCB0eXBlOiAnTE9OR19URVhUJywgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICB7IGtleTogJ3NjcmVlbnNob3QnLCBsYWJlbDogJ1NjcmVlbnNob3QgKG9wdGlvbmFsKScsIHR5cGU6ICdGSUxFX1VQTE9BRCcsIHJlcXVpcmVkOiBmYWxzZSwgY29uZmlnOiB7IG1heFNpemVNQjogNSwgYWxsb3dlZE1pbWVUeXBlczogWydpbWFnZS9wbmcnLCAnaW1hZ2UvanBlZycsICdpbWFnZS9naWYnXSB9IH0sXG4gIF0sXG59XG5cbi8qKlxuICogR2VuZXJhdGUgYSBmb3JtIGNvbmZpZ3VyYXRpb24gZnJvbSBhIG5hdHVyYWwgbGFuZ3VhZ2UgZGVzY3JpcHRpb24uXG4gKiBVc2VzIHRlbXBsYXRlLWJhc2VkIGdlbmVyYXRpb24gKG5vIExMTSByZXF1aXJlZCkuXG4gKiBGb3IgTExNLWJhc2VkIGdlbmVyYXRpb24sIHVzZSBgYnVpbGRMbG1Qcm9tcHQoKWAgYW5kIHBhc3MgdG8geW91ciBMTE0uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUZvcm1Gcm9tRGVzY3JpcHRpb24ocHJvbXB0OiBGb3JtR2VuZXJhdGlvblByb21wdCk6IEdlbmVyYXRlZEZvcm1Db25maWcge1xuICBjb25zdCBjYXRlZ29yeSA9IHByb21wdC5jYXRlZ29yeSA/PyBkZXRlY3RGb3JtVHlwZShwcm9tcHQuZGVzY3JpcHRpb24pXG4gIGNvbnN0IHRlbXBsYXRlcyA9IEZJRUxEX1RFTVBMQVRFU1tjYXRlZ29yeV0gPz8gRklFTERfVEVNUExBVEVTLmNvbnRhY3QhXG4gIGNvbnN0IG1heEZpZWxkcyA9IHByb21wdC5tYXhGaWVsZHMgPz8gdGVtcGxhdGVzLmxlbmd0aFxuXG4gIGNvbnN0IGZpZWxkczogRm9ybUZpZWxkW10gPSB0ZW1wbGF0ZXMuc2xpY2UoMCwgbWF4RmllbGRzKS5tYXAoKHQsIGkpID0+ICh7XG4gICAgaWQ6IGBmaWVsZF8ke3Qua2V5fWAsXG4gICAgdmVyc2lvbklkOiAndjEnLFxuICAgIGtleTogdC5rZXksXG4gICAgbGFiZWw6IHQubGFiZWwsXG4gICAgdHlwZTogdC50eXBlLFxuICAgIHJlcXVpcmVkOiB0LnJlcXVpcmVkLFxuICAgIG9yZGVyOiBpLFxuICAgIGNvbmZpZzogdC5jb25maWcgPz8ge30sXG4gICAgc3RlcElkOiBwcm9tcHQubXVsdGlTdGVwID8gYHN0ZXBfJHtNYXRoLmZsb29yKGkgLyA0KSArIDF9YCA6IHVuZGVmaW5lZCxcbiAgfSkpXG5cbiAgY29uc3Qgc3RlcHM6IEZvcm1TdGVwW10gPSBbXVxuICBpZiAocHJvbXB0Lm11bHRpU3RlcCkge1xuICAgIGNvbnN0IHN0ZXBDb3VudCA9IE1hdGguY2VpbChmaWVsZHMubGVuZ3RoIC8gNClcbiAgICBjb25zdCBzdGVwVGl0bGVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXT4gPSB7XG4gICAgICBjb250YWN0OiBbJ0NvbnRhY3QgSW5mb3JtYXRpb24nLCAnTWVzc2FnZSBEZXRhaWxzJ10sXG4gICAgICByZWdpc3RyYXRpb246IFsnQWNjb3VudCBEZXRhaWxzJywgJ1BlcnNvbmFsIEluZm8nLCAnQ29uZmlybWF0aW9uJ10sXG4gICAgICBvbmJvYXJkaW5nOiBbJ1BlcnNvbmFsIEluZm9ybWF0aW9uJywgJ1dvcmsgRGV0YWlscycsICdFbWVyZ2VuY3kgJiBEb2N1bWVudHMnXSxcbiAgICAgIHN1cnZleTogWydSYXRpbmcnLCAnRmVlZGJhY2sgRGV0YWlscyddLFxuICAgICAgc3VwcG9ydDogWydJc3N1ZSBEZXRhaWxzJywgJ0Rlc2NyaXB0aW9uICYgRXZpZGVuY2UnXSxcbiAgICB9XG4gICAgY29uc3QgdGl0bGVzID0gc3RlcFRpdGxlc1tjYXRlZ29yeV0gPz8gQXJyYXkuZnJvbSh7IGxlbmd0aDogc3RlcENvdW50IH0sIChfLCBpKSA9PiBgU3RlcCAke2kgKyAxfWApXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdGVwQ291bnQ7IGkrKykge1xuICAgICAgc3RlcHMucHVzaCh7XG4gICAgICAgIGlkOiBgc3RlcF8ke2kgKyAxfWAsXG4gICAgICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICAgICAgdGl0bGU6IHRpdGxlc1tpXSA/PyBgU3RlcCAke2kgKyAxfWAsXG4gICAgICAgIG9yZGVyOiBpLFxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICAvLyBFeHRyYWN0IHRpdGxlIGZyb20gZGVzY3JpcHRpb25cbiAgY29uc3QgdGl0bGUgPSBwcm9tcHQuZGVzY3JpcHRpb24ubGVuZ3RoID4gNjBcbiAgICA/IHByb21wdC5kZXNjcmlwdGlvbi5zbGljZSgwLCA1NykgKyAnLi4uJ1xuICAgIDogcHJvbXB0LmRlc2NyaXB0aW9uXG5cbiAgcmV0dXJuIHtcbiAgICB0aXRsZTogdGl0bGUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB0aXRsZS5zbGljZSgxKSxcbiAgICBkZXNjcmlwdGlvbjogcHJvbXB0LmRlc2NyaXB0aW9uLFxuICAgIGZpZWxkcyxcbiAgICBzdGVwcyxcbiAgICBjYXRlZ29yeSxcbiAgfVxufVxuXG4vLyDilIDilIDilIAgVmFsaWRhdGlvbiBTdWdnZXN0aW9ucyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuY29uc3QgVkFMSURBVElPTl9SVUxFUzogUmVjb3JkPHN0cmluZywgQXJyYXk8eyBydWxlOiBzdHJpbmc7IGRlc2NyaXB0aW9uOiBzdHJpbmc7IHByaW9yaXR5OiAnaGlnaCcgfCAnbWVkaXVtJyB8ICdsb3cnIH0+PiA9IHtcbiAgRU1BSUw6IFtcbiAgICB7IHJ1bGU6ICdmb3JtYXQ6ZW1haWwnLCBkZXNjcmlwdGlvbjogJ1ZhbGlkYXRlIGVtYWlsIGZvcm1hdCcsIHByaW9yaXR5OiAnaGlnaCcgfSxcbiAgICB7IHJ1bGU6ICdhc3luYzp1bmlxdWUnLCBkZXNjcmlwdGlvbjogJ0NoZWNrIGVtYWlsIHVuaXF1ZW5lc3MgdmlhIEFQSScsIHByaW9yaXR5OiAnbWVkaXVtJyB9LFxuICBdLFxuICBQSE9ORTogW1xuICAgIHsgcnVsZTogJ2Zvcm1hdDpwaG9uZScsIGRlc2NyaXB0aW9uOiAnVmFsaWRhdGUgcGhvbmUgbnVtYmVyIGZvcm1hdCcsIHByaW9yaXR5OiAnaGlnaCcgfSxcbiAgICB7IHJ1bGU6ICdtaW5MZW5ndGg6MTAnLCBkZXNjcmlwdGlvbjogJ01pbmltdW0gMTAgZGlnaXRzJywgcHJpb3JpdHk6ICdtZWRpdW0nIH0sXG4gIF0sXG4gIFBBU1NXT1JEOiBbXG4gICAgeyBydWxlOiAnbWluTGVuZ3RoOjgnLCBkZXNjcmlwdGlvbjogJ01pbmltdW0gOCBjaGFyYWN0ZXJzJywgcHJpb3JpdHk6ICdoaWdoJyB9LFxuICAgIHsgcnVsZTogJ3BhdHRlcm46dXBwZXJjYXNlJywgZGVzY3JpcHRpb246ICdSZXF1aXJlIGF0IGxlYXN0IG9uZSB1cHBlcmNhc2UgbGV0dGVyJywgcHJpb3JpdHk6ICdtZWRpdW0nIH0sXG4gICAgeyBydWxlOiAncGF0dGVybjpudW1iZXInLCBkZXNjcmlwdGlvbjogJ1JlcXVpcmUgYXQgbGVhc3Qgb25lIG51bWJlcicsIHByaW9yaXR5OiAnbWVkaXVtJyB9LFxuICAgIHsgcnVsZTogJ3BhdHRlcm46c3BlY2lhbCcsIGRlc2NyaXB0aW9uOiAnUmVxdWlyZSBhdCBsZWFzdCBvbmUgc3BlY2lhbCBjaGFyYWN0ZXInLCBwcmlvcml0eTogJ2xvdycgfSxcbiAgXSxcbiAgVVJMOiBbXG4gICAgeyBydWxlOiAnZm9ybWF0OnVybCcsIGRlc2NyaXB0aW9uOiAnVmFsaWRhdGUgVVJMIGZvcm1hdCcsIHByaW9yaXR5OiAnaGlnaCcgfSxcbiAgXSxcbiAgTlVNQkVSOiBbXG4gICAgeyBydWxlOiAnbWluOjAnLCBkZXNjcmlwdGlvbjogJ0Vuc3VyZSBub24tbmVnYXRpdmUgdmFsdWUnLCBwcmlvcml0eTogJ21lZGl1bScgfSxcbiAgXSxcbiAgREFURTogW1xuICAgIHsgcnVsZTogJ21pbjp0b2RheScsIGRlc2NyaXB0aW9uOiAnTXVzdCBiZSB0b2RheSBvciBpbiB0aGUgZnV0dXJlJywgcHJpb3JpdHk6ICdsb3cnIH0sXG4gIF0sXG4gIEZJTEVfVVBMT0FEOiBbXG4gICAgeyBydWxlOiAnbWF4U2l6ZToxME1CJywgZGVzY3JpcHRpb246ICdMaW1pdCBmaWxlIHNpemUgdG8gMTBNQicsIHByaW9yaXR5OiAnaGlnaCcgfSxcbiAgICB7IHJ1bGU6ICdhbGxvd2VkVHlwZXMnLCBkZXNjcmlwdGlvbjogJ1Jlc3RyaWN0IGFsbG93ZWQgZmlsZSB0eXBlcycsIHByaW9yaXR5OiAnaGlnaCcgfSxcbiAgXSxcbn1cblxuLyoqXG4gKiBTdWdnZXN0IHZhbGlkYXRpb24gcnVsZXMgYmFzZWQgb24gZmllbGQgdHlwZXMgYW5kIGxhYmVscy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN1Z2dlc3RWYWxpZGF0aW9uUnVsZXMoZmllbGRzOiBGb3JtRmllbGRbXSk6IFZhbGlkYXRpb25TdWdnZXN0aW9uW10ge1xuICBjb25zdCBzdWdnZXN0aW9uczogVmFsaWRhdGlvblN1Z2dlc3Rpb25bXSA9IFtdXG5cbiAgZm9yIChjb25zdCBmaWVsZCBvZiBmaWVsZHMpIHtcbiAgICBjb25zdCBydWxlcyA9IFZBTElEQVRJT05fUlVMRVNbZmllbGQudHlwZV1cbiAgICBpZiAocnVsZXMpIHtcbiAgICAgIGZvciAoY29uc3QgcnVsZSBvZiBydWxlcykge1xuICAgICAgICBzdWdnZXN0aW9ucy5wdXNoKHtcbiAgICAgICAgICBmaWVsZEtleTogZmllbGQua2V5LFxuICAgICAgICAgIGZpZWxkTGFiZWw6IGZpZWxkLmxhYmVsLFxuICAgICAgICAgIHJ1bGU6IHJ1bGUucnVsZSxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogcnVsZS5kZXNjcmlwdGlvbixcbiAgICAgICAgICBwcmlvcml0eTogcnVsZS5wcmlvcml0eSxcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBMYWJlbC1iYXNlZCBzdWdnZXN0aW9uc1xuICAgIGNvbnN0IGxvd2VyID0gZmllbGQubGFiZWwudG9Mb3dlckNhc2UoKVxuICAgIGlmIChsb3dlci5pbmNsdWRlcygnYWdlJykgJiYgZmllbGQudHlwZSA9PT0gJ05VTUJFUicpIHtcbiAgICAgIHN1Z2dlc3Rpb25zLnB1c2goeyBmaWVsZEtleTogZmllbGQua2V5LCBmaWVsZExhYmVsOiBmaWVsZC5sYWJlbCwgcnVsZTogJ3JhbmdlOjAtMTUwJywgZGVzY3JpcHRpb246ICdWYWxpZCBhZ2UgcmFuZ2UgKDAtMTUwKScsIHByaW9yaXR5OiAnbWVkaXVtJyB9KVxuICAgIH1cbiAgICBpZiAobG93ZXIuaW5jbHVkZXMoJ3ppcCcpIHx8IGxvd2VyLmluY2x1ZGVzKCdwb3N0YWwnKSkge1xuICAgICAgc3VnZ2VzdGlvbnMucHVzaCh7IGZpZWxkS2V5OiBmaWVsZC5rZXksIGZpZWxkTGFiZWw6IGZpZWxkLmxhYmVsLCBydWxlOiAncGF0dGVybjp6aXAnLCBkZXNjcmlwdGlvbjogJ1ZhbGlkYXRlIFpJUC9wb3N0YWwgY29kZSBmb3JtYXQnLCBwcmlvcml0eTogJ21lZGl1bScgfSlcbiAgICB9XG4gICAgaWYgKGxvd2VyLmluY2x1ZGVzKCdjb25maXJtJykgJiYgKGxvd2VyLmluY2x1ZGVzKCdlbWFpbCcpIHx8IGxvd2VyLmluY2x1ZGVzKCdwYXNzd29yZCcpKSkge1xuICAgICAgc3VnZ2VzdGlvbnMucHVzaCh7IGZpZWxkS2V5OiBmaWVsZC5rZXksIGZpZWxkTGFiZWw6IGZpZWxkLmxhYmVsLCBydWxlOiAnbWF0Y2g6b3JpZ2luYWwnLCBkZXNjcmlwdGlvbjogJ011c3QgbWF0Y2ggdGhlIG9yaWdpbmFsIGZpZWxkJywgcHJpb3JpdHk6ICdoaWdoJyB9KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzdWdnZXN0aW9ucy5zb3J0KChhLCBiKSA9PiB7XG4gICAgY29uc3QgcCA9IHsgaGlnaDogMCwgbWVkaXVtOiAxLCBsb3c6IDIgfVxuICAgIHJldHVybiBwW2EucHJpb3JpdHldIC0gcFtiLnByaW9yaXR5XVxuICB9KVxufVxuXG4vLyDilIDilIDilIAgU21hcnQgRmllbGQgU3VnZ2VzdGlvbnMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmNvbnN0IEZJRUxEX1NVR0dFU1RJT05TX0JZX1RZUEU6IFJlY29yZDxzdHJpbmcsIEZpZWxkU3VnZ2VzdGlvbltdPiA9IHtcbiAgY29udGFjdDogW1xuICAgIHsgdHlwZTogJ1NIT1JUX1RFWFQnLCBrZXk6ICdjb21wYW55JywgbGFiZWw6ICdDb21wYW55IE5hbWUnLCBkZXNjcmlwdGlvbjogJ09yZ2FuaXphdGlvbiBuYW1lJywgcmVxdWlyZWQ6IGZhbHNlLCByZWFzb246ICdDb21tb24gZm9yIGJ1c2luZXNzIGNvbnRhY3RzJywgY2F0ZWdvcnk6ICdjb250YWN0JyB9LFxuICAgIHsgdHlwZTogJ1NFTEVDVCcsIGtleTogJ3ByZWZlcnJlZF9jb250YWN0JywgbGFiZWw6ICdQcmVmZXJyZWQgQ29udGFjdCBNZXRob2QnLCBkZXNjcmlwdGlvbjogJycsIHJlcXVpcmVkOiBmYWxzZSwgcmVhc29uOiAnSGVscHMgcHJpb3JpdGl6ZSBmb2xsb3ctdXAnLCBjYXRlZ29yeTogJ2NvbnRhY3QnIH0sXG4gIF0sXG4gIG9uYm9hcmRpbmc6IFtcbiAgICB7IHR5cGU6ICdTSE9SVF9URVhUJywga2V5OiAnZGlldGFyeV9yZXN0cmljdGlvbnMnLCBsYWJlbDogJ0RpZXRhcnkgUmVzdHJpY3Rpb25zJywgZGVzY3JpcHRpb246ICdGb3Igb2ZmaWNlIGV2ZW50cycsIHJlcXVpcmVkOiBmYWxzZSwgcmVhc29uOiAnVXNlZnVsIGZvciBvZmZpY2UgcGxhbm5pbmcnLCBjYXRlZ29yeTogJ3BlcnNvbmFsJyB9LFxuICAgIHsgdHlwZTogJ1NFTEVDVCcsIGtleTogJ3RzaGlydF9zaXplJywgbGFiZWw6ICdULVNoaXJ0IFNpemUnLCBkZXNjcmlwdGlvbjogJ0ZvciBjb21wYW55IHN3YWcnLCByZXF1aXJlZDogZmFsc2UsIHJlYXNvbjogJ0NvbW1vbiBvbmJvYXJkaW5nIGZpZWxkJywgY2F0ZWdvcnk6ICdwZXJzb25hbCcgfSxcbiAgICB7IHR5cGU6ICdTSE9SVF9URVhUJywga2V5OiAncHJlZmVycmVkX25hbWUnLCBsYWJlbDogJ1ByZWZlcnJlZCBOYW1lJywgZGVzY3JpcHRpb246ICdXaGF0IHNob3VsZCB3ZSBjYWxsIHlvdT8nLCByZXF1aXJlZDogZmFsc2UsIHJlYXNvbjogJ0luY2x1c2l2ZSBvbmJvYXJkaW5nIHByYWN0aWNlJywgY2F0ZWdvcnk6ICdwZXJzb25hbCcgfSxcbiAgICB7IHR5cGU6ICdTRUxFQ1QnLCBrZXk6ICdwcm9ub3VucycsIGxhYmVsOiAnUHJvbm91bnMnLCBkZXNjcmlwdGlvbjogJycsIHJlcXVpcmVkOiBmYWxzZSwgcmVhc29uOiAnSW5jbHVzaXZlIG9uYm9hcmRpbmcgcHJhY3RpY2UnLCBjYXRlZ29yeTogJ3BlcnNvbmFsJyB9LFxuICAgIHsgdHlwZTogJ1NIT1JUX1RFWFQnLCBrZXk6ICdiYW5rX2FjY291bnQnLCBsYWJlbDogJ0JhbmsgQWNjb3VudCBOdW1iZXInLCBkZXNjcmlwdGlvbjogJ0ZvciBwYXlyb2xsJywgcmVxdWlyZWQ6IHRydWUsIHJlYXNvbjogJ1JlcXVpcmVkIGZvciBwYXlyb2xsIHNldHVwJywgY2F0ZWdvcnk6ICdmaW5hbmNpYWwnIH0sXG4gICAgeyB0eXBlOiAnU0hPUlRfVEVYVCcsIGtleTogJ3RheF9pZCcsIGxhYmVsOiAnVGF4IElEIC8gU1NOJywgZGVzY3JpcHRpb246ICcnLCByZXF1aXJlZDogdHJ1ZSwgcmVhc29uOiAnUmVxdWlyZWQgZm9yIHRheCBkb2N1bWVudGF0aW9uJywgY2F0ZWdvcnk6ICdmaW5hbmNpYWwnIH0sXG4gIF0sXG4gIHN1cnZleTogW1xuICAgIHsgdHlwZTogJ0xPTkdfVEVYVCcsIGtleTogJ2FkZGl0aW9uYWxfY29tbWVudHMnLCBsYWJlbDogJ0FkZGl0aW9uYWwgQ29tbWVudHMnLCBkZXNjcmlwdGlvbjogJ0FueSBvdGhlciB0aG91Z2h0cz8nLCByZXF1aXJlZDogZmFsc2UsIHJlYXNvbjogJ0NhcHR1cmVzIG9wZW4tZW5kZWQgZmVlZGJhY2snLCBjYXRlZ29yeTogJ2ZlZWRiYWNrJyB9LFxuICAgIHsgdHlwZTogJ0RBVEUnLCBrZXk6ICdsYXN0X2ludGVyYWN0aW9uJywgbGFiZWw6ICdMYXN0IEludGVyYWN0aW9uIERhdGUnLCBkZXNjcmlwdGlvbjogJycsIHJlcXVpcmVkOiBmYWxzZSwgcmVhc29uOiAnUHJvdmlkZXMgY29udGV4dCBmb3IgZmVlZGJhY2snLCBjYXRlZ29yeTogJ2NvbnRleHQnIH0sXG4gIF0sXG4gIHJlZ2lzdHJhdGlvbjogW1xuICAgIHsgdHlwZTogJ1BIT05FJywga2V5OiAncGhvbmUnLCBsYWJlbDogJ1Bob25lIE51bWJlcicsIGRlc2NyaXB0aW9uOiAnJywgcmVxdWlyZWQ6IGZhbHNlLCByZWFzb246ICdBbHRlcm5hdGl2ZSBjb250YWN0IG1ldGhvZCcsIGNhdGVnb3J5OiAnY29udGFjdCcgfSxcbiAgICB7IHR5cGU6ICdTRUxFQ1QnLCBrZXk6ICdob3dfaGVhcmQnLCBsYWJlbDogJ0hvdyBkaWQgeW91IGhlYXIgYWJvdXQgdXM/JywgZGVzY3JpcHRpb246ICcnLCByZXF1aXJlZDogZmFsc2UsIHJlYXNvbjogJ01hcmtldGluZyBhdHRyaWJ1dGlvbicsIGNhdGVnb3J5OiAnbWFya2V0aW5nJyB9LFxuICAgIHsgdHlwZTogJ0NIRUNLQk9YJywga2V5OiAnbmV3c2xldHRlcicsIGxhYmVsOiAnU3Vic2NyaWJlIHRvIG5ld3NsZXR0ZXInLCBkZXNjcmlwdGlvbjogJycsIHJlcXVpcmVkOiBmYWxzZSwgcmVhc29uOiAnTWFya2V0aW5nIG9wdC1pbicsIGNhdGVnb3J5OiAnbWFya2V0aW5nJyB9LFxuICBdLFxufVxuXG4vKipcbiAqIFN1Z2dlc3QgYWRkaXRpb25hbCBmaWVsZHMgYmFzZWQgb24gZXhpc3RpbmcgZm9ybSBmaWVsZHMgYW5kIGRldGVjdGVkIGZvcm0gdHlwZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN1Z2dlc3RBZGRpdGlvbmFsRmllbGRzKGZpZWxkczogRm9ybUZpZWxkW10sIGZvcm1UeXBlPzogc3RyaW5nKTogRmllbGRTdWdnZXN0aW9uW10ge1xuICBjb25zdCB0eXBlID0gZm9ybVR5cGUgPz8gZGV0ZWN0Rm9ybVR5cGUoZmllbGRzLm1hcChmID0+IGYubGFiZWwpLmpvaW4oJyAnKSlcbiAgY29uc3QgZXhpc3RpbmdLZXlzID0gbmV3IFNldChmaWVsZHMubWFwKGYgPT4gZi5rZXkpKVxuXG4gIGNvbnN0IHN1Z2dlc3Rpb25zID0gRklFTERfU1VHR0VTVElPTlNfQllfVFlQRVt0eXBlXSA/PyBbXVxuICByZXR1cm4gc3VnZ2VzdGlvbnMuZmlsdGVyKHMgPT4gIWV4aXN0aW5nS2V5cy5oYXMocy5rZXkpKVxufVxuXG4vKipcbiAqIEdyb3VwIGZpZWxkIHN1Z2dlc3Rpb25zIGJ5IGNhdGVnb3J5IGZvciBkaXNwbGF5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ3JvdXBTdWdnZXN0aW9uc0J5Q2F0ZWdvcnkoc3VnZ2VzdGlvbnM6IEZpZWxkU3VnZ2VzdGlvbltdKTogUmVjb3JkPHN0cmluZywgRmllbGRTdWdnZXN0aW9uW10+IHtcbiAgY29uc3QgZ3JvdXBlZDogUmVjb3JkPHN0cmluZywgRmllbGRTdWdnZXN0aW9uW10+ID0ge31cbiAgZm9yIChjb25zdCBzIG9mIHN1Z2dlc3Rpb25zKSB7XG4gICAgaWYgKCFncm91cGVkW3MuY2F0ZWdvcnldKSBncm91cGVkW3MuY2F0ZWdvcnldID0gW11cbiAgICBncm91cGVkW3MuY2F0ZWdvcnldLnB1c2gocylcbiAgfVxuICByZXR1cm4gZ3JvdXBlZFxufVxuIl19