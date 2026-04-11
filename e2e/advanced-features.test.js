"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const dfe_core_1 = require("@dmc-98/dfe-core");
const fixtures_1 = require("./helpers/fixtures");
(0, vitest_1.describe)('Advanced Form Engine Features', () => {
    // ============================================================================
    // COMPUTED FIELDS (~6 tests)
    // ============================================================================
    (0, vitest_1.describe)('Computed Fields', () => {
        (0, vitest_1.beforeEach)(() => {
            (0, fixtures_1.resetFieldCounter)();
        });
        (0, vitest_1.it)('should register and compute simple arithmetic expression', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'price', type: 'NUMBER' }),
                (0, fixtures_1.makeField)({ key: 'quantity', type: 'NUMBER' }),
                (0, fixtures_1.makeField)({ key: 'total', type: 'NUMBER', required: false }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.registerComputed('total', 'price * quantity', ['price', 'quantity']);
            engine.setFieldValue('price', 10);
            engine.setFieldValue('quantity', 3);
            (0, vitest_1.expect)(engine.getComputedValue('total')).toBe(30);
        });
        (0, vitest_1.it)('should recalculate when dependency changes', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'price', type: 'NUMBER' }),
                (0, fixtures_1.makeField)({ key: 'quantity', type: 'NUMBER' }),
                (0, fixtures_1.makeField)({ key: 'total', type: 'NUMBER', required: false }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.registerComputed('total', 'price * quantity', ['price', 'quantity']);
            engine.setFieldValue('price', 10);
            engine.setFieldValue('quantity', 3);
            (0, vitest_1.expect)(engine.getComputedValue('total')).toBe(30);
            engine.setFieldValue('quantity', 5);
            (0, vitest_1.expect)(engine.getComputedValue('total')).toBe(50);
        });
        (0, vitest_1.it)('should support chained computed fields', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'price', type: 'NUMBER' }),
                (0, fixtures_1.makeField)({ key: 'quantity', type: 'NUMBER' }),
                (0, fixtures_1.makeField)({ key: 'total', type: 'NUMBER', required: false }),
                (0, fixtures_1.makeField)({ key: 'double', type: 'NUMBER', required: false }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.registerComputed('total', 'price * quantity', ['price', 'quantity']);
            engine.registerComputed('double', 'total * 2', ['total']);
            engine.setFieldValue('price', 10);
            engine.setFieldValue('quantity', 2);
            (0, vitest_1.expect)(engine.getComputedValue('total')).toBe(20);
            (0, vitest_1.expect)(engine.getComputedValue('double')).toBe(40);
        });
        (0, vitest_1.it)('should return null for invalid expression without crashing', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'price', type: 'NUMBER' }),
                (0, fixtures_1.makeField)({ key: 'total', type: 'NUMBER', required: false }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.registerComputed('total', 'price * invalidField', ['price', 'invalidField']);
            engine.setFieldValue('price', 10);
            const result = engine.getComputedValue('total');
            (0, vitest_1.expect)(result === null || result === undefined).toBe(true);
        });
        (0, vitest_1.it)('should compute string concatenation', () => {
            const fields = [
                (0, fixtures_1.makeField)({ key: 'firstName', type: 'SHORT_TEXT' }),
                (0, fixtures_1.makeField)({ key: 'lastName', type: 'SHORT_TEXT' }),
                (0, fixtures_1.makeField)({ key: 'fullName', type: 'SHORT_TEXT', required: false }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.registerComputed('fullName', 'firstName + " " + lastName', ['firstName', 'lastName']);
            engine.setFieldValue('firstName', 'John');
            engine.setFieldValue('lastName', 'Doe');
            (0, vitest_1.expect)(engine.getComputedValue('fullName')).toBe('John Doe');
        });
        (0, vitest_1.it)('should return null for non-existent computed field key', () => {
            const fields = [(0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT' })];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const result = engine.getComputedValue('nonExistent');
            (0, vitest_1.expect)(result === null || result === undefined).toBe(true);
        });
    });
    // ============================================================================
    // UNDO/REDO (~6 tests)
    // ============================================================================
    (0, vitest_1.describe)('Undo/Redo Functionality', () => {
        (0, vitest_1.beforeEach)(() => {
            (0, fixtures_1.resetFieldCounter)();
        });
        (0, vitest_1.it)('should undo a field value change to default', () => {
            const fields = [(0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT' })];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('name', 'John');
            (0, vitest_1.expect)(engine.getValues().name).toBe('John');
            const undoResult = engine.undo();
            (0, vitest_1.expect)(undoResult).not.toBeNull();
            (0, vitest_1.expect)(engine.getValues().name).toBe('');
        });
        (0, vitest_1.it)('should undo and redo to restore value', () => {
            const fields = [(0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT' })];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('name', 'John');
            (0, vitest_1.expect)(engine.getValues().name).toBe('John');
            engine.undo();
            (0, vitest_1.expect)(engine.getValues().name).toBe('');
            const redoResult = engine.redo();
            (0, vitest_1.expect)(redoResult).not.toBeNull();
            (0, vitest_1.expect)(engine.getValues().name).toBe('John');
        });
        (0, vitest_1.it)('should handle multiple undo operations correctly', () => {
            const fields = [(0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT' })];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('name', 'First');
            engine.setFieldValue('name', 'Second');
            engine.setFieldValue('name', 'Third');
            (0, vitest_1.expect)(engine.getValues().name).toBe('Third');
            engine.undo();
            (0, vitest_1.expect)(engine.getValues().name).toBe('Second');
            engine.undo();
            (0, vitest_1.expect)(engine.getValues().name).toBe('First');
            const undoResult = engine.undo();
            (0, vitest_1.expect)(undoResult).not.toBeNull();
            (0, vitest_1.expect)(engine.getValues().name).toBe('');
        });
        (0, vitest_1.it)('should report canUndo false initially and true after change', () => {
            const fields = [(0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT' })];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            (0, vitest_1.expect)(engine.canUndo()).toBe(false);
            engine.setFieldValue('name', 'John');
            (0, vitest_1.expect)(engine.canUndo()).toBe(true);
        });
        (0, vitest_1.it)('should report canRedo correctly', () => {
            const fields = [(0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT' })];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            (0, vitest_1.expect)(engine.canRedo()).toBe(false);
            engine.setFieldValue('name', 'John');
            (0, vitest_1.expect)(engine.canRedo()).toBe(false);
            engine.undo();
            (0, vitest_1.expect)(engine.canRedo()).toBe(true);
        });
        (0, vitest_1.it)('should clear redo stack when new change made after undo', () => {
            const fields = [(0, fixtures_1.makeField)({ key: 'name', type: 'SHORT_TEXT' })];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.setFieldValue('name', 'First');
            engine.undo();
            (0, vitest_1.expect)(engine.canRedo()).toBe(true);
            engine.setFieldValue('name', 'Second');
            (0, vitest_1.expect)(engine.canRedo()).toBe(false);
            (0, vitest_1.expect)(engine.getValues().name).toBe('Second');
        });
    });
    // ============================================================================
    // STEP BRANCHING (~6 tests)
    // ============================================================================
    (0, vitest_1.describe)('Step Branching', () => {
        (0, vitest_1.beforeEach)(() => {
            (0, fixtures_1.resetFieldCounter)();
        });
        (0, vitest_1.it)('should branch to personal step when path is personal', () => {
            const form = (0, fixtures_1.createBranchingForm)();
            const engine = (0, dfe_core_1.createFormEngine)(form.fields);
            const stepper = (0, dfe_core_1.createFormStepper)(form.steps, engine);
            engine.setFieldValue('path', 'personal');
            const nextBranch = stepper.getNextBranch();
            (0, vitest_1.expect)(nextBranch).not.toBeNull();
            (0, vitest_1.expect)(nextBranch === null || nextBranch === void 0 ? void 0 : nextBranch.step.id).toBe('step_personal');
        });
        (0, vitest_1.it)('should branch to business step when path is business', () => {
            const form = (0, fixtures_1.createBranchingForm)();
            const engine = (0, dfe_core_1.createFormEngine)(form.fields);
            const stepper = (0, dfe_core_1.createFormStepper)(form.steps, engine);
            engine.setFieldValue('path', 'business');
            const nextBranch = stepper.getNextBranch();
            (0, vitest_1.expect)(nextBranch).not.toBeNull();
            (0, vitest_1.expect)(nextBranch === null || nextBranch === void 0 ? void 0 : nextBranch.step.id).toBe('step_business');
        });
        (0, vitest_1.it)('should navigate to branched step with goNextBranch', () => {
            var _a;
            const form = (0, fixtures_1.createBranchingForm)();
            const engine = (0, dfe_core_1.createFormEngine)(form.fields);
            const stepper = (0, dfe_core_1.createFormStepper)(form.steps, engine);
            engine.setFieldValue('path', 'personal');
            stepper.goNextBranch();
            const currentStep = (_a = stepper.getCurrentStep) === null || _a === void 0 ? void 0 : _a.call(stepper);
            (0, vitest_1.expect)(currentStep === null || currentStep === void 0 ? void 0 : currentStep.step.id).toBe('step_personal');
        });
        (0, vitest_1.it)('should return null when no value set for branch condition', () => {
            const form = (0, fixtures_1.createBranchingForm)();
            const engine = (0, dfe_core_1.createFormEngine)(form.fields);
            const stepper = (0, dfe_core_1.createFormStepper)(form.steps, engine);
            const nextBranch = stepper.getNextBranch();
            (0, vitest_1.expect)(nextBranch).toBeNull();
        });
        (0, vitest_1.it)('should have correct current step after branching', () => {
            var _a;
            const form = (0, fixtures_1.createBranchingForm)();
            const engine = (0, dfe_core_1.createFormEngine)(form.fields);
            const stepper = (0, dfe_core_1.createFormStepper)(form.steps, engine);
            engine.setFieldValue('path', 'business');
            stepper.goNextBranch();
            const currentStep = (_a = stepper.getCurrentStep) === null || _a === void 0 ? void 0 : _a.call(stepper);
            (0, vitest_1.expect)(currentStep === null || currentStep === void 0 ? void 0 : currentStep.step.id).toBe('step_business');
        });
        (0, vitest_1.it)('should fallback to sequential navigation when no matching branch', () => {
            var _a;
            const form = (0, fixtures_1.createBranchingForm)();
            const engine = (0, dfe_core_1.createFormEngine)(form.fields);
            const stepper = (0, dfe_core_1.createFormStepper)(form.steps, engine);
            engine.setFieldValue('path', 'invalid_value');
            stepper.goNextBranch();
            const currentStep = (_a = stepper.getCurrentStep) === null || _a === void 0 ? void 0 : _a.call(stepper);
            (0, vitest_1.expect)(currentStep).not.toBeNull();
        });
    });
    // ============================================================================
    // FIELD PERMISSIONS (~5 tests)
    // ============================================================================
    (0, vitest_1.describe)('Field Permissions', () => {
        (0, vitest_1.beforeEach)(() => {
            (0, fixtures_1.resetFieldCounter)();
        });
        (0, vitest_1.it)('should return editable for admin role on public field', () => {
            const fields = [
                {
                    id: 'f1',
                    versionId: 'v1',
                    key: 'public_name',
                    type: 'SHORT_TEXT',
                    label: 'Public Name',
                    required: true,
                    order: 0,
                    config: { minLength: 1 },
                    stepId: null,
                    sectionId: null,
                    parentFieldId: null,
                    conditions: null,
                    permissions: [
                        { role: 'admin', level: 'editable' },
                        { role: 'user', level: 'editable' },
                    ],
                },
                {
                    id: 'f2',
                    versionId: 'v1',
                    key: 'secret_code',
                    type: 'SHORT_TEXT',
                    label: 'Secret Code',
                    required: false,
                    order: 1,
                    config: {},
                    stepId: null,
                    sectionId: null,
                    parentFieldId: null,
                    conditions: null,
                    permissions: [
                        { role: 'admin', level: 'editable' },
                        { role: 'user', level: 'hidden' },
                    ],
                },
                {
                    id: 'f3',
                    versionId: 'v1',
                    key: 'readonly_field',
                    type: 'SHORT_TEXT',
                    label: 'Readonly Field',
                    required: false,
                    order: 2,
                    config: {},
                    stepId: null,
                    sectionId: null,
                    parentFieldId: null,
                    conditions: null,
                    permissions: [
                        { role: 'admin', level: 'editable' },
                        { role: 'user', level: 'readonly' },
                    ],
                },
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const permission = engine.getFieldPermission('public_name', 'admin');
            (0, vitest_1.expect)(permission).toBe('editable');
        });
        (0, vitest_1.it)('should return hidden for user role on secret field', () => {
            const fields = [
                {
                    id: 'f1',
                    versionId: 'v1',
                    key: 'public_name',
                    type: 'SHORT_TEXT',
                    label: 'Public Name',
                    required: true,
                    order: 0,
                    config: { minLength: 1 },
                    stepId: null,
                    sectionId: null,
                    parentFieldId: null,
                    conditions: null,
                    permissions: [
                        { role: 'admin', level: 'editable' },
                        { role: 'user', level: 'editable' },
                    ],
                },
                {
                    id: 'f2',
                    versionId: 'v1',
                    key: 'secret_code',
                    type: 'SHORT_TEXT',
                    label: 'Secret Code',
                    required: false,
                    order: 1,
                    config: {},
                    stepId: null,
                    sectionId: null,
                    parentFieldId: null,
                    conditions: null,
                    permissions: [
                        { role: 'admin', level: 'editable' },
                        { role: 'user', level: 'hidden' },
                    ],
                },
                {
                    id: 'f3',
                    versionId: 'v1',
                    key: 'readonly_field',
                    type: 'SHORT_TEXT',
                    label: 'Readonly Field',
                    required: false,
                    order: 2,
                    config: {},
                    stepId: null,
                    sectionId: null,
                    parentFieldId: null,
                    conditions: null,
                    permissions: [
                        { role: 'admin', level: 'editable' },
                        { role: 'user', level: 'readonly' },
                    ],
                },
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const permission = engine.getFieldPermission('secret_code', 'user');
            (0, vitest_1.expect)(permission).toBe('hidden');
        });
        (0, vitest_1.it)('should return readonly for user role on readonly field', () => {
            const fields = [
                {
                    id: 'f1',
                    versionId: 'v1',
                    key: 'public_name',
                    type: 'SHORT_TEXT',
                    label: 'Public Name',
                    required: true,
                    order: 0,
                    config: { minLength: 1 },
                    stepId: null,
                    sectionId: null,
                    parentFieldId: null,
                    conditions: null,
                    permissions: [
                        { role: 'admin', level: 'editable' },
                        { role: 'user', level: 'editable' },
                    ],
                },
                {
                    id: 'f2',
                    versionId: 'v1',
                    key: 'secret_code',
                    type: 'SHORT_TEXT',
                    label: 'Secret Code',
                    required: false,
                    order: 1,
                    config: {},
                    stepId: null,
                    sectionId: null,
                    parentFieldId: null,
                    conditions: null,
                    permissions: [
                        { role: 'admin', level: 'editable' },
                        { role: 'user', level: 'hidden' },
                    ],
                },
                {
                    id: 'f3',
                    versionId: 'v1',
                    key: 'readonly_field',
                    type: 'SHORT_TEXT',
                    label: 'Readonly Field',
                    required: false,
                    order: 2,
                    config: {},
                    stepId: null,
                    sectionId: null,
                    parentFieldId: null,
                    conditions: null,
                    permissions: [
                        { role: 'admin', level: 'editable' },
                        { role: 'user', level: 'readonly' },
                    ],
                },
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const permission = engine.getFieldPermission('readonly_field', 'user');
            (0, vitest_1.expect)(permission).toBe('readonly');
        });
        (0, vitest_1.it)('should return editable for user role on public field', () => {
            const fields = [
                {
                    id: 'f1',
                    versionId: 'v1',
                    key: 'public_name',
                    type: 'SHORT_TEXT',
                    label: 'Public Name',
                    required: true,
                    order: 0,
                    config: { minLength: 1 },
                    stepId: null,
                    sectionId: null,
                    parentFieldId: null,
                    conditions: null,
                    permissions: [
                        { role: 'admin', level: 'editable' },
                        { role: 'user', level: 'editable' },
                    ],
                },
                {
                    id: 'f2',
                    versionId: 'v1',
                    key: 'secret_code',
                    type: 'SHORT_TEXT',
                    label: 'Secret Code',
                    required: false,
                    order: 1,
                    config: {},
                    stepId: null,
                    sectionId: null,
                    parentFieldId: null,
                    conditions: null,
                    permissions: [
                        { role: 'admin', level: 'editable' },
                        { role: 'user', level: 'hidden' },
                    ],
                },
                {
                    id: 'f3',
                    versionId: 'v1',
                    key: 'readonly_field',
                    type: 'SHORT_TEXT',
                    label: 'Readonly Field',
                    required: false,
                    order: 2,
                    config: {},
                    stepId: null,
                    sectionId: null,
                    parentFieldId: null,
                    conditions: null,
                    permissions: [
                        { role: 'admin', level: 'editable' },
                        { role: 'user', level: 'readonly' },
                    ],
                },
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const permission = engine.getFieldPermission('public_name', 'user');
            (0, vitest_1.expect)(permission).toBe('editable');
        });
        (0, vitest_1.it)('should return editable by default for field with no permissions', () => {
            const fields = [(0, fixtures_1.makeField)({ key: 'unprotected', type: 'SHORT_TEXT' })];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const permission = engine.getFieldPermission('unprotected', 'admin');
            (0, vitest_1.expect)(permission).toBe('editable');
        });
    });
    // ============================================================================
    // INTERNATIONALIZATION (i18n) (~5 tests)
    // ============================================================================
    (0, vitest_1.describe)('Internationalization (i18n)', () => {
        (0, vitest_1.beforeEach)(() => {
            (0, fixtures_1.resetFieldCounter)();
        });
        (0, vitest_1.it)('should return English label', () => {
            const fields = [
                {
                    id: 'f1',
                    versionId: 'v1',
                    key: 'name',
                    type: 'SHORT_TEXT',
                    label: 'Name',
                    required: true,
                    order: 0,
                    config: { minLength: 1 },
                    stepId: null,
                    sectionId: null,
                    parentFieldId: null,
                    conditions: null,
                    i18nLabels: { en: 'Name', es: 'Nombre', fr: 'Nom' },
                },
                {
                    id: 'f2',
                    versionId: 'v1',
                    key: 'email',
                    type: 'EMAIL',
                    label: 'Email',
                    required: true,
                    order: 1,
                    config: {},
                    stepId: null,
                    sectionId: null,
                    parentFieldId: null,
                    conditions: null,
                    i18nLabels: { en: 'Email', es: 'Correo electrónico', fr: 'E-mail' },
                },
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const label = engine.getLocalizedLabel('name', 'en');
            (0, vitest_1.expect)(label).toBe('Name');
        });
        (0, vitest_1.it)('should return Spanish label', () => {
            const fields = [
                {
                    id: 'f1',
                    versionId: 'v1',
                    key: 'name',
                    type: 'SHORT_TEXT',
                    label: 'Name',
                    required: true,
                    order: 0,
                    config: { minLength: 1 },
                    stepId: null,
                    sectionId: null,
                    parentFieldId: null,
                    conditions: null,
                    i18nLabels: { en: 'Name', es: 'Nombre', fr: 'Nom' },
                },
                {
                    id: 'f2',
                    versionId: 'v1',
                    key: 'email',
                    type: 'EMAIL',
                    label: 'Email',
                    required: true,
                    order: 1,
                    config: {},
                    stepId: null,
                    sectionId: null,
                    parentFieldId: null,
                    conditions: null,
                    i18nLabels: { en: 'Email', es: 'Correo electrónico', fr: 'E-mail' },
                },
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const label = engine.getLocalizedLabel('name', 'es');
            (0, vitest_1.expect)(label).toBe('Nombre');
        });
        (0, vitest_1.it)('should return French label', () => {
            const fields = [
                {
                    id: 'f1',
                    versionId: 'v1',
                    key: 'name',
                    type: 'SHORT_TEXT',
                    label: 'Name',
                    required: true,
                    order: 0,
                    config: { minLength: 1 },
                    stepId: null,
                    sectionId: null,
                    parentFieldId: null,
                    conditions: null,
                    i18nLabels: { en: 'Name', es: 'Nombre', fr: 'Nom' },
                },
                {
                    id: 'f2',
                    versionId: 'v1',
                    key: 'email',
                    type: 'EMAIL',
                    label: 'Email',
                    required: true,
                    order: 1,
                    config: {},
                    stepId: null,
                    sectionId: null,
                    parentFieldId: null,
                    conditions: null,
                    i18nLabels: { en: 'Email', es: 'Correo electrónico', fr: 'E-mail' },
                },
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const label = engine.getLocalizedLabel('name', 'fr');
            (0, vitest_1.expect)(label).toBe('Nom');
        });
        (0, vitest_1.it)('should fallback to default label for unsupported locale', () => {
            const fields = [
                {
                    id: 'f1',
                    versionId: 'v1',
                    key: 'name',
                    type: 'SHORT_TEXT',
                    label: 'Name',
                    required: true,
                    order: 0,
                    config: { minLength: 1 },
                    stepId: null,
                    sectionId: null,
                    parentFieldId: null,
                    conditions: null,
                    i18nLabels: { en: 'Name', es: 'Nombre', fr: 'Nom' },
                },
                {
                    id: 'f2',
                    versionId: 'v1',
                    key: 'email',
                    type: 'EMAIL',
                    label: 'Email',
                    required: true,
                    order: 1,
                    config: {},
                    stepId: null,
                    sectionId: null,
                    parentFieldId: null,
                    conditions: null,
                    i18nLabels: { en: 'Email', es: 'Correo electrónico', fr: 'E-mail' },
                },
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const label = engine.getLocalizedLabel('name', 'de');
            (0, vitest_1.expect)(label).toBe('Name');
        });
        (0, vitest_1.it)('should return localized label for email field', () => {
            const fields = [
                {
                    id: 'f1',
                    versionId: 'v1',
                    key: 'name',
                    type: 'SHORT_TEXT',
                    label: 'Name',
                    required: true,
                    order: 0,
                    config: { minLength: 1 },
                    stepId: null,
                    sectionId: null,
                    parentFieldId: null,
                    conditions: null,
                    i18nLabels: { en: 'Name', es: 'Nombre', fr: 'Nom' },
                },
                {
                    id: 'f2',
                    versionId: 'v1',
                    key: 'email',
                    type: 'EMAIL',
                    label: 'Email',
                    required: true,
                    order: 1,
                    config: {},
                    stepId: null,
                    sectionId: null,
                    parentFieldId: null,
                    conditions: null,
                    i18nLabels: { en: 'Email', es: 'Correo electrónico', fr: 'E-mail' },
                },
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const label = engine.getLocalizedLabel('email', 'es');
            (0, vitest_1.expect)(label).toBe('Correo electrónico');
        });
    });
    // ============================================================================
    // REPEATABLE GROUPS (~5 tests)
    // ============================================================================
    (0, vitest_1.describe)('Repeatable Groups', () => {
        (0, vitest_1.beforeEach)(() => {
            (0, fixtures_1.resetFieldCounter)();
        });
        (0, vitest_1.it)('should start with empty repeat instances', () => {
            const fields = [
                (0, fixtures_1.makeField)({
                    key: 'addresses',
                    type: 'FIELD_GROUP',
                    config: {
                        templateFields: [
                            { key: 'street', type: 'SHORT_TEXT', config: {} },
                            { key: 'city', type: 'SHORT_TEXT', config: {} },
                        ],
                    },
                }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const instances = engine.getRepeatInstances('addresses');
            (0, vitest_1.expect)(Array.isArray(instances)).toBe(true);
            (0, vitest_1.expect)(instances.length).toBe(0);
        });
        (0, vitest_1.it)('should add repeat instance', () => {
            const fields = [
                (0, fixtures_1.makeField)({
                    key: 'addresses',
                    type: 'FIELD_GROUP',
                    config: {
                        templateFields: [
                            { key: 'street', type: 'SHORT_TEXT', config: {} },
                            { key: 'city', type: 'SHORT_TEXT', config: {} },
                        ],
                    },
                }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.addRepeatInstance('addresses');
            const instances = engine.getRepeatInstances('addresses');
            (0, vitest_1.expect)(instances.length).toBe(1);
        });
        (0, vitest_1.it)('should handle multiple repeat instances', () => {
            const fields = [
                (0, fixtures_1.makeField)({
                    key: 'addresses',
                    type: 'FIELD_GROUP',
                    config: {
                        templateFields: [
                            { key: 'street', type: 'SHORT_TEXT', config: {} },
                            { key: 'city', type: 'SHORT_TEXT', config: {} },
                        ],
                    },
                }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.addRepeatInstance('addresses');
            engine.addRepeatInstance('addresses');
            engine.addRepeatInstance('addresses');
            const instances = engine.getRepeatInstances('addresses');
            (0, vitest_1.expect)(instances.length).toBe(3);
        });
        (0, vitest_1.it)('should remove repeat instance at specific index', () => {
            const fields = [
                (0, fixtures_1.makeField)({
                    key: 'addresses',
                    type: 'FIELD_GROUP',
                    config: {
                        templateFields: [
                            { key: 'street', type: 'SHORT_TEXT', config: {} },
                            { key: 'city', type: 'SHORT_TEXT', config: {} },
                        ],
                    },
                }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            engine.addRepeatInstance('addresses');
            engine.addRepeatInstance('addresses');
            engine.addRepeatInstance('addresses');
            (0, vitest_1.expect)(engine.getRepeatInstances('addresses').length).toBe(3);
            engine.removeRepeatInstance('addresses', 1);
            (0, vitest_1.expect)(engine.getRepeatInstances('addresses').length).toBe(2);
        });
        (0, vitest_1.it)('should handle removal from empty repeat group gracefully', () => {
            const fields = [
                (0, fixtures_1.makeField)({
                    key: 'addresses',
                    type: 'FIELD_GROUP',
                    config: {
                        templateFields: [
                            { key: 'street', type: 'SHORT_TEXT', config: {} },
                            { key: 'city', type: 'SHORT_TEXT', config: {} },
                        ],
                    },
                }),
            ];
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            (0, vitest_1.expect)(() => {
                engine.removeRepeatInstance('addresses', 0);
            }).not.toThrow();
            const instances = engine.getRepeatInstances('addresses');
            (0, vitest_1.expect)(instances.length).toBe(0);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWR2YW5jZWQtZmVhdHVyZXMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFkdmFuY2VkLWZlYXR1cmVzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBeUQ7QUFDekQsa0RBQXlFO0FBQ3pFLGlEQU8yQjtBQUUzQixJQUFBLGlCQUFRLEVBQUMsK0JBQStCLEVBQUUsR0FBRyxFQUFFO0lBQzdDLCtFQUErRTtJQUMvRSw2QkFBNkI7SUFDN0IsK0VBQStFO0lBQy9FLElBQUEsaUJBQVEsRUFBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7UUFDL0IsSUFBQSxtQkFBVSxFQUFDLEdBQUcsRUFBRTtZQUNkLElBQUEsNEJBQWlCLEdBQUUsQ0FBQTtRQUNyQixDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLDBEQUEwRCxFQUFFLEdBQUcsRUFBRTtZQUNsRSxNQUFNLE1BQU0sR0FBRztnQkFDYixJQUFBLG9CQUFTLEVBQUMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQztnQkFDM0MsSUFBQSxvQkFBUyxFQUFDLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLENBQUM7Z0JBQzlDLElBQUEsb0JBQVMsRUFBQyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUM7YUFDN0QsQ0FBQTtZQUNELE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQWdCLEVBQUMsTUFBTSxDQUFDLENBQUE7WUFDdkMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFBO1lBRTNFLE1BQU0sQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ2pDLE1BQU0sQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBRW5DLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUNuRCxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLDRDQUE0QyxFQUFFLEdBQUcsRUFBRTtZQUNwRCxNQUFNLE1BQU0sR0FBRztnQkFDYixJQUFBLG9CQUFTLEVBQUMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQztnQkFDM0MsSUFBQSxvQkFBUyxFQUFDLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLENBQUM7Z0JBQzlDLElBQUEsb0JBQVMsRUFBQyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUM7YUFDN0QsQ0FBQTtZQUNELE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQWdCLEVBQUMsTUFBTSxDQUFDLENBQUE7WUFDdkMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFBO1lBRTNFLE1BQU0sQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ2pDLE1BQU0sQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ25DLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUVqRCxNQUFNLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUNuQyxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDbkQsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQyx3Q0FBd0MsRUFBRSxHQUFHLEVBQUU7WUFDaEQsTUFBTSxNQUFNLEdBQUc7Z0JBQ2IsSUFBQSxvQkFBUyxFQUFDLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLENBQUM7Z0JBQzNDLElBQUEsb0JBQVMsRUFBQyxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxDQUFDO2dCQUM5QyxJQUFBLG9CQUFTLEVBQUMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxDQUFDO2dCQUM1RCxJQUFBLG9CQUFTLEVBQUMsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxDQUFDO2FBQzlELENBQUE7WUFDRCxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ3ZDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQTtZQUMzRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUE7WUFFekQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFDakMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFFbkMsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1lBQ2pELElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUNwRCxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLDREQUE0RCxFQUFFLEdBQUcsRUFBRTtZQUNwRSxNQUFNLE1BQU0sR0FBRztnQkFDYixJQUFBLG9CQUFTLEVBQUMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQztnQkFDM0MsSUFBQSxvQkFBUyxFQUFDLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsQ0FBQzthQUM3RCxDQUFBO1lBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUN2QyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLHNCQUFzQixFQUFFLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUE7WUFFbkYsTUFBTSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFFakMsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQy9DLElBQUEsZUFBTSxFQUFDLE1BQU0sS0FBSyxJQUFJLElBQUksTUFBTSxLQUFLLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUM1RCxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLHFDQUFxQyxFQUFFLEdBQUcsRUFBRTtZQUM3QyxNQUFNLE1BQU0sR0FBRztnQkFDYixJQUFBLG9CQUFTLEVBQUMsRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsQ0FBQztnQkFDbkQsSUFBQSxvQkFBUyxFQUFDLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLENBQUM7Z0JBQ2xELElBQUEsb0JBQVMsRUFBQyxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUM7YUFDcEUsQ0FBQTtZQUNELE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQWdCLEVBQUMsTUFBTSxDQUFDLENBQUE7WUFDdkMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRSw0QkFBNEIsRUFBRSxDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFBO1lBRTVGLE1BQU0sQ0FBQyxhQUFhLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBQ3pDLE1BQU0sQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFBO1lBRXZDLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTtRQUM5RCxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLHdEQUF3RCxFQUFFLEdBQUcsRUFBRTtZQUNoRSxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQUEsb0JBQVMsRUFBQyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUMvRCxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRXZDLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQTtZQUNyRCxJQUFBLGVBQU0sRUFBQyxNQUFNLEtBQUssSUFBSSxJQUFJLE1BQU0sS0FBSyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDNUQsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLCtFQUErRTtJQUMvRSx1QkFBdUI7SUFDdkIsK0VBQStFO0lBQy9FLElBQUEsaUJBQVEsRUFBQyx5QkFBeUIsRUFBRSxHQUFHLEVBQUU7UUFDdkMsSUFBQSxtQkFBVSxFQUFDLEdBQUcsRUFBRTtZQUNkLElBQUEsNEJBQWlCLEdBQUUsQ0FBQTtRQUNyQixDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLDZDQUE2QyxFQUFFLEdBQUcsRUFBRTtZQUNyRCxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQUEsb0JBQVMsRUFBQyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUMvRCxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRXZDLE1BQU0sQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBQ3BDLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7WUFFNUMsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFBO1lBQ2hDLElBQUEsZUFBTSxFQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQTtZQUNqQyxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQzFDLENBQUMsQ0FBQyxDQUFBO1FBRUYsSUFBQSxXQUFFLEVBQUMsdUNBQXVDLEVBQUUsR0FBRyxFQUFFO1lBQy9DLE1BQU0sTUFBTSxHQUFHLENBQUMsSUFBQSxvQkFBUyxFQUFDLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQy9ELE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQWdCLEVBQUMsTUFBTSxDQUFDLENBQUE7WUFFdkMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUE7WUFDcEMsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUU1QyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUE7WUFDYixJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1lBRXhDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQTtZQUNoQyxJQUFBLGVBQU0sRUFBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUE7WUFDakMsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUM5QyxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLGtEQUFrRCxFQUFFLEdBQUcsRUFBRTtZQUMxRCxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQUEsb0JBQVMsRUFBQyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUMvRCxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRXZDLE1BQU0sQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQ3JDLE1BQU0sQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO1lBQ3RDLE1BQU0sQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQ3JDLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7WUFFN0MsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFBO1lBQ2IsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtZQUU5QyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUE7WUFDYixJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBRTdDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQTtZQUNoQyxJQUFBLGVBQU0sRUFBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUE7WUFDakMsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUMxQyxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLDZEQUE2RCxFQUFFLEdBQUcsRUFBRTtZQUNyRSxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQUEsb0JBQVMsRUFBQyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUMvRCxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRXZDLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUVwQyxNQUFNLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUNwQyxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDckMsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQyxpQ0FBaUMsRUFBRSxHQUFHLEVBQUU7WUFDekMsTUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFBLG9CQUFTLEVBQUMsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDL0QsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUV2QyxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7WUFFcEMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUE7WUFDcEMsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBRXBDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQTtZQUNiLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNyQyxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLHlEQUF5RCxFQUFFLEdBQUcsRUFBRTtZQUNqRSxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQUEsb0JBQVMsRUFBQyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUMvRCxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRXZDLE1BQU0sQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQ3JDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQTtZQUNiLElBQUEsZUFBTSxFQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtZQUVuQyxNQUFNLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtZQUN0QyxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDcEMsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUNoRCxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsK0VBQStFO0lBQy9FLDRCQUE0QjtJQUM1QiwrRUFBK0U7SUFDL0UsSUFBQSxpQkFBUSxFQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtRQUM5QixJQUFBLG1CQUFVLEVBQUMsR0FBRyxFQUFFO1lBQ2QsSUFBQSw0QkFBaUIsR0FBRSxDQUFBO1FBQ3JCLENBQUMsQ0FBQyxDQUFBO1FBRUYsSUFBQSxXQUFFLEVBQUMsc0RBQXNELEVBQUUsR0FBRyxFQUFFO1lBQzlELE1BQU0sSUFBSSxHQUFHLElBQUEsOEJBQW1CLEdBQUUsQ0FBQTtZQUNsQyxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUM1QyxNQUFNLE9BQU8sR0FBRyxJQUFBLDRCQUFpQixFQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUE7WUFFckQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUE7WUFFeEMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFBO1lBQzFDLElBQUEsZUFBTSxFQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQTtZQUNqQyxJQUFBLGVBQU0sRUFBQyxVQUFVLGFBQVYsVUFBVSx1QkFBVixVQUFVLENBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQTtRQUNuRCxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLHNEQUFzRCxFQUFFLEdBQUcsRUFBRTtZQUM5RCxNQUFNLElBQUksR0FBRyxJQUFBLDhCQUFtQixHQUFFLENBQUE7WUFDbEMsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDNUMsTUFBTSxPQUFPLEdBQUcsSUFBQSw0QkFBaUIsRUFBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBRXJELE1BQU0sQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFBO1lBRXhDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQTtZQUMxQyxJQUFBLGVBQU0sRUFBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUE7WUFDakMsSUFBQSxlQUFNLEVBQUMsVUFBVSxhQUFWLFVBQVUsdUJBQVYsVUFBVSxDQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUE7UUFDbkQsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQyxvREFBb0QsRUFBRSxHQUFHLEVBQUU7O1lBQzVELE1BQU0sSUFBSSxHQUFHLElBQUEsOEJBQW1CLEdBQUUsQ0FBQTtZQUNsQyxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUM1QyxNQUFNLE9BQU8sR0FBRyxJQUFBLDRCQUFpQixFQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUE7WUFFckQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUE7WUFDeEMsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFBO1lBRXRCLE1BQU0sV0FBVyxHQUFHLE1BQUEsT0FBTyxDQUFDLGNBQWMsdURBQUksQ0FBQTtZQUM5QyxJQUFBLGVBQU0sRUFBQyxXQUFXLGFBQVgsV0FBVyx1QkFBWCxXQUFXLENBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQTtRQUNwRCxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLDJEQUEyRCxFQUFFLEdBQUcsRUFBRTtZQUNuRSxNQUFNLElBQUksR0FBRyxJQUFBLDhCQUFtQixHQUFFLENBQUE7WUFDbEMsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDNUMsTUFBTSxPQUFPLEdBQUcsSUFBQSw0QkFBaUIsRUFBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBRXJELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQTtZQUMxQyxJQUFBLGVBQU0sRUFBQyxVQUFVLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQTtRQUMvQixDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLGtEQUFrRCxFQUFFLEdBQUcsRUFBRTs7WUFDMUQsTUFBTSxJQUFJLEdBQUcsSUFBQSw4QkFBbUIsR0FBRSxDQUFBO1lBQ2xDLE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQWdCLEVBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQzVDLE1BQU0sT0FBTyxHQUFHLElBQUEsNEJBQWlCLEVBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUVyRCxNQUFNLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQTtZQUN4QyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUE7WUFFdEIsTUFBTSxXQUFXLEdBQUcsTUFBQSxPQUFPLENBQUMsY0FBYyx1REFBSSxDQUFBO1lBQzlDLElBQUEsZUFBTSxFQUFDLFdBQVcsYUFBWCxXQUFXLHVCQUFYLFdBQVcsQ0FBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFBO1FBQ3BELENBQUMsQ0FBQyxDQUFBO1FBRUYsSUFBQSxXQUFFLEVBQUMsa0VBQWtFLEVBQUUsR0FBRyxFQUFFOztZQUMxRSxNQUFNLElBQUksR0FBRyxJQUFBLDhCQUFtQixHQUFFLENBQUE7WUFDbEMsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDNUMsTUFBTSxPQUFPLEdBQUcsSUFBQSw0QkFBaUIsRUFBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBRXJELE1BQU0sQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLGVBQWUsQ0FBQyxDQUFBO1lBQzdDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQTtZQUV0QixNQUFNLFdBQVcsR0FBRyxNQUFBLE9BQU8sQ0FBQyxjQUFjLHVEQUFJLENBQUE7WUFDOUMsSUFBQSxlQUFNLEVBQUMsV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFBO1FBQ3BDLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRiwrRUFBK0U7SUFDL0UsK0JBQStCO0lBQy9CLCtFQUErRTtJQUMvRSxJQUFBLGlCQUFRLEVBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1FBQ2pDLElBQUEsbUJBQVUsRUFBQyxHQUFHLEVBQUU7WUFDZCxJQUFBLDRCQUFpQixHQUFFLENBQUE7UUFDckIsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQyx1REFBdUQsRUFBRSxHQUFHLEVBQUU7WUFDL0QsTUFBTSxNQUFNLEdBQUc7Z0JBQ2I7b0JBQ0UsRUFBRSxFQUFFLElBQUk7b0JBQ1IsU0FBUyxFQUFFLElBQUk7b0JBQ2YsR0FBRyxFQUFFLGFBQWE7b0JBQ2xCLElBQUksRUFBRSxZQUFxQjtvQkFDM0IsS0FBSyxFQUFFLGFBQWE7b0JBQ3BCLFFBQVEsRUFBRSxJQUFJO29CQUNkLEtBQUssRUFBRSxDQUFDO29CQUNSLE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUU7b0JBQ3hCLE1BQU0sRUFBRSxJQUFJO29CQUNaLFNBQVMsRUFBRSxJQUFJO29CQUNmLGFBQWEsRUFBRSxJQUFJO29CQUNuQixVQUFVLEVBQUUsSUFBSTtvQkFDaEIsV0FBVyxFQUFFO3dCQUNYLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsVUFBbUIsRUFBRTt3QkFDN0MsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxVQUFtQixFQUFFO3FCQUM3QztpQkFDRjtnQkFDRDtvQkFDRSxFQUFFLEVBQUUsSUFBSTtvQkFDUixTQUFTLEVBQUUsSUFBSTtvQkFDZixHQUFHLEVBQUUsYUFBYTtvQkFDbEIsSUFBSSxFQUFFLFlBQXFCO29CQUMzQixLQUFLLEVBQUUsYUFBYTtvQkFDcEIsUUFBUSxFQUFFLEtBQUs7b0JBQ2YsS0FBSyxFQUFFLENBQUM7b0JBQ1IsTUFBTSxFQUFFLEVBQUU7b0JBQ1YsTUFBTSxFQUFFLElBQUk7b0JBQ1osU0FBUyxFQUFFLElBQUk7b0JBQ2YsYUFBYSxFQUFFLElBQUk7b0JBQ25CLFVBQVUsRUFBRSxJQUFJO29CQUNoQixXQUFXLEVBQUU7d0JBQ1gsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxVQUFtQixFQUFFO3dCQUM3QyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQWlCLEVBQUU7cUJBQzNDO2lCQUNGO2dCQUNEO29CQUNFLEVBQUUsRUFBRSxJQUFJO29CQUNSLFNBQVMsRUFBRSxJQUFJO29CQUNmLEdBQUcsRUFBRSxnQkFBZ0I7b0JBQ3JCLElBQUksRUFBRSxZQUFxQjtvQkFDM0IsS0FBSyxFQUFFLGdCQUFnQjtvQkFDdkIsUUFBUSxFQUFFLEtBQUs7b0JBQ2YsS0FBSyxFQUFFLENBQUM7b0JBQ1IsTUFBTSxFQUFFLEVBQUU7b0JBQ1YsTUFBTSxFQUFFLElBQUk7b0JBQ1osU0FBUyxFQUFFLElBQUk7b0JBQ2YsYUFBYSxFQUFFLElBQUk7b0JBQ25CLFVBQVUsRUFBRSxJQUFJO29CQUNoQixXQUFXLEVBQUU7d0JBQ1gsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxVQUFtQixFQUFFO3dCQUM3QyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFVBQW1CLEVBQUU7cUJBQzdDO2lCQUNGO2FBQ0ssQ0FBQTtZQUNSLE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQWdCLEVBQUMsTUFBTSxDQUFDLENBQUE7WUFFdkMsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQTtZQUNwRSxJQUFBLGVBQU0sRUFBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUE7UUFDckMsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQyxvREFBb0QsRUFBRSxHQUFHLEVBQUU7WUFDNUQsTUFBTSxNQUFNLEdBQUc7Z0JBQ2I7b0JBQ0UsRUFBRSxFQUFFLElBQUk7b0JBQ1IsU0FBUyxFQUFFLElBQUk7b0JBQ2YsR0FBRyxFQUFFLGFBQWE7b0JBQ2xCLElBQUksRUFBRSxZQUFxQjtvQkFDM0IsS0FBSyxFQUFFLGFBQWE7b0JBQ3BCLFFBQVEsRUFBRSxJQUFJO29CQUNkLEtBQUssRUFBRSxDQUFDO29CQUNSLE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUU7b0JBQ3hCLE1BQU0sRUFBRSxJQUFJO29CQUNaLFNBQVMsRUFBRSxJQUFJO29CQUNmLGFBQWEsRUFBRSxJQUFJO29CQUNuQixVQUFVLEVBQUUsSUFBSTtvQkFDaEIsV0FBVyxFQUFFO3dCQUNYLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsVUFBbUIsRUFBRTt3QkFDN0MsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxVQUFtQixFQUFFO3FCQUM3QztpQkFDRjtnQkFDRDtvQkFDRSxFQUFFLEVBQUUsSUFBSTtvQkFDUixTQUFTLEVBQUUsSUFBSTtvQkFDZixHQUFHLEVBQUUsYUFBYTtvQkFDbEIsSUFBSSxFQUFFLFlBQXFCO29CQUMzQixLQUFLLEVBQUUsYUFBYTtvQkFDcEIsUUFBUSxFQUFFLEtBQUs7b0JBQ2YsS0FBSyxFQUFFLENBQUM7b0JBQ1IsTUFBTSxFQUFFLEVBQUU7b0JBQ1YsTUFBTSxFQUFFLElBQUk7b0JBQ1osU0FBUyxFQUFFLElBQUk7b0JBQ2YsYUFBYSxFQUFFLElBQUk7b0JBQ25CLFVBQVUsRUFBRSxJQUFJO29CQUNoQixXQUFXLEVBQUU7d0JBQ1gsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxVQUFtQixFQUFFO3dCQUM3QyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQWlCLEVBQUU7cUJBQzNDO2lCQUNGO2dCQUNEO29CQUNFLEVBQUUsRUFBRSxJQUFJO29CQUNSLFNBQVMsRUFBRSxJQUFJO29CQUNmLEdBQUcsRUFBRSxnQkFBZ0I7b0JBQ3JCLElBQUksRUFBRSxZQUFxQjtvQkFDM0IsS0FBSyxFQUFFLGdCQUFnQjtvQkFDdkIsUUFBUSxFQUFFLEtBQUs7b0JBQ2YsS0FBSyxFQUFFLENBQUM7b0JBQ1IsTUFBTSxFQUFFLEVBQUU7b0JBQ1YsTUFBTSxFQUFFLElBQUk7b0JBQ1osU0FBUyxFQUFFLElBQUk7b0JBQ2YsYUFBYSxFQUFFLElBQUk7b0JBQ25CLFVBQVUsRUFBRSxJQUFJO29CQUNoQixXQUFXLEVBQUU7d0JBQ1gsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxVQUFtQixFQUFFO3dCQUM3QyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFVBQW1CLEVBQUU7cUJBQzdDO2lCQUNGO2FBQ0ssQ0FBQTtZQUNSLE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQWdCLEVBQUMsTUFBTSxDQUFDLENBQUE7WUFFdkMsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUNuRSxJQUFBLGVBQU0sRUFBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDbkMsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQyx3REFBd0QsRUFBRSxHQUFHLEVBQUU7WUFDaEUsTUFBTSxNQUFNLEdBQUc7Z0JBQ2I7b0JBQ0UsRUFBRSxFQUFFLElBQUk7b0JBQ1IsU0FBUyxFQUFFLElBQUk7b0JBQ2YsR0FBRyxFQUFFLGFBQWE7b0JBQ2xCLElBQUksRUFBRSxZQUFxQjtvQkFDM0IsS0FBSyxFQUFFLGFBQWE7b0JBQ3BCLFFBQVEsRUFBRSxJQUFJO29CQUNkLEtBQUssRUFBRSxDQUFDO29CQUNSLE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUU7b0JBQ3hCLE1BQU0sRUFBRSxJQUFJO29CQUNaLFNBQVMsRUFBRSxJQUFJO29CQUNmLGFBQWEsRUFBRSxJQUFJO29CQUNuQixVQUFVLEVBQUUsSUFBSTtvQkFDaEIsV0FBVyxFQUFFO3dCQUNYLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsVUFBbUIsRUFBRTt3QkFDN0MsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxVQUFtQixFQUFFO3FCQUM3QztpQkFDRjtnQkFDRDtvQkFDRSxFQUFFLEVBQUUsSUFBSTtvQkFDUixTQUFTLEVBQUUsSUFBSTtvQkFDZixHQUFHLEVBQUUsYUFBYTtvQkFDbEIsSUFBSSxFQUFFLFlBQXFCO29CQUMzQixLQUFLLEVBQUUsYUFBYTtvQkFDcEIsUUFBUSxFQUFFLEtBQUs7b0JBQ2YsS0FBSyxFQUFFLENBQUM7b0JBQ1IsTUFBTSxFQUFFLEVBQUU7b0JBQ1YsTUFBTSxFQUFFLElBQUk7b0JBQ1osU0FBUyxFQUFFLElBQUk7b0JBQ2YsYUFBYSxFQUFFLElBQUk7b0JBQ25CLFVBQVUsRUFBRSxJQUFJO29CQUNoQixXQUFXLEVBQUU7d0JBQ1gsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxVQUFtQixFQUFFO3dCQUM3QyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQWlCLEVBQUU7cUJBQzNDO2lCQUNGO2dCQUNEO29CQUNFLEVBQUUsRUFBRSxJQUFJO29CQUNSLFNBQVMsRUFBRSxJQUFJO29CQUNmLEdBQUcsRUFBRSxnQkFBZ0I7b0JBQ3JCLElBQUksRUFBRSxZQUFxQjtvQkFDM0IsS0FBSyxFQUFFLGdCQUFnQjtvQkFDdkIsUUFBUSxFQUFFLEtBQUs7b0JBQ2YsS0FBSyxFQUFFLENBQUM7b0JBQ1IsTUFBTSxFQUFFLEVBQUU7b0JBQ1YsTUFBTSxFQUFFLElBQUk7b0JBQ1osU0FBUyxFQUFFLElBQUk7b0JBQ2YsYUFBYSxFQUFFLElBQUk7b0JBQ25CLFVBQVUsRUFBRSxJQUFJO29CQUNoQixXQUFXLEVBQUU7d0JBQ1gsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxVQUFtQixFQUFFO3dCQUM3QyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFVBQW1CLEVBQUU7cUJBQzdDO2lCQUNGO2FBQ0ssQ0FBQTtZQUNSLE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQWdCLEVBQUMsTUFBTSxDQUFDLENBQUE7WUFFdkMsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLGtCQUFrQixDQUFDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBQ3RFLElBQUEsZUFBTSxFQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTtRQUNyQyxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLHNEQUFzRCxFQUFFLEdBQUcsRUFBRTtZQUM5RCxNQUFNLE1BQU0sR0FBRztnQkFDYjtvQkFDRSxFQUFFLEVBQUUsSUFBSTtvQkFDUixTQUFTLEVBQUUsSUFBSTtvQkFDZixHQUFHLEVBQUUsYUFBYTtvQkFDbEIsSUFBSSxFQUFFLFlBQXFCO29CQUMzQixLQUFLLEVBQUUsYUFBYTtvQkFDcEIsUUFBUSxFQUFFLElBQUk7b0JBQ2QsS0FBSyxFQUFFLENBQUM7b0JBQ1IsTUFBTSxFQUFFLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRTtvQkFDeEIsTUFBTSxFQUFFLElBQUk7b0JBQ1osU0FBUyxFQUFFLElBQUk7b0JBQ2YsYUFBYSxFQUFFLElBQUk7b0JBQ25CLFVBQVUsRUFBRSxJQUFJO29CQUNoQixXQUFXLEVBQUU7d0JBQ1gsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxVQUFtQixFQUFFO3dCQUM3QyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFVBQW1CLEVBQUU7cUJBQzdDO2lCQUNGO2dCQUNEO29CQUNFLEVBQUUsRUFBRSxJQUFJO29CQUNSLFNBQVMsRUFBRSxJQUFJO29CQUNmLEdBQUcsRUFBRSxhQUFhO29CQUNsQixJQUFJLEVBQUUsWUFBcUI7b0JBQzNCLEtBQUssRUFBRSxhQUFhO29CQUNwQixRQUFRLEVBQUUsS0FBSztvQkFDZixLQUFLLEVBQUUsQ0FBQztvQkFDUixNQUFNLEVBQUUsRUFBRTtvQkFDVixNQUFNLEVBQUUsSUFBSTtvQkFDWixTQUFTLEVBQUUsSUFBSTtvQkFDZixhQUFhLEVBQUUsSUFBSTtvQkFDbkIsVUFBVSxFQUFFLElBQUk7b0JBQ2hCLFdBQVcsRUFBRTt3QkFDWCxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQW1CLEVBQUU7d0JBQzdDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBaUIsRUFBRTtxQkFDM0M7aUJBQ0Y7Z0JBQ0Q7b0JBQ0UsRUFBRSxFQUFFLElBQUk7b0JBQ1IsU0FBUyxFQUFFLElBQUk7b0JBQ2YsR0FBRyxFQUFFLGdCQUFnQjtvQkFDckIsSUFBSSxFQUFFLFlBQXFCO29CQUMzQixLQUFLLEVBQUUsZ0JBQWdCO29CQUN2QixRQUFRLEVBQUUsS0FBSztvQkFDZixLQUFLLEVBQUUsQ0FBQztvQkFDUixNQUFNLEVBQUUsRUFBRTtvQkFDVixNQUFNLEVBQUUsSUFBSTtvQkFDWixTQUFTLEVBQUUsSUFBSTtvQkFDZixhQUFhLEVBQUUsSUFBSTtvQkFDbkIsVUFBVSxFQUFFLElBQUk7b0JBQ2hCLFdBQVcsRUFBRTt3QkFDWCxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQW1CLEVBQUU7d0JBQzdDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsVUFBbUIsRUFBRTtxQkFDN0M7aUJBQ0Y7YUFDSyxDQUFBO1lBQ1IsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUV2QyxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsa0JBQWtCLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBQ25FLElBQUEsZUFBTSxFQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTtRQUNyQyxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLGlFQUFpRSxFQUFFLEdBQUcsRUFBRTtZQUN6RSxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQUEsb0JBQVMsRUFBQyxFQUFFLEdBQUcsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUN0RSxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRXZDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUE7WUFDcEUsSUFBQSxlQUFNLEVBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1FBQ3JDLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFDLENBQUE7SUFFRiwrRUFBK0U7SUFDL0UseUNBQXlDO0lBQ3pDLCtFQUErRTtJQUMvRSxJQUFBLGlCQUFRLEVBQUMsNkJBQTZCLEVBQUUsR0FBRyxFQUFFO1FBQzNDLElBQUEsbUJBQVUsRUFBQyxHQUFHLEVBQUU7WUFDZCxJQUFBLDRCQUFpQixHQUFFLENBQUE7UUFDckIsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQyw2QkFBNkIsRUFBRSxHQUFHLEVBQUU7WUFDckMsTUFBTSxNQUFNLEdBQUc7Z0JBQ2I7b0JBQ0UsRUFBRSxFQUFFLElBQUk7b0JBQ1IsU0FBUyxFQUFFLElBQUk7b0JBQ2YsR0FBRyxFQUFFLE1BQU07b0JBQ1gsSUFBSSxFQUFFLFlBQXFCO29CQUMzQixLQUFLLEVBQUUsTUFBTTtvQkFDYixRQUFRLEVBQUUsSUFBSTtvQkFDZCxLQUFLLEVBQUUsQ0FBQztvQkFDUixNQUFNLEVBQUUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFO29CQUN4QixNQUFNLEVBQUUsSUFBSTtvQkFDWixTQUFTLEVBQUUsSUFBSTtvQkFDZixhQUFhLEVBQUUsSUFBSTtvQkFDbkIsVUFBVSxFQUFFLElBQUk7b0JBQ2hCLFVBQVUsRUFBRSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFO2lCQUNwRDtnQkFDRDtvQkFDRSxFQUFFLEVBQUUsSUFBSTtvQkFDUixTQUFTLEVBQUUsSUFBSTtvQkFDZixHQUFHLEVBQUUsT0FBTztvQkFDWixJQUFJLEVBQUUsT0FBZ0I7b0JBQ3RCLEtBQUssRUFBRSxPQUFPO29CQUNkLFFBQVEsRUFBRSxJQUFJO29CQUNkLEtBQUssRUFBRSxDQUFDO29CQUNSLE1BQU0sRUFBRSxFQUFFO29CQUNWLE1BQU0sRUFBRSxJQUFJO29CQUNaLFNBQVMsRUFBRSxJQUFJO29CQUNmLGFBQWEsRUFBRSxJQUFJO29CQUNuQixVQUFVLEVBQUUsSUFBSTtvQkFDaEIsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRTtpQkFDcEU7YUFDSyxDQUFBO1lBQ1IsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUV2QyxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFBO1lBQ3BELElBQUEsZUFBTSxFQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUM1QixDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtZQUNyQyxNQUFNLE1BQU0sR0FBRztnQkFDYjtvQkFDRSxFQUFFLEVBQUUsSUFBSTtvQkFDUixTQUFTLEVBQUUsSUFBSTtvQkFDZixHQUFHLEVBQUUsTUFBTTtvQkFDWCxJQUFJLEVBQUUsWUFBcUI7b0JBQzNCLEtBQUssRUFBRSxNQUFNO29CQUNiLFFBQVEsRUFBRSxJQUFJO29CQUNkLEtBQUssRUFBRSxDQUFDO29CQUNSLE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUU7b0JBQ3hCLE1BQU0sRUFBRSxJQUFJO29CQUNaLFNBQVMsRUFBRSxJQUFJO29CQUNmLGFBQWEsRUFBRSxJQUFJO29CQUNuQixVQUFVLEVBQUUsSUFBSTtvQkFDaEIsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUU7aUJBQ3BEO2dCQUNEO29CQUNFLEVBQUUsRUFBRSxJQUFJO29CQUNSLFNBQVMsRUFBRSxJQUFJO29CQUNmLEdBQUcsRUFBRSxPQUFPO29CQUNaLElBQUksRUFBRSxPQUFnQjtvQkFDdEIsS0FBSyxFQUFFLE9BQU87b0JBQ2QsUUFBUSxFQUFFLElBQUk7b0JBQ2QsS0FBSyxFQUFFLENBQUM7b0JBQ1IsTUFBTSxFQUFFLEVBQUU7b0JBQ1YsTUFBTSxFQUFFLElBQUk7b0JBQ1osU0FBUyxFQUFFLElBQUk7b0JBQ2YsYUFBYSxFQUFFLElBQUk7b0JBQ25CLFVBQVUsRUFBRSxJQUFJO29CQUNoQixVQUFVLEVBQUUsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFO2lCQUNwRTthQUNLLENBQUE7WUFDUixNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRXZDLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUE7WUFDcEQsSUFBQSxlQUFNLEVBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQzlCLENBQUMsQ0FBQyxDQUFBO1FBRUYsSUFBQSxXQUFFLEVBQUMsNEJBQTRCLEVBQUUsR0FBRyxFQUFFO1lBQ3BDLE1BQU0sTUFBTSxHQUFHO2dCQUNiO29CQUNFLEVBQUUsRUFBRSxJQUFJO29CQUNSLFNBQVMsRUFBRSxJQUFJO29CQUNmLEdBQUcsRUFBRSxNQUFNO29CQUNYLElBQUksRUFBRSxZQUFxQjtvQkFDM0IsS0FBSyxFQUFFLE1BQU07b0JBQ2IsUUFBUSxFQUFFLElBQUk7b0JBQ2QsS0FBSyxFQUFFLENBQUM7b0JBQ1IsTUFBTSxFQUFFLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRTtvQkFDeEIsTUFBTSxFQUFFLElBQUk7b0JBQ1osU0FBUyxFQUFFLElBQUk7b0JBQ2YsYUFBYSxFQUFFLElBQUk7b0JBQ25CLFVBQVUsRUFBRSxJQUFJO29CQUNoQixVQUFVLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRTtpQkFDcEQ7Z0JBQ0Q7b0JBQ0UsRUFBRSxFQUFFLElBQUk7b0JBQ1IsU0FBUyxFQUFFLElBQUk7b0JBQ2YsR0FBRyxFQUFFLE9BQU87b0JBQ1osSUFBSSxFQUFFLE9BQWdCO29CQUN0QixLQUFLLEVBQUUsT0FBTztvQkFDZCxRQUFRLEVBQUUsSUFBSTtvQkFDZCxLQUFLLEVBQUUsQ0FBQztvQkFDUixNQUFNLEVBQUUsRUFBRTtvQkFDVixNQUFNLEVBQUUsSUFBSTtvQkFDWixTQUFTLEVBQUUsSUFBSTtvQkFDZixhQUFhLEVBQUUsSUFBSTtvQkFDbkIsVUFBVSxFQUFFLElBQUk7b0JBQ2hCLFVBQVUsRUFBRSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUU7aUJBQ3BFO2FBQ0ssQ0FBQTtZQUNSLE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQWdCLEVBQUMsTUFBTSxDQUFDLENBQUE7WUFFdkMsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQTtZQUNwRCxJQUFBLGVBQU0sRUFBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDM0IsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQyx5REFBeUQsRUFBRSxHQUFHLEVBQUU7WUFDakUsTUFBTSxNQUFNLEdBQUc7Z0JBQ2I7b0JBQ0UsRUFBRSxFQUFFLElBQUk7b0JBQ1IsU0FBUyxFQUFFLElBQUk7b0JBQ2YsR0FBRyxFQUFFLE1BQU07b0JBQ1gsSUFBSSxFQUFFLFlBQXFCO29CQUMzQixLQUFLLEVBQUUsTUFBTTtvQkFDYixRQUFRLEVBQUUsSUFBSTtvQkFDZCxLQUFLLEVBQUUsQ0FBQztvQkFDUixNQUFNLEVBQUUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFO29CQUN4QixNQUFNLEVBQUUsSUFBSTtvQkFDWixTQUFTLEVBQUUsSUFBSTtvQkFDZixhQUFhLEVBQUUsSUFBSTtvQkFDbkIsVUFBVSxFQUFFLElBQUk7b0JBQ2hCLFVBQVUsRUFBRSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFO2lCQUNwRDtnQkFDRDtvQkFDRSxFQUFFLEVBQUUsSUFBSTtvQkFDUixTQUFTLEVBQUUsSUFBSTtvQkFDZixHQUFHLEVBQUUsT0FBTztvQkFDWixJQUFJLEVBQUUsT0FBZ0I7b0JBQ3RCLEtBQUssRUFBRSxPQUFPO29CQUNkLFFBQVEsRUFBRSxJQUFJO29CQUNkLEtBQUssRUFBRSxDQUFDO29CQUNSLE1BQU0sRUFBRSxFQUFFO29CQUNWLE1BQU0sRUFBRSxJQUFJO29CQUNaLFNBQVMsRUFBRSxJQUFJO29CQUNmLGFBQWEsRUFBRSxJQUFJO29CQUNuQixVQUFVLEVBQUUsSUFBSTtvQkFDaEIsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRTtpQkFDcEU7YUFDSyxDQUFBO1lBQ1IsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUV2QyxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFBO1lBQ3BELElBQUEsZUFBTSxFQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUM1QixDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLCtDQUErQyxFQUFFLEdBQUcsRUFBRTtZQUN2RCxNQUFNLE1BQU0sR0FBRztnQkFDYjtvQkFDRSxFQUFFLEVBQUUsSUFBSTtvQkFDUixTQUFTLEVBQUUsSUFBSTtvQkFDZixHQUFHLEVBQUUsTUFBTTtvQkFDWCxJQUFJLEVBQUUsWUFBcUI7b0JBQzNCLEtBQUssRUFBRSxNQUFNO29CQUNiLFFBQVEsRUFBRSxJQUFJO29CQUNkLEtBQUssRUFBRSxDQUFDO29CQUNSLE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUU7b0JBQ3hCLE1BQU0sRUFBRSxJQUFJO29CQUNaLFNBQVMsRUFBRSxJQUFJO29CQUNmLGFBQWEsRUFBRSxJQUFJO29CQUNuQixVQUFVLEVBQUUsSUFBSTtvQkFDaEIsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUU7aUJBQ3BEO2dCQUNEO29CQUNFLEVBQUUsRUFBRSxJQUFJO29CQUNSLFNBQVMsRUFBRSxJQUFJO29CQUNmLEdBQUcsRUFBRSxPQUFPO29CQUNaLElBQUksRUFBRSxPQUFnQjtvQkFDdEIsS0FBSyxFQUFFLE9BQU87b0JBQ2QsUUFBUSxFQUFFLElBQUk7b0JBQ2QsS0FBSyxFQUFFLENBQUM7b0JBQ1IsTUFBTSxFQUFFLEVBQUU7b0JBQ1YsTUFBTSxFQUFFLElBQUk7b0JBQ1osU0FBUyxFQUFFLElBQUk7b0JBQ2YsYUFBYSxFQUFFLElBQUk7b0JBQ25CLFVBQVUsRUFBRSxJQUFJO29CQUNoQixVQUFVLEVBQUUsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFO2lCQUNwRTthQUNLLENBQUE7WUFDUixNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRXZDLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUE7WUFDckQsSUFBQSxlQUFNLEVBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUE7UUFDMUMsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLCtFQUErRTtJQUMvRSwrQkFBK0I7SUFDL0IsK0VBQStFO0lBQy9FLElBQUEsaUJBQVEsRUFBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7UUFDakMsSUFBQSxtQkFBVSxFQUFDLEdBQUcsRUFBRTtZQUNkLElBQUEsNEJBQWlCLEdBQUUsQ0FBQTtRQUNyQixDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLDBDQUEwQyxFQUFFLEdBQUcsRUFBRTtZQUNsRCxNQUFNLE1BQU0sR0FBRztnQkFDYixJQUFBLG9CQUFTLEVBQUM7b0JBQ1IsR0FBRyxFQUFFLFdBQVc7b0JBQ2hCLElBQUksRUFBRSxhQUFhO29CQUNuQixNQUFNLEVBQUU7d0JBQ04sY0FBYyxFQUFFOzRCQUNkLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUU7NEJBQ2pELEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUU7eUJBQ2hEO3FCQUNGO2lCQUNGLENBQUM7YUFDSCxDQUFBO1lBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUV2QyxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsa0JBQWtCLENBQUMsV0FBVyxDQUFDLENBQUE7WUFDeEQsSUFBQSxlQUFNLEVBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtZQUMzQyxJQUFBLGVBQU0sRUFBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ2xDLENBQUMsQ0FBQyxDQUFBO1FBRUYsSUFBQSxXQUFFLEVBQUMsNEJBQTRCLEVBQUUsR0FBRyxFQUFFO1lBQ3BDLE1BQU0sTUFBTSxHQUFHO2dCQUNiLElBQUEsb0JBQVMsRUFBQztvQkFDUixHQUFHLEVBQUUsV0FBVztvQkFDaEIsSUFBSSxFQUFFLGFBQWE7b0JBQ25CLE1BQU0sRUFBRTt3QkFDTixjQUFjLEVBQUU7NEJBQ2QsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRTs0QkFDakQsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRTt5QkFDaEQ7cUJBQ0Y7aUJBQ0YsQ0FBQzthQUNILENBQUE7WUFDRCxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFnQixFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRXZDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsQ0FBQTtZQUNyQyxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsa0JBQWtCLENBQUMsV0FBVyxDQUFDLENBQUE7WUFDeEQsSUFBQSxlQUFNLEVBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNsQyxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLHlDQUF5QyxFQUFFLEdBQUcsRUFBRTtZQUNqRCxNQUFNLE1BQU0sR0FBRztnQkFDYixJQUFBLG9CQUFTLEVBQUM7b0JBQ1IsR0FBRyxFQUFFLFdBQVc7b0JBQ2hCLElBQUksRUFBRSxhQUFhO29CQUNuQixNQUFNLEVBQUU7d0JBQ04sY0FBYyxFQUFFOzRCQUNkLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUU7NEJBQ2pELEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUU7eUJBQ2hEO3FCQUNGO2lCQUNGLENBQUM7YUFDSCxDQUFBO1lBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUV2QyxNQUFNLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLENBQUE7WUFDckMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxDQUFBO1lBQ3JDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsQ0FBQTtZQUVyQyxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsa0JBQWtCLENBQUMsV0FBVyxDQUFDLENBQUE7WUFDeEQsSUFBQSxlQUFNLEVBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNsQyxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLGlEQUFpRCxFQUFFLEdBQUcsRUFBRTtZQUN6RCxNQUFNLE1BQU0sR0FBRztnQkFDYixJQUFBLG9CQUFTLEVBQUM7b0JBQ1IsR0FBRyxFQUFFLFdBQVc7b0JBQ2hCLElBQUksRUFBRSxhQUFhO29CQUNuQixNQUFNLEVBQUU7d0JBQ04sY0FBYyxFQUFFOzRCQUNkLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUU7NEJBQ2pELEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUU7eUJBQ2hEO3FCQUNGO2lCQUNGLENBQUM7YUFDSCxDQUFBO1lBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUV2QyxNQUFNLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLENBQUE7WUFDckMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxDQUFBO1lBQ3JDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsQ0FBQTtZQUNyQyxJQUFBLGVBQU0sRUFBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsV0FBVyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBRTdELE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDM0MsSUFBQSxlQUFNLEVBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUMvRCxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUEsV0FBRSxFQUFDLDBEQUEwRCxFQUFFLEdBQUcsRUFBRTtZQUNsRSxNQUFNLE1BQU0sR0FBRztnQkFDYixJQUFBLG9CQUFTLEVBQUM7b0JBQ1IsR0FBRyxFQUFFLFdBQVc7b0JBQ2hCLElBQUksRUFBRSxhQUFhO29CQUNuQixNQUFNLEVBQUU7d0JBQ04sY0FBYyxFQUFFOzRCQUNkLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUU7NEJBQ2pELEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUU7eUJBQ2hEO3FCQUNGO2lCQUNGLENBQUM7YUFDSCxDQUFBO1lBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUV2QyxJQUFBLGVBQU0sRUFBQyxHQUFHLEVBQUU7Z0JBQ1YsTUFBTSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUM3QyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUE7WUFFaEIsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxDQUFBO1lBQ3hELElBQUEsZUFBTSxFQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDbEMsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGVzY3JpYmUsIGl0LCBleHBlY3QsIGJlZm9yZUVhY2ggfSBmcm9tICd2aXRlc3QnXG5pbXBvcnQgeyBjcmVhdGVGb3JtRW5naW5lLCBjcmVhdGVGb3JtU3RlcHBlciB9IGZyb20gJ0BzbmFyanVuOTgvZGZlLWNvcmUnXG5pbXBvcnQge1xuICBtYWtlRmllbGQsXG4gIG1ha2VTdGVwLFxuICByZXNldEZpZWxkQ291bnRlcixcbiAgY3JlYXRlQnJhbmNoaW5nRm9ybSxcbiAgY3JlYXRlSTE4bkZvcm0sXG4gIGNyZWF0ZVBlcm1pc3Npb25zRm9ybSxcbn0gZnJvbSAnLi9oZWxwZXJzL2ZpeHR1cmVzJ1xuXG5kZXNjcmliZSgnQWR2YW5jZWQgRm9ybSBFbmdpbmUgRmVhdHVyZXMnLCAoKSA9PiB7XG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8gQ09NUFVURUQgRklFTERTICh+NiB0ZXN0cylcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBkZXNjcmliZSgnQ29tcHV0ZWQgRmllbGRzJywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgcmVzZXRGaWVsZENvdW50ZXIoKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJlZ2lzdGVyIGFuZCBjb21wdXRlIHNpbXBsZSBhcml0aG1ldGljIGV4cHJlc3Npb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ3ByaWNlJywgdHlwZTogJ05VTUJFUicgfSksXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ3F1YW50aXR5JywgdHlwZTogJ05VTUJFUicgfSksXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ3RvdGFsJywgdHlwZTogJ05VTUJFUicsIHJlcXVpcmVkOiBmYWxzZSB9KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuICAgICAgZW5naW5lLnJlZ2lzdGVyQ29tcHV0ZWQoJ3RvdGFsJywgJ3ByaWNlICogcXVhbnRpdHknLCBbJ3ByaWNlJywgJ3F1YW50aXR5J10pXG5cbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdwcmljZScsIDEwKVxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ3F1YW50aXR5JywgMylcblxuICAgICAgZXhwZWN0KGVuZ2luZS5nZXRDb21wdXRlZFZhbHVlKCd0b3RhbCcpKS50b0JlKDMwKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJlY2FsY3VsYXRlIHdoZW4gZGVwZW5kZW5jeSBjaGFuZ2VzJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICdwcmljZScsIHR5cGU6ICdOVU1CRVInIH0pLFxuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICdxdWFudGl0eScsIHR5cGU6ICdOVU1CRVInIH0pLFxuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICd0b3RhbCcsIHR5cGU6ICdOVU1CRVInLCByZXF1aXJlZDogZmFsc2UgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcbiAgICAgIGVuZ2luZS5yZWdpc3RlckNvbXB1dGVkKCd0b3RhbCcsICdwcmljZSAqIHF1YW50aXR5JywgWydwcmljZScsICdxdWFudGl0eSddKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgncHJpY2UnLCAxMClcbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdxdWFudGl0eScsIDMpXG4gICAgICBleHBlY3QoZW5naW5lLmdldENvbXB1dGVkVmFsdWUoJ3RvdGFsJykpLnRvQmUoMzApXG5cbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdxdWFudGl0eScsIDUpXG4gICAgICBleHBlY3QoZW5naW5lLmdldENvbXB1dGVkVmFsdWUoJ3RvdGFsJykpLnRvQmUoNTApXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgc3VwcG9ydCBjaGFpbmVkIGNvbXB1dGVkIGZpZWxkcycsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAncHJpY2UnLCB0eXBlOiAnTlVNQkVSJyB9KSxcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAncXVhbnRpdHknLCB0eXBlOiAnTlVNQkVSJyB9KSxcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAndG90YWwnLCB0eXBlOiAnTlVNQkVSJywgcmVxdWlyZWQ6IGZhbHNlIH0pLFxuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICdkb3VibGUnLCB0eXBlOiAnTlVNQkVSJywgcmVxdWlyZWQ6IGZhbHNlIH0pLFxuICAgICAgXVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgICBlbmdpbmUucmVnaXN0ZXJDb21wdXRlZCgndG90YWwnLCAncHJpY2UgKiBxdWFudGl0eScsIFsncHJpY2UnLCAncXVhbnRpdHknXSlcbiAgICAgIGVuZ2luZS5yZWdpc3RlckNvbXB1dGVkKCdkb3VibGUnLCAndG90YWwgKiAyJywgWyd0b3RhbCddKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgncHJpY2UnLCAxMClcbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdxdWFudGl0eScsIDIpXG5cbiAgICAgIGV4cGVjdChlbmdpbmUuZ2V0Q29tcHV0ZWRWYWx1ZSgndG90YWwnKSkudG9CZSgyMClcbiAgICAgIGV4cGVjdChlbmdpbmUuZ2V0Q29tcHV0ZWRWYWx1ZSgnZG91YmxlJykpLnRvQmUoNDApXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIG51bGwgZm9yIGludmFsaWQgZXhwcmVzc2lvbiB3aXRob3V0IGNyYXNoaW5nJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICdwcmljZScsIHR5cGU6ICdOVU1CRVInIH0pLFxuICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICd0b3RhbCcsIHR5cGU6ICdOVU1CRVInLCByZXF1aXJlZDogZmFsc2UgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcbiAgICAgIGVuZ2luZS5yZWdpc3RlckNvbXB1dGVkKCd0b3RhbCcsICdwcmljZSAqIGludmFsaWRGaWVsZCcsIFsncHJpY2UnLCAnaW52YWxpZEZpZWxkJ10pXG5cbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdwcmljZScsIDEwKVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBlbmdpbmUuZ2V0Q29tcHV0ZWRWYWx1ZSgndG90YWwnKVxuICAgICAgZXhwZWN0KHJlc3VsdCA9PT0gbnVsbCB8fCByZXN1bHQgPT09IHVuZGVmaW5lZCkudG9CZSh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGNvbXB1dGUgc3RyaW5nIGNvbmNhdGVuYXRpb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2ZpcnN0TmFtZScsIHR5cGU6ICdTSE9SVF9URVhUJyB9KSxcbiAgICAgICAgbWFrZUZpZWxkKHsga2V5OiAnbGFzdE5hbWUnLCB0eXBlOiAnU0hPUlRfVEVYVCcgfSksXG4gICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2Z1bGxOYW1lJywgdHlwZTogJ1NIT1JUX1RFWFQnLCByZXF1aXJlZDogZmFsc2UgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcbiAgICAgIGVuZ2luZS5yZWdpc3RlckNvbXB1dGVkKCdmdWxsTmFtZScsICdmaXJzdE5hbWUgKyBcIiBcIiArIGxhc3ROYW1lJywgWydmaXJzdE5hbWUnLCAnbGFzdE5hbWUnXSlcblxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2ZpcnN0TmFtZScsICdKb2huJylcbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdsYXN0TmFtZScsICdEb2UnKVxuXG4gICAgICBleHBlY3QoZW5naW5lLmdldENvbXB1dGVkVmFsdWUoJ2Z1bGxOYW1lJykpLnRvQmUoJ0pvaG4gRG9lJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gbnVsbCBmb3Igbm9uLWV4aXN0ZW50IGNvbXB1dGVkIGZpZWxkIGtleScsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICduYW1lJywgdHlwZTogJ1NIT1JUX1RFWFQnIH0pXVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGVuZ2luZS5nZXRDb21wdXRlZFZhbHVlKCdub25FeGlzdGVudCcpXG4gICAgICBleHBlY3QocmVzdWx0ID09PSBudWxsIHx8IHJlc3VsdCA9PT0gdW5kZWZpbmVkKS50b0JlKHRydWUpXG4gICAgfSlcbiAgfSlcblxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8vIFVORE8vUkVETyAofjYgdGVzdHMpXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgZGVzY3JpYmUoJ1VuZG8vUmVkbyBGdW5jdGlvbmFsaXR5JywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgcmVzZXRGaWVsZENvdW50ZXIoKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHVuZG8gYSBmaWVsZCB2YWx1ZSBjaGFuZ2UgdG8gZGVmYXVsdCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICduYW1lJywgdHlwZTogJ1NIT1JUX1RFWFQnIH0pXVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCduYW1lJywgJ0pvaG4nKVxuICAgICAgZXhwZWN0KGVuZ2luZS5nZXRWYWx1ZXMoKS5uYW1lKS50b0JlKCdKb2huJylcblxuICAgICAgY29uc3QgdW5kb1Jlc3VsdCA9IGVuZ2luZS51bmRvKClcbiAgICAgIGV4cGVjdCh1bmRvUmVzdWx0KS5ub3QudG9CZU51bGwoKVxuICAgICAgZXhwZWN0KGVuZ2luZS5nZXRWYWx1ZXMoKS5uYW1lKS50b0JlKCcnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHVuZG8gYW5kIHJlZG8gdG8gcmVzdG9yZSB2YWx1ZScsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICduYW1lJywgdHlwZTogJ1NIT1JUX1RFWFQnIH0pXVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCduYW1lJywgJ0pvaG4nKVxuICAgICAgZXhwZWN0KGVuZ2luZS5nZXRWYWx1ZXMoKS5uYW1lKS50b0JlKCdKb2huJylcblxuICAgICAgZW5naW5lLnVuZG8oKVxuICAgICAgZXhwZWN0KGVuZ2luZS5nZXRWYWx1ZXMoKS5uYW1lKS50b0JlKCcnKVxuXG4gICAgICBjb25zdCByZWRvUmVzdWx0ID0gZW5naW5lLnJlZG8oKVxuICAgICAgZXhwZWN0KHJlZG9SZXN1bHQpLm5vdC50b0JlTnVsbCgpXG4gICAgICBleHBlY3QoZW5naW5lLmdldFZhbHVlcygpLm5hbWUpLnRvQmUoJ0pvaG4nKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBtdWx0aXBsZSB1bmRvIG9wZXJhdGlvbnMgY29ycmVjdGx5JywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ25hbWUnLCB0eXBlOiAnU0hPUlRfVEVYVCcgfSldXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ25hbWUnLCAnRmlyc3QnKVxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ25hbWUnLCAnU2Vjb25kJylcbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCduYW1lJywgJ1RoaXJkJylcbiAgICAgIGV4cGVjdChlbmdpbmUuZ2V0VmFsdWVzKCkubmFtZSkudG9CZSgnVGhpcmQnKVxuXG4gICAgICBlbmdpbmUudW5kbygpXG4gICAgICBleHBlY3QoZW5naW5lLmdldFZhbHVlcygpLm5hbWUpLnRvQmUoJ1NlY29uZCcpXG5cbiAgICAgIGVuZ2luZS51bmRvKClcbiAgICAgIGV4cGVjdChlbmdpbmUuZ2V0VmFsdWVzKCkubmFtZSkudG9CZSgnRmlyc3QnKVxuXG4gICAgICBjb25zdCB1bmRvUmVzdWx0ID0gZW5naW5lLnVuZG8oKVxuICAgICAgZXhwZWN0KHVuZG9SZXN1bHQpLm5vdC50b0JlTnVsbCgpXG4gICAgICBleHBlY3QoZW5naW5lLmdldFZhbHVlcygpLm5hbWUpLnRvQmUoJycpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmVwb3J0IGNhblVuZG8gZmFsc2UgaW5pdGlhbGx5IGFuZCB0cnVlIGFmdGVyIGNoYW5nZScsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICduYW1lJywgdHlwZTogJ1NIT1JUX1RFWFQnIH0pXVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICAgIGV4cGVjdChlbmdpbmUuY2FuVW5kbygpKS50b0JlKGZhbHNlKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnbmFtZScsICdKb2huJylcbiAgICAgIGV4cGVjdChlbmdpbmUuY2FuVW5kbygpKS50b0JlKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmVwb3J0IGNhblJlZG8gY29ycmVjdGx5JywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ25hbWUnLCB0eXBlOiAnU0hPUlRfVEVYVCcgfSldXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgICAgZXhwZWN0KGVuZ2luZS5jYW5SZWRvKCkpLnRvQmUoZmFsc2UpXG5cbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCduYW1lJywgJ0pvaG4nKVxuICAgICAgZXhwZWN0KGVuZ2luZS5jYW5SZWRvKCkpLnRvQmUoZmFsc2UpXG5cbiAgICAgIGVuZ2luZS51bmRvKClcbiAgICAgIGV4cGVjdChlbmdpbmUuY2FuUmVkbygpKS50b0JlKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgY2xlYXIgcmVkbyBzdGFjayB3aGVuIG5ldyBjaGFuZ2UgbWFkZSBhZnRlciB1bmRvJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ25hbWUnLCB0eXBlOiAnU0hPUlRfVEVYVCcgfSldXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ25hbWUnLCAnRmlyc3QnKVxuICAgICAgZW5naW5lLnVuZG8oKVxuICAgICAgZXhwZWN0KGVuZ2luZS5jYW5SZWRvKCkpLnRvQmUodHJ1ZSlcblxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ25hbWUnLCAnU2Vjb25kJylcbiAgICAgIGV4cGVjdChlbmdpbmUuY2FuUmVkbygpKS50b0JlKGZhbHNlKVxuICAgICAgZXhwZWN0KGVuZ2luZS5nZXRWYWx1ZXMoKS5uYW1lKS50b0JlKCdTZWNvbmQnKVxuICAgIH0pXG4gIH0pXG5cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBTVEVQIEJSQU5DSElORyAofjYgdGVzdHMpXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgZGVzY3JpYmUoJ1N0ZXAgQnJhbmNoaW5nJywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgcmVzZXRGaWVsZENvdW50ZXIoKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGJyYW5jaCB0byBwZXJzb25hbCBzdGVwIHdoZW4gcGF0aCBpcyBwZXJzb25hbCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZvcm0gPSBjcmVhdGVCcmFuY2hpbmdGb3JtKClcbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZm9ybS5maWVsZHMpXG4gICAgICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIoZm9ybS5zdGVwcywgZW5naW5lKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgncGF0aCcsICdwZXJzb25hbCcpXG5cbiAgICAgIGNvbnN0IG5leHRCcmFuY2ggPSBzdGVwcGVyLmdldE5leHRCcmFuY2goKVxuICAgICAgZXhwZWN0KG5leHRCcmFuY2gpLm5vdC50b0JlTnVsbCgpXG4gICAgICBleHBlY3QobmV4dEJyYW5jaD8uc3RlcC5pZCkudG9CZSgnc3RlcF9wZXJzb25hbCcpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgYnJhbmNoIHRvIGJ1c2luZXNzIHN0ZXAgd2hlbiBwYXRoIGlzIGJ1c2luZXNzJywgKCkgPT4ge1xuICAgICAgY29uc3QgZm9ybSA9IGNyZWF0ZUJyYW5jaGluZ0Zvcm0oKVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmb3JtLmZpZWxkcylcbiAgICAgIGNvbnN0IHN0ZXBwZXIgPSBjcmVhdGVGb3JtU3RlcHBlcihmb3JtLnN0ZXBzLCBlbmdpbmUpXG5cbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdwYXRoJywgJ2J1c2luZXNzJylcblxuICAgICAgY29uc3QgbmV4dEJyYW5jaCA9IHN0ZXBwZXIuZ2V0TmV4dEJyYW5jaCgpXG4gICAgICBleHBlY3QobmV4dEJyYW5jaCkubm90LnRvQmVOdWxsKClcbiAgICAgIGV4cGVjdChuZXh0QnJhbmNoPy5zdGVwLmlkKS50b0JlKCdzdGVwX2J1c2luZXNzJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBuYXZpZ2F0ZSB0byBicmFuY2hlZCBzdGVwIHdpdGggZ29OZXh0QnJhbmNoJywgKCkgPT4ge1xuICAgICAgY29uc3QgZm9ybSA9IGNyZWF0ZUJyYW5jaGluZ0Zvcm0oKVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmb3JtLmZpZWxkcylcbiAgICAgIGNvbnN0IHN0ZXBwZXIgPSBjcmVhdGVGb3JtU3RlcHBlcihmb3JtLnN0ZXBzLCBlbmdpbmUpXG5cbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdwYXRoJywgJ3BlcnNvbmFsJylcbiAgICAgIHN0ZXBwZXIuZ29OZXh0QnJhbmNoKClcblxuICAgICAgY29uc3QgY3VycmVudFN0ZXAgPSBzdGVwcGVyLmdldEN1cnJlbnRTdGVwPy4oKVxuICAgICAgZXhwZWN0KGN1cnJlbnRTdGVwPy5zdGVwLmlkKS50b0JlKCdzdGVwX3BlcnNvbmFsJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gbnVsbCB3aGVuIG5vIHZhbHVlIHNldCBmb3IgYnJhbmNoIGNvbmRpdGlvbicsICgpID0+IHtcbiAgICAgIGNvbnN0IGZvcm0gPSBjcmVhdGVCcmFuY2hpbmdGb3JtKClcbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZm9ybS5maWVsZHMpXG4gICAgICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIoZm9ybS5zdGVwcywgZW5naW5lKVxuXG4gICAgICBjb25zdCBuZXh0QnJhbmNoID0gc3RlcHBlci5nZXROZXh0QnJhbmNoKClcbiAgICAgIGV4cGVjdChuZXh0QnJhbmNoKS50b0JlTnVsbCgpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaGF2ZSBjb3JyZWN0IGN1cnJlbnQgc3RlcCBhZnRlciBicmFuY2hpbmcnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmb3JtID0gY3JlYXRlQnJhbmNoaW5nRm9ybSgpXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZvcm0uZmllbGRzKVxuICAgICAgY29uc3Qgc3RlcHBlciA9IGNyZWF0ZUZvcm1TdGVwcGVyKGZvcm0uc3RlcHMsIGVuZ2luZSlcblxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ3BhdGgnLCAnYnVzaW5lc3MnKVxuICAgICAgc3RlcHBlci5nb05leHRCcmFuY2goKVxuXG4gICAgICBjb25zdCBjdXJyZW50U3RlcCA9IHN0ZXBwZXIuZ2V0Q3VycmVudFN0ZXA/LigpXG4gICAgICBleHBlY3QoY3VycmVudFN0ZXA/LnN0ZXAuaWQpLnRvQmUoJ3N0ZXBfYnVzaW5lc3MnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGZhbGxiYWNrIHRvIHNlcXVlbnRpYWwgbmF2aWdhdGlvbiB3aGVuIG5vIG1hdGNoaW5nIGJyYW5jaCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZvcm0gPSBjcmVhdGVCcmFuY2hpbmdGb3JtKClcbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZm9ybS5maWVsZHMpXG4gICAgICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIoZm9ybS5zdGVwcywgZW5naW5lKVxuXG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgncGF0aCcsICdpbnZhbGlkX3ZhbHVlJylcbiAgICAgIHN0ZXBwZXIuZ29OZXh0QnJhbmNoKClcblxuICAgICAgY29uc3QgY3VycmVudFN0ZXAgPSBzdGVwcGVyLmdldEN1cnJlbnRTdGVwPy4oKVxuICAgICAgZXhwZWN0KGN1cnJlbnRTdGVwKS5ub3QudG9CZU51bGwoKVxuICAgIH0pXG4gIH0pXG5cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBGSUVMRCBQRVJNSVNTSU9OUyAofjUgdGVzdHMpXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgZGVzY3JpYmUoJ0ZpZWxkIFBlcm1pc3Npb25zJywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgcmVzZXRGaWVsZENvdW50ZXIoKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBlZGl0YWJsZSBmb3IgYWRtaW4gcm9sZSBvbiBwdWJsaWMgZmllbGQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2YxJyxcbiAgICAgICAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgICAgICAga2V5OiAncHVibGljX25hbWUnLFxuICAgICAgICAgIHR5cGU6ICdTSE9SVF9URVhUJyBhcyBjb25zdCxcbiAgICAgICAgICBsYWJlbDogJ1B1YmxpYyBOYW1lJyxcbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICBvcmRlcjogMCxcbiAgICAgICAgICBjb25maWc6IHsgbWluTGVuZ3RoOiAxIH0sXG4gICAgICAgICAgc3RlcElkOiBudWxsLFxuICAgICAgICAgIHNlY3Rpb25JZDogbnVsbCxcbiAgICAgICAgICBwYXJlbnRGaWVsZElkOiBudWxsLFxuICAgICAgICAgIGNvbmRpdGlvbnM6IG51bGwsXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtcbiAgICAgICAgICAgIHsgcm9sZTogJ2FkbWluJywgbGV2ZWw6ICdlZGl0YWJsZScgYXMgY29uc3QgfSxcbiAgICAgICAgICAgIHsgcm9sZTogJ3VzZXInLCBsZXZlbDogJ2VkaXRhYmxlJyBhcyBjb25zdCB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2YyJyxcbiAgICAgICAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgICAgICAga2V5OiAnc2VjcmV0X2NvZGUnLFxuICAgICAgICAgIHR5cGU6ICdTSE9SVF9URVhUJyBhcyBjb25zdCxcbiAgICAgICAgICBsYWJlbDogJ1NlY3JldCBDb2RlJyxcbiAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgICAgb3JkZXI6IDEsXG4gICAgICAgICAgY29uZmlnOiB7fSxcbiAgICAgICAgICBzdGVwSWQ6IG51bGwsXG4gICAgICAgICAgc2VjdGlvbklkOiBudWxsLFxuICAgICAgICAgIHBhcmVudEZpZWxkSWQ6IG51bGwsXG4gICAgICAgICAgY29uZGl0aW9uczogbnVsbCxcbiAgICAgICAgICBwZXJtaXNzaW9uczogW1xuICAgICAgICAgICAgeyByb2xlOiAnYWRtaW4nLCBsZXZlbDogJ2VkaXRhYmxlJyBhcyBjb25zdCB9LFxuICAgICAgICAgICAgeyByb2xlOiAndXNlcicsIGxldmVsOiAnaGlkZGVuJyBhcyBjb25zdCB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2YzJyxcbiAgICAgICAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgICAgICAga2V5OiAncmVhZG9ubHlfZmllbGQnLFxuICAgICAgICAgIHR5cGU6ICdTSE9SVF9URVhUJyBhcyBjb25zdCxcbiAgICAgICAgICBsYWJlbDogJ1JlYWRvbmx5IEZpZWxkJyxcbiAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgICAgb3JkZXI6IDIsXG4gICAgICAgICAgY29uZmlnOiB7fSxcbiAgICAgICAgICBzdGVwSWQ6IG51bGwsXG4gICAgICAgICAgc2VjdGlvbklkOiBudWxsLFxuICAgICAgICAgIHBhcmVudEZpZWxkSWQ6IG51bGwsXG4gICAgICAgICAgY29uZGl0aW9uczogbnVsbCxcbiAgICAgICAgICBwZXJtaXNzaW9uczogW1xuICAgICAgICAgICAgeyByb2xlOiAnYWRtaW4nLCBsZXZlbDogJ2VkaXRhYmxlJyBhcyBjb25zdCB9LFxuICAgICAgICAgICAgeyByb2xlOiAndXNlcicsIGxldmVsOiAncmVhZG9ubHknIGFzIGNvbnN0IH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIF0gYXMgYW55XG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgICAgY29uc3QgcGVybWlzc2lvbiA9IGVuZ2luZS5nZXRGaWVsZFBlcm1pc3Npb24oJ3B1YmxpY19uYW1lJywgJ2FkbWluJylcbiAgICAgIGV4cGVjdChwZXJtaXNzaW9uKS50b0JlKCdlZGl0YWJsZScpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIGhpZGRlbiBmb3IgdXNlciByb2xlIG9uIHNlY3JldCBmaWVsZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnZjEnLFxuICAgICAgICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICAgICAgICBrZXk6ICdwdWJsaWNfbmFtZScsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnIGFzIGNvbnN0LFxuICAgICAgICAgIGxhYmVsOiAnUHVibGljIE5hbWUnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGNvbmZpZzogeyBtaW5MZW5ndGg6IDEgfSxcbiAgICAgICAgICBzdGVwSWQ6IG51bGwsXG4gICAgICAgICAgc2VjdGlvbklkOiBudWxsLFxuICAgICAgICAgIHBhcmVudEZpZWxkSWQ6IG51bGwsXG4gICAgICAgICAgY29uZGl0aW9uczogbnVsbCxcbiAgICAgICAgICBwZXJtaXNzaW9uczogW1xuICAgICAgICAgICAgeyByb2xlOiAnYWRtaW4nLCBsZXZlbDogJ2VkaXRhYmxlJyBhcyBjb25zdCB9LFxuICAgICAgICAgICAgeyByb2xlOiAndXNlcicsIGxldmVsOiAnZWRpdGFibGUnIGFzIGNvbnN0IH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnZjInLFxuICAgICAgICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICAgICAgICBrZXk6ICdzZWNyZXRfY29kZScsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnIGFzIGNvbnN0LFxuICAgICAgICAgIGxhYmVsOiAnU2VjcmV0IENvZGUnLFxuICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICBvcmRlcjogMSxcbiAgICAgICAgICBjb25maWc6IHt9LFxuICAgICAgICAgIHN0ZXBJZDogbnVsbCxcbiAgICAgICAgICBzZWN0aW9uSWQ6IG51bGwsXG4gICAgICAgICAgcGFyZW50RmllbGRJZDogbnVsbCxcbiAgICAgICAgICBjb25kaXRpb25zOiBudWxsLFxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbXG4gICAgICAgICAgICB7IHJvbGU6ICdhZG1pbicsIGxldmVsOiAnZWRpdGFibGUnIGFzIGNvbnN0IH0sXG4gICAgICAgICAgICB7IHJvbGU6ICd1c2VyJywgbGV2ZWw6ICdoaWRkZW4nIGFzIGNvbnN0IH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnZjMnLFxuICAgICAgICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICAgICAgICBrZXk6ICdyZWFkb25seV9maWVsZCcsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnIGFzIGNvbnN0LFxuICAgICAgICAgIGxhYmVsOiAnUmVhZG9ubHkgRmllbGQnLFxuICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICBvcmRlcjogMixcbiAgICAgICAgICBjb25maWc6IHt9LFxuICAgICAgICAgIHN0ZXBJZDogbnVsbCxcbiAgICAgICAgICBzZWN0aW9uSWQ6IG51bGwsXG4gICAgICAgICAgcGFyZW50RmllbGRJZDogbnVsbCxcbiAgICAgICAgICBjb25kaXRpb25zOiBudWxsLFxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbXG4gICAgICAgICAgICB7IHJvbGU6ICdhZG1pbicsIGxldmVsOiAnZWRpdGFibGUnIGFzIGNvbnN0IH0sXG4gICAgICAgICAgICB7IHJvbGU6ICd1c2VyJywgbGV2ZWw6ICdyZWFkb25seScgYXMgY29uc3QgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgXSBhcyBhbnlcbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgICBjb25zdCBwZXJtaXNzaW9uID0gZW5naW5lLmdldEZpZWxkUGVybWlzc2lvbignc2VjcmV0X2NvZGUnLCAndXNlcicpXG4gICAgICBleHBlY3QocGVybWlzc2lvbikudG9CZSgnaGlkZGVuJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gcmVhZG9ubHkgZm9yIHVzZXIgcm9sZSBvbiByZWFkb25seSBmaWVsZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnZjEnLFxuICAgICAgICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICAgICAgICBrZXk6ICdwdWJsaWNfbmFtZScsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnIGFzIGNvbnN0LFxuICAgICAgICAgIGxhYmVsOiAnUHVibGljIE5hbWUnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGNvbmZpZzogeyBtaW5MZW5ndGg6IDEgfSxcbiAgICAgICAgICBzdGVwSWQ6IG51bGwsXG4gICAgICAgICAgc2VjdGlvbklkOiBudWxsLFxuICAgICAgICAgIHBhcmVudEZpZWxkSWQ6IG51bGwsXG4gICAgICAgICAgY29uZGl0aW9uczogbnVsbCxcbiAgICAgICAgICBwZXJtaXNzaW9uczogW1xuICAgICAgICAgICAgeyByb2xlOiAnYWRtaW4nLCBsZXZlbDogJ2VkaXRhYmxlJyBhcyBjb25zdCB9LFxuICAgICAgICAgICAgeyByb2xlOiAndXNlcicsIGxldmVsOiAnZWRpdGFibGUnIGFzIGNvbnN0IH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnZjInLFxuICAgICAgICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICAgICAgICBrZXk6ICdzZWNyZXRfY29kZScsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnIGFzIGNvbnN0LFxuICAgICAgICAgIGxhYmVsOiAnU2VjcmV0IENvZGUnLFxuICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICBvcmRlcjogMSxcbiAgICAgICAgICBjb25maWc6IHt9LFxuICAgICAgICAgIHN0ZXBJZDogbnVsbCxcbiAgICAgICAgICBzZWN0aW9uSWQ6IG51bGwsXG4gICAgICAgICAgcGFyZW50RmllbGRJZDogbnVsbCxcbiAgICAgICAgICBjb25kaXRpb25zOiBudWxsLFxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbXG4gICAgICAgICAgICB7IHJvbGU6ICdhZG1pbicsIGxldmVsOiAnZWRpdGFibGUnIGFzIGNvbnN0IH0sXG4gICAgICAgICAgICB7IHJvbGU6ICd1c2VyJywgbGV2ZWw6ICdoaWRkZW4nIGFzIGNvbnN0IH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnZjMnLFxuICAgICAgICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICAgICAgICBrZXk6ICdyZWFkb25seV9maWVsZCcsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnIGFzIGNvbnN0LFxuICAgICAgICAgIGxhYmVsOiAnUmVhZG9ubHkgRmllbGQnLFxuICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICBvcmRlcjogMixcbiAgICAgICAgICBjb25maWc6IHt9LFxuICAgICAgICAgIHN0ZXBJZDogbnVsbCxcbiAgICAgICAgICBzZWN0aW9uSWQ6IG51bGwsXG4gICAgICAgICAgcGFyZW50RmllbGRJZDogbnVsbCxcbiAgICAgICAgICBjb25kaXRpb25zOiBudWxsLFxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbXG4gICAgICAgICAgICB7IHJvbGU6ICdhZG1pbicsIGxldmVsOiAnZWRpdGFibGUnIGFzIGNvbnN0IH0sXG4gICAgICAgICAgICB7IHJvbGU6ICd1c2VyJywgbGV2ZWw6ICdyZWFkb25seScgYXMgY29uc3QgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgXSBhcyBhbnlcbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgICBjb25zdCBwZXJtaXNzaW9uID0gZW5naW5lLmdldEZpZWxkUGVybWlzc2lvbigncmVhZG9ubHlfZmllbGQnLCAndXNlcicpXG4gICAgICBleHBlY3QocGVybWlzc2lvbikudG9CZSgncmVhZG9ubHknKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBlZGl0YWJsZSBmb3IgdXNlciByb2xlIG9uIHB1YmxpYyBmaWVsZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnZjEnLFxuICAgICAgICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICAgICAgICBrZXk6ICdwdWJsaWNfbmFtZScsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnIGFzIGNvbnN0LFxuICAgICAgICAgIGxhYmVsOiAnUHVibGljIE5hbWUnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGNvbmZpZzogeyBtaW5MZW5ndGg6IDEgfSxcbiAgICAgICAgICBzdGVwSWQ6IG51bGwsXG4gICAgICAgICAgc2VjdGlvbklkOiBudWxsLFxuICAgICAgICAgIHBhcmVudEZpZWxkSWQ6IG51bGwsXG4gICAgICAgICAgY29uZGl0aW9uczogbnVsbCxcbiAgICAgICAgICBwZXJtaXNzaW9uczogW1xuICAgICAgICAgICAgeyByb2xlOiAnYWRtaW4nLCBsZXZlbDogJ2VkaXRhYmxlJyBhcyBjb25zdCB9LFxuICAgICAgICAgICAgeyByb2xlOiAndXNlcicsIGxldmVsOiAnZWRpdGFibGUnIGFzIGNvbnN0IH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnZjInLFxuICAgICAgICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICAgICAgICBrZXk6ICdzZWNyZXRfY29kZScsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnIGFzIGNvbnN0LFxuICAgICAgICAgIGxhYmVsOiAnU2VjcmV0IENvZGUnLFxuICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICBvcmRlcjogMSxcbiAgICAgICAgICBjb25maWc6IHt9LFxuICAgICAgICAgIHN0ZXBJZDogbnVsbCxcbiAgICAgICAgICBzZWN0aW9uSWQ6IG51bGwsXG4gICAgICAgICAgcGFyZW50RmllbGRJZDogbnVsbCxcbiAgICAgICAgICBjb25kaXRpb25zOiBudWxsLFxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbXG4gICAgICAgICAgICB7IHJvbGU6ICdhZG1pbicsIGxldmVsOiAnZWRpdGFibGUnIGFzIGNvbnN0IH0sXG4gICAgICAgICAgICB7IHJvbGU6ICd1c2VyJywgbGV2ZWw6ICdoaWRkZW4nIGFzIGNvbnN0IH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnZjMnLFxuICAgICAgICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICAgICAgICBrZXk6ICdyZWFkb25seV9maWVsZCcsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnIGFzIGNvbnN0LFxuICAgICAgICAgIGxhYmVsOiAnUmVhZG9ubHkgRmllbGQnLFxuICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICBvcmRlcjogMixcbiAgICAgICAgICBjb25maWc6IHt9LFxuICAgICAgICAgIHN0ZXBJZDogbnVsbCxcbiAgICAgICAgICBzZWN0aW9uSWQ6IG51bGwsXG4gICAgICAgICAgcGFyZW50RmllbGRJZDogbnVsbCxcbiAgICAgICAgICBjb25kaXRpb25zOiBudWxsLFxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbXG4gICAgICAgICAgICB7IHJvbGU6ICdhZG1pbicsIGxldmVsOiAnZWRpdGFibGUnIGFzIGNvbnN0IH0sXG4gICAgICAgICAgICB7IHJvbGU6ICd1c2VyJywgbGV2ZWw6ICdyZWFkb25seScgYXMgY29uc3QgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgXSBhcyBhbnlcbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgICBjb25zdCBwZXJtaXNzaW9uID0gZW5naW5lLmdldEZpZWxkUGVybWlzc2lvbigncHVibGljX25hbWUnLCAndXNlcicpXG4gICAgICBleHBlY3QocGVybWlzc2lvbikudG9CZSgnZWRpdGFibGUnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBlZGl0YWJsZSBieSBkZWZhdWx0IGZvciBmaWVsZCB3aXRoIG5vIHBlcm1pc3Npb25zJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ3VucHJvdGVjdGVkJywgdHlwZTogJ1NIT1JUX1RFWFQnIH0pXVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICAgIGNvbnN0IHBlcm1pc3Npb24gPSBlbmdpbmUuZ2V0RmllbGRQZXJtaXNzaW9uKCd1bnByb3RlY3RlZCcsICdhZG1pbicpXG4gICAgICBleHBlY3QocGVybWlzc2lvbikudG9CZSgnZWRpdGFibGUnKVxuICAgIH0pXG4gIH0pXG5cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBJTlRFUk5BVElPTkFMSVpBVElPTiAoaTE4bikgKH41IHRlc3RzKVxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGRlc2NyaWJlKCdJbnRlcm5hdGlvbmFsaXphdGlvbiAoaTE4biknLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICByZXNldEZpZWxkQ291bnRlcigpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIEVuZ2xpc2ggbGFiZWwnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2YxJyxcbiAgICAgICAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgICAgICAga2V5OiAnbmFtZScsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnIGFzIGNvbnN0LFxuICAgICAgICAgIGxhYmVsOiAnTmFtZScsXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgICAgY29uZmlnOiB7IG1pbkxlbmd0aDogMSB9LFxuICAgICAgICAgIHN0ZXBJZDogbnVsbCxcbiAgICAgICAgICBzZWN0aW9uSWQ6IG51bGwsXG4gICAgICAgICAgcGFyZW50RmllbGRJZDogbnVsbCxcbiAgICAgICAgICBjb25kaXRpb25zOiBudWxsLFxuICAgICAgICAgIGkxOG5MYWJlbHM6IHsgZW46ICdOYW1lJywgZXM6ICdOb21icmUnLCBmcjogJ05vbScgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnZjInLFxuICAgICAgICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICAgICAgICBrZXk6ICdlbWFpbCcsXG4gICAgICAgICAgdHlwZTogJ0VNQUlMJyBhcyBjb25zdCxcbiAgICAgICAgICBsYWJlbDogJ0VtYWlsJyxcbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICBvcmRlcjogMSxcbiAgICAgICAgICBjb25maWc6IHt9LFxuICAgICAgICAgIHN0ZXBJZDogbnVsbCxcbiAgICAgICAgICBzZWN0aW9uSWQ6IG51bGwsXG4gICAgICAgICAgcGFyZW50RmllbGRJZDogbnVsbCxcbiAgICAgICAgICBjb25kaXRpb25zOiBudWxsLFxuICAgICAgICAgIGkxOG5MYWJlbHM6IHsgZW46ICdFbWFpbCcsIGVzOiAnQ29ycmVvIGVsZWN0csOzbmljbycsIGZyOiAnRS1tYWlsJyB9LFxuICAgICAgICB9LFxuICAgICAgXSBhcyBhbnlcbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgICBjb25zdCBsYWJlbCA9IGVuZ2luZS5nZXRMb2NhbGl6ZWRMYWJlbCgnbmFtZScsICdlbicpXG4gICAgICBleHBlY3QobGFiZWwpLnRvQmUoJ05hbWUnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBTcGFuaXNoIGxhYmVsJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdmMScsXG4gICAgICAgICAgdmVyc2lvbklkOiAndjEnLFxuICAgICAgICAgIGtleTogJ25hbWUnLFxuICAgICAgICAgIHR5cGU6ICdTSE9SVF9URVhUJyBhcyBjb25zdCxcbiAgICAgICAgICBsYWJlbDogJ05hbWUnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGNvbmZpZzogeyBtaW5MZW5ndGg6IDEgfSxcbiAgICAgICAgICBzdGVwSWQ6IG51bGwsXG4gICAgICAgICAgc2VjdGlvbklkOiBudWxsLFxuICAgICAgICAgIHBhcmVudEZpZWxkSWQ6IG51bGwsXG4gICAgICAgICAgY29uZGl0aW9uczogbnVsbCxcbiAgICAgICAgICBpMThuTGFiZWxzOiB7IGVuOiAnTmFtZScsIGVzOiAnTm9tYnJlJywgZnI6ICdOb20nIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2YyJyxcbiAgICAgICAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgICAgICAga2V5OiAnZW1haWwnLFxuICAgICAgICAgIHR5cGU6ICdFTUFJTCcgYXMgY29uc3QsXG4gICAgICAgICAgbGFiZWw6ICdFbWFpbCcsXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgb3JkZXI6IDEsXG4gICAgICAgICAgY29uZmlnOiB7fSxcbiAgICAgICAgICBzdGVwSWQ6IG51bGwsXG4gICAgICAgICAgc2VjdGlvbklkOiBudWxsLFxuICAgICAgICAgIHBhcmVudEZpZWxkSWQ6IG51bGwsXG4gICAgICAgICAgY29uZGl0aW9uczogbnVsbCxcbiAgICAgICAgICBpMThuTGFiZWxzOiB7IGVuOiAnRW1haWwnLCBlczogJ0NvcnJlbyBlbGVjdHLDs25pY28nLCBmcjogJ0UtbWFpbCcgfSxcbiAgICAgICAgfSxcbiAgICAgIF0gYXMgYW55XG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgICAgY29uc3QgbGFiZWwgPSBlbmdpbmUuZ2V0TG9jYWxpemVkTGFiZWwoJ25hbWUnLCAnZXMnKVxuICAgICAgZXhwZWN0KGxhYmVsKS50b0JlKCdOb21icmUnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBGcmVuY2ggbGFiZWwnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2YxJyxcbiAgICAgICAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgICAgICAga2V5OiAnbmFtZScsXG4gICAgICAgICAgdHlwZTogJ1NIT1JUX1RFWFQnIGFzIGNvbnN0LFxuICAgICAgICAgIGxhYmVsOiAnTmFtZScsXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgICAgY29uZmlnOiB7IG1pbkxlbmd0aDogMSB9LFxuICAgICAgICAgIHN0ZXBJZDogbnVsbCxcbiAgICAgICAgICBzZWN0aW9uSWQ6IG51bGwsXG4gICAgICAgICAgcGFyZW50RmllbGRJZDogbnVsbCxcbiAgICAgICAgICBjb25kaXRpb25zOiBudWxsLFxuICAgICAgICAgIGkxOG5MYWJlbHM6IHsgZW46ICdOYW1lJywgZXM6ICdOb21icmUnLCBmcjogJ05vbScgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnZjInLFxuICAgICAgICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICAgICAgICBrZXk6ICdlbWFpbCcsXG4gICAgICAgICAgdHlwZTogJ0VNQUlMJyBhcyBjb25zdCxcbiAgICAgICAgICBsYWJlbDogJ0VtYWlsJyxcbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICBvcmRlcjogMSxcbiAgICAgICAgICBjb25maWc6IHt9LFxuICAgICAgICAgIHN0ZXBJZDogbnVsbCxcbiAgICAgICAgICBzZWN0aW9uSWQ6IG51bGwsXG4gICAgICAgICAgcGFyZW50RmllbGRJZDogbnVsbCxcbiAgICAgICAgICBjb25kaXRpb25zOiBudWxsLFxuICAgICAgICAgIGkxOG5MYWJlbHM6IHsgZW46ICdFbWFpbCcsIGVzOiAnQ29ycmVvIGVsZWN0csOzbmljbycsIGZyOiAnRS1tYWlsJyB9LFxuICAgICAgICB9LFxuICAgICAgXSBhcyBhbnlcbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgICBjb25zdCBsYWJlbCA9IGVuZ2luZS5nZXRMb2NhbGl6ZWRMYWJlbCgnbmFtZScsICdmcicpXG4gICAgICBleHBlY3QobGFiZWwpLnRvQmUoJ05vbScpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZmFsbGJhY2sgdG8gZGVmYXVsdCBsYWJlbCBmb3IgdW5zdXBwb3J0ZWQgbG9jYWxlJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdmMScsXG4gICAgICAgICAgdmVyc2lvbklkOiAndjEnLFxuICAgICAgICAgIGtleTogJ25hbWUnLFxuICAgICAgICAgIHR5cGU6ICdTSE9SVF9URVhUJyBhcyBjb25zdCxcbiAgICAgICAgICBsYWJlbDogJ05hbWUnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGNvbmZpZzogeyBtaW5MZW5ndGg6IDEgfSxcbiAgICAgICAgICBzdGVwSWQ6IG51bGwsXG4gICAgICAgICAgc2VjdGlvbklkOiBudWxsLFxuICAgICAgICAgIHBhcmVudEZpZWxkSWQ6IG51bGwsXG4gICAgICAgICAgY29uZGl0aW9uczogbnVsbCxcbiAgICAgICAgICBpMThuTGFiZWxzOiB7IGVuOiAnTmFtZScsIGVzOiAnTm9tYnJlJywgZnI6ICdOb20nIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2YyJyxcbiAgICAgICAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgICAgICAga2V5OiAnZW1haWwnLFxuICAgICAgICAgIHR5cGU6ICdFTUFJTCcgYXMgY29uc3QsXG4gICAgICAgICAgbGFiZWw6ICdFbWFpbCcsXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgb3JkZXI6IDEsXG4gICAgICAgICAgY29uZmlnOiB7fSxcbiAgICAgICAgICBzdGVwSWQ6IG51bGwsXG4gICAgICAgICAgc2VjdGlvbklkOiBudWxsLFxuICAgICAgICAgIHBhcmVudEZpZWxkSWQ6IG51bGwsXG4gICAgICAgICAgY29uZGl0aW9uczogbnVsbCxcbiAgICAgICAgICBpMThuTGFiZWxzOiB7IGVuOiAnRW1haWwnLCBlczogJ0NvcnJlbyBlbGVjdHLDs25pY28nLCBmcjogJ0UtbWFpbCcgfSxcbiAgICAgICAgfSxcbiAgICAgIF0gYXMgYW55XG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgICAgY29uc3QgbGFiZWwgPSBlbmdpbmUuZ2V0TG9jYWxpemVkTGFiZWwoJ25hbWUnLCAnZGUnKVxuICAgICAgZXhwZWN0KGxhYmVsKS50b0JlKCdOYW1lJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gbG9jYWxpemVkIGxhYmVsIGZvciBlbWFpbCBmaWVsZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnZjEnLFxuICAgICAgICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICAgICAgICBrZXk6ICduYW1lJyxcbiAgICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcgYXMgY29uc3QsXG4gICAgICAgICAgbGFiZWw6ICdOYW1lJyxcbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICBvcmRlcjogMCxcbiAgICAgICAgICBjb25maWc6IHsgbWluTGVuZ3RoOiAxIH0sXG4gICAgICAgICAgc3RlcElkOiBudWxsLFxuICAgICAgICAgIHNlY3Rpb25JZDogbnVsbCxcbiAgICAgICAgICBwYXJlbnRGaWVsZElkOiBudWxsLFxuICAgICAgICAgIGNvbmRpdGlvbnM6IG51bGwsXG4gICAgICAgICAgaTE4bkxhYmVsczogeyBlbjogJ05hbWUnLCBlczogJ05vbWJyZScsIGZyOiAnTm9tJyB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdmMicsXG4gICAgICAgICAgdmVyc2lvbklkOiAndjEnLFxuICAgICAgICAgIGtleTogJ2VtYWlsJyxcbiAgICAgICAgICB0eXBlOiAnRU1BSUwnIGFzIGNvbnN0LFxuICAgICAgICAgIGxhYmVsOiAnRW1haWwnLFxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG9yZGVyOiAxLFxuICAgICAgICAgIGNvbmZpZzoge30sXG4gICAgICAgICAgc3RlcElkOiBudWxsLFxuICAgICAgICAgIHNlY3Rpb25JZDogbnVsbCxcbiAgICAgICAgICBwYXJlbnRGaWVsZElkOiBudWxsLFxuICAgICAgICAgIGNvbmRpdGlvbnM6IG51bGwsXG4gICAgICAgICAgaTE4bkxhYmVsczogeyBlbjogJ0VtYWlsJywgZXM6ICdDb3JyZW8gZWxlY3Ryw7NuaWNvJywgZnI6ICdFLW1haWwnIH0sXG4gICAgICAgIH0sXG4gICAgICBdIGFzIGFueVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICAgIGNvbnN0IGxhYmVsID0gZW5naW5lLmdldExvY2FsaXplZExhYmVsKCdlbWFpbCcsICdlcycpXG4gICAgICBleHBlY3QobGFiZWwpLnRvQmUoJ0NvcnJlbyBlbGVjdHLDs25pY28nKVxuICAgIH0pXG4gIH0pXG5cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBSRVBFQVRBQkxFIEdST1VQUyAofjUgdGVzdHMpXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgZGVzY3JpYmUoJ1JlcGVhdGFibGUgR3JvdXBzJywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgcmVzZXRGaWVsZENvdW50ZXIoKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHN0YXJ0IHdpdGggZW1wdHkgcmVwZWF0IGluc3RhbmNlcycsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAgICBrZXk6ICdhZGRyZXNzZXMnLFxuICAgICAgICAgIHR5cGU6ICdGSUVMRF9HUk9VUCcsXG4gICAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZUZpZWxkczogW1xuICAgICAgICAgICAgICB7IGtleTogJ3N0cmVldCcsIHR5cGU6ICdTSE9SVF9URVhUJywgY29uZmlnOiB7fSB9LFxuICAgICAgICAgICAgICB7IGtleTogJ2NpdHknLCB0eXBlOiAnU0hPUlRfVEVYVCcsIGNvbmZpZzoge30gfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgICAgY29uc3QgaW5zdGFuY2VzID0gZW5naW5lLmdldFJlcGVhdEluc3RhbmNlcygnYWRkcmVzc2VzJylcbiAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KGluc3RhbmNlcykpLnRvQmUodHJ1ZSlcbiAgICAgIGV4cGVjdChpbnN0YW5jZXMubGVuZ3RoKS50b0JlKDApXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgYWRkIHJlcGVhdCBpbnN0YW5jZScsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAgICBrZXk6ICdhZGRyZXNzZXMnLFxuICAgICAgICAgIHR5cGU6ICdGSUVMRF9HUk9VUCcsXG4gICAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZUZpZWxkczogW1xuICAgICAgICAgICAgICB7IGtleTogJ3N0cmVldCcsIHR5cGU6ICdTSE9SVF9URVhUJywgY29uZmlnOiB7fSB9LFxuICAgICAgICAgICAgICB7IGtleTogJ2NpdHknLCB0eXBlOiAnU0hPUlRfVEVYVCcsIGNvbmZpZzoge30gfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgICAgZW5naW5lLmFkZFJlcGVhdEluc3RhbmNlKCdhZGRyZXNzZXMnKVxuICAgICAgY29uc3QgaW5zdGFuY2VzID0gZW5naW5lLmdldFJlcGVhdEluc3RhbmNlcygnYWRkcmVzc2VzJylcbiAgICAgIGV4cGVjdChpbnN0YW5jZXMubGVuZ3RoKS50b0JlKDEpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIG11bHRpcGxlIHJlcGVhdCBpbnN0YW5jZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgICAga2V5OiAnYWRkcmVzc2VzJyxcbiAgICAgICAgICB0eXBlOiAnRklFTERfR1JPVVAnLFxuICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgdGVtcGxhdGVGaWVsZHM6IFtcbiAgICAgICAgICAgICAgeyBrZXk6ICdzdHJlZXQnLCB0eXBlOiAnU0hPUlRfVEVYVCcsIGNvbmZpZzoge30gfSxcbiAgICAgICAgICAgICAgeyBrZXk6ICdjaXR5JywgdHlwZTogJ1NIT1JUX1RFWFQnLCBjb25maWc6IHt9IH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgXVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICAgIGVuZ2luZS5hZGRSZXBlYXRJbnN0YW5jZSgnYWRkcmVzc2VzJylcbiAgICAgIGVuZ2luZS5hZGRSZXBlYXRJbnN0YW5jZSgnYWRkcmVzc2VzJylcbiAgICAgIGVuZ2luZS5hZGRSZXBlYXRJbnN0YW5jZSgnYWRkcmVzc2VzJylcblxuICAgICAgY29uc3QgaW5zdGFuY2VzID0gZW5naW5lLmdldFJlcGVhdEluc3RhbmNlcygnYWRkcmVzc2VzJylcbiAgICAgIGV4cGVjdChpbnN0YW5jZXMubGVuZ3RoKS50b0JlKDMpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmVtb3ZlIHJlcGVhdCBpbnN0YW5jZSBhdCBzcGVjaWZpYyBpbmRleCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAgICBrZXk6ICdhZGRyZXNzZXMnLFxuICAgICAgICAgIHR5cGU6ICdGSUVMRF9HUk9VUCcsXG4gICAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZUZpZWxkczogW1xuICAgICAgICAgICAgICB7IGtleTogJ3N0cmVldCcsIHR5cGU6ICdTSE9SVF9URVhUJywgY29uZmlnOiB7fSB9LFxuICAgICAgICAgICAgICB7IGtleTogJ2NpdHknLCB0eXBlOiAnU0hPUlRfVEVYVCcsIGNvbmZpZzoge30gfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgICAgZW5naW5lLmFkZFJlcGVhdEluc3RhbmNlKCdhZGRyZXNzZXMnKVxuICAgICAgZW5naW5lLmFkZFJlcGVhdEluc3RhbmNlKCdhZGRyZXNzZXMnKVxuICAgICAgZW5naW5lLmFkZFJlcGVhdEluc3RhbmNlKCdhZGRyZXNzZXMnKVxuICAgICAgZXhwZWN0KGVuZ2luZS5nZXRSZXBlYXRJbnN0YW5jZXMoJ2FkZHJlc3NlcycpLmxlbmd0aCkudG9CZSgzKVxuXG4gICAgICBlbmdpbmUucmVtb3ZlUmVwZWF0SW5zdGFuY2UoJ2FkZHJlc3NlcycsIDEpXG4gICAgICBleHBlY3QoZW5naW5lLmdldFJlcGVhdEluc3RhbmNlcygnYWRkcmVzc2VzJykubGVuZ3RoKS50b0JlKDIpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIHJlbW92YWwgZnJvbSBlbXB0eSByZXBlYXQgZ3JvdXAgZ3JhY2VmdWxseScsICgpID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAgICBrZXk6ICdhZGRyZXNzZXMnLFxuICAgICAgICAgIHR5cGU6ICdGSUVMRF9HUk9VUCcsXG4gICAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICB0ZW1wbGF0ZUZpZWxkczogW1xuICAgICAgICAgICAgICB7IGtleTogJ3N0cmVldCcsIHR5cGU6ICdTSE9SVF9URVhUJywgY29uZmlnOiB7fSB9LFxuICAgICAgICAgICAgICB7IGtleTogJ2NpdHknLCB0eXBlOiAnU0hPUlRfVEVYVCcsIGNvbmZpZzoge30gfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICBdXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgICAgZXhwZWN0KCgpID0+IHtcbiAgICAgICAgZW5naW5lLnJlbW92ZVJlcGVhdEluc3RhbmNlKCdhZGRyZXNzZXMnLCAwKVxuICAgICAgfSkubm90LnRvVGhyb3coKVxuXG4gICAgICBjb25zdCBpbnN0YW5jZXMgPSBlbmdpbmUuZ2V0UmVwZWF0SW5zdGFuY2VzKCdhZGRyZXNzZXMnKVxuICAgICAgZXhwZWN0KGluc3RhbmNlcy5sZW5ndGgpLnRvQmUoMClcbiAgICB9KVxuICB9KVxufSlcbiJdfQ==