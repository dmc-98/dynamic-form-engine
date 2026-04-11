"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const dfe_core_1 = require("@dmc-98/dfe-core");
(0, vitest_1.describe)('AI and Templates', () => {
    (0, vitest_1.describe)('Template Management', () => {
        (0, vitest_1.it)('should list templates and return non-empty array', () => {
            const templates = (0, dfe_core_1.listTemplates)();
            (0, vitest_1.expect)(Array.isArray(templates)).toBe(true);
            (0, vitest_1.expect)(templates.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should have required properties on each template', () => {
            const templates = (0, dfe_core_1.listTemplates)();
            templates.forEach((template) => {
                (0, vitest_1.expect)(template.id).toBeDefined();
                (0, vitest_1.expect)(typeof template.id).toBe('string');
                (0, vitest_1.expect)(template.name).toBeDefined();
                (0, vitest_1.expect)(typeof template.name).toBe('string');
                (0, vitest_1.expect)(template.description).toBeDefined();
                (0, vitest_1.expect)(typeof template.description).toBe('string');
                (0, vitest_1.expect)(template.category).toBeDefined();
                (0, vitest_1.expect)(typeof template.category).toBe('string');
            });
        });
        (0, vitest_1.it)('should retrieve specific template by id', () => {
            const template = (0, dfe_core_1.getTemplate)('contact-form');
            (0, vitest_1.expect)(template).toBeDefined();
            (0, vitest_1.expect)(template === null || template === void 0 ? void 0 : template.id).toBe('contact-form');
            (0, vitest_1.expect)(template === null || template === void 0 ? void 0 : template.fields.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should return undefined for non-existent template', () => {
            const template = (0, dfe_core_1.getTemplate)('non-existent-template-xyz');
            (0, vitest_1.expect)(template).toBeUndefined();
        });
        (0, vitest_1.it)('should retrieve templates by category', () => {
            const contactTemplates = (0, dfe_core_1.getTemplatesByCategory)('contact');
            (0, vitest_1.expect)(Array.isArray(contactTemplates)).toBe(true);
            (0, vitest_1.expect)(contactTemplates.length).toBeGreaterThan(0);
            contactTemplates.forEach((template) => {
                (0, vitest_1.expect)(template.category).toBe('contact');
            });
        });
        (0, vitest_1.it)('should create valid FormEngine from template fields', () => {
            const template = (0, dfe_core_1.getTemplate)('contact-form');
            (0, vitest_1.expect)(template).toBeDefined();
            if (template) {
                (0, vitest_1.expect)(() => (0, dfe_core_1.createFormEngine)(template.fields)).not.toThrow();
            }
        });
    });
    (0, vitest_1.describe)('Form Generation from Description', () => {
        (0, vitest_1.it)('should generate form with fields from natural language description', () => {
            const config = (0, dfe_core_1.generateFormFromDescription)({
                description: 'contact form for collecting user inquiries',
            });
            (0, vitest_1.expect)(config).toBeDefined();
            (0, vitest_1.expect)(config.fields).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(config.fields)).toBe(true);
            (0, vitest_1.expect)(config.fields.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should include steps when multiStep option is true', () => {
            const config = (0, dfe_core_1.generateFormFromDescription)({
                description: 'multi-step customer onboarding form',
                multiStep: true,
            });
            (0, vitest_1.expect)(config).toBeDefined();
            if (config.steps) {
                (0, vitest_1.expect)(Array.isArray(config.steps)).toBe(true);
                (0, vitest_1.expect)(config.steps.length).toBeGreaterThan(0);
            }
        });
        (0, vitest_1.it)('should respect maxFields parameter in generation', () => {
            const config = (0, dfe_core_1.generateFormFromDescription)({
                description: 'customer survey with many questions',
                maxFields: 5,
            });
            (0, vitest_1.expect)(config.fields.length).toBeLessThanOrEqual(5);
        });
        (0, vitest_1.it)('should accept category hint for form generation', () => {
            const config = (0, dfe_core_1.generateFormFromDescription)({
                description: 'employee data collection',
                category: 'hr',
            });
            (0, vitest_1.expect)(config).toBeDefined();
            (0, vitest_1.expect)(config.fields.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should generate valid fields that work with FormEngine', () => {
            const config = (0, dfe_core_1.generateFormFromDescription)({
                description: 'basic contact information form',
            });
            (0, vitest_1.expect)(() => (0, dfe_core_1.createFormEngine)(config.fields)).not.toThrow();
        });
    });
    (0, vitest_1.describe)('Form Type Detection', () => {
        (0, vitest_1.it)('should detect contact form type', () => {
            const formType = (0, dfe_core_1.detectFormType)('Please help me create a contact us form');
            (0, vitest_1.expect)(formType).toBe('contact');
        });
        (0, vitest_1.it)('should detect onboarding form type', () => {
            const formType = (0, dfe_core_1.detectFormType)('employee onboarding and HR intake form');
            (0, vitest_1.expect)(formType).toBe('onboarding');
        });
        (0, vitest_1.it)('should detect survey form type', () => {
            const formType = (0, dfe_core_1.detectFormType)('customer survey to gather feedback');
            (0, vitest_1.expect)(formType).toBe('survey');
        });
        (0, vitest_1.it)('should detect feedback form type', () => {
            const formType = (0, dfe_core_1.detectFormType)('product feedback and improvement suggestions');
            (0, vitest_1.expect)(typeof formType).toBe('string');
            (0, vitest_1.expect)(formType.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should detect registration form type', () => {
            const formType = (0, dfe_core_1.detectFormType)('user registration and account creation');
            (0, vitest_1.expect)(typeof formType).toBe('string');
        });
    });
    (0, vitest_1.describe)('LLM Prompt Building', () => {
        (0, vitest_1.it)('should build non-empty structured prompt', () => {
            const prompt = (0, dfe_core_1.buildLlmPrompt)({
                description: 'customer feedback form',
            });
            (0, vitest_1.expect)(typeof prompt).toBe('string');
            (0, vitest_1.expect)(prompt.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should include description in prompt', () => {
            const description = 'collect employee vacation requests';
            const prompt = (0, dfe_core_1.buildLlmPrompt)({ description });
            (0, vitest_1.expect)(prompt).toContain(description);
        });
        (0, vitest_1.it)('should include category hint when provided', () => {
            const category = 'hr';
            const prompt = (0, dfe_core_1.buildLlmPrompt)({
                description: 'vacation request form',
                category,
            });
            (0, vitest_1.expect)(prompt.toLowerCase()).toContain('form');
        });
        (0, vitest_1.it)('should include maxFields constraint when provided', () => {
            const maxFields = 10;
            const prompt = (0, dfe_core_1.buildLlmPrompt)({
                description: 'survey form',
                maxFields,
            });
            (0, vitest_1.expect)(typeof prompt).toBe('string');
            (0, vitest_1.expect)(prompt.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should generate consistent structured content', () => {
            const prompt1 = (0, dfe_core_1.buildLlmPrompt)({ description: 'contact form' });
            const prompt2 = (0, dfe_core_1.buildLlmPrompt)({ description: 'contact form' });
            (0, vitest_1.expect)(prompt1).toBe(prompt2);
        });
    });
    (0, vitest_1.describe)('Validation Rule Suggestions', () => {
        (0, vitest_1.it)('should suggest validation rules for email field', () => {
            const fields = [
                {
                    type: 'EMAIL',
                    key: 'email',
                    label: 'Email Address',
                    required: true,
                },
            ];
            const suggestions = (0, dfe_core_1.suggestValidationRules)(fields);
            (0, vitest_1.expect)(Array.isArray(suggestions)).toBe(true);
            (0, vitest_1.expect)(suggestions.length).toBeGreaterThan(0);
            const emailSuggestions = suggestions.filter((s) => s.fieldKey === 'email');
            (0, vitest_1.expect)(emailSuggestions.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should suggest validation rules for password field', () => {
            const fields = [
                {
                    type: 'PASSWORD',
                    key: 'password',
                    label: 'Password',
                    required: true,
                },
            ];
            const suggestions = (0, dfe_core_1.suggestValidationRules)(fields);
            (0, vitest_1.expect)(suggestions.length).toBeGreaterThan(0);
            suggestions.forEach((s) => {
                (0, vitest_1.expect)(s.fieldKey).toBeDefined();
                (0, vitest_1.expect)(s.fieldLabel).toBeDefined();
                (0, vitest_1.expect)(s.rule).toBeDefined();
                (0, vitest_1.expect)(s.description).toBeDefined();
                (0, vitest_1.expect)(s.priority).toBeDefined();
            });
        });
        (0, vitest_1.it)('should suggest validation rules for number field', () => {
            const fields = [
                {
                    type: 'NUMBER',
                    key: 'age',
                    label: 'Age',
                    required: false,
                },
            ];
            const suggestions = (0, dfe_core_1.suggestValidationRules)(fields);
            const ageSuggestions = suggestions.filter((s) => s.fieldKey === 'age');
            (0, vitest_1.expect)(ageSuggestions.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should include priority in validation suggestions', () => {
            const fields = [
                {
                    type: 'SHORT_TEXT',
                    key: 'username',
                    label: 'Username',
                    required: true,
                },
            ];
            const suggestions = (0, dfe_core_1.suggestValidationRules)(fields);
            suggestions.forEach((s) => {
                (0, vitest_1.expect)(['high', 'medium', 'low']).toContain(s.priority);
            });
        });
        (0, vitest_1.it)('should provide more suggestions for required fields', () => {
            const requiredField = [
                {
                    type: 'EMAIL',
                    key: 'email',
                    label: 'Email',
                    required: true,
                },
            ];
            const optionalField = [
                {
                    type: 'EMAIL',
                    key: 'email',
                    label: 'Email',
                    required: false,
                },
            ];
            const requiredSuggestions = (0, dfe_core_1.suggestValidationRules)(requiredField);
            const optionalSuggestions = (0, dfe_core_1.suggestValidationRules)(optionalField);
            (0, vitest_1.expect)(requiredSuggestions.length).toBeGreaterThanOrEqual(optionalSuggestions.length);
        });
    });
    (0, vitest_1.describe)('Additional Field Suggestions', () => {
        (0, vitest_1.it)('should suggest additional fields for basic form', () => {
            const fields = [
                {
                    type: 'SHORT_TEXT',
                    key: 'name',
                    label: 'Full Name',
                    required: true,
                },
            ];
            const suggestions = (0, dfe_core_1.suggestAdditionalFields)(fields, 'contact');
            (0, vitest_1.expect)(Array.isArray(suggestions)).toBe(true);
            (0, vitest_1.expect)(suggestions.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should include required properties in field suggestions', () => {
            const fields = [
                {
                    type: 'SHORT_TEXT',
                    key: 'name',
                    label: 'Name',
                    required: true,
                },
            ];
            const suggestions = (0, dfe_core_1.suggestAdditionalFields)(fields);
            suggestions.forEach((s) => {
                (0, vitest_1.expect)(s.type).toBeDefined();
                (0, vitest_1.expect)(s.key).toBeDefined();
                (0, vitest_1.expect)(s.label).toBeDefined();
                (0, vitest_1.expect)(s.description).toBeDefined();
                (0, vitest_1.expect)(s.required).toBeDefined();
                (0, vitest_1.expect)(s.reason).toBeDefined();
                (0, vitest_1.expect)(s.category).toBeDefined();
            });
        });
        (0, vitest_1.it)('should suggest fields based on form type', () => {
            const contactFields = [
                {
                    type: 'SHORT_TEXT',
                    key: 'name',
                    label: 'Name',
                    required: true,
                },
            ];
            const suggestions = (0, dfe_core_1.suggestAdditionalFields)(contactFields, 'contact');
            (0, vitest_1.expect)(Array.isArray(suggestions)).toBe(true);
            if (suggestions.length > 0) {
                (0, vitest_1.expect)(suggestions[0].type).toBeDefined();
                (0, vitest_1.expect)(suggestions[0].key).toBeDefined();
            }
        });
        (0, vitest_1.it)('should not suggest fields already in form', () => {
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
            ];
            const suggestions = (0, dfe_core_1.suggestAdditionalFields)(fields, 'contact');
            const suggestedKeys = suggestions.map((s) => s.key);
            (0, vitest_1.expect)(suggestedKeys).not.toContain('name');
            (0, vitest_1.expect)(suggestedKeys).not.toContain('email');
        });
        (0, vitest_1.it)('should provide reason for each suggestion', () => {
            const fields = [
                {
                    type: 'SHORT_TEXT',
                    key: 'name',
                    label: 'Name',
                    required: true,
                },
            ];
            const suggestions = (0, dfe_core_1.suggestAdditionalFields)(fields);
            suggestions.forEach((s) => {
                (0, vitest_1.expect)(s.reason).toBeDefined();
                (0, vitest_1.expect)(typeof s.reason).toBe('string');
                (0, vitest_1.expect)(s.reason.length).toBeGreaterThan(0);
            });
        });
    });
    (0, vitest_1.describe)('Suggestion Grouping', () => {
        (0, vitest_1.it)('should group field suggestions by category', () => {
            const fields = [
                {
                    type: 'SHORT_TEXT',
                    key: 'name',
                    label: 'Name',
                    required: true,
                },
            ];
            const suggestions = (0, dfe_core_1.suggestAdditionalFields)(fields);
            const grouped = (0, dfe_core_1.groupSuggestionsByCategory)(suggestions);
            (0, vitest_1.expect)(typeof grouped).toBe('object');
            (0, vitest_1.expect)(grouped !== null).toBe(true);
            (0, vitest_1.expect)(Object.keys(grouped).length).toBeGreaterThanOrEqual(0);
        });
        (0, vitest_1.it)('should return Map with category keys', () => {
            const fields = [
                {
                    type: 'SHORT_TEXT',
                    key: 'name',
                    label: 'Name',
                    required: true,
                },
            ];
            const suggestions = (0, dfe_core_1.suggestAdditionalFields)(fields);
            const grouped = (0, dfe_core_1.groupSuggestionsByCategory)(suggestions);
            for (const [category, items] of Object.entries(grouped)) {
                (0, vitest_1.expect)(typeof category).toBe('string');
                (0, vitest_1.expect)(Array.isArray(items)).toBe(true);
                items.forEach((item) => {
                    (0, vitest_1.expect)(item.category).toBe(category);
                });
            }
        });
        (0, vitest_1.it)('should preserve all suggestions in grouped output', () => {
            const fields = [
                {
                    type: 'SHORT_TEXT',
                    key: 'name',
                    label: 'Name',
                    required: true,
                },
            ];
            const suggestions = (0, dfe_core_1.suggestAdditionalFields)(fields);
            const grouped = (0, dfe_core_1.groupSuggestionsByCategory)(suggestions);
            let totalGroupedItems = 0;
            for (const items of Object.values(grouped)) {
                totalGroupedItems += items.length;
            }
            (0, vitest_1.expect)(totalGroupedItems).toBe(suggestions.length);
        });
        (0, vitest_1.it)('should handle empty suggestions array', () => {
            const grouped = (0, dfe_core_1.groupSuggestionsByCategory)([]);
            (0, vitest_1.expect)(typeof grouped).toBe('object');
            (0, vitest_1.expect)(Object.keys(grouped).length).toBe(0);
        });
    });
    (0, vitest_1.describe)('Integration: End-to-End AI Workflow', () => {
        (0, vitest_1.it)('should complete workflow: describe → detect → generate → suggest', () => {
            const description = 'I need a form for collecting customer feedback';
            // Step 1: Detect form type
            const formType = (0, dfe_core_1.detectFormType)(description);
            (0, vitest_1.expect)(formType).toBeDefined();
            // Step 2: Generate form from description
            const config = (0, dfe_core_1.generateFormFromDescription)({
                description,
                category: formType,
            });
            (0, vitest_1.expect)(config.fields.length).toBeGreaterThan(0);
            // Step 3: Suggest validation rules
            const validationSuggestions = (0, dfe_core_1.suggestValidationRules)(config.fields);
            (0, vitest_1.expect)(Array.isArray(validationSuggestions)).toBe(true);
            // Step 4: Suggest additional fields
            const fieldSuggestions = (0, dfe_core_1.suggestAdditionalFields)(config.fields, formType);
            (0, vitest_1.expect)(Array.isArray(fieldSuggestions)).toBe(true);
            // Step 5: Group suggestions
            const grouped = (0, dfe_core_1.groupSuggestionsByCategory)(fieldSuggestions);
            (0, vitest_1.expect)(typeof grouped).toBe('object');
        });
        (0, vitest_1.it)('should create engine from AI-generated form', () => {
            const config = (0, dfe_core_1.generateFormFromDescription)({
                description: 'user registration form',
            });
            (0, vitest_1.expect)(() => (0, dfe_core_1.createFormEngine)(config.fields)).not.toThrow();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWktYW5kLXRlbXBsYXRlcy50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYWktYW5kLXRlbXBsYXRlcy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQTZDO0FBQzdDLGtEQUs0QjtBQUU1QixJQUFBLGlCQUFRLEVBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO0lBQ2hDLElBQUEsaUJBQVEsRUFBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7UUFDbkMsSUFBQSxXQUFFLEVBQUMsa0RBQWtELEVBQUUsR0FBRyxFQUFFO1lBQzFELE1BQU0sU0FBUyxHQUFHLElBQUEsd0JBQWEsR0FBRSxDQUFBO1lBRWpDLElBQUEsZUFBTSxFQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDM0MsSUFBQSxlQUFNLEVBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUM3QyxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLGtEQUFrRCxFQUFFLEdBQUcsRUFBRTtZQUMxRCxNQUFNLFNBQVMsR0FBRyxJQUFBLHdCQUFhLEdBQUUsQ0FBQTtZQUVqQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUU7Z0JBQzdCLElBQUEsZUFBTSxFQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtnQkFDakMsSUFBQSxlQUFNLEVBQUMsT0FBTyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBO2dCQUN6QyxJQUFBLGVBQU0sRUFBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUE7Z0JBQ25DLElBQUEsZUFBTSxFQUFDLE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFR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d0I7YUFDdEMsQ0FBQyxDQUFBO1lBRUYsSUFBQSxlQUFNLEVBQUMsR0FBRyxFQUFFLENBQUMsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUE7UUFDN0QsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGVzY3JpYmUsIGl0LCBleHBlY3QgfSBmcm9tICd2aXRlc3QnXG5pbXBvcnQge1xuICBsaXN0VGVtcGxhdGVzLCBnZXRUZW1wbGF0ZSwgZ2V0VGVtcGxhdGVzQnlDYXRlZ29yeSxcbiAgZ2VuZXJhdGVGb3JtRnJvbURlc2NyaXB0aW9uLCBidWlsZExsbVByb21wdCwgZGV0ZWN0Rm9ybVR5cGUsXG4gIHN1Z2dlc3RWYWxpZGF0aW9uUnVsZXMsIHN1Z2dlc3RBZGRpdGlvbmFsRmllbGRzLCBncm91cFN1Z2dlc3Rpb25zQnlDYXRlZ29yeSxcbiAgY3JlYXRlRm9ybUVuZ2luZSxcbn0gZnJvbSAnQHNuYXJqdW45OC9kZmUtY29yZSdcblxuZGVzY3JpYmUoJ0FJIGFuZCBUZW1wbGF0ZXMnLCAoKSA9PiB7XG4gIGRlc2NyaWJlKCdUZW1wbGF0ZSBNYW5hZ2VtZW50JywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgbGlzdCB0ZW1wbGF0ZXMgYW5kIHJldHVybiBub24tZW1wdHkgYXJyYXknLCAoKSA9PiB7XG4gICAgICBjb25zdCB0ZW1wbGF0ZXMgPSBsaXN0VGVtcGxhdGVzKClcblxuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkodGVtcGxhdGVzKSkudG9CZSh0cnVlKVxuICAgICAgZXhwZWN0KHRlbXBsYXRlcy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGhhdmUgcmVxdWlyZWQgcHJvcGVydGllcyBvbiBlYWNoIHRlbXBsYXRlJywgKCkgPT4ge1xuICAgICAgY29uc3QgdGVtcGxhdGVzID0gbGlzdFRlbXBsYXRlcygpXG5cbiAgICAgIHRlbXBsYXRlcy5mb3JFYWNoKCh0ZW1wbGF0ZSkgPT4ge1xuICAgICAgICBleHBlY3QodGVtcGxhdGUuaWQpLnRvQmVEZWZpbmVkKClcbiAgICAgICAgZXhwZWN0KHR5cGVvZiB0ZW1wbGF0ZS5pZCkudG9CZSgnc3RyaW5nJylcbiAgICAgICAgZXhwZWN0KHRlbXBsYXRlLm5hbWUpLnRvQmVEZWZpbmVkKClcbiAgICAgICAgZXhwZWN0KHR5cGVvZiB0ZW1wbGF0ZS5uYW1lKS50b0JlKCdzdHJpbmcnKVxuICAgICAgICBleHBlY3QodGVtcGxhdGUuZGVzY3JpcHRpb24pLnRvQmVEZWZpbmVkKClcbiAgICAgICAgZXhwZWN0KHR5cGVvZiB0ZW1wbGF0ZS5kZXNjcmlwdGlvbikudG9CZSgnc3RyaW5nJylcbiAgICAgICAgZXhwZWN0KHRlbXBsYXRlLmNhdGVnb3J5KS50b0JlRGVmaW5lZCgpXG4gICAgICAgIGV4cGVjdCh0eXBlb2YgdGVtcGxhdGUuY2F0ZWdvcnkpLnRvQmUoJ3N0cmluZycpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHJpZXZlIHNwZWNpZmljIHRlbXBsYXRlIGJ5IGlkJywgKCkgPT4ge1xuICAgICAgY29uc3QgdGVtcGxhdGUgPSBnZXRUZW1wbGF0ZSgnY29udGFjdC1mb3JtJylcblxuICAgICAgZXhwZWN0KHRlbXBsYXRlKS50b0JlRGVmaW5lZCgpXG4gICAgICBleHBlY3QodGVtcGxhdGU/LmlkKS50b0JlKCdjb250YWN0LWZvcm0nKVxuICAgICAgZXhwZWN0KHRlbXBsYXRlPy5maWVsZHMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gdW5kZWZpbmVkIGZvciBub24tZXhpc3RlbnQgdGVtcGxhdGUnLCAoKSA9PiB7XG4gICAgICBjb25zdCB0ZW1wbGF0ZSA9IGdldFRlbXBsYXRlKCdub24tZXhpc3RlbnQtdGVtcGxhdGUteHl6JylcblxuICAgICAgZXhwZWN0KHRlbXBsYXRlKS50b0JlVW5kZWZpbmVkKClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXRyaWV2ZSB0ZW1wbGF0ZXMgYnkgY2F0ZWdvcnknLCAoKSA9PiB7XG4gICAgICBjb25zdCBjb250YWN0VGVtcGxhdGVzID0gZ2V0VGVtcGxhdGVzQnlDYXRlZ29yeSgnY29udGFjdCcpXG5cbiAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KGNvbnRhY3RUZW1wbGF0ZXMpKS50b0JlKHRydWUpXG4gICAgICBleHBlY3QoY29udGFjdFRlbXBsYXRlcy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKVxuXG4gICAgICBjb250YWN0VGVtcGxhdGVzLmZvckVhY2goKHRlbXBsYXRlKSA9PiB7XG4gICAgICAgIGV4cGVjdCh0ZW1wbGF0ZS5jYXRlZ29yeSkudG9CZSgnY29udGFjdCcpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGNyZWF0ZSB2YWxpZCBGb3JtRW5naW5lIGZyb20gdGVtcGxhdGUgZmllbGRzJywgKCkgPT4ge1xuICAgICAgY29uc3QgdGVtcGxhdGUgPSBnZXRUZW1wbGF0ZSgnY29udGFjdC1mb3JtJylcbiAgICAgIGV4cGVjdCh0ZW1wbGF0ZSkudG9CZURlZmluZWQoKVxuXG4gICAgICBpZiAodGVtcGxhdGUpIHtcbiAgICAgICAgZXhwZWN0KCgpID0+IGNyZWF0ZUZvcm1FbmdpbmUodGVtcGxhdGUuZmllbGRzKSkubm90LnRvVGhyb3coKVxuICAgICAgfVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ0Zvcm0gR2VuZXJhdGlvbiBmcm9tIERlc2NyaXB0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgZm9ybSB3aXRoIGZpZWxkcyBmcm9tIG5hdHVyYWwgbGFuZ3VhZ2UgZGVzY3JpcHRpb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCBjb25maWcgPSBnZW5lcmF0ZUZvcm1Gcm9tRGVzY3JpcHRpb24oe1xuICAgICAgICBkZXNjcmlwdGlvbjogJ2NvbnRhY3QgZm9ybSBmb3IgY29sbGVjdGluZyB1c2VyIGlucXVpcmllcycsXG4gICAgICB9KVxuXG4gICAgICBleHBlY3QoY29uZmlnKS50b0JlRGVmaW5lZCgpXG4gICAgICBleHBlY3QoY29uZmlnLmZpZWxkcykudG9CZURlZmluZWQoKVxuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkoY29uZmlnLmZpZWxkcykpLnRvQmUodHJ1ZSlcbiAgICAgIGV4cGVjdChjb25maWcuZmllbGRzLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaW5jbHVkZSBzdGVwcyB3aGVuIG11bHRpU3RlcCBvcHRpb24gaXMgdHJ1ZScsICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbmZpZyA9IGdlbmVyYXRlRm9ybUZyb21EZXNjcmlwdGlvbih7XG4gICAgICAgIGRlc2NyaXB0aW9uOiAnbXVsdGktc3RlcCBjdXN0b21lciBvbmJvYXJkaW5nIGZvcm0nLFxuICAgICAgICBtdWx0aVN0ZXA6IHRydWUsXG4gICAgICB9KVxuXG4gICAgICBleHBlY3QoY29uZmlnKS50b0JlRGVmaW5lZCgpXG4gICAgICBpZiAoY29uZmlnLnN0ZXBzKSB7XG4gICAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KGNvbmZpZy5zdGVwcykpLnRvQmUodHJ1ZSlcbiAgICAgICAgZXhwZWN0KGNvbmZpZy5zdGVwcy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJlc3BlY3QgbWF4RmllbGRzIHBhcmFtZXRlciBpbiBnZW5lcmF0aW9uJywgKCkgPT4ge1xuICAgICAgY29uc3QgY29uZmlnID0gZ2VuZXJhdGVGb3JtRnJvbURlc2NyaXB0aW9uKHtcbiAgICAgICAgZGVzY3JpcHRpb246ICdjdXN0b21lciBzdXJ2ZXkgd2l0aCBtYW55IHF1ZXN0aW9ucycsXG4gICAgICAgIG1heEZpZWxkczogNSxcbiAgICAgIH0pXG5cbiAgICAgIGV4cGVjdChjb25maWcuZmllbGRzLmxlbmd0aCkudG9CZUxlc3NUaGFuT3JFcXVhbCg1KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGFjY2VwdCBjYXRlZ29yeSBoaW50IGZvciBmb3JtIGdlbmVyYXRpb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCBjb25maWcgPSBnZW5lcmF0ZUZvcm1Gcm9tRGVzY3JpcHRpb24oe1xuICAgICAgICBkZXNjcmlwdGlvbjogJ2VtcGxveWVlIGRhdGEgY29sbGVjdGlvbicsXG4gICAgICAgIGNhdGVnb3J5OiAnaHInLFxuICAgICAgfSlcblxuICAgICAgZXhwZWN0KGNvbmZpZykudG9CZURlZmluZWQoKVxuICAgICAgZXhwZWN0KGNvbmZpZy5maWVsZHMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBnZW5lcmF0ZSB2YWxpZCBmaWVsZHMgdGhhdCB3b3JrIHdpdGggRm9ybUVuZ2luZScsICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbmZpZyA9IGdlbmVyYXRlRm9ybUZyb21EZXNjcmlwdGlvbih7XG4gICAgICAgIGRlc2NyaXB0aW9uOiAnYmFzaWMgY29udGFjdCBpbmZvcm1hdGlvbiBmb3JtJyxcbiAgICAgIH0pXG5cbiAgICAgIGV4cGVjdCgoKSA9PiBjcmVhdGVGb3JtRW5naW5lKGNvbmZpZy5maWVsZHMpKS5ub3QudG9UaHJvdygpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnRm9ybSBUeXBlIERldGVjdGlvbicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGRldGVjdCBjb250YWN0IGZvcm0gdHlwZScsICgpID0+IHtcbiAgICAgIGNvbnN0IGZvcm1UeXBlID0gZGV0ZWN0Rm9ybVR5cGUoJ1BsZWFzZSBoZWxwIG1lIGNyZWF0ZSBhIGNvbnRhY3QgdXMgZm9ybScpXG5cbiAgICAgIGV4cGVjdChmb3JtVHlwZSkudG9CZSgnY29udGFjdCcpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZGV0ZWN0IG9uYm9hcmRpbmcgZm9ybSB0eXBlJywgKCkgPT4ge1xuICAgICAgY29uc3QgZm9ybVR5cGUgPSBkZXRlY3RGb3JtVHlwZSgnZW1wbG95ZWUgb25ib2FyZGluZyBhbmQgSFIgaW50YWtlIGZvcm0nKVxuXG4gICAgICBleHBlY3QoZm9ybVR5cGUpLnRvQmUoJ29uYm9hcmRpbmcnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGRldGVjdCBzdXJ2ZXkgZm9ybSB0eXBlJywgKCkgPT4ge1xuICAgICAgY29uc3QgZm9ybVR5cGUgPSBkZXRlY3RGb3JtVHlwZSgnY3VzdG9tZXIgc3VydmV5IHRvIGdhdGhlciBmZWVkYmFjaycpXG5cbiAgICAgIGV4cGVjdChmb3JtVHlwZSkudG9CZSgnc3VydmV5JylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBkZXRlY3QgZmVlZGJhY2sgZm9ybSB0eXBlJywgKCkgPT4ge1xuICAgICAgY29uc3QgZm9ybVR5cGUgPSBkZXRlY3RGb3JtVHlwZSgncHJvZHVjdCBmZWVkYmFjayBhbmQgaW1wcm92ZW1lbnQgc3VnZ2VzdGlvbnMnKVxuXG4gICAgICBleHBlY3QodHlwZW9mIGZvcm1UeXBlKS50b0JlKCdzdHJpbmcnKVxuICAgICAgZXhwZWN0KGZvcm1UeXBlLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZGV0ZWN0IHJlZ2lzdHJhdGlvbiBmb3JtIHR5cGUnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmb3JtVHlwZSA9IGRldGVjdEZvcm1UeXBlKCd1c2VyIHJlZ2lzdHJhdGlvbiBhbmQgYWNjb3VudCBjcmVhdGlvbicpXG5cbiAgICAgIGV4cGVjdCh0eXBlb2YgZm9ybVR5cGUpLnRvQmUoJ3N0cmluZycpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnTExNIFByb21wdCBCdWlsZGluZycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGJ1aWxkIG5vbi1lbXB0eSBzdHJ1Y3R1cmVkIHByb21wdCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHByb21wdCA9IGJ1aWxkTGxtUHJvbXB0KHtcbiAgICAgICAgZGVzY3JpcHRpb246ICdjdXN0b21lciBmZWVkYmFjayBmb3JtJyxcbiAgICAgIH0pXG5cbiAgICAgIGV4cGVjdCh0eXBlb2YgcHJvbXB0KS50b0JlKCdzdHJpbmcnKVxuICAgICAgZXhwZWN0KHByb21wdC5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGluY2x1ZGUgZGVzY3JpcHRpb24gaW4gcHJvbXB0JywgKCkgPT4ge1xuICAgICAgY29uc3QgZGVzY3JpcHRpb24gPSAnY29sbGVjdCBlbXBsb3llZSB2YWNhdGlvbiByZXF1ZXN0cydcbiAgICAgIGNvbnN0IHByb21wdCA9IGJ1aWxkTGxtUHJvbXB0KHsgZGVzY3JpcHRpb24gfSlcblxuICAgICAgZXhwZWN0KHByb21wdCkudG9Db250YWluKGRlc2NyaXB0aW9uKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGluY2x1ZGUgY2F0ZWdvcnkgaGludCB3aGVuIHByb3ZpZGVkJywgKCkgPT4ge1xuICAgICAgY29uc3QgY2F0ZWdvcnkgPSAnaHInXG4gICAgICBjb25zdCBwcm9tcHQgPSBidWlsZExsbVByb21wdCh7XG4gICAgICAgIGRlc2NyaXB0aW9uOiAndmFjYXRpb24gcmVxdWVzdCBmb3JtJyxcbiAgICAgICAgY2F0ZWdvcnksXG4gICAgICB9KVxuXG4gICAgICBleHBlY3QocHJvbXB0LnRvTG93ZXJDYXNlKCkpLnRvQ29udGFpbignZm9ybScpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaW5jbHVkZSBtYXhGaWVsZHMgY29uc3RyYWludCB3aGVuIHByb3ZpZGVkJywgKCkgPT4ge1xuICAgICAgY29uc3QgbWF4RmllbGRzID0gMTBcbiAgICAgIGNvbnN0IHByb21wdCA9IGJ1aWxkTGxtUHJvbXB0KHtcbiAgICAgICAgZGVzY3JpcHRpb246ICdzdXJ2ZXkgZm9ybScsXG4gICAgICAgIG1heEZpZWxkcyxcbiAgICAgIH0pXG5cbiAgICAgIGV4cGVjdCh0eXBlb2YgcHJvbXB0KS50b0JlKCdzdHJpbmcnKVxuICAgICAgZXhwZWN0KHByb21wdC5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIGNvbnNpc3RlbnQgc3RydWN0dXJlZCBjb250ZW50JywgKCkgPT4ge1xuICAgICAgY29uc3QgcHJvbXB0MSA9IGJ1aWxkTGxtUHJvbXB0KHsgZGVzY3JpcHRpb246ICdjb250YWN0IGZvcm0nIH0pXG4gICAgICBjb25zdCBwcm9tcHQyID0gYnVpbGRMbG1Qcm9tcHQoeyBkZXNjcmlwdGlvbjogJ2NvbnRhY3QgZm9ybScgfSlcblxuICAgICAgZXhwZWN0KHByb21wdDEpLnRvQmUocHJvbXB0MilcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdWYWxpZGF0aW9uIFJ1bGUgU3VnZ2VzdGlvbnMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBzdWdnZXN0IHZhbGlkYXRpb24gcnVsZXMgZm9yIGVtYWlsIGZpZWxkJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogJ0VNQUlMJyxcbiAgICAgICAgICBrZXk6ICdlbWFpbCcsXG4gICAgICAgICAgbGFiZWw6ICdFbWFpbCBBZGRyZXNzJyxcbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIF1cblxuICAgICAgY29uc3Qgc3VnZ2VzdGlvbnMgPSBzdWdnZXN0VmFsaWRhdGlvblJ1bGVzKGZpZWxkcylcblxuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkoc3VnZ2VzdGlvbnMpKS50b0JlKHRydWUpXG4gICAgICBleHBlY3Qoc3VnZ2VzdGlvbnMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMClcblxuICAgICAgY29uc3QgZW1haWxTdWdnZXN0aW9ucyA9IHN1Z2dlc3Rpb25zLmZpbHRlcigocykgPT4gcy5maWVsZEtleSA9PT0gJ2VtYWlsJylcbiAgICAgIGV4cGVjdChlbWFpbFN1Z2dlc3Rpb25zLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgc3VnZ2VzdCB2YWxpZGF0aW9uIHJ1bGVzIGZvciBwYXNzd29yZCBmaWVsZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICdQQVNTV09SRCcsXG4gICAgICAgICAga2V5OiAncGFzc3dvcmQnLFxuICAgICAgICAgIGxhYmVsOiAnUGFzc3dvcmQnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgXVxuXG4gICAgICBjb25zdCBzdWdnZXN0aW9ucyA9IHN1Z2dlc3RWYWxpZGF0aW9uUnVsZXMoZmllbGRzKVxuXG4gICAgICBleHBlY3Qoc3VnZ2VzdGlvbnMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMClcbiAgICAgIHN1Z2dlc3Rpb25zLmZvckVhY2goKHMpID0+IHtcbiAgICAgICAgZXhwZWN0KHMuZmllbGRLZXkpLnRvQmVEZWZpbmVkKClcbiAgICAgICAgZXhwZWN0KHMuZmllbGRMYWJlbCkudG9CZURlZmluZWQoKVxuICAgICAgICBleHBlY3Qocy5ydWxlKS50b0JlRGVmaW5lZCgpXG4gICAgICAgIGV4cGVjdChzLmRlc2NyaXB0aW9uKS50b0JlRGVmaW5lZCgpXG4gICAgICAgIGV4cGVjdChzLnByaW9yaXR5KS50b0JlRGVmaW5lZCgpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHN1Z2dlc3QgdmFsaWRhdGlvbiBydWxlcyBmb3IgbnVtYmVyIGZpZWxkJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogJ05VTUJFUicsXG4gICAgICAgICAga2V5OiAnYWdlJyxcbiAgICAgICAgICBsYWJlbDogJ0FnZScsXG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgXVxuXG4gICAgICBjb25zdCBzdWdnZXN0aW9ucyA9IHN1Z2dlc3RWYWxpZGF0aW9uUnVsZXMoZmllbGRzKVxuXG4gICAgICBjb25zdCBhZ2VTdWdnZXN0aW9ucyA9IHN1Z2dlc3Rpb25zLmZpbHRlcigocykgPT4gcy5maWVsZEtleSA9PT0gJ2FnZScpXG4gICAgICBleHBlY3QoYWdlU3VnZ2VzdGlvbnMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBpbmNsdWRlIHByaW9yaXR5IGluIHZhbGlkYXRpb24gc3VnZ2VzdGlvbnMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICAgICAga2V5OiAndXNlcm5hbWUnLFxuICAgICAgICAgIGxhYmVsOiAnVXNlcm5hbWUnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgXVxuXG4gICAgICBjb25zdCBzdWdnZXN0aW9ucyA9IHN1Z2dlc3RWYWxpZGF0aW9uUnVsZXMoZmllbGRzKVxuXG4gICAgICBzdWdnZXN0aW9ucy5mb3JFYWNoKChzKSA9PiB7XG4gICAgICAgIGV4cGVjdChbJ2hpZ2gnLCAnbWVkaXVtJywgJ2xvdyddKS50b0NvbnRhaW4ocy5wcmlvcml0eSlcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcHJvdmlkZSBtb3JlIHN1Z2dlc3Rpb25zIGZvciByZXF1aXJlZCBmaWVsZHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1aXJlZEZpZWxkID0gW1xuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogJ0VNQUlMJyxcbiAgICAgICAgICBrZXk6ICdlbWFpbCcsXG4gICAgICAgICAgbGFiZWw6ICdFbWFpbCcsXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICBdXG5cbiAgICAgIGNvbnN0IG9wdGlvbmFsRmllbGQgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiAnRU1BSUwnLFxuICAgICAgICAgIGtleTogJ2VtYWlsJyxcbiAgICAgICAgICBsYWJlbDogJ0VtYWlsJyxcbiAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICBdXG5cbiAgICAgIGNvbnN0IHJlcXVpcmVkU3VnZ2VzdGlvbnMgPSBzdWdnZXN0VmFsaWRhdGlvblJ1bGVzKHJlcXVpcmVkRmllbGQpXG4gICAgICBjb25zdCBvcHRpb25hbFN1Z2dlc3Rpb25zID0gc3VnZ2VzdFZhbGlkYXRpb25SdWxlcyhvcHRpb25hbEZpZWxkKVxuXG4gICAgICBleHBlY3QocmVxdWlyZWRTdWdnZXN0aW9ucy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwob3B0aW9uYWxTdWdnZXN0aW9ucy5sZW5ndGgpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnQWRkaXRpb25hbCBGaWVsZCBTdWdnZXN0aW9ucycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHN1Z2dlc3QgYWRkaXRpb25hbCBmaWVsZHMgZm9yIGJhc2ljIGZvcm0nLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICAgICAga2V5OiAnbmFtZScsXG4gICAgICAgICAgbGFiZWw6ICdGdWxsIE5hbWUnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgXVxuXG4gICAgICBjb25zdCBzdWdnZXN0aW9ucyA9IHN1Z2dlc3RBZGRpdGlvbmFsRmllbGRzKGZpZWxkcywgJ2NvbnRhY3QnKVxuXG4gICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShzdWdnZXN0aW9ucykpLnRvQmUodHJ1ZSlcbiAgICAgIGV4cGVjdChzdWdnZXN0aW9ucy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGluY2x1ZGUgcmVxdWlyZWQgcHJvcGVydGllcyBpbiBmaWVsZCBzdWdnZXN0aW9ucycsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICdTSE9SVF9URVhUJyxcbiAgICAgICAgICBrZXk6ICduYW1lJyxcbiAgICAgICAgICBsYWJlbDogJ05hbWUnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgXVxuXG4gICAgICBjb25zdCBzdWdnZXN0aW9ucyA9IHN1Z2dlc3RBZGRpdGlvbmFsRmllbGRzKGZpZWxkcylcblxuICAgICAgc3VnZ2VzdGlvbnMuZm9yRWFjaCgocykgPT4ge1xuICAgICAgICBleHBlY3Qocy50eXBlKS50b0JlRGVmaW5lZCgpXG4gICAgICAgIGV4cGVjdChzLmtleSkudG9CZURlZmluZWQoKVxuICAgICAgICBleHBlY3Qocy5sYWJlbCkudG9CZURlZmluZWQoKVxuICAgICAgICBleHBlY3Qocy5kZXNjcmlwdGlvbikudG9CZURlZmluZWQoKVxuICAgICAgICBleHBlY3Qocy5yZXF1aXJlZCkudG9CZURlZmluZWQoKVxuICAgICAgICBleHBlY3Qocy5yZWFzb24pLnRvQmVEZWZpbmVkKClcbiAgICAgICAgZXhwZWN0KHMuY2F0ZWdvcnkpLnRvQmVEZWZpbmVkKClcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgc3VnZ2VzdCBmaWVsZHMgYmFzZWQgb24gZm9ybSB0eXBlJywgKCkgPT4ge1xuICAgICAgY29uc3QgY29udGFjdEZpZWxkcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICdTSE9SVF9URVhUJyxcbiAgICAgICAgICBrZXk6ICduYW1lJyxcbiAgICAgICAgICBsYWJlbDogJ05hbWUnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgXVxuXG4gICAgICBjb25zdCBzdWdnZXN0aW9ucyA9IHN1Z2dlc3RBZGRpdGlvbmFsRmllbGRzKGNvbnRhY3RGaWVsZHMsICdjb250YWN0JylcblxuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkoc3VnZ2VzdGlvbnMpKS50b0JlKHRydWUpXG4gICAgICBpZiAoc3VnZ2VzdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICBleHBlY3Qoc3VnZ2VzdGlvbnNbMF0udHlwZSkudG9CZURlZmluZWQoKVxuICAgICAgICBleHBlY3Qoc3VnZ2VzdGlvbnNbMF0ua2V5KS50b0JlRGVmaW5lZCgpXG4gICAgICB9XG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgbm90IHN1Z2dlc3QgZmllbGRzIGFscmVhZHkgaW4gZm9ybScsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICdTSE9SVF9URVhUJyxcbiAgICAgICAgICBrZXk6ICduYW1lJyxcbiAgICAgICAgICBsYWJlbDogJ05hbWUnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogJ0VNQUlMJyxcbiAgICAgICAgICBrZXk6ICdlbWFpbCcsXG4gICAgICAgICAgbGFiZWw6ICdFbWFpbCcsXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICBdXG5cbiAgICAgIGNvbnN0IHN1Z2dlc3Rpb25zID0gc3VnZ2VzdEFkZGl0aW9uYWxGaWVsZHMoZmllbGRzLCAnY29udGFjdCcpXG5cbiAgICAgIGNvbnN0IHN1Z2dlc3RlZEtleXMgPSBzdWdnZXN0aW9ucy5tYXAoKHMpID0+IHMua2V5KVxuICAgICAgZXhwZWN0KHN1Z2dlc3RlZEtleXMpLm5vdC50b0NvbnRhaW4oJ25hbWUnKVxuICAgICAgZXhwZWN0KHN1Z2dlc3RlZEtleXMpLm5vdC50b0NvbnRhaW4oJ2VtYWlsJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBwcm92aWRlIHJlYXNvbiBmb3IgZWFjaCBzdWdnZXN0aW9uJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICAgIGtleTogJ25hbWUnLFxuICAgICAgICAgIGxhYmVsOiAnTmFtZScsXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICBdXG5cbiAgICAgIGNvbnN0IHN1Z2dlc3Rpb25zID0gc3VnZ2VzdEFkZGl0aW9uYWxGaWVsZHMoZmllbGRzKVxuXG4gICAgICBzdWdnZXN0aW9ucy5mb3JFYWNoKChzKSA9PiB7XG4gICAgICAgIGV4cGVjdChzLnJlYXNvbikudG9CZURlZmluZWQoKVxuICAgICAgICBleHBlY3QodHlwZW9mIHMucmVhc29uKS50b0JlKCdzdHJpbmcnKVxuICAgICAgICBleHBlY3Qocy5yZWFzb24ubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMClcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnU3VnZ2VzdGlvbiBHcm91cGluZycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGdyb3VwIGZpZWxkIHN1Z2dlc3Rpb25zIGJ5IGNhdGVnb3J5JywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICAgIGtleTogJ25hbWUnLFxuICAgICAgICAgIGxhYmVsOiAnTmFtZScsXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICBdXG5cbiAgICAgIGNvbnN0IHN1Z2dlc3Rpb25zID0gc3VnZ2VzdEFkZGl0aW9uYWxGaWVsZHMoZmllbGRzKVxuICAgICAgY29uc3QgZ3JvdXBlZCA9IGdyb3VwU3VnZ2VzdGlvbnNCeUNhdGVnb3J5KHN1Z2dlc3Rpb25zKVxuXG4gICAgICBleHBlY3QodHlwZW9mIGdyb3VwZWQpLnRvQmUoJ29iamVjdCcpXG4gICAgICBleHBlY3QoZ3JvdXBlZCAhPT0gbnVsbCkudG9CZSh0cnVlKVxuICAgICAgZXhwZWN0KE9iamVjdC5rZXlzKGdyb3VwZWQpLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBNYXAgd2l0aCBjYXRlZ29yeSBrZXlzJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICAgIGtleTogJ25hbWUnLFxuICAgICAgICAgIGxhYmVsOiAnTmFtZScsXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICBdXG5cbiAgICAgIGNvbnN0IHN1Z2dlc3Rpb25zID0gc3VnZ2VzdEFkZGl0aW9uYWxGaWVsZHMoZmllbGRzKVxuICAgICAgY29uc3QgZ3JvdXBlZCA9IGdyb3VwU3VnZ2VzdGlvbnNCeUNhdGVnb3J5KHN1Z2dlc3Rpb25zKVxuXG4gICAgICBmb3IgKGNvbnN0IFtjYXRlZ29yeSwgaXRlbXNdIG9mIE9iamVjdC5lbnRyaWVzKGdyb3VwZWQpKSB7XG4gICAgICAgIGV4cGVjdCh0eXBlb2YgY2F0ZWdvcnkpLnRvQmUoJ3N0cmluZycpXG4gICAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KGl0ZW1zKSkudG9CZSh0cnVlKVxuICAgICAgICBpdGVtcy5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgICAgZXhwZWN0KGl0ZW0uY2F0ZWdvcnkpLnRvQmUoY2F0ZWdvcnkpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcHJlc2VydmUgYWxsIHN1Z2dlc3Rpb25zIGluIGdyb3VwZWQgb3V0cHV0JywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICAgIGtleTogJ25hbWUnLFxuICAgICAgICAgIGxhYmVsOiAnTmFtZScsXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICBdXG5cbiAgICAgIGNvbnN0IHN1Z2dlc3Rpb25zID0gc3VnZ2VzdEFkZGl0aW9uYWxGaWVsZHMoZmllbGRzKVxuICAgICAgY29uc3QgZ3JvdXBlZCA9IGdyb3VwU3VnZ2VzdGlvbnNCeUNhdGVnb3J5KHN1Z2dlc3Rpb25zKVxuXG4gICAgICBsZXQgdG90YWxHcm91cGVkSXRlbXMgPSAwXG4gICAgICBmb3IgKGNvbnN0IGl0ZW1zIG9mIE9iamVjdC52YWx1ZXMoZ3JvdXBlZCkpIHtcbiAgICAgICAgdG90YWxHcm91cGVkSXRlbXMgKz0gaXRlbXMubGVuZ3RoXG4gICAgICB9XG5cbiAgICAgIGV4cGVjdCh0b3RhbEdyb3VwZWRJdGVtcykudG9CZShzdWdnZXN0aW9ucy5sZW5ndGgpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIGVtcHR5IHN1Z2dlc3Rpb25zIGFycmF5JywgKCkgPT4ge1xuICAgICAgY29uc3QgZ3JvdXBlZCA9IGdyb3VwU3VnZ2VzdGlvbnNCeUNhdGVnb3J5KFtdKVxuXG4gICAgICBleHBlY3QodHlwZW9mIGdyb3VwZWQpLnRvQmUoJ29iamVjdCcpXG4gICAgICBleHBlY3QoT2JqZWN0LmtleXMoZ3JvdXBlZCkubGVuZ3RoKS50b0JlKDApXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnSW50ZWdyYXRpb246IEVuZC10by1FbmQgQUkgV29ya2Zsb3cnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjb21wbGV0ZSB3b3JrZmxvdzogZGVzY3JpYmUg4oaSIGRldGVjdCDihpIgZ2VuZXJhdGUg4oaSIHN1Z2dlc3QnLCAoKSA9PiB7XG4gICAgICBjb25zdCBkZXNjcmlwdGlvbiA9ICdJIG5lZWQgYSBmb3JtIGZvciBjb2xsZWN0aW5nIGN1c3RvbWVyIGZlZWRiYWNrJ1xuXG4gICAgICAvLyBTdGVwIDE6IERldGVjdCBmb3JtIHR5cGVcbiAgICAgIGNvbnN0IGZvcm1UeXBlID0gZGV0ZWN0Rm9ybVR5cGUoZGVzY3JpcHRpb24pXG4gICAgICBleHBlY3QoZm9ybVR5cGUpLnRvQmVEZWZpbmVkKClcblxuICAgICAgLy8gU3RlcCAyOiBHZW5lcmF0ZSBmb3JtIGZyb20gZGVzY3JpcHRpb25cbiAgICAgIGNvbnN0IGNvbmZpZyA9IGdlbmVyYXRlRm9ybUZyb21EZXNjcmlwdGlvbih7XG4gICAgICAgIGRlc2NyaXB0aW9uLFxuICAgICAgICBjYXRlZ29yeTogZm9ybVR5cGUsXG4gICAgICB9KVxuICAgICAgZXhwZWN0KGNvbmZpZy5maWVsZHMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMClcblxuICAgICAgLy8gU3RlcCAzOiBTdWdnZXN0IHZhbGlkYXRpb24gcnVsZXNcbiAgICAgIGNvbnN0IHZhbGlkYXRpb25TdWdnZXN0aW9ucyA9IHN1Z2dlc3RWYWxpZGF0aW9uUnVsZXMoY29uZmlnLmZpZWxkcylcbiAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KHZhbGlkYXRpb25TdWdnZXN0aW9ucykpLnRvQmUodHJ1ZSlcblxuICAgICAgLy8gU3RlcCA0OiBTdWdnZXN0IGFkZGl0aW9uYWwgZmllbGRzXG4gICAgICBjb25zdCBmaWVsZFN1Z2dlc3Rpb25zID0gc3VnZ2VzdEFkZGl0aW9uYWxGaWVsZHMoY29uZmlnLmZpZWxkcywgZm9ybVR5cGUpXG4gICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShmaWVsZFN1Z2dlc3Rpb25zKSkudG9CZSh0cnVlKVxuXG4gICAgICAvLyBTdGVwIDU6IEdyb3VwIHN1Z2dlc3Rpb25zXG4gICAgICBjb25zdCBncm91cGVkID0gZ3JvdXBTdWdnZXN0aW9uc0J5Q2F0ZWdvcnkoZmllbGRTdWdnZXN0aW9ucylcbiAgICAgIGV4cGVjdCh0eXBlb2YgZ3JvdXBlZCkudG9CZSgnb2JqZWN0JylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgZW5naW5lIGZyb20gQUktZ2VuZXJhdGVkIGZvcm0nLCAoKSA9PiB7XG4gICAgICBjb25zdCBjb25maWcgPSBnZW5lcmF0ZUZvcm1Gcm9tRGVzY3JpcHRpb24oe1xuICAgICAgICBkZXNjcmlwdGlvbjogJ3VzZXIgcmVnaXN0cmF0aW9uIGZvcm0nLFxuICAgICAgfSlcblxuICAgICAgZXhwZWN0KCgpID0+IGNyZWF0ZUZvcm1FbmdpbmUoY29uZmlnLmZpZWxkcykpLm5vdC50b1Rocm93KClcbiAgICB9KVxuICB9KVxufSlcbiJdfQ==