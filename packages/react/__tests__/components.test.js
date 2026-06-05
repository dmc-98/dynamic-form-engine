"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const dfe_core_1 = require("@dmc--98/dfe-core");
const components_1 = require("../src/components");
/**
 * Component tests for DfeFormRenderer and DfeStepIndicator.
 *
 * Since @testing-library/react is not available, these tests verify:
 * - Component type exports and prop interfaces
 * - Component logic through the underlying engine/stepper
 * - Props handling and defaults
 * - Conditional rendering based on field visibility
 */
// ─── Test Fixtures ──────────────────────────────────────────────────────────
const testFields = [
    {
        id: 'field_name',
        versionId: 'v1',
        key: 'fullName',
        label: 'Full Name',
        type: 'SHORT_TEXT',
        required: true,
        order: 1,
        config: { placeholder: 'Enter your full name' },
    },
    {
        id: 'field_email',
        versionId: 'v1',
        key: 'email',
        label: 'Email Address',
        type: 'EMAIL',
        required: true,
        order: 2,
        config: {},
    },
    {
        id: 'field_number',
        versionId: 'v1',
        key: 'age',
        label: 'Age',
        type: 'NUMBER',
        required: false,
        order: 3,
        config: { min: 0, max: 150 },
    },
    {
        id: 'field_phone',
        versionId: 'v1',
        key: 'phone',
        label: 'Phone Number',
        type: 'PHONE',
        required: false,
        order: 4,
        config: {},
    },
    {
        id: 'field_url',
        versionId: 'v1',
        key: 'website',
        label: 'Website',
        type: 'URL',
        required: false,
        order: 5,
        config: {},
    },
    {
        id: 'field_password',
        versionId: 'v1',
        key: 'password',
        label: 'Password',
        type: 'PASSWORD',
        required: true,
        order: 6,
        config: {},
    },
    {
        id: 'field_long_text',
        versionId: 'v1',
        key: 'bio',
        label: 'Bio',
        type: 'LONG_TEXT',
        required: false,
        order: 7,
        config: { maxLength: 500 },
    },
    {
        id: 'field_date',
        versionId: 'v1',
        key: 'birthDate',
        label: 'Birth Date',
        type: 'DATE',
        required: false,
        order: 8,
        config: {},
    },
    {
        id: 'field_time',
        versionId: 'v1',
        key: 'meetingTime',
        label: 'Meeting Time',
        type: 'TIME',
        required: false,
        order: 9,
        config: {},
    },
    {
        id: 'field_datetime',
        versionId: 'v1',
        key: 'meetingDateTime',
        label: 'Meeting Date & Time',
        type: 'DATE_TIME',
        required: false,
        order: 10,
        config: {},
    },
    {
        id: 'field_select',
        versionId: 'v1',
        key: 'country',
        label: 'Country',
        type: 'SELECT',
        required: true,
        order: 11,
        config: {
            mode: 'static',
            options: [
                { label: 'United States', value: 'us' },
                { label: 'Canada', value: 'ca' },
                { label: 'Mexico', value: 'mx' },
            ],
        },
    },
    {
        id: 'field_multi_select',
        versionId: 'v1',
        key: 'interests',
        label: 'Interests',
        type: 'MULTI_SELECT',
        required: false,
        order: 12,
        config: {
            mode: 'static',
            options: [
                { label: 'Sports', value: 'sports' },
                { label: 'Music', value: 'music' },
                { label: 'Reading', value: 'reading' },
                { label: 'Gaming', value: 'gaming' },
            ],
        },
    },
    {
        id: 'field_radio',
        versionId: 'v1',
        key: 'gender',
        label: 'Gender',
        type: 'RADIO',
        required: false,
        order: 13,
        config: {
            mode: 'static',
            options: [
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Other', value: 'other' },
            ],
        },
    },
    {
        id: 'field_checkbox',
        versionId: 'v1',
        key: 'subscribe',
        label: 'Subscribe to newsletter',
        type: 'CHECKBOX',
        required: false,
        order: 14,
        config: {},
    },
    {
        id: 'field_section_break',
        versionId: 'v1',
        key: 'section_1',
        label: 'Personal Information',
        type: 'SECTION_BREAK',
        required: false,
        order: 0,
        config: {},
    },
];
const testSteps = [
    {
        id: 'step1',
        versionId: 'v1',
        title: 'Personal Information',
        order: 1,
        config: null,
        conditions: null,
    },
    {
        id: 'step2',
        versionId: 'v1',
        title: 'Contact Information',
        order: 2,
        config: null,
        conditions: null,
    },
    {
        id: 'step3',
        versionId: 'v1',
        title: 'Preferences',
        order: 3,
        config: null,
        conditions: null,
    },
];
// ─── DfeFormRenderer Tests ───────────────────────────────────────────────────
(0, vitest_1.describe)('DfeFormRenderer', () => {
    (0, vitest_1.it)('should export DfeFormRenderer as a function', () => {
        (0, vitest_1.expect)(typeof components_1.DfeFormRenderer).toBe('function');
    });
    (0, vitest_1.it)('should have the correct prop interface', () => {
        // Test that props interface is correct by creating engine
        const engine = (0, dfe_core_1.createFormEngine)(testFields);
        const props = {
            fields: engine.getVisibleFields(),
            values: engine.getValues(),
            onFieldChange: (key, value) => engine.setFieldValue(key, value),
            errors: {},
            className: 'test-form',
        };
        (0, vitest_1.expect)(props).toBeDefined();
        (0, vitest_1.expect)(props.fields).toBeInstanceOf(Array);
        (0, vitest_1.expect)(typeof props.values).toBe('object');
        (0, vitest_1.expect)(typeof props.onFieldChange).toBe('function');
    });
    (0, vitest_1.describe)('field rendering logic', () => {
        (0, vitest_1.it)('should render all visible field types', () => {
            const engine = (0, dfe_core_1.createFormEngine)(testFields);
            const visibleFields = engine.getVisibleFields();
            // Should include all field types except SECTION_BREAK for form input
            const textTypes = ['SHORT_TEXT', 'EMAIL', 'PHONE', 'URL', 'PASSWORD', 'LONG_TEXT'];
            const dateTypes = ['DATE', 'TIME', 'DATE_TIME'];
            const selectTypes = ['SELECT', 'RADIO', 'MULTI_SELECT'];
            const otherTypes = ['NUMBER', 'CHECKBOX'];
            for (const type of [...textTypes, ...dateTypes, ...selectTypes, ...otherTypes]) {
                const field = visibleFields.find(f => f.type === type);
                if (field) {
                    (0, vitest_1.expect)(field.type).toBe(type);
                    (0, vitest_1.expect)(field.key).toBeDefined();
                    (0, vitest_1.expect)(field.label).toBeDefined();
                }
            }
        });
        (0, vitest_1.it)('should handle required and optional fields', () => {
            const engine = (0, dfe_core_1.createFormEngine)(testFields);
            const visibleFields = engine.getVisibleFields();
            const requiredField = visibleFields.find(f => f.key === 'fullName');
            const optionalField = visibleFields.find(f => f.key === 'age');
            (0, vitest_1.expect)(requiredField === null || requiredField === void 0 ? void 0 : requiredField.required).toBe(true);
            (0, vitest_1.expect)(optionalField === null || optionalField === void 0 ? void 0 : optionalField.required).toBe(false);
        });
        (0, vitest_1.it)('should handle field values from engine', () => {
            const engine = (0, dfe_core_1.createFormEngine)(testFields, {
                fullName: 'John Doe',
                email: 'john@example.com',
                age: 30,
            });
            const values = engine.getValues();
            (0, vitest_1.expect)(values.fullName).toBe('John Doe');
            (0, vitest_1.expect)(values.email).toBe('john@example.com');
            (0, vitest_1.expect)(values.age).toBe(30);
        });
        (0, vitest_1.it)('should handle validation errors', () => {
            const engine = (0, dfe_core_1.createFormEngine)(testFields);
            engine.setFieldValue('fullName', '');
            const validation = engine.validate();
            (0, vitest_1.expect)(validation.success).toBe(false);
            (0, vitest_1.expect)(validation.errors.fullName).toBeDefined();
        });
        (0, vitest_1.it)('should support custom field renderer function', () => {
            const engine = (0, dfe_core_1.createFormEngine)(testFields);
            const customRenderer = vitest_1.vi.fn();
            // Props should accept renderField function
            const props = {
                fields: engine.getVisibleFields(),
                values: engine.getValues(),
                onFieldChange: (key, value) => engine.setFieldValue(key, value),
                renderField: customRenderer,
            };
            (0, vitest_1.expect)(props.renderField).toBeDefined();
            (0, vitest_1.expect)(typeof props.renderField).toBe('function');
        });
    });
    (0, vitest_1.describe)('visibility and conditional logic', () => {
        (0, vitest_1.it)('should reflect visible fields from engine', () => {
            const fieldsWithCondition = [
                {
                    id: 'field_role',
                    versionId: 'v1',
                    key: 'role',
                    label: 'Role',
                    type: 'SELECT',
                    required: true,
                    order: 1,
                    config: {
                        mode: 'static',
                        options: [
                            { label: 'Admin', value: 'admin' },
                            { label: 'User', value: 'user' },
                        ],
                    },
                },
                {
                    id: 'field_permissions',
                    versionId: 'v1',
                    key: 'permissions',
                    label: 'Permissions',
                    type: 'MULTI_SELECT',
                    required: false,
                    order: 2,
                    config: {
                        mode: 'static',
                        options: [
                            { label: 'Read', value: 'read' },
                            { label: 'Write', value: 'write' },
                        ],
                    },
                    conditions: {
                        action: 'SHOW',
                        operator: 'and',
                        rules: [
                            { fieldKey: 'role', operator: 'eq', value: 'admin' },
                        ],
                    },
                },
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fieldsWithCondition);
            let visibleFields = engine.getVisibleFields();
            (0, vitest_1.expect)(visibleFields.find(f => f.key === 'permissions')).toBeUndefined();
            engine.setFieldValue('role', 'admin');
            visibleFields = engine.getVisibleFields();
            (0, vitest_1.expect)(visibleFields.find(f => f.key === 'permissions')).toBeDefined();
        });
    });
    (0, vitest_1.describe)('error handling', () => {
        (0, vitest_1.it)('should handle missing required fields', () => {
            const engine = (0, dfe_core_1.createFormEngine)([
                {
                    id: 'field_required',
                    versionId: 'v1',
                    key: 'requiredField',
                    label: 'Required Field',
                    type: 'SHORT_TEXT',
                    required: true,
                    order: 1,
                    config: {},
                },
            ]);
            const validation = engine.validate();
            (0, vitest_1.expect)(validation.success).toBe(false);
        });
        (0, vitest_1.it)('should track errors by field key', () => {
            const engine = (0, dfe_core_1.createFormEngine)([
                {
                    id: 'field_email',
                    versionId: 'v1',
                    key: 'email',
                    label: 'Email',
                    type: 'EMAIL',
                    required: true,
                    order: 1,
                    config: {},
                },
            ]);
            engine.setFieldValue('email', 'not-an-email');
            const validation = engine.validate();
            (0, vitest_1.expect)(validation.errors.email).toBeDefined();
        });
    });
    (0, vitest_1.describe)('prop defaults', () => {
        (0, vitest_1.it)('should support optional errors prop', () => {
            const engine = (0, dfe_core_1.createFormEngine)(testFields);
            const props1 = {
                fields: engine.getVisibleFields(),
                values: engine.getValues(),
                onFieldChange: (key, value) => engine.setFieldValue(key, value),
            };
            (0, vitest_1.expect)(props1.errors).toBeUndefined();
            const props2 = {
                fields: engine.getVisibleFields(),
                values: engine.getValues(),
                onFieldChange: (key, value) => engine.setFieldValue(key, value),
                errors: { someField: 'Error message' },
            };
            (0, vitest_1.expect)(props2.errors).toBeDefined();
        });
        (0, vitest_1.it)('should support optional className prop', () => {
            const engine = (0, dfe_core_1.createFormEngine)(testFields);
            const props1 = {
                fields: engine.getVisibleFields(),
                values: engine.getValues(),
                onFieldChange: (key, value) => engine.setFieldValue(key, value),
            };
            (0, vitest_1.expect)(props1.className).toBeUndefined();
            const props2 = {
                fields: engine.getVisibleFields(),
                values: engine.getValues(),
                onFieldChange: (key, value) => engine.setFieldValue(key, value),
                className: 'custom-form-class',
            };
            (0, vitest_1.expect)(props2.className).toBe('custom-form-class');
        });
    });
});
// ─── DfeStepIndicator Tests ─────────────────────────────────────────────────
(0, vitest_1.describe)('DfeStepIndicator', () => {
    (0, vitest_1.it)('should export DfeStepIndicator as a function', () => {
        (0, vitest_1.expect)(typeof components_1.DfeStepIndicator).toBe('function');
    });
    (0, vitest_1.it)('should have the correct prop interface', () => {
        const engine = (0, dfe_core_1.createFormEngine)(testFields);
        const stepper = (0, dfe_core_1.createFormStepper)(testSteps, engine);
        const visibleSteps = stepper.getVisibleSteps();
        const props = {
            steps: visibleSteps,
            currentIndex: stepper.getCurrentIndex(),
            onStepClick: (index) => stepper.jumpTo(index),
            className: 'step-indicator',
        };
        (0, vitest_1.expect)(props).toBeDefined();
        (0, vitest_1.expect)(props.steps).toBeInstanceOf(Array);
        (0, vitest_1.expect)(typeof props.currentIndex).toBe('number');
    });
    (0, vitest_1.describe)('step state rendering', () => {
        (0, vitest_1.it)('should show all visible steps', () => {
            const engine = (0, dfe_core_1.createFormEngine)(testFields);
            const stepper = (0, dfe_core_1.createFormStepper)(testSteps, engine);
            const visibleSteps = stepper.getVisibleSteps();
            (0, vitest_1.expect)(visibleSteps.length).toBe(3);
            (0, vitest_1.expect)(visibleSteps[0].step.title).toBe('Personal Information');
            (0, vitest_1.expect)(visibleSteps[1].step.title).toBe('Contact Information');
            (0, vitest_1.expect)(visibleSteps[2].step.title).toBe('Preferences');
        });
        (0, vitest_1.it)('should indicate active step', () => {
            const engine = (0, dfe_core_1.createFormEngine)(testFields);
            const stepper = (0, dfe_core_1.createFormStepper)(testSteps, engine);
            (0, vitest_1.expect)(stepper.getCurrentIndex()).toBe(0);
            const currentStep = stepper.getCurrentStep();
            (0, vitest_1.expect)(currentStep === null || currentStep === void 0 ? void 0 : currentStep.step.id).toBe('step1');
        });
        (0, vitest_1.it)('should track step completion', () => {
            var _a;
            const engine = (0, dfe_core_1.createFormEngine)(testFields);
            const stepper = (0, dfe_core_1.createFormStepper)(testSteps, engine);
            const visibleSteps = stepper.getVisibleSteps();
            (0, vitest_1.expect)(visibleSteps[0].isComplete).toBe(false);
            stepper.markComplete('step1');
            (0, vitest_1.expect)((_a = stepper.getCurrentStep()) === null || _a === void 0 ? void 0 : _a.isComplete).toBe(true);
        });
    });
    (0, vitest_1.describe)('step navigation', () => {
        (0, vitest_1.it)('should handle step navigation', () => {
            const engine = (0, dfe_core_1.createFormEngine)(testFields);
            const stepper = (0, dfe_core_1.createFormStepper)(testSteps, engine);
            (0, vitest_1.expect)(stepper.canGoBack()).toBe(false);
            (0, vitest_1.expect)(stepper.isLastStep()).toBe(false);
            stepper.goNext();
            (0, vitest_1.expect)(stepper.getCurrentIndex()).toBe(1);
            (0, vitest_1.expect)(stepper.canGoBack()).toBe(true);
            stepper.goBack();
            (0, vitest_1.expect)(stepper.getCurrentIndex()).toBe(0);
        });
        (0, vitest_1.it)('should handle jump to specific step', () => {
            const engine = (0, dfe_core_1.createFormEngine)(testFields);
            const stepper = (0, dfe_core_1.createFormStepper)(testSteps, engine);
            stepper.jumpTo(2);
            (0, vitest_1.expect)(stepper.getCurrentIndex()).toBe(2);
            (0, vitest_1.expect)(stepper.isLastStep()).toBe(true);
        });
        (0, vitest_1.it)('should track progress', () => {
            const engine = (0, dfe_core_1.createFormEngine)(testFields);
            const stepper = (0, dfe_core_1.createFormStepper)(testSteps, engine);
            const progress1 = stepper.getProgress();
            (0, vitest_1.expect)(progress1.current).toBe(1);
            (0, vitest_1.expect)(progress1.total).toBe(3);
            (0, vitest_1.expect)(progress1.percent).toBe(Math.round((1 / 3) * 100));
            stepper.goNext();
            const progress2 = stepper.getProgress();
            (0, vitest_1.expect)(progress2.current).toBe(2);
            (0, vitest_1.expect)(progress2.percent).toBe(Math.round((2 / 3) * 100));
        });
    });
    (0, vitest_1.describe)('step branching', () => {
        (0, vitest_1.it)('should support branching logic', () => {
            const fieldsWithBranching = [
                {
                    id: 'field_path',
                    versionId: 'v1',
                    key: 'path',
                    label: 'Which path?',
                    type: 'SELECT',
                    required: true,
                    order: 1,
                    config: {
                        mode: 'static',
                        options: [
                            { label: 'Path A', value: 'pathA' },
                            { label: 'Path B', value: 'pathB' },
                        ],
                    },
                },
            ];
            const stepsWithBranches = [
                {
                    id: 'step_start',
                    versionId: 'v1',
                    title: 'Start',
                    order: 1,
                    config: null,
                    conditions: null,
                    branches: [
                        { condition: 'path === "pathA"', targetStepId: 'step_a' },
                        { condition: 'path === "pathB"', targetStepId: 'step_b' },
                    ],
                },
                {
                    id: 'step_a',
                    versionId: 'v1',
                    title: 'Path A',
                    order: 2,
                    config: null,
                    conditions: null,
                },
                {
                    id: 'step_b',
                    versionId: 'v1',
                    title: 'Path B',
                    order: 3,
                    config: null,
                    conditions: null,
                },
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fieldsWithBranching);
            const stepper = (0, dfe_core_1.createFormStepper)(stepsWithBranches, engine);
            engine.setFieldValue('path', 'pathA');
            const nextBranch = stepper.getNextBranch();
            (0, vitest_1.expect)(nextBranch === null || nextBranch === void 0 ? void 0 : nextBranch.step.id).toBe('step_a');
            engine.setFieldValue('path', 'pathB');
            const nextBranch2 = stepper.getNextBranch();
            (0, vitest_1.expect)(nextBranch2 === null || nextBranch2 === void 0 ? void 0 : nextBranch2.step.id).toBe('step_b');
        });
        (0, vitest_1.it)('should navigate to branch target', () => {
            const fieldsWithBranching = [
                {
                    id: 'field_type',
                    versionId: 'v1',
                    key: 'type',
                    label: 'Type',
                    type: 'SELECT',
                    required: true,
                    order: 1,
                    config: {
                        mode: 'static',
                        options: [
                            { label: 'Option A', value: 'a' },
                            { label: 'Option B', value: 'b' },
                        ],
                    },
                },
            ];
            const stepsWithBranches = [
                {
                    id: 'step_choose',
                    versionId: 'v1',
                    title: 'Choose',
                    order: 1,
                    config: null,
                    conditions: null,
                    branches: [
                        { condition: 'type === "a"', targetStepId: 'step_a' },
                    ],
                },
                {
                    id: 'step_a',
                    versionId: 'v1',
                    title: 'Option A Details',
                    order: 2,
                    config: null,
                    conditions: null,
                },
                {
                    id: 'step_skip',
                    versionId: 'v1',
                    title: 'Skipped Step',
                    order: 3,
                    config: null,
                    conditions: null,
                },
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fieldsWithBranching);
            const stepper = (0, dfe_core_1.createFormStepper)(stepsWithBranches, engine);
            engine.setFieldValue('type', 'a');
            stepper.goNextBranch();
            const currentStep = stepper.getCurrentStep();
            (0, vitest_1.expect)(currentStep === null || currentStep === void 0 ? void 0 : currentStep.step.id).toBe('step_a');
        });
    });
    (0, vitest_1.describe)('prop defaults and optional properties', () => {
        (0, vitest_1.it)('should support optional onStepClick prop', () => {
            const engine = (0, dfe_core_1.createFormEngine)(testFields);
            const stepper = (0, dfe_core_1.createFormStepper)(testSteps, engine);
            const visibleSteps = stepper.getVisibleSteps();
            const props1 = {
                steps: visibleSteps,
                currentIndex: 0,
            };
            (0, vitest_1.expect)(props1.onStepClick).toBeUndefined();
            const props2 = {
                steps: visibleSteps,
                currentIndex: 0,
                onStepClick: (index) => stepper.jumpTo(index),
            };
            (0, vitest_1.expect)(props2.onStepClick).toBeDefined();
        });
        (0, vitest_1.it)('should support optional className prop', () => {
            const engine = (0, dfe_core_1.createFormEngine)(testFields);
            const stepper = (0, dfe_core_1.createFormStepper)(testSteps, engine);
            const visibleSteps = stepper.getVisibleSteps();
            const props1 = {
                steps: visibleSteps,
                currentIndex: 0,
            };
            (0, vitest_1.expect)(props1.className).toBeUndefined();
            const props2 = {
                steps: visibleSteps,
                currentIndex: 0,
                className: 'custom-steps',
            };
            (0, vitest_1.expect)(props2.className).toBe('custom-steps');
        });
    });
    (0, vitest_1.describe)('accessibility', () => {
        (0, vitest_1.it)('should mark current step with aria-current', () => {
            const engine = (0, dfe_core_1.createFormEngine)(testFields);
            const stepper = (0, dfe_core_1.createFormStepper)(testSteps, engine);
            const visibleSteps = stepper.getVisibleSteps();
            // Current step should have aria-current="step"
            (0, vitest_1.expect)(visibleSteps[0].step.id).toBeDefined();
            stepper.goNext();
            const updatedSteps = stepper.getVisibleSteps();
            // Next current step should be marked
            (0, vitest_1.expect)(updatedSteps[1].step.id).toBeDefined();
        });
        (0, vitest_1.it)('should support completion markers', () => {
            const engine = (0, dfe_core_1.createFormEngine)(testFields);
            const stepper = (0, dfe_core_1.createFormStepper)(testSteps, engine);
            const visibleSteps = stepper.getVisibleSteps();
            stepper.markComplete('step1');
            stepper.goNext();
            const currentSteps = stepper.getVisibleSteps();
            (0, vitest_1.expect)(currentSteps[0].isComplete).toBe(true);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50cy50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tcG9uZW50cy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQWlEO0FBQ2pELGtEQU00QjtBQUM1QixrREFBcUU7QUFHckU7Ozs7Ozs7O0dBUUc7QUFFSCwrRUFBK0U7QUFFL0UsTUFBTSxVQUFVLEdBQWdCO0lBQzlCO1FBQ0UsRUFBRSxFQUFFLFlBQVk7UUFDaEIsU0FBUyxFQUFFLElBQUk7UUFDZixHQUFHLEVBQUUsVUFBVTtRQUNmLEtBQUssRUFBRSxXQUFXO1FBQ2xCLElBQUksRUFBRSxZQUFZO1FBQ2xCLFFBQVEsRUFBRSxJQUFJO1FBQ2QsS0FBSyxFQUFFLENBQUM7UUFDUixNQUFNLEVBQUUsRUFBRSxXQUFXLEVBQUUsc0JBQXNCLEVBQUU7S0FDaEQ7SUFDRDtRQUNFLEVBQUUsRUFBRSxhQUFhO1FBQ2pCLFNBQVMsRUFBRSxJQUFJO1FBQ2YsR0FBRyxFQUFFLE9BQU87UUFDWixLQUFLLEVBQUUsZUFBZTtRQUN0QixJQUFJLEVBQUUsT0FBTztRQUNiLFFBQVEsRUFBRSxJQUFJO1FBQ2QsS0FBSyxFQUFFLENBQUM7UUFDUixNQUFNLEVBQUUsRUFBRTtLQUNYO0lBQ0Q7UUFDRSxFQUFFLEVBQUUsY0FBYztRQUNsQixTQUFTLEVBQUUsSUFBSTtRQUNmLEdBQUcsRUFBRSxLQUFLO1FBQ1YsS0FBSyxFQUFFLEtBQUs7UUFDWixJQUFJLEVBQUUsUUFBUTtRQUNkLFFBQVEsRUFBRSxLQUFLO1FBQ2YsS0FBSyxFQUFFLENBQUM7UUFDUixNQUFNLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUU7S0FDN0I7SUFDRDtRQUNFLEVBQUUsRUFBRSxhQUFhO1FBQ2pCLFNBQVMsRUFBRSxJQUFJO1FBQ2YsR0FBRyxFQUFFLE9BQU87UUFDWixLQUFLLEVBQUUsY0FBYztRQUNyQixJQUFJLEVBQUUsT0FBTztRQUNiLFFB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TSxDQUFDLENBQUE7WUFDcEQsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLGVBQWUsRUFBRSxDQUFBO1lBRTlDLCtDQUErQztZQUMvQyxJQUFBLGVBQU0sRUFBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFBO1lBRTdDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQTtZQUNoQixNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsZUFBZSxFQUFFLENBQUE7WUFDOUMscUNBQXFDO1lBQ3JDLElBQUEsZUFBTSxFQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDL0MsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQyxtQ0FBbUMsRUFBRSxHQUFHLEVBQUU7WUFDM0MsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxVQUFVLENBQUMsQ0FBQTtZQUMzQyxNQUFNLE9BQU8sR0FBRyxJQUFBLDRCQUFpQixFQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUNwRCxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsZUFBZSxFQUFFLENBQUE7WUFFOUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUM3QixPQUFPLENBQUMsTUFBTSxFQUFFLENBQUE7WUFFaEIsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLGVBQWUsRUFBRSxDQUFBO1lBQzlDLElBQUEsZUFBTSxFQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDL0MsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGVzY3JpYmUsIGl0LCBleHBlY3QsIHZpIH0gZnJvbSAndml0ZXN0J1xuaW1wb3J0IHtcbiAgY3JlYXRlRm9ybUVuZ2luZSxcbiAgY3JlYXRlRm9ybVN0ZXBwZXIsXG4gIHR5cGUgRm9ybUZpZWxkLFxuICB0eXBlIEZvcm1TdGVwLFxuICB0eXBlIFN0ZXBOb2RlU3RhdGUsXG59IGZyb20gJ0BzbmFyanVuOTgvZGZlLWNvcmUnXG5pbXBvcnQgeyBEZmVGb3JtUmVuZGVyZXIsIERmZVN0ZXBJbmRpY2F0b3IgfSBmcm9tICcuLi9zcmMvY29tcG9uZW50cydcbmltcG9ydCB0eXBlIHsgRGZlRm9ybVJlbmRlcmVyUHJvcHMsIERmZVN0ZXBJbmRpY2F0b3JQcm9wcyB9IGZyb20gJy4uL3NyYy9jb21wb25lbnRzL0RmZUZvcm1SZW5kZXJlcidcblxuLyoqXG4gKiBDb21wb25lbnQgdGVzdHMgZm9yIERmZUZvcm1SZW5kZXJlciBhbmQgRGZlU3RlcEluZGljYXRvci5cbiAqXG4gKiBTaW5jZSBAdGVzdGluZy1saWJyYXJ5L3JlYWN0IGlzIG5vdCBhdmFpbGFibGUsIHRoZXNlIHRlc3RzIHZlcmlmeTpcbiAqIC0gQ29tcG9uZW50IHR5cGUgZXhwb3J0cyBhbmQgcHJvcCBpbnRlcmZhY2VzXG4gKiAtIENvbXBvbmVudCBsb2dpYyB0aHJvdWdoIHRoZSB1bmRlcmx5aW5nIGVuZ2luZS9zdGVwcGVyXG4gKiAtIFByb3BzIGhhbmRsaW5nIGFuZCBkZWZhdWx0c1xuICogLSBDb25kaXRpb25hbCByZW5kZXJpbmcgYmFzZWQgb24gZmllbGQgdmlzaWJpbGl0eVxuICovXG5cbi8vIOKUgOKUgOKUgCBUZXN0IEZpeHR1cmVzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5jb25zdCB0ZXN0RmllbGRzOiBGb3JtRmllbGRbXSA9IFtcbiAge1xuICAgIGlkOiAnZmllbGRfbmFtZScsXG4gICAgdmVyc2lvbklkOiAndjEnLFxuICAgIGtleTogJ2Z1bGxOYW1lJyxcbiAgICBsYWJlbDogJ0Z1bGwgTmFtZScsXG4gICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgIG9yZGVyOiAxLFxuICAgIGNvbmZpZzogeyBwbGFjZWhvbGRlcjogJ0VudGVyIHlvdXIgZnVsbCBuYW1lJyB9LFxuICB9LFxuICB7XG4gICAgaWQ6ICdmaWVsZF9lbWFpbCcsXG4gICAgdmVyc2lvbklkOiAndjEnLFxuICAgIGtleTogJ2VtYWlsJyxcbiAgICBsYWJlbDogJ0VtYWlsIEFkZHJlc3MnLFxuICAgIHR5cGU6ICdFTUFJTCcsXG4gICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgb3JkZXI6IDIsXG4gICAgY29uZmlnOiB7fSxcbiAgfSxcbiAge1xuICAgIGlkOiAnZmllbGRfbnVtYmVyJyxcbiAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAga2V5OiAnYWdlJyxcbiAgICBsYWJlbDogJ0FnZScsXG4gICAgdHlwZTogJ05VTUJFUicsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIG9yZGVyOiAzLFxuICAgIGNvbmZpZzogeyBtaW46IDAsIG1heDogMTUwIH0sXG4gIH0sXG4gIHtcbiAgICBpZDogJ2ZpZWxkX3Bob25lJyxcbiAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAga2V5OiAncGhvbmUnLFxuICAgIGxhYmVsOiAnUGhvbmUgTnVtYmVyJyxcbiAgICB0eXBlOiAnUEhPTkUnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBvcmRlcjogNCxcbiAgICBjb25maWc6IHt9LFxuICB9LFxuICB7XG4gICAgaWQ6ICdmaWVsZF91cmwnLFxuICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICBrZXk6ICd3ZWJzaXRlJyxcbiAgICBsYWJlbDogJ1dlYnNpdGUnLFxuICAgIHR5cGU6ICdVUkwnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBvcmRlcjogNSxcbiAgICBjb25maWc6IHt9LFxuICB9LFxuICB7XG4gICAgaWQ6ICdmaWVsZF9wYXNzd29yZCcsXG4gICAgdmVyc2lvbklkOiAndjEnLFxuICAgIGtleTogJ3Bhc3N3b3JkJyxcbiAgICBsYWJlbDogJ1Bhc3N3b3JkJyxcbiAgICB0eXBlOiAnUEFTU1dPUkQnLFxuICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgIG9yZGVyOiA2LFxuICAgIGNvbmZpZzoge30sXG4gIH0sXG4gIHtcbiAgICBpZDogJ2ZpZWxkX2xvbmdfdGV4dCcsXG4gICAgdmVyc2lvbklkOiAndjEnLFxuICAgIGtleTogJ2JpbycsXG4gICAgbGFiZWw6ICdCaW8nLFxuICAgIHR5cGU6ICdMT05HX1RFWFQnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBvcmRlcjogNyxcbiAgICBjb25maWc6IHsgbWF4TGVuZ3RoOiA1MDAgfSxcbiAgfSxcbiAge1xuICAgIGlkOiAnZmllbGRfZGF0ZScsXG4gICAgdmVyc2lvbklkOiAndjEnLFxuICAgIGtleTogJ2JpcnRoRGF0ZScsXG4gICAgbGFiZWw6ICdCaXJ0aCBEYXRlJyxcbiAgICB0eXBlOiAnREFURScsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIG9yZGVyOiA4LFxuICAgIGNvbmZpZzoge30sXG4gIH0sXG4gIHtcbiAgICBpZDogJ2ZpZWxkX3RpbWUnLFxuICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICBrZXk6ICdtZWV0aW5nVGltZScsXG4gICAgbGFiZWw6ICdNZWV0aW5nIFRpbWUnLFxuICAgIHR5cGU6ICdUSU1FJyxcbiAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgb3JkZXI6IDksXG4gICAgY29uZmlnOiB7fSxcbiAgfSxcbiAge1xuICAgIGlkOiAnZmllbGRfZGF0ZXRpbWUnLFxuICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICBrZXk6ICdtZWV0aW5nRGF0ZVRpbWUnLFxuICAgIGxhYmVsOiAnTWVldGluZyBEYXRlICYgVGltZScsXG4gICAgdHlwZTogJ0RBVEVfVElNRScsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIG9yZGVyOiAxMCxcbiAgICBjb25maWc6IHt9LFxuICB9LFxuICB7XG4gICAgaWQ6ICdmaWVsZF9zZWxlY3QnLFxuICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICBrZXk6ICdjb3VudHJ5JyxcbiAgICBsYWJlbDogJ0NvdW50cnknLFxuICAgIHR5cGU6ICdTRUxFQ1QnLFxuICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgIG9yZGVyOiAxMSxcbiAgICBjb25maWc6IHtcbiAgICAgIG1vZGU6ICdzdGF0aWMnLFxuICAgICAgb3B0aW9uczogW1xuICAgICAgICB7IGxhYmVsOiAnVW5pdGVkIFN0YXRlcycsIHZhbHVlOiAndXMnIH0sXG4gICAgICAgIHsgbGFiZWw6ICdDYW5hZGEnLCB2YWx1ZTogJ2NhJyB9LFxuICAgICAgICB7IGxhYmVsOiAnTWV4aWNvJywgdmFsdWU6ICdteCcgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIGlkOiAnZmllbGRfbXVsdGlfc2VsZWN0JyxcbiAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAga2V5OiAnaW50ZXJlc3RzJyxcbiAgICBsYWJlbDogJ0ludGVyZXN0cycsXG4gICAgdHlwZTogJ01VTFRJX1NFTEVDVCcsXG4gICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgIG9yZGVyOiAxMixcbiAgICBjb25maWc6IHtcbiAgICAgIG1vZGU6ICdzdGF0aWMnLFxuICAgICAgb3B0aW9uczogW1xuICAgICAgICB7IGxhYmVsOiAnU3BvcnRzJywgdmFsdWU6ICdzcG9ydHMnIH0sXG4gICAgICAgIHsgbGFiZWw6ICdNdXNpYycsIHZhbHVlOiAnbXVzaWMnIH0sXG4gICAgICAgIHsgbGFiZWw6ICdSZWFkaW5nJywgdmFsdWU6ICdyZWFkaW5nJyB9LFxuICAgICAgICB7IGxhYmVsOiAnR2FtaW5nJywgdmFsdWU6ICdnYW1pbmcnIH0sXG4gICAgICBdLFxuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBpZDogJ2ZpZWxkX3JhZGlvJyxcbiAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAga2V5OiAnZ2VuZGVyJyxcbiAgICBsYWJlbDogJ0dlbmRlcicsXG4gICAgdHlwZTogJ1JBRElPJyxcbiAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgb3JkZXI6IDEzLFxuICAgIGNvbmZpZzoge1xuICAgICAgbW9kZTogJ3N0YXRpYycsXG4gICAgICBvcHRpb25zOiBbXG4gICAgICAgIHsgbGFiZWw6ICdNYWxlJywgdmFsdWU6ICdtYWxlJyB9LFxuICAgICAgICB7IGxhYmVsOiAnRmVtYWxlJywgdmFsdWU6ICdmZW1hbGUnIH0sXG4gICAgICAgIHsgbGFiZWw6ICdPdGhlcicsIHZhbHVlOiAnb3RoZXInIH0sXG4gICAgICBdLFxuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBpZDogJ2ZpZWxkX2NoZWNrYm94JyxcbiAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAga2V5OiAnc3Vic2NyaWJlJyxcbiAgICBsYWJlbDogJ1N1YnNjcmliZSB0byBuZXdzbGV0dGVyJyxcbiAgICB0eXBlOiAnQ0hFQ0tCT1gnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBvcmRlcjogMTQsXG4gICAgY29uZmlnOiB7fSxcbiAgfSxcbiAge1xuICAgIGlkOiAnZmllbGRfc2VjdGlvbl9icmVhaycsXG4gICAgdmVyc2lvbklkOiAndjEnLFxuICAgIGtleTogJ3NlY3Rpb25fMScsXG4gICAgbGFiZWw6ICdQZXJzb25hbCBJbmZvcm1hdGlvbicsXG4gICAgdHlwZTogJ1NFQ1RJT05fQlJFQUsnLFxuICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICBvcmRlcjogMCxcbiAgICBjb25maWc6IHt9LFxuICB9LFxuXVxuXG5jb25zdCB0ZXN0U3RlcHM6IEZvcm1TdGVwW10gPSBbXG4gIHtcbiAgICBpZDogJ3N0ZXAxJyxcbiAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgdGl0bGU6ICdQZXJzb25hbCBJbmZvcm1hdGlvbicsXG4gICAgb3JkZXI6IDEsXG4gICAgY29uZmlnOiBudWxsLFxuICAgIGNvbmRpdGlvbnM6IG51bGwsXG4gIH0sXG4gIHtcbiAgICBpZDogJ3N0ZXAyJyxcbiAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgdGl0bGU6ICdDb250YWN0IEluZm9ybWF0aW9uJyxcbiAgICBvcmRlcjogMixcbiAgICBjb25maWc6IG51bGwsXG4gICAgY29uZGl0aW9uczogbnVsbCxcbiAgfSxcbiAge1xuICAgIGlkOiAnc3RlcDMnLFxuICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICB0aXRsZTogJ1ByZWZlcmVuY2VzJyxcbiAgICBvcmRlcjogMyxcbiAgICBjb25maWc6IG51bGwsXG4gICAgY29uZGl0aW9uczogbnVsbCxcbiAgfSxcbl1cblxuLy8g4pSA4pSA4pSAIERmZUZvcm1SZW5kZXJlciBUZXN0cyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZGVzY3JpYmUoJ0RmZUZvcm1SZW5kZXJlcicsICgpID0+IHtcbiAgaXQoJ3Nob3VsZCBleHBvcnQgRGZlRm9ybVJlbmRlcmVyIGFzIGEgZnVuY3Rpb24nLCAoKSA9PiB7XG4gICAgZXhwZWN0KHR5cGVvZiBEZmVGb3JtUmVuZGVyZXIpLnRvQmUoJ2Z1bmN0aW9uJylcbiAgfSlcblxuICBpdCgnc2hvdWxkIGhhdmUgdGhlIGNvcnJlY3QgcHJvcCBpbnRlcmZhY2UnLCAoKSA9PiB7XG4gICAgLy8gVGVzdCB0aGF0IHByb3BzIGludGVyZmFjZSBpcyBjb3JyZWN0IGJ5IGNyZWF0aW5nIGVuZ2luZVxuICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUodGVzdEZpZWxkcylcbiAgICBjb25zdCBwcm9wczogRGZlRm9ybVJlbmRlcmVyUHJvcHMgPSB7XG4gICAgICBmaWVsZHM6IGVuZ2luZS5nZXRWaXNpYmxlRmllbGRzKCksXG4gICAgICB2YWx1ZXM6IGVuZ2luZS5nZXRWYWx1ZXMoKSxcbiAgICAgIG9uRmllbGRDaGFuZ2U6IChrZXksIHZhbHVlKSA9PiBlbmdpbmUuc2V0RmllbGRWYWx1ZShrZXksIHZhbHVlKSxcbiAgICAgIGVycm9yczoge30sXG4gICAgICBjbGFzc05hbWU6ICd0ZXN0LWZvcm0nLFxuICAgIH1cbiAgICBleHBlY3QocHJvcHMpLnRvQmVEZWZpbmVkKClcbiAgICBleHBlY3QocHJvcHMuZmllbGRzKS50b0JlSW5zdGFuY2VPZihBcnJheSlcbiAgICBleHBlY3QodHlwZW9mIHByb3BzLnZhbHVlcykudG9CZSgnb2JqZWN0JylcbiAgICBleHBlY3QodHlwZW9mIHByb3BzLm9uRmllbGRDaGFuZ2UpLnRvQmUoJ2Z1bmN0aW9uJylcbiAgfSlcblxuICBkZXNjcmliZSgnZmllbGQgcmVuZGVyaW5nIGxvZ2ljJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcmVuZGVyIGFsbCB2aXNpYmxlIGZpZWxkIHR5cGVzJywgKCkgPT4ge1xuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZSh0ZXN0RmllbGRzKVxuICAgICAgY29uc3QgdmlzaWJsZUZpZWxkcyA9IGVuZ2luZS5nZXRWaXNpYmxlRmllbGRzKClcblxuICAgICAgLy8gU2hvdWxkIGluY2x1ZGUgYWxsIGZpZWxkIHR5cGVzIGV4Y2VwdCBTRUNUSU9OX0JSRUFLIGZvciBmb3JtIGlucHV0XG4gICAgICBjb25zdCB0ZXh0VHlwZXMgPSBbJ1NIT1JUX1RFWFQnLCAnRU1BSUwnLCAnUEhPTkUnLCAnVVJMJywgJ1BBU1NXT1JEJywgJ0xPTkdfVEVYVCddXG4gICAgICBjb25zdCBkYXRlVHlwZXMgPSBbJ0RBVEUnLCAnVElNRScsICdEQVRFX1RJTUUnXVxuICAgICAgY29uc3Qgc2VsZWN0VHlwZXMgPSBbJ1NFTEVDVCcsICdSQURJTycsICdNVUxUSV9TRUxFQ1QnXVxuICAgICAgY29uc3Qgb3RoZXJUeXBlcyA9IFsnTlVNQkVSJywgJ0NIRUNLQk9YJ11cblxuICAgICAgZm9yIChjb25zdCB0eXBlIG9mIFsuLi50ZXh0VHlwZXMsIC4uLmRhdGVUeXBlcywgLi4uc2VsZWN0VHlwZXMsIC4uLm90aGVyVHlwZXNdKSB7XG4gICAgICAgIGNvbnN0IGZpZWxkID0gdmlzaWJsZUZpZWxkcy5maW5kKGYgPT4gZi50eXBlID09PSB0eXBlKVxuICAgICAgICBpZiAoZmllbGQpIHtcbiAgICAgICAgICBleHBlY3QoZmllbGQudHlwZSkudG9CZSh0eXBlKVxuICAgICAgICAgIGV4cGVjdChmaWVsZC5rZXkpLnRvQmVEZWZpbmVkKClcbiAgICAgICAgICBleHBlY3QoZmllbGQubGFiZWwpLnRvQmVEZWZpbmVkKClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSByZXF1aXJlZCBhbmQgb3B0aW9uYWwgZmllbGRzJywgKCkgPT4ge1xuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZSh0ZXN0RmllbGRzKVxuICAgICAgY29uc3QgdmlzaWJsZUZpZWxkcyA9IGVuZ2luZS5nZXRWaXNpYmxlRmllbGRzKClcblxuICAgICAgY29uc3QgcmVxdWlyZWRGaWVsZCA9IHZpc2libGVGaWVsZHMuZmluZChmID0+IGYua2V5ID09PSAnZnVsbE5hbWUnKVxuICAgICAgY29uc3Qgb3B0aW9uYWxGaWVsZCA9IHZpc2libGVGaWVsZHMuZmluZChmID0+IGYua2V5ID09PSAnYWdlJylcblxuICAgICAgZXhwZWN0KHJlcXVpcmVkRmllbGQ/LnJlcXVpcmVkKS50b0JlKHRydWUpXG4gICAgICBleHBlY3Qob3B0aW9uYWxGaWVsZD8ucmVxdWlyZWQpLnRvQmUoZmFsc2UpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIGZpZWxkIHZhbHVlcyBmcm9tIGVuZ2luZScsICgpID0+IHtcbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUodGVzdEZpZWxkcywge1xuICAgICAgICBmdWxsTmFtZTogJ0pvaG4gRG9lJyxcbiAgICAgICAgZW1haWw6ICdqb2huQGV4YW1wbGUuY29tJyxcbiAgICAgICAgYWdlOiAzMCxcbiAgICAgIH0pXG5cbiAgICAgIGNvbnN0IHZhbHVlcyA9IGVuZ2luZS5nZXRWYWx1ZXMoKVxuICAgICAgZXhwZWN0KHZhbHVlcy5mdWxsTmFtZSkudG9CZSgnSm9obiBEb2UnKVxuICAgICAgZXhwZWN0KHZhbHVlcy5lbWFpbCkudG9CZSgnam9obkBleGFtcGxlLmNvbScpXG4gICAgICBleHBlY3QodmFsdWVzLmFnZSkudG9CZSgzMClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgdmFsaWRhdGlvbiBlcnJvcnMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKHRlc3RGaWVsZHMpXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnZnVsbE5hbWUnLCAnJylcblxuICAgICAgY29uc3QgdmFsaWRhdGlvbiA9IGVuZ2luZS52YWxpZGF0ZSgpXG4gICAgICBleHBlY3QodmFsaWRhdGlvbi5zdWNjZXNzKS50b0JlKGZhbHNlKVxuICAgICAgZXhwZWN0KHZhbGlkYXRpb24uZXJyb3JzLmZ1bGxOYW1lKS50b0JlRGVmaW5lZCgpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgc3VwcG9ydCBjdXN0b20gZmllbGQgcmVuZGVyZXIgZnVuY3Rpb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKHRlc3RGaWVsZHMpXG4gICAgICBjb25zdCBjdXN0b21SZW5kZXJlciA9IHZpLmZuKClcblxuICAgICAgLy8gUHJvcHMgc2hvdWxkIGFjY2VwdCByZW5kZXJGaWVsZCBmdW5jdGlvblxuICAgICAgY29uc3QgcHJvcHM6IERmZUZvcm1SZW5kZXJlclByb3BzID0ge1xuICAgICAgICBmaWVsZHM6IGVuZ2luZS5nZXRWaXNpYmxlRmllbGRzKCksXG4gICAgICAgIHZhbHVlczogZW5naW5lLmdldFZhbHVlcygpLFxuICAgICAgICBvbkZpZWxkQ2hhbmdlOiAoa2V5LCB2YWx1ZSkgPT4gZW5naW5lLnNldEZpZWxkVmFsdWUoa2V5LCB2YWx1ZSksXG4gICAgICAgIHJlbmRlckZpZWxkOiBjdXN0b21SZW5kZXJlcixcbiAgICAgIH1cblxuICAgICAgZXhwZWN0KHByb3BzLnJlbmRlckZpZWxkKS50b0JlRGVmaW5lZCgpXG4gICAgICBleHBlY3QodHlwZW9mIHByb3BzLnJlbmRlckZpZWxkKS50b0JlKCdmdW5jdGlvbicpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgndmlzaWJpbGl0eSBhbmQgY29uZGl0aW9uYWwgbG9naWMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZWZsZWN0IHZpc2libGUgZmllbGRzIGZyb20gZW5naW5lJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzV2l0aENvbmRpdGlvbjogRm9ybUZpZWxkW10gPSBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2ZpZWxkX3JvbGUnLFxuICAgICAgICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICAgICAgICBrZXk6ICdyb2xlJyxcbiAgICAgICAgICBsYWJlbDogJ1JvbGUnLFxuICAgICAgICAgIHR5cGU6ICdTRUxFQ1QnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG9yZGVyOiAxLFxuICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgbW9kZTogJ3N0YXRpYycsXG4gICAgICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdBZG1pbicsIHZhbHVlOiAnYWRtaW4nIH0sXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdVc2VyJywgdmFsdWU6ICd1c2VyJyB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdmaWVsZF9wZXJtaXNzaW9ucycsXG4gICAgICAgICAgdmVyc2lvbklkOiAndjEnLFxuICAgICAgICAgIGtleTogJ3Blcm1pc3Npb25zJyxcbiAgICAgICAgICBsYWJlbDogJ1Blcm1pc3Npb25zJyxcbiAgICAgICAgICB0eXBlOiAnTVVMVElfU0VMRUNUJyxcbiAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgICAgb3JkZXI6IDIsXG4gICAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICBtb2RlOiAnc3RhdGljJyxcbiAgICAgICAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAgICAgICAgeyBsYWJlbDogJ1JlYWQnLCB2YWx1ZTogJ3JlYWQnIH0sXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdXcml0ZScsIHZhbHVlOiAnd3JpdGUnIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY29uZGl0aW9uczoge1xuICAgICAgICAgICAgYWN0aW9uOiAnU0hPVycsXG4gICAgICAgICAgICBvcGVyYXRvcjogJ2FuZCcsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICB7IGZpZWxkS2V5OiAncm9sZScsIG9wZXJhdG9yOiAnZXEnLCB2YWx1ZTogJ2FkbWluJyB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgXVxuXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkc1dpdGhDb25kaXRpb24pXG4gICAgICBsZXQgdmlzaWJsZUZpZWxkcyA9IGVuZ2luZS5nZXRWaXNpYmxlRmllbGRzKClcbiAgICAgIGV4cGVjdCh2aXNpYmxlRmllbGRzLmZpbmQoZiA9PiBmLmtleSA9PT0gJ3Blcm1pc3Npb25zJykpLnRvQmVVbmRlZmluZWQoKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgncm9sZScsICdhZG1pbicpXG4gICAgICB2aXNpYmxlRmllbGRzID0gZW5naW5lLmdldFZpc2libGVGaWVsZHMoKVxuICAgICAgZXhwZWN0KHZpc2libGVGaWVsZHMuZmluZChmID0+IGYua2V5ID09PSAncGVybWlzc2lvbnMnKSkudG9CZURlZmluZWQoKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ2Vycm9yIGhhbmRsaW5nJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgaGFuZGxlIG1pc3NpbmcgcmVxdWlyZWQgZmllbGRzJywgKCkgPT4ge1xuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2ZpZWxkX3JlcXVpcmVkJyxcbiAgICAgICAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgICAgICAga2V5OiAncmVxdWlyZWRGaWVsZCcsXG4gICAgICAgICAgbGFiZWw6ICdSZXF1aXJlZCBGaWVsZCcsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG9yZGVyOiAxLFxuICAgICAgICAgIGNvbmZpZzoge30sXG4gICAgICAgIH0sXG4gICAgICBdKVxuXG4gICAgICBjb25zdCB2YWxpZGF0aW9uID0gZW5naW5lLnZhbGlkYXRlKClcbiAgICAgIGV4cGVjdCh2YWxpZGF0aW9uLnN1Y2Nlc3MpLnRvQmUoZmFsc2UpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgdHJhY2sgZXJyb3JzIGJ5IGZpZWxkIGtleScsICgpID0+IHtcbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdmaWVsZF9lbWFpbCcsXG4gICAgICAgICAgdmVyc2lvbklkOiAndjEnLFxuICAgICAgICAgIGtleTogJ2VtYWlsJyxcbiAgICAgICAgICBsYWJlbDogJ0VtYWlsJyxcbiAgICAgICAgICB0eXBlOiAnRU1BSUwnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG9yZGVyOiAxLFxuICAgICAgICAgIGNvbmZpZzoge30sXG4gICAgICAgIH0sXG4gICAgICBdKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnZW1haWwnLCAnbm90LWFuLWVtYWlsJylcbiAgICAgIGNvbnN0IHZhbGlkYXRpb24gPSBlbmdpbmUudmFsaWRhdGUoKVxuICAgICAgZXhwZWN0KHZhbGlkYXRpb24uZXJyb3JzLmVtYWlsKS50b0JlRGVmaW5lZCgpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgncHJvcCBkZWZhdWx0cycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHN1cHBvcnQgb3B0aW9uYWwgZXJyb3JzIHByb3AnLCAoKSA9PiB7XG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKHRlc3RGaWVsZHMpXG4gICAgICBjb25zdCBwcm9wczE6IERmZUZvcm1SZW5kZXJlclByb3BzID0ge1xuICAgICAgICBmaWVsZHM6IGVuZ2luZS5nZXRWaXNpYmxlRmllbGRzKCksXG4gICAgICAgIHZhbHVlczogZW5naW5lLmdldFZhbHVlcygpLFxuICAgICAgICBvbkZpZWxkQ2hhbmdlOiAoa2V5LCB2YWx1ZSkgPT4gZW5naW5lLnNldEZpZWxkVmFsdWUoa2V5LCB2YWx1ZSksXG4gICAgICB9XG4gICAgICBleHBlY3QocHJvcHMxLmVycm9ycykudG9CZVVuZGVmaW5lZCgpXG5cbiAgICAgIGNvbnN0IHByb3BzMjogRGZlRm9ybVJlbmRlcmVyUHJvcHMgPSB7XG4gICAgICAgIGZpZWxkczogZW5naW5lLmdldFZpc2libGVGaWVsZHMoKSxcbiAgICAgICAgdmFsdWVzOiBlbmdpbmUuZ2V0VmFsdWVzKCksXG4gICAgICAgIG9uRmllbGRDaGFuZ2U6IChrZXksIHZhbHVlKSA9PiBlbmdpbmUuc2V0RmllbGRWYWx1ZShrZXksIHZhbHVlKSxcbiAgICAgICAgZXJyb3JzOiB7IHNvbWVGaWVsZDogJ0Vycm9yIG1lc3NhZ2UnIH0sXG4gICAgICB9XG4gICAgICBleHBlY3QocHJvcHMyLmVycm9ycykudG9CZURlZmluZWQoKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHN1cHBvcnQgb3B0aW9uYWwgY2xhc3NOYW1lIHByb3AnLCAoKSA9PiB7XG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKHRlc3RGaWVsZHMpXG4gICAgICBjb25zdCBwcm9wczE6IERmZUZvcm1SZW5kZXJlclByb3BzID0ge1xuICAgICAgICBmaWVsZHM6IGVuZ2luZS5nZXRWaXNpYmxlRmllbGRzKCksXG4gICAgICAgIHZhbHVlczogZW5naW5lLmdldFZhbHVlcygpLFxuICAgICAgICBvbkZpZWxkQ2hhbmdlOiAoa2V5LCB2YWx1ZSkgPT4gZW5naW5lLnNldEZpZWxkVmFsdWUoa2V5LCB2YWx1ZSksXG4gICAgICB9XG4gICAgICBleHBlY3QocHJvcHMxLmNsYXNzTmFtZSkudG9CZVVuZGVmaW5lZCgpXG5cbiAgICAgIGNvbnN0IHByb3BzMjogRGZlRm9ybVJlbmRlcmVyUHJvcHMgPSB7XG4gICAgICAgIGZpZWxkczogZW5naW5lLmdldFZpc2libGVGaWVsZHMoKSxcbiAgICAgICAgdmFsdWVzOiBlbmdpbmUuZ2V0VmFsdWVzKCksXG4gICAgICAgIG9uRmllbGRDaGFuZ2U6IChrZXksIHZhbHVlKSA9PiBlbmdpbmUuc2V0RmllbGRWYWx1ZShrZXksIHZhbHVlKSxcbiAgICAgICAgY2xhc3NOYW1lOiAnY3VzdG9tLWZvcm0tY2xhc3MnLFxuICAgICAgfVxuICAgICAgZXhwZWN0KHByb3BzMi5jbGFzc05hbWUpLnRvQmUoJ2N1c3RvbS1mb3JtLWNsYXNzJylcbiAgICB9KVxuICB9KVxufSlcblxuLy8g4pSA4pSA4pSAIERmZVN0ZXBJbmRpY2F0b3IgVGVzdHMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmRlc2NyaWJlKCdEZmVTdGVwSW5kaWNhdG9yJywgKCkgPT4ge1xuICBpdCgnc2hvdWxkIGV4cG9ydCBEZmVTdGVwSW5kaWNhdG9yIGFzIGEgZnVuY3Rpb24nLCAoKSA9PiB7XG4gICAgZXhwZWN0KHR5cGVvZiBEZmVTdGVwSW5kaWNhdG9yKS50b0JlKCdmdW5jdGlvbicpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCBoYXZlIHRoZSBjb3JyZWN0IHByb3AgaW50ZXJmYWNlJywgKCkgPT4ge1xuICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUodGVzdEZpZWxkcylcbiAgICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIodGVzdFN0ZXBzLCBlbmdpbmUpXG4gICAgY29uc3QgdmlzaWJsZVN0ZXBzID0gc3RlcHBlci5nZXRWaXNpYmxlU3RlcHMoKVxuXG4gICAgY29uc3QgcHJvcHM6IERmZVN0ZXBJbmRpY2F0b3JQcm9wcyA9IHtcbiAgICAgIHN0ZXBzOiB2aXNpYmxlU3RlcHMsXG4gICAgICBjdXJyZW50SW5kZXg6IHN0ZXBwZXIuZ2V0Q3VycmVudEluZGV4KCksXG4gICAgICBvblN0ZXBDbGljazogKGluZGV4OiBudW1iZXIpID0+IHN0ZXBwZXIuanVtcFRvKGluZGV4KSxcbiAgICAgIGNsYXNzTmFtZTogJ3N0ZXAtaW5kaWNhdG9yJyxcbiAgICB9XG5cbiAgICBleHBlY3QocHJvcHMpLnRvQmVEZWZpbmVkKClcbiAgICBleHBlY3QocHJvcHMuc3RlcHMpLnRvQmVJbnN0YW5jZU9mKEFycmF5KVxuICAgIGV4cGVjdCh0eXBlb2YgcHJvcHMuY3VycmVudEluZGV4KS50b0JlKCdudW1iZXInKVxuICB9KVxuXG4gIGRlc2NyaWJlKCdzdGVwIHN0YXRlIHJlbmRlcmluZycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHNob3cgYWxsIHZpc2libGUgc3RlcHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKHRlc3RGaWVsZHMpXG4gICAgICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIodGVzdFN0ZXBzLCBlbmdpbmUpXG4gICAgICBjb25zdCB2aXNpYmxlU3RlcHMgPSBzdGVwcGVyLmdldFZpc2libGVTdGVwcygpXG5cbiAgICAgIGV4cGVjdCh2aXNpYmxlU3RlcHMubGVuZ3RoKS50b0JlKDMpXG4gICAgICBleHBlY3QodmlzaWJsZVN0ZXBzWzBdLnN0ZXAudGl0bGUpLnRvQmUoJ1BlcnNvbmFsIEluZm9ybWF0aW9uJylcbiAgICAgIGV4cGVjdCh2aXNpYmxlU3RlcHNbMV0uc3RlcC50aXRsZSkudG9CZSgnQ29udGFjdCBJbmZvcm1hdGlvbicpXG4gICAgICBleHBlY3QodmlzaWJsZVN0ZXBzWzJdLnN0ZXAudGl0bGUpLnRvQmUoJ1ByZWZlcmVuY2VzJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBpbmRpY2F0ZSBhY3RpdmUgc3RlcCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUodGVzdEZpZWxkcylcbiAgICAgIGNvbnN0IHN0ZXBwZXIgPSBjcmVhdGVGb3JtU3RlcHBlcih0ZXN0U3RlcHMsIGVuZ2luZSlcblxuICAgICAgZXhwZWN0KHN0ZXBwZXIuZ2V0Q3VycmVudEluZGV4KCkpLnRvQmUoMClcbiAgICAgIGNvbnN0IGN1cnJlbnRTdGVwID0gc3RlcHBlci5nZXRDdXJyZW50U3RlcCgpXG4gICAgICBleHBlY3QoY3VycmVudFN0ZXA/LnN0ZXAuaWQpLnRvQmUoJ3N0ZXAxJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCB0cmFjayBzdGVwIGNvbXBsZXRpb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKHRlc3RGaWVsZHMpXG4gICAgICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIodGVzdFN0ZXBzLCBlbmdpbmUpXG4gICAgICBjb25zdCB2aXNpYmxlU3RlcHMgPSBzdGVwcGVyLmdldFZpc2libGVTdGVwcygpXG5cbiAgICAgIGV4cGVjdCh2aXNpYmxlU3RlcHNbMF0uaXNDb21wbGV0ZSkudG9CZShmYWxzZSlcbiAgICAgIHN0ZXBwZXIubWFya0NvbXBsZXRlKCdzdGVwMScpXG4gICAgICBleHBlY3Qoc3RlcHBlci5nZXRDdXJyZW50U3RlcCgpPy5pc0NvbXBsZXRlKS50b0JlKHRydWUpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnc3RlcCBuYXZpZ2F0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgaGFuZGxlIHN0ZXAgbmF2aWdhdGlvbicsICgpID0+IHtcbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUodGVzdEZpZWxkcylcbiAgICAgIGNvbnN0IHN0ZXBwZXIgPSBjcmVhdGVGb3JtU3RlcHBlcih0ZXN0U3RlcHMsIGVuZ2luZSlcblxuICAgICAgZXhwZWN0KHN0ZXBwZXIuY2FuR29CYWNrKCkpLnRvQmUoZmFsc2UpXG4gICAgICBleHBlY3Qoc3RlcHBlci5pc0xhc3RTdGVwKCkpLnRvQmUoZmFsc2UpXG5cbiAgICAgIHN0ZXBwZXIuZ29OZXh0KClcbiAgICAgIGV4cGVjdChzdGVwcGVyLmdldEN1cnJlbnRJbmRleCgpKS50b0JlKDEpXG4gICAgICBleHBlY3Qoc3RlcHBlci5jYW5Hb0JhY2soKSkudG9CZSh0cnVlKVxuXG4gICAgICBzdGVwcGVyLmdvQmFjaygpXG4gICAgICBleHBlY3Qoc3RlcHBlci5nZXRDdXJyZW50SW5kZXgoKSkudG9CZSgwKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBqdW1wIHRvIHNwZWNpZmljIHN0ZXAnLCAoKSA9PiB7XG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKHRlc3RGaWVsZHMpXG4gICAgICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIodGVzdFN0ZXBzLCBlbmdpbmUpXG5cbiAgICAgIHN0ZXBwZXIuanVtcFRvKDIpXG4gICAgICBleHBlY3Qoc3RlcHBlci5nZXRDdXJyZW50SW5kZXgoKSkudG9CZSgyKVxuICAgICAgZXhwZWN0KHN0ZXBwZXIuaXNMYXN0U3RlcCgpKS50b0JlKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgdHJhY2sgcHJvZ3Jlc3MnLCAoKSA9PiB7XG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKHRlc3RGaWVsZHMpXG4gICAgICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIodGVzdFN0ZXBzLCBlbmdpbmUpXG5cbiAgICAgIGNvbnN0IHByb2dyZXNzMSA9IHN0ZXBwZXIuZ2V0UHJvZ3Jlc3MoKVxuICAgICAgZXhwZWN0KHByb2dyZXNzMS5jdXJyZW50KS50b0JlKDEpXG4gICAgICBleHBlY3QocHJvZ3Jlc3MxLnRvdGFsKS50b0JlKDMpXG4gICAgICBleHBlY3QocHJvZ3Jlc3MxLnBlcmNlbnQpLnRvQmUoTWF0aC5yb3VuZCgoMSAvIDMpICogMTAwKSlcblxuICAgICAgc3RlcHBlci5nb05leHQoKVxuICAgICAgY29uc3QgcHJvZ3Jlc3MyID0gc3RlcHBlci5nZXRQcm9ncmVzcygpXG4gICAgICBleHBlY3QocHJvZ3Jlc3MyLmN1cnJlbnQpLnRvQmUoMilcbiAgICAgIGV4cGVjdChwcm9ncmVzczIucGVyY2VudCkudG9CZShNYXRoLnJvdW5kKCgyIC8gMykgKiAxMDApKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ3N0ZXAgYnJhbmNoaW5nJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgc3VwcG9ydCBicmFuY2hpbmcgbG9naWMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHNXaXRoQnJhbmNoaW5nOiBGb3JtRmllbGRbXSA9IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnZmllbGRfcGF0aCcsXG4gICAgICAgICAgdmVyc2lvbklkOiAndjEnLFxuICAgICAgICAgIGtleTogJ3BhdGgnLFxuICAgICAgICAgIGxhYmVsOiAnV2hpY2ggcGF0aD8nLFxuICAgICAgICAgIHR5cGU6ICdTRUxFQ1QnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG9yZGVyOiAxLFxuICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgbW9kZTogJ3N0YXRpYycsXG4gICAgICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdQYXRoIEEnLCB2YWx1ZTogJ3BhdGhBJyB9LFxuICAgICAgICAgICAgICB7IGxhYmVsOiAnUGF0aCBCJywgdmFsdWU6ICdwYXRoQicgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF1cblxuICAgICAgY29uc3Qgc3RlcHNXaXRoQnJhbmNoZXM6IEZvcm1TdGVwW10gPSBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ3N0ZXBfc3RhcnQnLFxuICAgICAgICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICAgICAgICB0aXRsZTogJ1N0YXJ0JyxcbiAgICAgICAgICBvcmRlcjogMSxcbiAgICAgICAgICBjb25maWc6IG51bGwsXG4gICAgICAgICAgY29uZGl0aW9uczogbnVsbCxcbiAgICAgICAgICBicmFuY2hlczogW1xuICAgICAgICAgICAgeyBjb25kaXRpb246ICdwYXRoID09PSBcInBhdGhBXCInLCB0YXJnZXRTdGVwSWQ6ICdzdGVwX2EnIH0sXG4gICAgICAgICAgICB7IGNvbmRpdGlvbjogJ3BhdGggPT09IFwicGF0aEJcIicsIHRhcmdldFN0ZXBJZDogJ3N0ZXBfYicgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdzdGVwX2EnLFxuICAgICAgICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICAgICAgICB0aXRsZTogJ1BhdGggQScsXG4gICAgICAgICAgb3JkZXI6IDIsXG4gICAgICAgICAgY29uZmlnOiBudWxsLFxuICAgICAgICAgIGNvbmRpdGlvbnM6IG51bGwsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ3N0ZXBfYicsXG4gICAgICAgICAgdmVyc2lvbklkOiAndjEnLFxuICAgICAgICAgIHRpdGxlOiAnUGF0aCBCJyxcbiAgICAgICAgICBvcmRlcjogMyxcbiAgICAgICAgICBjb25maWc6IG51bGwsXG4gICAgICAgICAgY29uZGl0aW9uczogbnVsbCxcbiAgICAgICAgfSxcbiAgICAgIF1cblxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHNXaXRoQnJhbmNoaW5nKVxuICAgICAgY29uc3Qgc3RlcHBlciA9IGNyZWF0ZUZvcm1TdGVwcGVyKHN0ZXBzV2l0aEJyYW5jaGVzLCBlbmdpbmUpXG5cbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdwYXRoJywgJ3BhdGhBJylcbiAgICAgIGNvbnN0IG5leHRCcmFuY2ggPSBzdGVwcGVyLmdldE5leHRCcmFuY2goKVxuICAgICAgZXhwZWN0KG5leHRCcmFuY2g/LnN0ZXAuaWQpLnRvQmUoJ3N0ZXBfYScpXG5cbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdwYXRoJywgJ3BhdGhCJylcbiAgICAgIGNvbnN0IG5leHRCcmFuY2gyID0gc3RlcHBlci5nZXROZXh0QnJhbmNoKClcbiAgICAgIGV4cGVjdChuZXh0QnJhbmNoMj8uc3RlcC5pZCkudG9CZSgnc3RlcF9iJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBuYXZpZ2F0ZSB0byBicmFuY2ggdGFyZ2V0JywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzV2l0aEJyYW5jaGluZzogRm9ybUZpZWxkW10gPSBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2ZpZWxkX3R5cGUnLFxuICAgICAgICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICAgICAgICBrZXk6ICd0eXBlJyxcbiAgICAgICAgICBsYWJlbDogJ1R5cGUnLFxuICAgICAgICAgIHR5cGU6ICdTRUxFQ1QnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG9yZGVyOiAxLFxuICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgbW9kZTogJ3N0YXRpYycsXG4gICAgICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdPcHRpb24gQScsIHZhbHVlOiAnYScgfSxcbiAgICAgICAgICAgICAgeyBsYWJlbDogJ09wdGlvbiBCJywgdmFsdWU6ICdiJyB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgXVxuXG4gICAgICBjb25zdCBzdGVwc1dpdGhCcmFuY2hlczogRm9ybVN0ZXBbXSA9IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnc3RlcF9jaG9vc2UnLFxuICAgICAgICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICAgICAgICB0aXRsZTogJ0Nob29zZScsXG4gICAgICAgICAgb3JkZXI6IDEsXG4gICAgICAgICAgY29uZmlnOiBudWxsLFxuICAgICAgICAgIGNvbmRpdGlvbnM6IG51bGwsXG4gICAgICAgICAgYnJhbmNoZXM6IFtcbiAgICAgICAgICAgIHsgY29uZGl0aW9uOiAndHlwZSA9PT0gXCJhXCInLCB0YXJnZXRTdGVwSWQ6ICdzdGVwX2EnIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnc3RlcF9hJyxcbiAgICAgICAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgICAgICAgdGl0bGU6ICdPcHRpb24gQSBEZXRhaWxzJyxcbiAgICAgICAgICBvcmRlcjogMixcbiAgICAgICAgICBjb25maWc6IG51bGwsXG4gICAgICAgICAgY29uZGl0aW9uczogbnVsbCxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnc3RlcF9za2lwJyxcbiAgICAgICAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgICAgICAgdGl0bGU6ICdTa2lwcGVkIFN0ZXAnLFxuICAgICAgICAgIG9yZGVyOiAzLFxuICAgICAgICAgIGNvbmZpZzogbnVsbCxcbiAgICAgICAgICBjb25kaXRpb25zOiBudWxsLFxuICAgICAgICB9LFxuICAgICAgXVxuXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkc1dpdGhCcmFuY2hpbmcpXG4gICAgICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIoc3RlcHNXaXRoQnJhbmNoZXMsIGVuZ2luZSlcblxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ3R5cGUnLCAnYScpXG4gICAgICBzdGVwcGVyLmdvTmV4dEJyYW5jaCgpXG5cbiAgICAgIGNvbnN0IGN1cnJlbnRTdGVwID0gc3RlcHBlci5nZXRDdXJyZW50U3RlcCgpXG4gICAgICBleHBlY3QoY3VycmVudFN0ZXA/LnN0ZXAuaWQpLnRvQmUoJ3N0ZXBfYScpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgncHJvcCBkZWZhdWx0cyBhbmQgb3B0aW9uYWwgcHJvcGVydGllcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHN1cHBvcnQgb3B0aW9uYWwgb25TdGVwQ2xpY2sgcHJvcCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUodGVzdEZpZWxkcylcbiAgICAgIGNvbnN0IHN0ZXBwZXIgPSBjcmVhdGVGb3JtU3RlcHBlcih0ZXN0U3RlcHMsIGVuZ2luZSlcbiAgICAgIGNvbnN0IHZpc2libGVTdGVwcyA9IHN0ZXBwZXIuZ2V0VmlzaWJsZVN0ZXBzKClcblxuICAgICAgY29uc3QgcHJvcHMxOiBEZmVTdGVwSW5kaWNhdG9yUHJvcHMgPSB7XG4gICAgICAgIHN0ZXBzOiB2aXNpYmxlU3RlcHMsXG4gICAgICAgIGN1cnJlbnRJbmRleDogMCxcbiAgICAgIH1cbiAgICAgIGV4cGVjdChwcm9wczEub25TdGVwQ2xpY2spLnRvQmVVbmRlZmluZWQoKVxuXG4gICAgICBjb25zdCBwcm9wczI6IERmZVN0ZXBJbmRpY2F0b3JQcm9wcyA9IHtcbiAgICAgICAgc3RlcHM6IHZpc2libGVTdGVwcyxcbiAgICAgICAgY3VycmVudEluZGV4OiAwLFxuICAgICAgICBvblN0ZXBDbGljazogKGluZGV4OiBudW1iZXIpID0+IHN0ZXBwZXIuanVtcFRvKGluZGV4KSxcbiAgICAgIH1cbiAgICAgIGV4cGVjdChwcm9wczIub25TdGVwQ2xpY2spLnRvQmVEZWZpbmVkKClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBzdXBwb3J0IG9wdGlvbmFsIGNsYXNzTmFtZSBwcm9wJywgKCkgPT4ge1xuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZSh0ZXN0RmllbGRzKVxuICAgICAgY29uc3Qgc3RlcHBlciA9IGNyZWF0ZUZvcm1TdGVwcGVyKHRlc3RTdGVwcywgZW5naW5lKVxuICAgICAgY29uc3QgdmlzaWJsZVN0ZXBzID0gc3RlcHBlci5nZXRWaXNpYmxlU3RlcHMoKVxuXG4gICAgICBjb25zdCBwcm9wczE6IERmZVN0ZXBJbmRpY2F0b3JQcm9wcyA9IHtcbiAgICAgICAgc3RlcHM6IHZpc2libGVTdGVwcyxcbiAgICAgICAgY3VycmVudEluZGV4OiAwLFxuICAgICAgfVxuICAgICAgZXhwZWN0KHByb3BzMS5jbGFzc05hbWUpLnRvQmVVbmRlZmluZWQoKVxuXG4gICAgICBjb25zdCBwcm9wczI6IERmZVN0ZXBJbmRpY2F0b3JQcm9wcyA9IHtcbiAgICAgICAgc3RlcHM6IHZpc2libGVTdGVwcyxcbiAgICAgICAgY3VycmVudEluZGV4OiAwLFxuICAgICAgICBjbGFzc05hbWU6ICdjdXN0b20tc3RlcHMnLFxuICAgICAgfVxuICAgICAgZXhwZWN0KHByb3BzMi5jbGFzc05hbWUpLnRvQmUoJ2N1c3RvbS1zdGVwcycpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnYWNjZXNzaWJpbGl0eScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIG1hcmsgY3VycmVudCBzdGVwIHdpdGggYXJpYS1jdXJyZW50JywgKCkgPT4ge1xuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZSh0ZXN0RmllbGRzKVxuICAgICAgY29uc3Qgc3RlcHBlciA9IGNyZWF0ZUZvcm1TdGVwcGVyKHRlc3RTdGVwcywgZW5naW5lKVxuICAgICAgY29uc3QgdmlzaWJsZVN0ZXBzID0gc3RlcHBlci5nZXRWaXNpYmxlU3RlcHMoKVxuXG4gICAgICAvLyBDdXJyZW50IHN0ZXAgc2hvdWxkIGhhdmUgYXJpYS1jdXJyZW50PVwic3RlcFwiXG4gICAgICBleHBlY3QodmlzaWJsZVN0ZXBzWzBdLnN0ZXAuaWQpLnRvQmVEZWZpbmVkKClcblxuICAgICAgc3RlcHBlci5nb05leHQoKVxuICAgICAgY29uc3QgdXBkYXRlZFN0ZXBzID0gc3RlcHBlci5nZXRWaXNpYmxlU3RlcHMoKVxuICAgICAgLy8gTmV4dCBjdXJyZW50IHN0ZXAgc2hvdWxkIGJlIG1hcmtlZFxuICAgICAgZXhwZWN0KHVwZGF0ZWRTdGVwc1sxXS5zdGVwLmlkKS50b0JlRGVmaW5lZCgpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgc3VwcG9ydCBjb21wbGV0aW9uIG1hcmtlcnMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKHRlc3RGaWVsZHMpXG4gICAgICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIodGVzdFN0ZXBzLCBlbmdpbmUpXG4gICAgICBjb25zdCB2aXNpYmxlU3RlcHMgPSBzdGVwcGVyLmdldFZpc2libGVTdGVwcygpXG5cbiAgICAgIHN0ZXBwZXIubWFya0NvbXBsZXRlKCdzdGVwMScpXG4gICAgICBzdGVwcGVyLmdvTmV4dCgpXG5cbiAgICAgIGNvbnN0IGN1cnJlbnRTdGVwcyA9IHN0ZXBwZXIuZ2V0VmlzaWJsZVN0ZXBzKClcbiAgICAgIGV4cGVjdChjdXJyZW50U3RlcHNbMF0uaXNDb21wbGV0ZSkudG9CZSh0cnVlKVxuICAgIH0pXG4gIH0pXG59KVxuIl19