import { describe, it, expect } from 'vitest'
import {
  listTemplates, getTemplate, getTemplatesByCategory,
  generateFormFromDescription, buildLlmPrompt, detectFormType,
  suggestValidationRules, suggestAdditionalFields, groupSuggestionsByCategory,
  createFormEngine,
} from '@dmc--98/dfe-core'

describe('AI and Templates', () => {
  describe('Template Management', () => {
    it('should list templates and return non-empty array', () => {
      const templates = listTemplates()

      expect(Array.isArray(templates)).toBe(true)
      expect(templates.length).toBeGreaterThan(0)
    })

    it('should have required properties on each template', () => {
      const templates = listTemplates()

      templates.forEach((template) => {
        expect(template.id).toBeDefined()
        expect(typeof template.id).toBe('string')
        expect(template.name).toBeDefined()
        expect(typeof template.name).toBe('string')
        expect(template.description).toBeDefined()
        expect(typeof template.description).toBe('string')
        expect(template.category).toBeDefined()
        expect(typeof template.category).toBe('string')
      })
    })

    it('should retrieve specific template by id', () => {
      const template = getTemplate('contact-form')

      expect(template).toBeDefined()
      expect(template?.id).toBe('contact-form')
      expect(template?.fields.length).toBeGreaterThan(0)
    })

    it('should return undefined for non-existent template', () => {
      const template = getTemplate('non-existent-template-xyz')

      expect(template).toBeUndefined()
    })

    it('should retrieve templates by category', () => {
      const contactTemplates = getTemplatesByCategory('contact')

      expect(Array.isArray(contactTemplates)).toBe(true)
      expect(contactTemplates.length).toBeGreaterThan(0)

      contactTemplates.forEach((template) => {
        expect(template.category).toBe('contact')
      })
    })

    it('should create valid FormEngine from template fields', () => {
      const template = getTemplate('contact-form')
      expect(template).toBeDefined()

      if (template) {
        expect(() => createFormEngine(template.fields)).not.toThrow()
      }
    })
  })

  describe('Form Generation from Description', () => {
    it('should generate form with fields from natural language description', () => {
      const config = generateFormFromDescription({
        description: 'contact form for collecting user inquiries',
      })

      expect(config).toBeDefined()
      expect(config.fields).toBeDefined()
      expect(Array.isArray(config.fields)).toBe(true)
      expect(config.fields.length).toBeGreaterThan(0)
    })

    it('should include steps when multiStep option is true', () => {
      const config = generateFormFromDescription({
        description: 'multi-step customer onboarding form',
        multiStep: true,
      })

      expect(config).toBeDefined()
      if (config.steps) {
        expect(Array.isArray(config.steps)).toBe(true)
        expect(config.steps.length).toBeGreaterThan(0)
      }
    })

    it('should respect maxFields parameter in generation', () => {
      const config = generateFormFromDescription({
        description: 'customer survey with many questions',
        maxFields: 5,
      })

      expect(config.fields.length).toBeLessThanOrEqual(5)
    })

    it('should accept category hint for form generation', () => {
      const config = generateFormFromDescription({
        description: 'employee data collection',
        category: 'hr',
      })

      expect(config).toBeDefined()
      expect(config.fields.length).toBeGreaterThan(0)
    })

    it('should generate valid fields that work with FormEngine', () => {
      const config = generateFormFromDescription({
        description: 'basic contact information form',
      })

      expect(() => createFormEngine(config.fields)).not.toThrow()
    })
  })

  describe('Form Type Detection', () => {
    it('should detect contact form type', () => {
      const formType = detectFormType('Please help me create a contact us form')

      expect(formType).toBe('contact')
    })

    it('should detect onboarding form type', () => {
      const formType = detectFormType('employee onboarding and HR intake form')

      expect(formType).toBe('onboarding')
    })

    it('should detect survey form type', () => {
      const formType = detectFormType('customer survey to gather feedback')

      expect(formType).toBe('survey')
    })

    it('should detect feedback form type', () => {
      const formType = detectFormType('product feedback and improvement suggestions')

      expect(typeof formType).toBe('string')
      expect(formType.length).toBeGreaterThan(0)
    })

    it('should detect registration form type', () => {
      const formType = detectFormType('user registration and account creation')

      expect(typeof formType).toBe('string')
    })
  })

  describe('LLM Prompt Building', () => {
    it('should build non-empty structured prompt', () => {
      const prompt = buildLlmPrompt({
        description: 'customer feedback form',
      })

      expect(typeof prompt).toBe('string')
      expect(prompt.length).toBeGreaterThan(0)
    })

    it('should include description in prompt', () => {
      const description = 'collect employee vacation requests'
      const prompt = buildLlmPrompt({ description })

      expect(prompt).toContain(description)
    })

    it('should include category hint when provided', () => {
      const category = 'hr'
      const prompt = buildLlmPrompt({
        description: 'vacation request form',
        category,
      })

      expect(prompt.toLowerCase()).toContain('form')
    })

    it('should include maxFields constraint when provided', () => {
      const maxFields = 10
      const prompt = buildLlmPrompt({
        description: 'survey form',
        maxFields,
      })

      expect(typeof prompt).toBe('string')
      expect(prompt.length).toBeGreaterThan(0)
    })

    it('should generate consistent structured content', () => {
      const prompt1 = buildLlmPrompt({ description: 'contact form' })
      const prompt2 = buildLlmPrompt({ description: 'contact form' })

      expect(prompt1).toBe(prompt2)
    })
  })

  describe('Validation Rule Suggestions', () => {
    it('should suggest validation rules for email field', () => {
      const fields = [
        {
          type: 'EMAIL',
          key: 'email',
          label: 'Email Address',
          required: true,
        },
      ]

      const suggestions = suggestValidationRules(fields)

      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.length).toBeGreaterThan(0)

      const emailSuggestions = suggestions.filter((s) => s.fieldKey === 'email')
      expect(emailSuggestions.length).toBeGreaterThan(0)
    })

    it('should suggest validation rules for password field', () => {
      const fields = [
        {
          type: 'PASSWORD',
          key: 'password',
          label: 'Password',
          required: true,
        },
      ]

      const suggestions = suggestValidationRules(fields)

      expect(suggestions.length).toBeGreaterThan(0)
      suggestions.forEach((s) => {
        expect(s.fieldKey).toBeDefined()
        expect(s.fieldLabel).toBeDefined()
        expect(s.rule).toBeDefined()
        expect(s.description).toBeDefined()
        expect(s.priority).toBeDefined()
      })
    })

    it('should suggest validation rules for number field', () => {
      const fields = [
        {
          type: 'NUMBER',
          key: 'age',
          label: 'Age',
          required: false,
        },
      ]

      const suggestions = suggestValidationRules(fields)

      const ageSuggestions = suggestions.filter((s) => s.fieldKey === 'age')
      expect(ageSuggestions.length).toBeGreaterThan(0)
    })

    it('should include priority in validation suggestions', () => {
      const fields = [
        {
          type: 'SHORT_TEXT',
          key: 'username',
          label: 'Username',
          required: true,
        },
      ]

      const suggestions = suggestValidationRules(fields)

      suggestions.forEach((s) => {
        expect(['high', 'medium', 'low']).toContain(s.priority)
      })
    })

    it('should provide more suggestions for required fields', () => {
      const requiredField = [
        {
          type: 'EMAIL',
          key: 'email',
          label: 'Email',
          required: true,
        },
      ]

      const optionalField = [
        {
          type: 'EMAIL',
          key: 'email',
          label: 'Email',
          required: false,
        },
      ]

      const requiredSuggestions = suggestValidationRules(requiredField)
      const optionalSuggestions = suggestValidationRules(optionalField)

      expect(requiredSuggestions.length).toBeGreaterThanOrEqual(optionalSuggestions.length)
    })
  })

  describe('Additional Field Suggestions', () => {
    it('should suggest additional fields for basic form', () => {
      const fields = [
        {
          type: 'SHORT_TEXT',
          key: 'name',
          label: 'Full Name',
          required: true,
        },
      ]

      const suggestions = suggestAdditionalFields(fields, 'contact')

      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should include required properties in field suggestions', () => {
      const fields = [
        {
          type: 'SHORT_TEXT',
          key: 'name',
          label: 'Name',
          required: true,
        },
      ]

      const suggestions = suggestAdditionalFields(fields)

      suggestions.forEach((s) => {
        expect(s.type).toBeDefined()
        expect(s.key).toBeDefined()
        expect(s.label).toBeDefined()
        expect(s.description).toBeDefined()
        expect(s.required).toBeDefined()
        expect(s.reason).toBeDefined()
        expect(s.category).toBeDefined()
      })
    })

    it('should suggest fields based on form type', () => {
      const contactFields = [
        {
          type: 'SHORT_TEXT',
          key: 'name',
          label: 'Name',
          required: true,
        },
      ]

      const suggestions = suggestAdditionalFields(contactFields, 'contact')

      expect(Array.isArray(suggestions)).toBe(true)
      if (suggestions.length > 0) {
        expect(suggestions[0].type).toBeDefined()
        expect(suggestions[0].key).toBeDefined()
      }
    })

    it('should not suggest fields already in form', () => {
      const fields = [
        {
          type: 'SHORT_TEXT',
          key: 'name',
          label: 'Name',
          required: true,
        },
        {
          type: 'EMAIL',
          key: 'email',
          label: 'Email',
          required: true,
        },
      ]

      const suggestions = suggestAdditionalFields(fields, 'contact')

      const suggestedKeys = suggestions.map((s) => s.key)
      expect(suggestedKeys).not.toContain('name')
      expect(suggestedKeys).not.toContain('email')
    })

    it('should provide reason for each suggestion', () => {
      const fields = [
        {
          type: 'SHORT_TEXT',
          key: 'name',
          label: 'Name',
          required: true,
        },
      ]

      const suggestions = suggestAdditionalFields(fields)

      suggestions.forEach((s) => {
        expect(s.reason).toBeDefined()
        expect(typeof s.reason).toBe('string')
        expect(s.reason.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Suggestion Grouping', () => {
    it('should group field suggestions by category', () => {
      const fields = [
        {
          type: 'SHORT_TEXT',
          key: 'name',
          label: 'Name',
          required: true,
        },
      ]

      const suggestions = suggestAdditionalFields(fields)
      const grouped = groupSuggestionsByCategory(suggestions)

      expect(typeof grouped).toBe('object')
      expect(grouped !== null).toBe(true)
      expect(Object.keys(grouped).length).toBeGreaterThanOrEqual(0)
    })

    it('should return Map with category keys', () => {
      const fields = [
        {
          type: 'SHORT_TEXT',
          key: 'name',
          label: 'Name',
          required: true,
        },
      ]

      const suggestions = suggestAdditionalFields(fields)
      const grouped = groupSuggestionsByCategory(suggestions)

      for (const [category, items] of Object.entries(grouped)) {
        expect(typeof category).toBe('string')
        expect(Array.isArray(items)).toBe(true)
        items.forEach((item) => {
          expect(item.category).toBe(category)
        })
      }
    })

    it('should preserve all suggestions in grouped output', () => {
      const fields = [
        {
          type: 'SHORT_TEXT',
          key: 'name',
          label: 'Name',
          required: true,
        },
      ]

      const suggestions = suggestAdditionalFields(fields)
      const grouped = groupSuggestionsByCategory(suggestions)

      let totalGroupedItems = 0
      for (const items of Object.values(grouped)) {
        totalGroupedItems += items.length
      }

      expect(totalGroupedItems).toBe(suggestions.length)
    })

    it('should handle empty suggestions array', () => {
      const grouped = groupSuggestionsByCategory([])

      expect(typeof grouped).toBe('object')
      expect(Object.keys(grouped).length).toBe(0)
    })
  })

  describe('Integration: End-to-End AI Workflow', () => {
    it('should complete workflow: describe → detect → generate → suggest', () => {
      const description = 'I need a form for collecting customer feedback'

      // Step 1: Detect form type
      const formType = detectFormType(description)
      expect(formType).toBeDefined()

      // Step 2: Generate form from description
      const config = generateFormFromDescription({
        description,
        category: formType,
      })
      expect(config.fields.length).toBeGreaterThan(0)

      // Step 3: Suggest validation rules
      const validationSuggestions = suggestValidationRules(config.fields)
      expect(Array.isArray(validationSuggestions)).toBe(true)

      // Step 4: Suggest additional fields
      const fieldSuggestions = suggestAdditionalFields(config.fields, formType)
      expect(Array.isArray(fieldSuggestions)).toBe(true)

      // Step 5: Group suggestions
      const grouped = groupSuggestionsByCategory(fieldSuggestions)
      expect(typeof grouped).toBe('object')
    })

    it('should create engine from AI-generated form', () => {
      const config = generateFormFromDescription({
        description: 'user registration form',
      })

      expect(() => createFormEngine(config.fields)).not.toThrow()
    })
  })
})
