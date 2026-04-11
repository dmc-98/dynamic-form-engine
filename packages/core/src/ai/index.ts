// ─── AI Integration & Assistants ──────────────────────────────────────────────

// Form Generation
export {
  generateFormFromDescription,
  buildLlmPrompt,
  type FormGenerationPrompt,
  type GeneratedFormConfig,
} from './form-generator'

// Validation Rule Suggestions
export {
  suggestValidationRules,
  type ValidationSuggestion,
} from './validation-suggester'

// Field Suggestions
export {
  suggestAdditionalFields,
  detectFormType,
  groupSuggestionsByCategory,
  type FieldSuggestion,
} from './field-suggester'
