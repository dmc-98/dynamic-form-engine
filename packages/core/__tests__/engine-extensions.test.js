"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const src_1 = require("../src");
/**
 * Tests for engine extension features:
 * - Computed fields with expression evaluation
 * - Undo/redo functionality
 * - Field permissions and role-based access
 * - i18n label localization
 * - Repeatable field groups
 * - Stepper branching logic
 */
// ─── Test Helpers ───────────────────────────────────────────────────────────
function makeField(overrides) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    return {
        id: (_a = overrides.id) !== null && _a !== void 0 ? _a : `field_${overrides.key}`,
        versionId: (_b = overrides.versionId) !== null && _b !== void 0 ? _b : 'v1',
        key: overrides.key,
        label: (_c = overrides.label) !== null && _c !== void 0 ? _c : overrides.key,
        type: (_d = overrides.type) !== null && _d !== void 0 ? _d : 'SHORT_TEXT',
        required: (_e = overrides.required) !== null && _e !== void 0 ? _e : false,
        order: (_f = overrides.order) !== null && _f !== void 0 ? _f : 0,
        config: (_g = overrides.config) !== null && _g !== void 0 ? _g : {},
        stepId: (_h = overrides.stepId) !== null && _h !== void 0 ? _h : null,
        sectionId: (_j = overrides.sectionId) !== null && _j !== void 0 ? _j : null,
        parentFieldId: (_k = overrides.parentFieldId) !== null && _k !== void 0 ? _k : null,
        conditions: (_l = overrides.conditions) !== null && _l !== void 0 ? _l : null,
        children: overrides.children,
        computed: overrides.computed,
        permissions: overrides.permissions,
        i18nLabels: overrides.i18nLabels,
    };
}
function makeStep(overrides) {
    var _a, _b, _c, _d;
    return {
        id: overrides.id,
        versionId: (_a = overrides.versionId) !== null && _a !== void 0 ? _a : 'v1',
        title: overrides.title,
        order: (_b = overrides.order) !== null && _b !== void 0 ? _b : 0,
        conditions: (_c = overrides.conditions) !== null && _c !== void 0 ? _c : null,
        config: (_d = overrides.config) !== null && _d !== void 0 ? _d : null,
        fields: overrides.fields,
        branches: overrides.branches,
    };
}
// ─── Computed Fields Tests ───────────────────────────────────────────────────
(0, vitest_1.describe)('Computed Fields', () => {
    (0, vitest_1.it)('should register and evaluate computed field', () => {
        const fields = [
            makeField({ key: 'quantity', type: 'NUMBER', required: true }),
            makeField({ key: 'price', type: 'NUMBER', required: true }),
            makeField({
                key: 'total',
                type: 'NUMBER',
                computed: {
                    expression: 'quantity * price',
                    dependsOn: ['quantity', 'price'],
                },
            }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        engine.setFieldValue('quantity', 5);
        engine.setFieldValue('price', 10);
        const computed = engine.getComputedValue('total');
        (0, vitest_1.expect)(computed).toBe(50);
    });
    (0, vitest_1.it)('should auto-update computed field when dependencies change', () => {
        const fields = [
            makeField({ key: 'a', type: 'NUMBER' }),
            makeField({ key: 'b', type: 'NUMBER' }),
            makeField({
                key: 'sum',
                type: 'NUMBER',
                computed: {
                    expression: 'a + b',
                    dependsOn: ['a', 'b'],
                },
            }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        engine.setFieldValue('a', 10);
        (0, vitest_1.expect)(engine.getComputedValue('sum')).toBe(10);
        engine.setFieldValue('b', 5);
        (0, vitest_1.expect)(engine.getComputedValue('sum')).toBe(15);
        engine.setFieldValue('a', 20);
        (0, vitest_1.expect)(engine.getComputedValue('sum')).toBe(25);
    });
    (0, vitest_1.it)('should handle complex mathematical expressions', () => {
        const fields = [
            makeField({ key: 'x', type: 'NUMBER' }),
            makeField({ key: 'y', type: 'NUMBER' }),
            makeField({
                key: 'result',
                type: 'NUMBER',
                computed: {
                    expression: '(x * x) + (y * y)',
                    dependsOn: ['x', 'y'],
                },
            }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        engine.setFieldValue('x', 3);
        engine.setFieldValue('y', 4);
        const result = engine.getComputedValue('result');
        (0, vitest_1.expect)(result).toBe(25); // 3² + 4² = 9 + 16 = 25
    });
    (0, vitest_1.it)('should handle boolean conditions in computed fields', () => {
        const fields = [
            makeField({ key: 'age', type: 'NUMBER' }),
            makeField({
                key: 'isAdult',
                type: 'CHECKBOX',
                computed: {
                    expression: 'age >= 18',
                    dependsOn: ['age'],
                },
            }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        engine.setFieldValue('age', 17);
        (0, vitest_1.expect)(engine.getComputedValue('isAdult')).toBe(false);
        engine.setFieldValue('age', 18);
        (0, vitest_1.expect)(engine.getComputedValue('isAdult')).toBe(true);
        engine.setFieldValue('age', 25);
        (0, vitest_1.expect)(engine.getComputedValue('isAdult')).toBe(true);
    });
    (0, vitest_1.it)('should handle ternary operators in computed fields', () => {
        const fields = [
            makeField({ key: 'score', type: 'NUMBER' }),
            makeField({
                key: 'grade',
                type: 'SHORT_TEXT',
                computed: {
                    expression: 'score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : "F"',
                    dependsOn: ['score'],
                },
            }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        engine.setFieldValue('score', 95);
        (0, vitest_1.expect)(engine.getComputedValue('grade')).toBe('A');
        engine.setFieldValue('score', 85);
        (0, vitest_1.expect)(engine.getComputedValue('grade')).toBe('B');
        engine.setFieldValue('score', 75);
        (0, vitest_1.expect)(engine.getComputedValue('grade')).toBe('C');
        engine.setFieldValue('score', 50);
        (0, vitest_1.expect)(engine.getComputedValue('grade')).toBe('F');
    });
    (0, vitest_1.it)('should handle chained computed dependencies', () => {
        const fields = [
            makeField({ key: 'a', type: 'NUMBER' }),
            makeField({
                key: 'b',
                type: 'NUMBER',
                computed: {
                    expression: 'a * 2',
                    dependsOn: ['a'],
                },
            }),
            makeField({
                key: 'c',
                type: 'NUMBER',
                computed: {
                    expression: 'b * 3',
                    dependsOn: ['b'],
                },
            }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        engine.setFieldValue('a', 5);
        // a = 5, b = a * 2 = 10, c = b * 3 = 30
        (0, vitest_1.expect)(engine.getComputedValue('b')).toBe(10);
        (0, vitest_1.expect)(engine.getComputedValue('c')).toBe(30);
    });
    (0, vitest_1.it)('should return undefined for non-computed fields', () => {
        const fields = [makeField({ key: 'name' })];
        const engine = (0, src_1.createFormEngine)(fields);
        const computed = engine.getComputedValue('name');
        (0, vitest_1.expect)(computed).toBeUndefined();
    });
    (0, vitest_1.it)('should handle expression evaluation errors gracefully', () => {
        const fields = [
            makeField({ key: 'a', type: 'NUMBER' }),
            makeField({
                key: 'result',
                type: 'NUMBER',
                computed: {
                    expression: 'undefined_variable * 2',
                    dependsOn: ['a'],
                },
            }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        engine.setFieldValue('a', 5);
        // Should return null on error
        const result = engine.getComputedValue('result');
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('should dynamically register computed fields', () => {
        const fields = [
            makeField({ key: 'x', type: 'NUMBER' }),
            makeField({ key: 'y', type: 'NUMBER' }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        // Register computed field after engine creation
        engine.registerComputed('sum', 'x + y', ['x', 'y']);
        engine.setFieldValue('x', 5);
        engine.setFieldValue('y', 3);
        (0, vitest_1.expect)(engine.getComputedValue('sum')).toBe(8);
    });
});
// ─── Undo/Redo Tests ─────────────────────────────────────────────────────────
(0, vitest_1.describe)('Undo/Redo', () => {
    (0, vitest_1.it)('should track undo history', () => {
        const fields = [makeField({ key: 'name' })];
        const engine = (0, src_1.createFormEngine)(fields);
        engine.setFieldValue('name', 'John');
        (0, vitest_1.expect)(engine.canUndo()).toBe(true);
        engine.setFieldValue('name', 'Jane');
        (0, vitest_1.expect)(engine.canUndo()).toBe(true);
    });
    (0, vitest_1.it)('should undo field changes', () => {
        const fields = [makeField({ key: 'name' })];
        const engine = (0, src_1.createFormEngine)(fields);
        engine.setFieldValue('name', 'John');
        engine.setFieldValue('name', 'Jane');
        (0, vitest_1.expect)(engine.getValues().name).toBe('Jane');
        const previousValues = engine.undo();
        (0, vitest_1.expect)(previousValues === null || previousValues === void 0 ? void 0 : previousValues.name).toBe('John');
        (0, vitest_1.expect)(engine.getValues().name).toBe('John');
    });
    (0, vitest_1.it)('should redo field changes', () => {
        const fields = [makeField({ key: 'name' })];
        const engine = (0, src_1.createFormEngine)(fields);
        engine.setFieldValue('name', 'John');
        engine.setFieldValue('name', 'Jane');
        engine.undo();
        (0, vitest_1.expect)(engine.getValues().name).toBe('John');
        (0, vitest_1.expect)(engine.canRedo()).toBe(true);
        const nextValues = engine.redo();
        (0, vitest_1.expect)(nextValues === null || nextValues === void 0 ? void 0 : nextValues.name).toBe('Jane');
        (0, vitest_1.expect)(engine.getValues().name).toBe('Jane');
    });
    (0, vitest_1.it)('should clear redo stack on new change after undo', () => {
        const fields = [makeField({ key: 'name' })];
        const engine = (0, src_1.createFormEngine)(fields);
        engine.setFieldValue('name', 'John');
        engine.setFieldValue('name', 'Jane');
        engine.undo();
        (0, vitest_1.expect)(engine.canRedo()).toBe(true);
        engine.setFieldValue('name', 'Bob');
        (0, vitest_1.expect)(engine.canRedo()).toBe(false);
    });
    (0, vitest_1.it)('should respect max history limit', () => {
        const fields = [makeField({ key: 'counter', type: 'NUMBER' })];
        const engine = (0, src_1.createFormEngine)(fields);
        // Make 60 changes (should limit to 50)
        for (let i = 0; i < 60; i++) {
            engine.setFieldValue('counter', i);
        }
        // Should be able to undo at most 50 times
        let undoCount = 0;
        while (engine.canUndo() && undoCount < 55) {
            engine.undo();
            undoCount++;
        }
        // Should have undone at most 50 changes
        (0, vitest_1.expect)(undoCount).toBeLessThanOrEqual(50);
    });
    (0, vitest_1.it)('should handle undo/redo with multiple fields', () => {
        const fields = [
            makeField({ key: 'name' }),
            makeField({ key: 'email' }),
            makeField({ key: 'phone' }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        engine.setFieldValue('name', 'John');
        engine.setFieldValue('email', 'john@example.com');
        engine.setFieldValue('phone', '555-1234');
        const snapshot1 = { name: 'John', email: 'john@example.com', phone: '555-1234' };
        (0, vitest_1.expect)(engine.getValues()).toEqual(vitest_1.expect.objectContaining(snapshot1));
        engine.undo();
        // After undo, phone reverts to its value before setFieldValue('phone', '555-1234')
        (0, vitest_1.expect)(engine.getValues().phone).toBe('');
        engine.undo();
        (0, vitest_1.expect)(engine.getValues().email).toBe('');
        engine.undo();
        (0, vitest_1.expect)(engine.getValues().name).toBe('');
    });
    (0, vitest_1.it)('should return null when cannot undo', () => {
        const fields = [makeField({ key: 'name' })];
        const engine = (0, src_1.createFormEngine)(fields);
        (0, vitest_1.expect)(engine.canUndo()).toBe(false);
        (0, vitest_1.expect)(engine.undo()).toBeNull();
    });
    (0, vitest_1.it)('should return null when cannot redo', () => {
        const fields = [makeField({ key: 'name' })];
        const engine = (0, src_1.createFormEngine)(fields);
        engine.setFieldValue('name', 'John');
        engine.undo();
        engine.redo();
        (0, vitest_1.expect)(engine.canRedo()).toBe(false);
        (0, vitest_1.expect)(engine.redo()).toBeNull();
    });
});
// ─── Field Permissions Tests ─────────────────────────────────────────────────
(0, vitest_1.describe)('Field Permissions', () => {
    (0, vitest_1.it)('should return editable as default permission', () => {
        const fields = [makeField({ key: 'name' })];
        const engine = (0, src_1.createFormEngine)(fields);
        const permission = engine.getFieldPermission('name', 'user');
        (0, vitest_1.expect)(permission).toBe('editable');
    });
    (0, vitest_1.it)('should return permission level for role', () => {
        const fields = [
            makeField({
                key: 'salary',
                permissions: [
                    { role: 'admin', level: 'editable' },
                    { role: 'manager', level: 'readonly' },
                    { role: 'employee', level: 'hidden' },
                ],
            }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        (0, vitest_1.expect)(engine.getFieldPermission('salary', 'admin')).toBe('editable');
        (0, vitest_1.expect)(engine.getFieldPermission('salary', 'manager')).toBe('readonly');
        (0, vitest_1.expect)(engine.getFieldPermission('salary', 'employee')).toBe('hidden');
    });
    (0, vitest_1.it)('should return default when role not found', () => {
        const fields = [
            makeField({
                key: 'field',
                permissions: [{ role: 'admin', level: 'editable' }],
            }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        (0, vitest_1.expect)(engine.getFieldPermission('field', 'unknown')).toBe('editable');
    });
    (0, vitest_1.it)('should handle permission changes across multiple roles', () => {
        const fields = [
            makeField({
                key: 'email',
                permissions: [
                    { role: 'user', level: 'readonly' },
                    { role: 'admin', level: 'editable' },
                    { role: 'guest', level: 'hidden' },
                ],
            }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        const roles = ['user', 'admin', 'guest', 'other'];
        const permissions = roles.map(role => engine.getFieldPermission('email', role));
        (0, vitest_1.expect)(permissions[0]).toBe('readonly'); // user
        (0, vitest_1.expect)(permissions[1]).toBe('editable'); // admin
        (0, vitest_1.expect)(permissions[2]).toBe('hidden'); // guest
        (0, vitest_1.expect)(permissions[3]).toBe('editable'); // other (default)
    });
    (0, vitest_1.it)('should return editable for non-existent fields', () => {
        const fields = [makeField({ key: 'name' })];
        const engine = (0, src_1.createFormEngine)(fields);
        (0, vitest_1.expect)(engine.getFieldPermission('nonexistent', 'user')).toBe('editable');
    });
    (0, vitest_1.it)('should support permission levels: editable, readonly, hidden', () => {
        const fields = [
            makeField({
                key: 'field1',
                permissions: [{ role: 'role1', level: 'editable' }],
            }),
            makeField({
                key: 'field2',
                permissions: [{ role: 'role1', level: 'readonly' }],
            }),
            makeField({
                key: 'field3',
                permissions: [{ role: 'role1', level: 'hidden' }],
            }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        (0, vitest_1.expect)(engine.getFieldPermission('field1', 'role1')).toBe('editable');
        (0, vitest_1.expect)(engine.getFieldPermission('field2', 'role1')).toBe('readonly');
        (0, vitest_1.expect)(engine.getFieldPermission('field3', 'role1')).toBe('hidden');
    });
});
// ─── i18n Label Tests ────────────────────────────────────────────────────────
(0, vitest_1.describe)('Internationalization (i18n)', () => {
    (0, vitest_1.it)('should return localized label for supported locale', () => {
        const fields = [
            makeField({
                key: 'name',
                label: 'Name',
                i18nLabels: {
                    es: 'Nombre',
                    fr: 'Nom',
                    de: 'Name',
                },
            }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        (0, vitest_1.expect)(engine.getLocalizedLabel('name', 'es')).toBe('Nombre');
        (0, vitest_1.expect)(engine.getLocalizedLabel('name', 'fr')).toBe('Nom');
        (0, vitest_1.expect)(engine.getLocalizedLabel('name', 'de')).toBe('Name');
    });
    (0, vitest_1.it)('should fall back to default label for unsupported locale', () => {
        const fields = [
            makeField({
                key: 'email',
                label: 'Email Address',
                i18nLabels: { es: 'Correo Electrónico' },
            }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        (0, vitest_1.expect)(engine.getLocalizedLabel('email', 'fr')).toBe('Email Address');
        (0, vitest_1.expect)(engine.getLocalizedLabel('email', 'de')).toBe('Email Address');
    });
    (0, vitest_1.it)('should handle multiple languages', () => {
        const fields = [
            makeField({
                key: 'firstName',
                label: 'First Name',
                i18nLabels: {
                    es: 'Nombre',
                    fr: 'Prénom',
                    de: 'Vorname',
                    ja: '名前',
                },
            }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        (0, vitest_1.expect)(engine.getLocalizedLabel('firstName', 'es')).toBe('Nombre');
        (0, vitest_1.expect)(engine.getLocalizedLabel('firstName', 'fr')).toBe('Prénom');
        (0, vitest_1.expect)(engine.getLocalizedLabel('firstName', 'de')).toBe('Vorname');
        (0, vitest_1.expect)(engine.getLocalizedLabel('firstName', 'ja')).toBe('名前');
    });
    (0, vitest_1.it)('should return empty string for non-existent field', () => {
        const fields = [makeField({ key: 'name' })];
        const engine = (0, src_1.createFormEngine)(fields);
        (0, vitest_1.expect)(engine.getLocalizedLabel('nonexistent', 'en')).toBe('');
    });
    (0, vitest_1.it)('should handle field without i18n labels', () => {
        const fields = [makeField({ key: 'name', label: 'Name' })];
        const engine = (0, src_1.createFormEngine)(fields);
        (0, vitest_1.expect)(engine.getLocalizedLabel('name', 'es')).toBe('Name');
        (0, vitest_1.expect)(engine.getLocalizedLabel('name', 'fr')).toBe('Name');
    });
    (0, vitest_1.it)('should support common locales', () => {
        const fields = [
            makeField({
                key: 'city',
                label: 'City',
                i18nLabels: {
                    'en-US': 'City',
                    'es-ES': 'Ciudad',
                    'fr-FR': 'Ville',
                    'de-DE': 'Stadt',
                    'zh-CN': '城市',
                },
            }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        (0, vitest_1.expect)(engine.getLocalizedLabel('city', 'en-US')).toBe('City');
        (0, vitest_1.expect)(engine.getLocalizedLabel('city', 'es-ES')).toBe('Ciudad');
        (0, vitest_1.expect)(engine.getLocalizedLabel('city', 'fr-FR')).toBe('Ville');
    });
});
// ─── Repeatable Groups Tests ─────────────────────────────────────────────────
(0, vitest_1.describe)('Repeatable Field Groups', () => {
    (0, vitest_1.it)('should add repeat instance', () => {
        const fields = [
            {
                id: 'group_1',
                versionId: 'v1',
                key: 'group_1',
                label: 'Repeat Group',
                type: 'FIELD_GROUP',
                required: false,
                order: 0,
                config: {
                    templateFields: [
                        makeField({ key: 'name' }),
                    ],
                },
            },
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        engine.addRepeatInstance('group_1');
        const instances = engine.getRepeatInstances('group_1');
        (0, vitest_1.expect)(instances.length).toBe(1);
    });
    (0, vitest_1.it)('should add multiple repeat instances', () => {
        const fields = [
            {
                id: 'group_1',
                versionId: 'v1',
                key: 'group_1',
                label: 'Repeat Group',
                type: 'FIELD_GROUP',
                required: false,
                order: 0,
                config: {
                    templateFields: [makeField({ key: 'name' })],
                },
            },
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        engine.addRepeatInstance('group_1');
        engine.addRepeatInstance('group_1');
        engine.addRepeatInstance('group_1');
        const instances = engine.getRepeatInstances('group_1');
        (0, vitest_1.expect)(instances.length).toBe(3);
    });
    (0, vitest_1.it)('should remove repeat instance', () => {
        const fields = [
            {
                id: 'group_1',
                versionId: 'v1',
                key: 'group_1',
                label: 'Repeat Group',
                type: 'FIELD_GROUP',
                required: false,
                order: 0,
                config: {
                    templateFields: [makeField({ key: 'name' })],
                },
            },
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        engine.addRepeatInstance('group_1');
        engine.addRepeatInstance('group_1');
        engine.addRepeatInstance('group_1');
        (0, vitest_1.expect)(engine.getRepeatInstances('group_1').length).toBe(3);
        engine.removeRepeatInstance('group_1', 1);
        (0, vitest_1.expect)(engine.getRepeatInstances('group_1').length).toBe(2);
    });
    (0, vitest_1.it)('should handle invalid index on remove', () => {
        const fields = [
            {
                id: 'group_1',
                versionId: 'v1',
                key: 'group_1',
                label: 'Repeat Group',
                type: 'FIELD_GROUP',
                required: false,
                order: 0,
                config: {
                    templateFields: [makeField({ key: 'name' })],
                },
            },
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        engine.addRepeatInstance('group_1');
        // Should not crash on invalid index
        engine.removeRepeatInstance('group_1', 10);
        (0, vitest_1.expect)(engine.getRepeatInstances('group_1').length).toBe(1);
        engine.removeRepeatInstance('group_1', -1);
        (0, vitest_1.expect)(engine.getRepeatInstances('group_1').length).toBe(1);
    });
    (0, vitest_1.it)('should return empty array for non-existent group', () => {
        const fields = [makeField({ key: 'name' })];
        const engine = (0, src_1.createFormEngine)(fields);
        const instances = engine.getRepeatInstances('nonexistent');
        (0, vitest_1.expect)(instances).toEqual([]);
    });
    (0, vitest_1.it)('should populate repeat instances with template defaults', () => {
        const fields = [
            {
                id: 'group_1',
                versionId: 'v1',
                key: 'group_1',
                label: 'Contact Group',
                type: 'FIELD_GROUP',
                required: false,
                order: 0,
                config: {
                    templateFields: [
                        makeField({ key: 'firstName' }),
                        makeField({ key: 'lastName' }),
                    ],
                },
            },
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        engine.addRepeatInstance('group_1');
        const instances = engine.getRepeatInstances('group_1');
        (0, vitest_1.expect)(instances[0]).toHaveProperty('firstName');
        (0, vitest_1.expect)(instances[0]).toHaveProperty('lastName');
    });
    (0, vitest_1.it)('should handle group without template fields', () => {
        const fields = [
            {
                id: 'group_1',
                versionId: 'v1',
                key: 'group_1',
                label: 'Group',
                type: 'FIELD_GROUP',
                required: false,
                order: 0,
                config: {},
            },
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        // Should not crash
        engine.addRepeatInstance('group_1');
        const instances = engine.getRepeatInstances('group_1');
        (0, vitest_1.expect)(instances.length).toBe(0); // No instances added if no template
    });
});
// ─── Stepper Branching Tests ─────────────────────────────────────────────────
(0, vitest_1.describe)('Stepper Branching', () => {
    (0, vitest_1.it)('should get next branch when condition matches', () => {
        const fields = [
            makeField({
                key: 'type',
                type: 'SELECT',
                required: true,
                config: {
                    mode: 'static',
                    options: [
                        { label: 'Option A', value: 'a' },
                        { label: 'Option B', value: 'b' },
                    ],
                },
            }),
        ];
        const steps = [
            makeStep({
                id: 'step1',
                title: 'Choose Type',
                branches: [
                    { condition: 'type === "a"', targetStepId: 'step_a' },
                ],
            }),
            makeStep({ id: 'step_a', title: 'Path A' }),
            makeStep({ id: 'step_b', title: 'Path B' }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        const stepper = (0, src_1.createFormStepper)(steps, engine);
        engine.setFieldValue('type', 'a');
        const nextBranch = stepper.getNextBranch();
        (0, vitest_1.expect)(nextBranch === null || nextBranch === void 0 ? void 0 : nextBranch.step.id).toBe('step_a');
    });
    (0, vitest_1.it)('should evaluate multiple branch conditions', () => {
        var _a, _b, _c;
        const fields = [
            makeField({
                key: 'option',
                type: 'SELECT',
                config: {
                    mode: 'static',
                    options: [
                        { label: 'A', value: 'a' },
                        { label: 'B', value: 'b' },
                        { label: 'C', value: 'c' },
                    ],
                },
            }),
        ];
        const steps = [
            makeStep({
                id: 'step_start',
                title: 'Start',
                branches: [
                    { condition: 'option === "a"', targetStepId: 'step_a' },
                    { condition: 'option === "b"', targetStepId: 'step_b' },
                    { condition: 'option === "c"', targetStepId: 'step_c' },
                ],
            }),
            makeStep({ id: 'step_a', title: 'A' }),
            makeStep({ id: 'step_b', title: 'B' }),
            makeStep({ id: 'step_c', title: 'C' }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        const stepper = (0, src_1.createFormStepper)(steps, engine);
        engine.setFieldValue('option', 'a');
        (0, vitest_1.expect)((_a = stepper.getNextBranch()) === null || _a === void 0 ? void 0 : _a.step.id).toBe('step_a');
        engine.setFieldValue('option', 'b');
        (0, vitest_1.expect)((_b = stepper.getNextBranch()) === null || _b === void 0 ? void 0 : _b.step.id).toBe('step_b');
        engine.setFieldValue('option', 'c');
        (0, vitest_1.expect)((_c = stepper.getNextBranch()) === null || _c === void 0 ? void 0 : _c.step.id).toBe('step_c');
    });
    (0, vitest_1.it)('should return null when no branch matches', () => {
        const fields = [
            makeField({
                key: 'type',
                type: 'SELECT',
                config: {
                    mode: 'static',
                    options: [{ label: 'A', value: 'a' }],
                },
            }),
        ];
        const steps = [
            makeStep({
                id: 'step1',
                title: 'Choose',
                branches: [
                    { condition: 'type === "a"', targetStepId: 'step_a' },
                ],
            }),
            makeStep({ id: 'step_a', title: 'Path A' }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        const stepper = (0, src_1.createFormStepper)(steps, engine);
        engine.setFieldValue('type', 'x');
        const nextBranch = stepper.getNextBranch();
        (0, vitest_1.expect)(nextBranch).toBeNull();
    });
    (0, vitest_1.it)('should navigate to branch target', () => {
        var _a;
        const fields = [
            makeField({
                key: 'useBasic',
                type: 'CHECKBOX',
            }),
        ];
        const steps = [
            makeStep({
                id: 'config',
                title: 'Configuration',
                branches: [
                    { condition: 'useBasic === true', targetStepId: 'basic' },
                    { condition: 'useBasic === false', targetStepId: 'advanced' },
                ],
            }),
            makeStep({ id: 'basic', title: 'Basic Setup' }),
            makeStep({ id: 'advanced', title: 'Advanced Setup' }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        const stepper = (0, src_1.createFormStepper)(steps, engine);
        engine.setFieldValue('useBasic', true);
        stepper.goNextBranch();
        (0, vitest_1.expect)((_a = stepper.getCurrentStep()) === null || _a === void 0 ? void 0 : _a.step.id).toBe('basic');
    });
    (0, vitest_1.it)('should fall back to sequential navigation if no branch matches', () => {
        var _a;
        const fields = [makeField({ key: 'skip', type: 'CHECKBOX' })];
        const steps = [
            makeStep({
                id: 'step1',
                title: 'Step 1',
                branches: [
                    { condition: 'skip === true', targetStepId: 'step3' },
                ],
            }),
            makeStep({ id: 'step2', title: 'Step 2' }),
            makeStep({ id: 'step3', title: 'Step 3' }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        const stepper = (0, src_1.createFormStepper)(steps, engine);
        engine.setFieldValue('skip', false);
        stepper.goNextBranch();
        // Should go to step2 (next sequential step)
        (0, vitest_1.expect)((_a = stepper.getCurrentStep()) === null || _a === void 0 ? void 0 : _a.step.id).toBe('step2');
    });
    (0, vitest_1.it)('should handle complex branch conditions', () => {
        var _a, _b, _c;
        const fields = [
            makeField({ key: 'age', type: 'NUMBER' }),
            makeField({ key: 'hasLicense', type: 'CHECKBOX' }),
        ];
        const steps = [
            makeStep({
                id: 'verify',
                title: 'Verification',
                branches: [
                    { condition: 'age >= 18 && hasLicense === true', targetStepId: 'approved' },
                    { condition: 'age >= 18', targetStepId: 'getLicense' },
                    { condition: 'age < 18', targetStepId: 'denied' },
                ],
            }),
            makeStep({ id: 'approved', title: 'Approved' }),
            makeStep({ id: 'getLicense', title: 'Get License' }),
            makeStep({ id: 'denied', title: 'Denied' }),
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        const stepper = (0, src_1.createFormStepper)(steps, engine);
        // Case 1: Age >= 18 && has license
        engine.setFieldValue('age', 25);
        engine.setFieldValue('hasLicense', true);
        (0, vitest_1.expect)((_a = stepper.getNextBranch()) === null || _a === void 0 ? void 0 : _a.step.id).toBe('approved');
        // Case 2: Age >= 18 && no license
        engine.setFieldValue('hasLicense', false);
        (0, vitest_1.expect)((_b = stepper.getNextBranch()) === null || _b === void 0 ? void 0 : _b.step.id).toBe('getLicense');
        // Case 3: Age < 18
        engine.setFieldValue('age', 16);
        (0, vitest_1.expect)((_c = stepper.getNextBranch()) === null || _c === void 0 ? void 0 : _c.step.id).toBe('denied');
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5naW5lLWV4dGVuc2lvbnMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVuZ2luZS1leHRlbnNpb25zLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBNkM7QUFDN0MsZ0NBQTREO0FBRzVEOzs7Ozs7OztHQVFHO0FBRUgsK0VBQStFO0FBRS9FLFNBQVMsU0FBUyxDQUFDLFNBQStDOztJQUNoRSxPQUFPO1FBQ0wsRUFBRSxFQUFFLE1BQUEsU0FBUyxDQUFDLEVBQUUsbUNBQUksU0FBUyxTQUFTLENBQUMsR0FBRyxFQUFFO1FBQzVDLFNBQVMsRUFBRSxNQUFBLFNBQVMsQ0FBQyxTQUFTLG1DQUFJLElBQUk7UUFDdEMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxHQUFHO1FBQ2xCLEtBQUssRUFBRSxNQUFBLFNBQVMsQ0FBQyxLQUFLLG1DQUFJLFNBQVMsQ0FBQyxHQUFHO1FBQ3ZDLElBQUksRUFBRSxNQUFBLFNBQVMsQ0FBQyxJQUFJLG1DQUFJLFlBQVk7UUFDcEMsUUFBUSxFQUFFLE1BQUEsU0FBUyxDQUFDLFFBQVEsbUNBQUksS0FBSztRQUNyQyxLQUFLLEVBQUUsTUFBQSxTQUFTLENBQUMsS0FBSyxtQ0FBSSxDQUFDO1FBQzNCLE1BQU0sRUFBRSxNQUFBLFNBQVMsQ0FBQyxNQUFNLG1DQUFJLEVBQUU7UUFDOUIsTUFBTSxFQUFFLE1BQUEsU0FBUyxDQUFDLE1BQU0sbUNBQUksSUFBSTtRQUNoQyxTQUFTLEVBQUUsTUFBQSxTQUFTLENBQUMsU0FBUyxtQ0FBSSxJQUFJO1FBQ3RDLGFBQWEsRUFBRSxNQUFBLFNBQVMsQ0FBQyxhQUFhLG1DQUFJLElBQUk7UUFDOUMsVUFBVSxFQUFFLE1BQUEsU0FBUyxDQUFDLFVBQVUsbUNBQUksSUFBSTtRQUN4QyxRQUFRLEVBQUUsU0FBUyxDQUFDLFFBQVE7UUFDNUIsUUFBUSxFQUFHLFNBQWlCLENBQUMsUUFBUTtRQUNyQyxXQUFXLEVBQUcsU0FBaUIsQ0FBQyxXQUFXO1FBQzND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Q0FBQyxDQUFBO1FBQy9CLE1BQU0sQ0FBQyxhQUFhLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFBO1FBQ3hDLElBQUEsZUFBTSxFQUFDLE1BQUEsT0FBTyxDQUFDLGFBQWEsRUFBRSwwQ0FBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1FBRXpELGtDQUFrQztRQUNsQyxNQUFNLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUN6QyxJQUFBLGVBQU0sRUFBQyxNQUFBLE9BQU8sQ0FBQyxhQUFhLEVBQUUsMENBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQTtRQUUzRCxtQkFBbUI7UUFDbkIsTUFBTSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDL0IsSUFBQSxlQUFNLEVBQUMsTUFBQSxPQUFPLENBQUMsYUFBYSxFQUFFLDBDQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7SUFDekQsQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRlc2NyaWJlLCBpdCwgZXhwZWN0IH0gZnJvbSAndml0ZXN0J1xuaW1wb3J0IHsgY3JlYXRlRm9ybUVuZ2luZSwgY3JlYXRlRm9ybVN0ZXBwZXIgfSBmcm9tICcuLi9zcmMnXG5pbXBvcnQgdHlwZSB7IEZvcm1GaWVsZCwgRm9ybVN0ZXAgfSBmcm9tICcuLi9zcmMvdHlwZXMnXG5cbi8qKlxuICogVGVzdHMgZm9yIGVuZ2luZSBleHRlbnNpb24gZmVhdHVyZXM6XG4gKiAtIENvbXB1dGVkIGZpZWxkcyB3aXRoIGV4cHJlc3Npb24gZXZhbHVhdGlvblxuICogLSBVbmRvL3JlZG8gZnVuY3Rpb25hbGl0eVxuICogLSBGaWVsZCBwZXJtaXNzaW9ucyBhbmQgcm9sZS1iYXNlZCBhY2Nlc3NcbiAqIC0gaTE4biBsYWJlbCBsb2NhbGl6YXRpb25cbiAqIC0gUmVwZWF0YWJsZSBmaWVsZCBncm91cHNcbiAqIC0gU3RlcHBlciBicmFuY2hpbmcgbG9naWNcbiAqL1xuXG4vLyDilIDilIDilIAgVGVzdCBIZWxwZXJzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5mdW5jdGlvbiBtYWtlRmllbGQob3ZlcnJpZGVzOiBQYXJ0aWFsPEZvcm1GaWVsZD4gJiB7IGtleTogc3RyaW5nIH0pOiBGb3JtRmllbGQge1xuICByZXR1cm4ge1xuICAgIGlkOiBvdmVycmlkZXMuaWQgPz8gYGZpZWxkXyR7b3ZlcnJpZGVzLmtleX1gLFxuICAgIHZlcnNpb25JZDogb3ZlcnJpZGVzLnZlcnNpb25JZCA/PyAndjEnLFxuICAgIGtleTogb3ZlcnJpZGVzLmtleSxcbiAgICBsYWJlbDogb3ZlcnJpZGVzLmxhYmVsID8/IG92ZXJyaWRlcy5rZXksXG4gICAgdHlwZTogb3ZlcnJpZGVzLnR5cGUgPz8gJ1NIT1JUX1RFWFQnLFxuICAgIHJlcXVpcmVkOiBvdmVycmlkZXMucmVxdWlyZWQgPz8gZmFsc2UsXG4gICAgb3JkZXI6IG92ZXJyaWRlcy5vcmRlciA/PyAwLFxuICAgIGNvbmZpZzogb3ZlcnJpZGVzLmNvbmZpZyA/PyB7fSxcbiAgICBzdGVwSWQ6IG92ZXJyaWRlcy5zdGVwSWQgPz8gbnVsbCxcbiAgICBzZWN0aW9uSWQ6IG92ZXJyaWRlcy5zZWN0aW9uSWQgPz8gbnVsbCxcbiAgICBwYXJlbnRGaWVsZElkOiBvdmVycmlkZXMucGFyZW50RmllbGRJZCA/PyBudWxsLFxuICAgIGNvbmRpdGlvbnM6IG92ZXJyaWRlcy5jb25kaXRpb25zID8/IG51bGwsXG4gICAgY2hpbGRyZW46IG92ZXJyaWRlcy5jaGlsZHJlbixcbiAgICBjb21wdXRlZDogKG92ZXJyaWRlcyBhcyBhbnkpLmNvbXB1dGVkLFxuICAgIHBlcm1pc3Npb25zOiAob3ZlcnJpZGVzIGFzIGFueSkucGVybWlzc2lvbnMsXG4gICAgaTE4bkxhYmVsczogKG92ZXJyaWRlcyBhcyBhbnkpLmkxOG5MYWJlbHMsXG4gIH1cbn1cblxuZnVuY3Rpb24gbWFrZVN0ZXAob3ZlcnJpZGVzOiBQYXJ0aWFsPEZvcm1TdGVwPiAmIHsgaWQ6IHN0cmluZzsgdGl0bGU6IHN0cmluZyB9KTogRm9ybVN0ZXAge1xuICByZXR1cm4ge1xuICAgIGlkOiBvdmVycmlkZXMuaWQsXG4gICAgdmVyc2lvbklkOiBvdmVycmlkZXMudmVyc2lvbklkID8/ICd2MScsXG4gICAgdGl0bGU6IG92ZXJyaWRlcy50aXRsZSxcbiAgICBvcmRlcjogb3ZlcnJpZGVzLm9yZGVyID8/IDAsXG4gICAgY29uZGl0aW9uczogb3ZlcnJpZGVzLmNvbmRpdGlvbnMgPz8gbnVsbCxcbiAgICBjb25maWc6IG92ZXJyaWRlcy5jb25maWcgPz8gbnVsbCxcbiAgICBmaWVsZHM6IG92ZXJyaWRlcy5maWVsZHMsXG4gICAgYnJhbmNoZXM6IChvdmVycmlkZXMgYXMgYW55KS5icmFuY2hlcyxcbiAgfVxufVxuXG4vLyDilIDilIDilIAgQ29tcHV0ZWQgRmllbGRzIFRlc3RzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5kZXNjcmliZSgnQ29tcHV0ZWQgRmllbGRzJywgKCkgPT4ge1xuICBpdCgnc2hvdWxkIHJlZ2lzdGVyIGFuZCBldmFsdWF0ZSBjb21wdXRlZCBmaWVsZCcsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICBtYWtlRmllbGQoeyBrZXk6ICdxdWFudGl0eScsIHR5cGU6ICdOVU1CRVInLCByZXF1aXJlZDogdHJ1ZSB9KSxcbiAgICAgIG1ha2VGaWVsZCh7IGtleTogJ3ByaWNlJywgdHlwZTogJ05VTUJFUicsIHJlcXVpcmVkOiB0cnVlIH0pLFxuICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAga2V5OiAndG90YWwnLFxuICAgICAgICB0eXBlOiAnTlVNQkVSJyxcbiAgICAgICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgICBleHByZXNzaW9uOiAncXVhbnRpdHkgKiBwcmljZScsXG4gICAgICAgICAgZGVwZW5kc09uOiBbJ3F1YW50aXR5JywgJ3ByaWNlJ10sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICBdXG5cbiAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcbiAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgncXVhbnRpdHknLCA1KVxuICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdwcmljZScsIDEwKVxuXG4gICAgY29uc3QgY29tcHV0ZWQgPSBlbmdpbmUuZ2V0Q29tcHV0ZWRWYWx1ZSgndG90YWwnKVxuICAgIGV4cGVjdChjb21wdXRlZCkudG9CZSg1MClcbiAgfSlcblxuICBpdCgnc2hvdWxkIGF1dG8tdXBkYXRlIGNvbXB1dGVkIGZpZWxkIHdoZW4gZGVwZW5kZW5jaWVzIGNoYW5nZScsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICBtYWtlRmllbGQoeyBrZXk6ICdhJywgdHlwZTogJ05VTUJFUicgfSksXG4gICAgICBtYWtlRmllbGQoeyBrZXk6ICdiJywgdHlwZTogJ05VTUJFUicgfSksXG4gICAgICBtYWtlRmllbGQoe1xuICAgICAgICBrZXk6ICdzdW0nLFxuICAgICAgICB0eXBlOiAnTlVNQkVSJyxcbiAgICAgICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgICBleHByZXNzaW9uOiAnYSArIGInLFxuICAgICAgICAgIGRlcGVuZHNPbjogWydhJywgJ2InXSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgIF1cblxuICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2EnLCAxMClcbiAgICBleHBlY3QoZW5naW5lLmdldENvbXB1dGVkVmFsdWUoJ3N1bScpKS50b0JlKDEwKVxuXG4gICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2InLCA1KVxuICAgIGV4cGVjdChlbmdpbmUuZ2V0Q29tcHV0ZWRWYWx1ZSgnc3VtJykpLnRvQmUoMTUpXG5cbiAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnYScsIDIwKVxuICAgIGV4cGVjdChlbmdpbmUuZ2V0Q29tcHV0ZWRWYWx1ZSgnc3VtJykpLnRvQmUoMjUpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCBoYW5kbGUgY29tcGxleCBtYXRoZW1hdGljYWwgZXhwcmVzc2lvbnMnLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgbWFrZUZpZWxkKHsga2V5OiAneCcsIHR5cGU6ICdOVU1CRVInIH0pLFxuICAgICAgbWFrZUZpZWxkKHsga2V5OiAneScsIHR5cGU6ICdOVU1CRVInIH0pLFxuICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAga2V5OiAncmVzdWx0JyxcbiAgICAgICAgdHlwZTogJ05VTUJFUicsXG4gICAgICAgIGNvbXB1dGVkOiB7XG4gICAgICAgICAgZXhwcmVzc2lvbjogJyh4ICogeCkgKyAoeSAqIHkpJyxcbiAgICAgICAgICBkZXBlbmRzT246IFsneCcsICd5J10sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICBdXG5cbiAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcbiAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgneCcsIDMpXG4gICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ3knLCA0KVxuXG4gICAgY29uc3QgcmVzdWx0ID0gZW5naW5lLmdldENvbXB1dGVkVmFsdWUoJ3Jlc3VsdCcpXG4gICAgZXhwZWN0KHJlc3VsdCkudG9CZSgyNSkgLy8gM8KyICsgNMKyID0gOSArIDE2ID0gMjVcbiAgfSlcblxuICBpdCgnc2hvdWxkIGhhbmRsZSBib29sZWFuIGNvbmRpdGlvbnMgaW4gY29tcHV0ZWQgZmllbGRzJywgKCkgPT4ge1xuICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2FnZScsIHR5cGU6ICdOVU1CRVInIH0pLFxuICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAga2V5OiAnaXNBZHVsdCcsXG4gICAgICAgIHR5cGU6ICdDSEVDS0JPWCcsXG4gICAgICAgIGNvbXB1dGVkOiB7XG4gICAgICAgICAgZXhwcmVzc2lvbjogJ2FnZSA+PSAxOCcsXG4gICAgICAgICAgZGVwZW5kc09uOiBbJ2FnZSddLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgXVxuXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnYWdlJywgMTcpXG4gICAgZXhwZWN0KGVuZ2luZS5nZXRDb21wdXRlZFZhbHVlKCdpc0FkdWx0JykpLnRvQmUoZmFsc2UpXG5cbiAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnYWdlJywgMTgpXG4gICAgZXhwZWN0KGVuZ2luZS5nZXRDb21wdXRlZFZhbHVlKCdpc0FkdWx0JykpLnRvQmUodHJ1ZSlcblxuICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdhZ2UnLCAyNSlcbiAgICBleHBlY3QoZW5naW5lLmdldENvbXB1dGVkVmFsdWUoJ2lzQWR1bHQnKSkudG9CZSh0cnVlKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgaGFuZGxlIHRlcm5hcnkgb3BlcmF0b3JzIGluIGNvbXB1dGVkIGZpZWxkcycsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICBtYWtlRmllbGQoeyBrZXk6ICdzY29yZScsIHR5cGU6ICdOVU1CRVInIH0pLFxuICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAga2V5OiAnZ3JhZGUnLFxuICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICAgIGNvbXB1dGVkOiB7XG4gICAgICAgICAgZXhwcmVzc2lvbjogJ3Njb3JlID49IDkwID8gXCJBXCIgOiBzY29yZSA+PSA4MCA/IFwiQlwiIDogc2NvcmUgPj0gNzAgPyBcIkNcIiA6IFwiRlwiJyxcbiAgICAgICAgICBkZXBlbmRzT246IFsnc2NvcmUnXSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgIF1cblxuICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ3Njb3JlJywgOTUpXG4gICAgZXhwZWN0KGVuZ2luZS5nZXRDb21wdXRlZFZhbHVlKCdncmFkZScpKS50b0JlKCdBJylcblxuICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdzY29yZScsIDg1KVxuICAgIGV4cGVjdChlbmdpbmUuZ2V0Q29tcHV0ZWRWYWx1ZSgnZ3JhZGUnKSkudG9CZSgnQicpXG5cbiAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnc2NvcmUnLCA3NSlcbiAgICBleHBlY3QoZW5naW5lLmdldENvbXB1dGVkVmFsdWUoJ2dyYWRlJykpLnRvQmUoJ0MnKVxuXG4gICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ3Njb3JlJywgNTApXG4gICAgZXhwZWN0KGVuZ2luZS5nZXRDb21wdXRlZFZhbHVlKCdncmFkZScpKS50b0JlKCdGJylcbiAgfSlcblxuICBpdCgnc2hvdWxkIGhhbmRsZSBjaGFpbmVkIGNvbXB1dGVkIGRlcGVuZGVuY2llcycsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICBtYWtlRmllbGQoeyBrZXk6ICdhJywgdHlwZTogJ05VTUJFUicgfSksXG4gICAgICBtYWtlRmllbGQoe1xuICAgICAgICBrZXk6ICdiJyxcbiAgICAgICAgdHlwZTogJ05VTUJFUicsXG4gICAgICAgIGNvbXB1dGVkOiB7XG4gICAgICAgICAgZXhwcmVzc2lvbjogJ2EgKiAyJyxcbiAgICAgICAgICBkZXBlbmRzT246IFsnYSddLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgICBtYWtlRmllbGQoe1xuICAgICAgICBrZXk6ICdjJyxcbiAgICAgICAgdHlwZTogJ05VTUJFUicsXG4gICAgICAgIGNvbXB1dGVkOiB7XG4gICAgICAgICAgZXhwcmVzc2lvbjogJ2IgKiAzJyxcbiAgICAgICAgICBkZXBlbmRzT246IFsnYiddLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgXVxuXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2EnLCA1KVxuXG4gICAgLy8gYSA9IDUsIGIgPSBhICogMiA9IDEwLCBjID0gYiAqIDMgPSAzMFxuICAgIGV4cGVjdChlbmdpbmUuZ2V0Q29tcHV0ZWRWYWx1ZSgnYicpKS50b0JlKDEwKVxuICAgIGV4cGVjdChlbmdpbmUuZ2V0Q29tcHV0ZWRWYWx1ZSgnYycpKS50b0JlKDMwKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgcmV0dXJuIHVuZGVmaW5lZCBmb3Igbm9uLWNvbXB1dGVkIGZpZWxkcycsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMgPSBbbWFrZUZpZWxkKHsga2V5OiAnbmFtZScgfSldXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICBjb25zdCBjb21wdXRlZCA9IGVuZ2luZS5nZXRDb21wdXRlZFZhbHVlKCduYW1lJylcbiAgICBleHBlY3QoY29tcHV0ZWQpLnRvQmVVbmRlZmluZWQoKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgaGFuZGxlIGV4cHJlc3Npb24gZXZhbHVhdGlvbiBlcnJvcnMgZ3JhY2VmdWxseScsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICBtYWtlRmllbGQoeyBrZXk6ICdhJywgdHlwZTogJ05VTUJFUicgfSksXG4gICAgICBtYWtlRmllbGQoe1xuICAgICAgICBrZXk6ICdyZXN1bHQnLFxuICAgICAgICB0eXBlOiAnTlVNQkVSJyxcbiAgICAgICAgY29tcHV0ZWQ6IHtcbiAgICAgICAgICBleHByZXNzaW9uOiAndW5kZWZpbmVkX3ZhcmlhYmxlICogMicsXG4gICAgICAgICAgZGVwZW5kc09uOiBbJ2EnXSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgIF1cblxuICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdhJywgNSlcblxuICAgIC8vIFNob3VsZCByZXR1cm4gbnVsbCBvbiBlcnJvclxuICAgIGNvbnN0IHJlc3VsdCA9IGVuZ2luZS5nZXRDb21wdXRlZFZhbHVlKCdyZXN1bHQnKVxuICAgIGV4cGVjdChyZXN1bHQpLnRvQmVOdWxsKClcbiAgfSlcblxuICBpdCgnc2hvdWxkIGR5bmFtaWNhbGx5IHJlZ2lzdGVyIGNvbXB1dGVkIGZpZWxkcycsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICBtYWtlRmllbGQoeyBrZXk6ICd4JywgdHlwZTogJ05VTUJFUicgfSksXG4gICAgICBtYWtlRmllbGQoeyBrZXk6ICd5JywgdHlwZTogJ05VTUJFUicgfSksXG4gICAgXVxuXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICAvLyBSZWdpc3RlciBjb21wdXRlZCBmaWVsZCBhZnRlciBlbmdpbmUgY3JlYXRpb25cbiAgICBlbmdpbmUucmVnaXN0ZXJDb21wdXRlZCgnc3VtJywgJ3ggKyB5JywgWyd4JywgJ3knXSlcblxuICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCd4JywgNSlcbiAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgneScsIDMpXG5cbiAgICBleHBlY3QoZW5naW5lLmdldENvbXB1dGVkVmFsdWUoJ3N1bScpKS50b0JlKDgpXG4gIH0pXG59KVxuXG4vLyDilIDilIDilIAgVW5kby9SZWRvIFRlc3RzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5kZXNjcmliZSgnVW5kby9SZWRvJywgKCkgPT4ge1xuICBpdCgnc2hvdWxkIHRyYWNrIHVuZG8gaGlzdG9yeScsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMgPSBbbWFrZUZpZWxkKHsga2V5OiAnbmFtZScgfSldXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnbmFtZScsICdKb2huJylcbiAgICBleHBlY3QoZW5naW5lLmNhblVuZG8oKSkudG9CZSh0cnVlKVxuXG4gICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ25hbWUnLCAnSmFuZScpXG4gICAgZXhwZWN0KGVuZ2luZS5jYW5VbmRvKCkpLnRvQmUodHJ1ZSlcbiAgfSlcblxuICBpdCgnc2hvdWxkIHVuZG8gZmllbGQgY2hhbmdlcycsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMgPSBbbWFrZUZpZWxkKHsga2V5OiAnbmFtZScgfSldXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnbmFtZScsICdKb2huJylcbiAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnbmFtZScsICdKYW5lJylcblxuICAgIGV4cGVjdChlbmdpbmUuZ2V0VmFsdWVzKCkubmFtZSkudG9CZSgnSmFuZScpXG5cbiAgICBjb25zdCBwcmV2aW91c1ZhbHVlcyA9IGVuZ2luZS51bmRvKClcbiAgICBleHBlY3QocHJldmlvdXNWYWx1ZXM/Lm5hbWUpLnRvQmUoJ0pvaG4nKVxuICAgIGV4cGVjdChlbmdpbmUuZ2V0VmFsdWVzKCkubmFtZSkudG9CZSgnSm9obicpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCByZWRvIGZpZWxkIGNoYW5nZXMnLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ25hbWUnIH0pXVxuICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ25hbWUnLCAnSm9obicpXG4gICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ25hbWUnLCAnSmFuZScpXG5cbiAgICBlbmdpbmUudW5kbygpXG4gICAgZXhwZWN0KGVuZ2luZS5nZXRWYWx1ZXMoKS5uYW1lKS50b0JlKCdKb2huJylcbiAgICBleHBlY3QoZW5naW5lLmNhblJlZG8oKSkudG9CZSh0cnVlKVxuXG4gICAgY29uc3QgbmV4dFZhbHVlcyA9IGVuZ2luZS5yZWRvKClcbiAgICBleHBlY3QobmV4dFZhbHVlcz8ubmFtZSkudG9CZSgnSmFuZScpXG4gICAgZXhwZWN0KGVuZ2luZS5nZXRWYWx1ZXMoKS5uYW1lKS50b0JlKCdKYW5lJylcbiAgfSlcblxuICBpdCgnc2hvdWxkIGNsZWFyIHJlZG8gc3RhY2sgb24gbmV3IGNoYW5nZSBhZnRlciB1bmRvJywgKCkgPT4ge1xuICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICduYW1lJyB9KV1cbiAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCduYW1lJywgJ0pvaG4nKVxuICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCduYW1lJywgJ0phbmUnKVxuICAgIGVuZ2luZS51bmRvKClcblxuICAgIGV4cGVjdChlbmdpbmUuY2FuUmVkbygpKS50b0JlKHRydWUpXG5cbiAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnbmFtZScsICdCb2InKVxuICAgIGV4cGVjdChlbmdpbmUuY2FuUmVkbygpKS50b0JlKGZhbHNlKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgcmVzcGVjdCBtYXggaGlzdG9yeSBsaW1pdCcsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMgPSBbbWFrZUZpZWxkKHsga2V5OiAnY291bnRlcicsIHR5cGU6ICdOVU1CRVInIH0pXVxuICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgLy8gTWFrZSA2MCBjaGFuZ2VzIChzaG91bGQgbGltaXQgdG8gNTApXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCA2MDsgaSsrKSB7XG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnY291bnRlcicsIGkpXG4gICAgfVxuXG4gICAgLy8gU2hvdWxkIGJlIGFibGUgdG8gdW5kbyBhdCBtb3N0IDUwIHRpbWVzXG4gICAgbGV0IHVuZG9Db3VudCA9IDBcbiAgICB3aGlsZSAoZW5naW5lLmNhblVuZG8oKSAmJiB1bmRvQ291bnQgPCA1NSkge1xuICAgICAgZW5naW5lLnVuZG8oKVxuICAgICAgdW5kb0NvdW50KytcbiAgICB9XG5cbiAgICAvLyBTaG91bGQgaGF2ZSB1bmRvbmUgYXQgbW9zdCA1MCBjaGFuZ2VzXG4gICAgZXhwZWN0KHVuZG9Db3VudCkudG9CZUxlc3NUaGFuT3JFcXVhbCg1MClcbiAgfSlcblxuICBpdCgnc2hvdWxkIGhhbmRsZSB1bmRvL3JlZG8gd2l0aCBtdWx0aXBsZSBmaWVsZHMnLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgbWFrZUZpZWxkKHsga2V5OiAnbmFtZScgfSksXG4gICAgICBtYWtlRmllbGQoeyBrZXk6ICdlbWFpbCcgfSksXG4gICAgICBtYWtlRmllbGQoeyBrZXk6ICdwaG9uZScgfSksXG4gICAgXVxuICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ25hbWUnLCAnSm9obicpXG4gICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2VtYWlsJywgJ2pvaG5AZXhhbXBsZS5jb20nKVxuICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdwaG9uZScsICc1NTUtMTIzNCcpXG5cbiAgICBjb25zdCBzbmFwc2hvdDEgPSB7IG5hbWU6ICdKb2huJywgZW1haWw6ICdqb2huQGV4YW1wbGUuY29tJywgcGhvbmU6ICc1NTUtMTIzNCcgfVxuICAgIGV4cGVjdChlbmdpbmUuZ2V0VmFsdWVzKCkpLnRvRXF1YWwoZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoc25hcHNob3QxKSlcblxuICAgIGVuZ2luZS51bmRvKClcbiAgICAvLyBBZnRlciB1bmRvLCBwaG9uZSByZXZlcnRzIHRvIGl0cyB2YWx1ZSBiZWZvcmUgc2V0RmllbGRWYWx1ZSgncGhvbmUnLCAnNTU1LTEyMzQnKVxuICAgIGV4cGVjdChlbmdpbmUuZ2V0VmFsdWVzKCkucGhvbmUpLnRvQmUoJycpXG5cbiAgICBlbmdpbmUudW5kbygpXG4gICAgZXhwZWN0KGVuZ2luZS5nZXRWYWx1ZXMoKS5lbWFpbCkudG9CZSgnJylcblxuICAgIGVuZ2luZS51bmRvKClcbiAgICBleHBlY3QoZW5naW5lLmdldFZhbHVlcygpLm5hbWUpLnRvQmUoJycpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCByZXR1cm4gbnVsbCB3aGVuIGNhbm5vdCB1bmRvJywgKCkgPT4ge1xuICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICduYW1lJyB9KV1cbiAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgIGV4cGVjdChlbmdpbmUuY2FuVW5kbygpKS50b0JlKGZhbHNlKVxuICAgIGV4cGVjdChlbmdpbmUudW5kbygpKS50b0JlTnVsbCgpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCByZXR1cm4gbnVsbCB3aGVuIGNhbm5vdCByZWRvJywgKCkgPT4ge1xuICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICduYW1lJyB9KV1cbiAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCduYW1lJywgJ0pvaG4nKVxuICAgIGVuZ2luZS51bmRvKClcbiAgICBlbmdpbmUucmVkbygpXG5cbiAgICBleHBlY3QoZW5naW5lLmNhblJlZG8oKSkudG9CZShmYWxzZSlcbiAgICBleHBlY3QoZW5naW5lLnJlZG8oKSkudG9CZU51bGwoKVxuICB9KVxufSlcblxuLy8g4pSA4pSA4pSAIEZpZWxkIFBlcm1pc3Npb25zIFRlc3RzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG5kZXNjcmliZSgnRmllbGQgUGVybWlzc2lvbnMnLCAoKSA9PiB7XG4gIGl0KCdzaG91bGQgcmV0dXJuIGVkaXRhYmxlIGFzIGRlZmF1bHQgcGVybWlzc2lvbicsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMgPSBbbWFrZUZpZWxkKHsga2V5OiAnbmFtZScgfSldXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICBjb25zdCBwZXJtaXNzaW9uID0gZW5naW5lLmdldEZpZWxkUGVybWlzc2lvbignbmFtZScsICd1c2VyJylcbiAgICBleHBlY3QocGVybWlzc2lvbikudG9CZSgnZWRpdGFibGUnKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgcmV0dXJuIHBlcm1pc3Npb24gbGV2ZWwgZm9yIHJvbGUnLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAga2V5OiAnc2FsYXJ5JyxcbiAgICAgICAgcGVybWlzc2lvbnM6IFtcbiAgICAgICAgICB7IHJvbGU6ICdhZG1pbicsIGxldmVsOiAnZWRpdGFibGUnIH0sXG4gICAgICAgICAgeyByb2xlOiAnbWFuYWdlcicsIGxldmVsOiAncmVhZG9ubHknIH0sXG4gICAgICAgICAgeyByb2xlOiAnZW1wbG95ZWUnLCBsZXZlbDogJ2hpZGRlbicgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pLFxuICAgIF1cbiAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgIGV4cGVjdChlbmdpbmUuZ2V0RmllbGRQZXJtaXNzaW9uKCdzYWxhcnknLCAnYWRtaW4nKSkudG9CZSgnZWRpdGFibGUnKVxuICAgIGV4cGVjdChlbmdpbmUuZ2V0RmllbGRQZXJtaXNzaW9uKCdzYWxhcnknLCAnbWFuYWdlcicpKS50b0JlKCdyZWFkb25seScpXG4gICAgZXhwZWN0KGVuZ2luZS5nZXRGaWVsZFBlcm1pc3Npb24oJ3NhbGFyeScsICdlbXBsb3llZScpKS50b0JlKCdoaWRkZW4nKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgcmV0dXJuIGRlZmF1bHQgd2hlbiByb2xlIG5vdCBmb3VuZCcsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICBtYWtlRmllbGQoe1xuICAgICAgICBrZXk6ICdmaWVsZCcsXG4gICAgICAgIHBlcm1pc3Npb25zOiBbeyByb2xlOiAnYWRtaW4nLCBsZXZlbDogJ2VkaXRhYmxlJyB9XSxcbiAgICAgIH0pLFxuICAgIF1cbiAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgIGV4cGVjdChlbmdpbmUuZ2V0RmllbGRQZXJtaXNzaW9uKCdmaWVsZCcsICd1bmtub3duJykpLnRvQmUoJ2VkaXRhYmxlJylcbiAgfSlcblxuICBpdCgnc2hvdWxkIGhhbmRsZSBwZXJtaXNzaW9uIGNoYW5nZXMgYWNyb3NzIG11bHRpcGxlIHJvbGVzJywgKCkgPT4ge1xuICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgIGtleTogJ2VtYWlsJyxcbiAgICAgICAgcGVybWlzc2lvbnM6IFtcbiAgICAgICAgICB7IHJvbGU6ICd1c2VyJywgbGV2ZWw6ICdyZWFkb25seScgfSxcbiAgICAgICAgICB7IHJvbGU6ICdhZG1pbicsIGxldmVsOiAnZWRpdGFibGUnIH0sXG4gICAgICAgICAgeyByb2xlOiAnZ3Vlc3QnLCBsZXZlbDogJ2hpZGRlbicgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pLFxuICAgIF1cbiAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgIGNvbnN0IHJvbGVzID0gWyd1c2VyJywgJ2FkbWluJywgJ2d1ZXN0JywgJ290aGVyJ11cbiAgICBjb25zdCBwZXJtaXNzaW9ucyA9IHJvbGVzLm1hcChyb2xlID0+IGVuZ2luZS5nZXRGaWVsZFBlcm1pc3Npb24oJ2VtYWlsJywgcm9sZSkpXG5cbiAgICBleHBlY3QocGVybWlzc2lvbnNbMF0pLnRvQmUoJ3JlYWRvbmx5JykgLy8gdXNlclxuICAgIGV4cGVjdChwZXJtaXNzaW9uc1sxXSkudG9CZSgnZWRpdGFibGUnKSAvLyBhZG1pblxuICAgIGV4cGVjdChwZXJtaXNzaW9uc1syXSkudG9CZSgnaGlkZGVuJykgLy8gZ3Vlc3RcbiAgICBleHBlY3QocGVybWlzc2lvbnNbM10pLnRvQmUoJ2VkaXRhYmxlJykgLy8gb3RoZXIgKGRlZmF1bHQpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCByZXR1cm4gZWRpdGFibGUgZm9yIG5vbi1leGlzdGVudCBmaWVsZHMnLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ25hbWUnIH0pXVxuICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgZXhwZWN0KGVuZ2luZS5nZXRGaWVsZFBlcm1pc3Npb24oJ25vbmV4aXN0ZW50JywgJ3VzZXInKSkudG9CZSgnZWRpdGFibGUnKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgc3VwcG9ydCBwZXJtaXNzaW9uIGxldmVsczogZWRpdGFibGUsIHJlYWRvbmx5LCBoaWRkZW4nLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAga2V5OiAnZmllbGQxJyxcbiAgICAgICAgcGVybWlzc2lvbnM6IFt7IHJvbGU6ICdyb2xlMScsIGxldmVsOiAnZWRpdGFibGUnIH1dLFxuICAgICAgfSksXG4gICAgICBtYWtlRmllbGQoe1xuICAgICAgICBrZXk6ICdmaWVsZDInLFxuICAgICAgICBwZXJtaXNzaW9uczogW3sgcm9sZTogJ3JvbGUxJywgbGV2ZWw6ICdyZWFkb25seScgfV0sXG4gICAgICB9KSxcbiAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgIGtleTogJ2ZpZWxkMycsXG4gICAgICAgIHBlcm1pc3Npb25zOiBbeyByb2xlOiAncm9sZTEnLCBsZXZlbDogJ2hpZGRlbicgfV0sXG4gICAgICB9KSxcbiAgICBdXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICBleHBlY3QoZW5naW5lLmdldEZpZWxkUGVybWlzc2lvbignZmllbGQxJywgJ3JvbGUxJykpLnRvQmUoJ2VkaXRhYmxlJylcbiAgICBleHBlY3QoZW5naW5lLmdldEZpZWxkUGVybWlzc2lvbignZmllbGQyJywgJ3JvbGUxJykpLnRvQmUoJ3JlYWRvbmx5JylcbiAgICBleHBlY3QoZW5naW5lLmdldEZpZWxkUGVybWlzc2lvbignZmllbGQzJywgJ3JvbGUxJykpLnRvQmUoJ2hpZGRlbicpXG4gIH0pXG59KVxuXG4vLyDilIDilIDilIAgaTE4biBMYWJlbCBUZXN0cyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZGVzY3JpYmUoJ0ludGVybmF0aW9uYWxpemF0aW9uIChpMThuKScsICgpID0+IHtcbiAgaXQoJ3Nob3VsZCByZXR1cm4gbG9jYWxpemVkIGxhYmVsIGZvciBzdXBwb3J0ZWQgbG9jYWxlJywgKCkgPT4ge1xuICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgIGtleTogJ25hbWUnLFxuICAgICAgICBsYWJlbDogJ05hbWUnLFxuICAgICAgICBpMThuTGFiZWxzOiB7XG4gICAgICAgICAgZXM6ICdOb21icmUnLFxuICAgICAgICAgIGZyOiAnTm9tJyxcbiAgICAgICAgICBkZTogJ05hbWUnLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgXVxuICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgZXhwZWN0KGVuZ2luZS5nZXRMb2NhbGl6ZWRMYWJlbCgnbmFtZScsICdlcycpKS50b0JlKCdOb21icmUnKVxuICAgIGV4cGVjdChlbmdpbmUuZ2V0TG9jYWxpemVkTGFiZWwoJ25hbWUnLCAnZnInKSkudG9CZSgnTm9tJylcbiAgICBleHBlY3QoZW5naW5lLmdldExvY2FsaXplZExhYmVsKCduYW1lJywgJ2RlJykpLnRvQmUoJ05hbWUnKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgZmFsbCBiYWNrIHRvIGRlZmF1bHQgbGFiZWwgZm9yIHVuc3VwcG9ydGVkIGxvY2FsZScsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICBtYWtlRmllbGQoe1xuICAgICAgICBrZXk6ICdlbWFpbCcsXG4gICAgICAgIGxhYmVsOiAnRW1haWwgQWRkcmVzcycsXG4gICAgICAgIGkxOG5MYWJlbHM6IHsgZXM6ICdDb3JyZW8gRWxlY3Ryw7NuaWNvJyB9LFxuICAgICAgfSksXG4gICAgXVxuICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgZXhwZWN0KGVuZ2luZS5nZXRMb2NhbGl6ZWRMYWJlbCgnZW1haWwnLCAnZnInKSkudG9CZSgnRW1haWwgQWRkcmVzcycpXG4gICAgZXhwZWN0KGVuZ2luZS5nZXRMb2NhbGl6ZWRMYWJlbCgnZW1haWwnLCAnZGUnKSkudG9CZSgnRW1haWwgQWRkcmVzcycpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCBoYW5kbGUgbXVsdGlwbGUgbGFuZ3VhZ2VzJywgKCkgPT4ge1xuICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgIGtleTogJ2ZpcnN0TmFtZScsXG4gICAgICAgIGxhYmVsOiAnRmlyc3QgTmFtZScsXG4gICAgICAgIGkxOG5MYWJlbHM6IHtcbiAgICAgICAgICBlczogJ05vbWJyZScsXG4gICAgICAgICAgZnI6ICdQcsOpbm9tJyxcbiAgICAgICAgICBkZTogJ1Zvcm5hbWUnLFxuICAgICAgICAgIGphOiAn5ZCN5YmNJyxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgIF1cbiAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgIGV4cGVjdChlbmdpbmUuZ2V0TG9jYWxpemVkTGFiZWwoJ2ZpcnN0TmFtZScsICdlcycpKS50b0JlKCdOb21icmUnKVxuICAgIGV4cGVjdChlbmdpbmUuZ2V0TG9jYWxpemVkTGFiZWwoJ2ZpcnN0TmFtZScsICdmcicpKS50b0JlKCdQcsOpbm9tJylcbiAgICBleHBlY3QoZW5naW5lLmdldExvY2FsaXplZExhYmVsKCdmaXJzdE5hbWUnLCAnZGUnKSkudG9CZSgnVm9ybmFtZScpXG4gICAgZXhwZWN0KGVuZ2luZS5nZXRMb2NhbGl6ZWRMYWJlbCgnZmlyc3ROYW1lJywgJ2phJykpLnRvQmUoJ+WQjeWJjScpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCByZXR1cm4gZW1wdHkgc3RyaW5nIGZvciBub24tZXhpc3RlbnQgZmllbGQnLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ25hbWUnIH0pXVxuICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgZXhwZWN0KGVuZ2luZS5nZXRMb2NhbGl6ZWRMYWJlbCgnbm9uZXhpc3RlbnQnLCAnZW4nKSkudG9CZSgnJylcbiAgfSlcblxuICBpdCgnc2hvdWxkIGhhbmRsZSBmaWVsZCB3aXRob3V0IGkxOG4gbGFiZWxzJywgKCkgPT4ge1xuICAgIGNvbnN0IGZpZWxkcyA9IFttYWtlRmllbGQoeyBrZXk6ICduYW1lJywgbGFiZWw6ICdOYW1lJyB9KV1cbiAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgIGV4cGVjdChlbmdpbmUuZ2V0TG9jYWxpemVkTGFiZWwoJ25hbWUnLCAnZXMnKSkudG9CZSgnTmFtZScpXG4gICAgZXhwZWN0KGVuZ2luZS5nZXRMb2NhbGl6ZWRMYWJlbCgnbmFtZScsICdmcicpKS50b0JlKCdOYW1lJylcbiAgfSlcblxuICBpdCgnc2hvdWxkIHN1cHBvcnQgY29tbW9uIGxvY2FsZXMnLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAga2V5OiAnY2l0eScsXG4gICAgICAgIGxhYmVsOiAnQ2l0eScsXG4gICAgICAgIGkxOG5MYWJlbHM6IHtcbiAgICAgICAgICAnZW4tVVMnOiAnQ2l0eScsXG4gICAgICAgICAgJ2VzLUVTJzogJ0NpdWRhZCcsXG4gICAgICAgICAgJ2ZyLUZSJzogJ1ZpbGxlJyxcbiAgICAgICAgICAnZGUtREUnOiAnU3RhZHQnLFxuICAgICAgICAgICd6aC1DTic6ICfln47luIInLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgXVxuICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgZXhwZWN0KGVuZ2luZS5nZXRMb2NhbGl6ZWRMYWJlbCgnY2l0eScsICdlbi1VUycpKS50b0JlKCdDaXR5JylcbiAgICBleHBlY3QoZW5naW5lLmdldExvY2FsaXplZExhYmVsKCdjaXR5JywgJ2VzLUVTJykpLnRvQmUoJ0NpdWRhZCcpXG4gICAgZXhwZWN0KGVuZ2luZS5nZXRMb2NhbGl6ZWRMYWJlbCgnY2l0eScsICdmci1GUicpKS50b0JlKCdWaWxsZScpXG4gIH0pXG59KVxuXG4vLyDilIDilIDilIAgUmVwZWF0YWJsZSBHcm91cHMgVGVzdHMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmRlc2NyaWJlKCdSZXBlYXRhYmxlIEZpZWxkIEdyb3VwcycsICgpID0+IHtcbiAgaXQoJ3Nob3VsZCBhZGQgcmVwZWF0IGluc3RhbmNlJywgKCkgPT4ge1xuICAgIGNvbnN0IGZpZWxkczogRm9ybUZpZWxkW10gPSBbXG4gICAgICB7XG4gICAgICAgIGlkOiAnZ3JvdXBfMScsXG4gICAgICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICAgICAga2V5OiAnZ3JvdXBfMScsXG4gICAgICAgIGxhYmVsOiAnUmVwZWF0IEdyb3VwJyxcbiAgICAgICAgdHlwZTogJ0ZJRUxEX0dST1VQJyxcbiAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICBvcmRlcjogMCxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgdGVtcGxhdGVGaWVsZHM6IFtcbiAgICAgICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ25hbWUnIH0pLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF1cblxuICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuICAgIGVuZ2luZS5hZGRSZXBlYXRJbnN0YW5jZSgnZ3JvdXBfMScpXG5cbiAgICBjb25zdCBpbnN0YW5jZXMgPSBlbmdpbmUuZ2V0UmVwZWF0SW5zdGFuY2VzKCdncm91cF8xJylcbiAgICBleHBlY3QoaW5zdGFuY2VzLmxlbmd0aCkudG9CZSgxKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgYWRkIG11bHRpcGxlIHJlcGVhdCBpbnN0YW5jZXMnLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzOiBGb3JtRmllbGRbXSA9IFtcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdncm91cF8xJyxcbiAgICAgICAgdmVyc2lvbklkOiAndjEnLFxuICAgICAgICBrZXk6ICdncm91cF8xJyxcbiAgICAgICAgbGFiZWw6ICdSZXBlYXQgR3JvdXAnLFxuICAgICAgICB0eXBlOiAnRklFTERfR1JPVVAnLFxuICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgIG9yZGVyOiAwLFxuICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICB0ZW1wbGF0ZUZpZWxkczogW21ha2VGaWVsZCh7IGtleTogJ25hbWUnIH0pXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXVxuXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgZW5naW5lLmFkZFJlcGVhdEluc3RhbmNlKCdncm91cF8xJylcbiAgICBlbmdpbmUuYWRkUmVwZWF0SW5zdGFuY2UoJ2dyb3VwXzEnKVxuICAgIGVuZ2luZS5hZGRSZXBlYXRJbnN0YW5jZSgnZ3JvdXBfMScpXG5cbiAgICBjb25zdCBpbnN0YW5jZXMgPSBlbmdpbmUuZ2V0UmVwZWF0SW5zdGFuY2VzKCdncm91cF8xJylcbiAgICBleHBlY3QoaW5zdGFuY2VzLmxlbmd0aCkudG9CZSgzKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgcmVtb3ZlIHJlcGVhdCBpbnN0YW5jZScsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHM6IEZvcm1GaWVsZFtdID0gW1xuICAgICAge1xuICAgICAgICBpZDogJ2dyb3VwXzEnLFxuICAgICAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgICAgIGtleTogJ2dyb3VwXzEnLFxuICAgICAgICBsYWJlbDogJ1JlcGVhdCBHcm91cCcsXG4gICAgICAgIHR5cGU6ICdGSUVMRF9HUk9VUCcsXG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgIHRlbXBsYXRlRmllbGRzOiBbbWFrZUZpZWxkKHsga2V5OiAnbmFtZScgfSldLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdXG5cbiAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcbiAgICBlbmdpbmUuYWRkUmVwZWF0SW5zdGFuY2UoJ2dyb3VwXzEnKVxuICAgIGVuZ2luZS5hZGRSZXBlYXRJbnN0YW5jZSgnZ3JvdXBfMScpXG4gICAgZW5naW5lLmFkZFJlcGVhdEluc3RhbmNlKCdncm91cF8xJylcblxuICAgIGV4cGVjdChlbmdpbmUuZ2V0UmVwZWF0SW5zdGFuY2VzKCdncm91cF8xJykubGVuZ3RoKS50b0JlKDMpXG5cbiAgICBlbmdpbmUucmVtb3ZlUmVwZWF0SW5zdGFuY2UoJ2dyb3VwXzEnLCAxKVxuICAgIGV4cGVjdChlbmdpbmUuZ2V0UmVwZWF0SW5zdGFuY2VzKCdncm91cF8xJykubGVuZ3RoKS50b0JlKDIpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCBoYW5kbGUgaW52YWxpZCBpbmRleCBvbiByZW1vdmUnLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzOiBGb3JtRmllbGRbXSA9IFtcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdncm91cF8xJyxcbiAgICAgICAgdmVyc2lvbklkOiAndjEnLFxuICAgICAgICBrZXk6ICdncm91cF8xJyxcbiAgICAgICAgbGFiZWw6ICdSZXBlYXQgR3JvdXAnLFxuICAgICAgICB0eXBlOiAnRklFTERfR1JPVVAnLFxuICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgIG9yZGVyOiAwLFxuICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICB0ZW1wbGF0ZUZpZWxkczogW21ha2VGaWVsZCh7IGtleTogJ25hbWUnIH0pXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXVxuXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgZW5naW5lLmFkZFJlcGVhdEluc3RhbmNlKCdncm91cF8xJylcblxuICAgIC8vIFNob3VsZCBub3QgY3Jhc2ggb24gaW52YWxpZCBpbmRleFxuICAgIGVuZ2luZS5yZW1vdmVSZXBlYXRJbnN0YW5jZSgnZ3JvdXBfMScsIDEwKVxuICAgIGV4cGVjdChlbmdpbmUuZ2V0UmVwZWF0SW5zdGFuY2VzKCdncm91cF8xJykubGVuZ3RoKS50b0JlKDEpXG5cbiAgICBlbmdpbmUucmVtb3ZlUmVwZWF0SW5zdGFuY2UoJ2dyb3VwXzEnLCAtMSlcbiAgICBleHBlY3QoZW5naW5lLmdldFJlcGVhdEluc3RhbmNlcygnZ3JvdXBfMScpLmxlbmd0aCkudG9CZSgxKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgcmV0dXJuIGVtcHR5IGFycmF5IGZvciBub24tZXhpc3RlbnQgZ3JvdXAnLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ25hbWUnIH0pXVxuICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgY29uc3QgaW5zdGFuY2VzID0gZW5naW5lLmdldFJlcGVhdEluc3RhbmNlcygnbm9uZXhpc3RlbnQnKVxuICAgIGV4cGVjdChpbnN0YW5jZXMpLnRvRXF1YWwoW10pXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCBwb3B1bGF0ZSByZXBlYXQgaW5zdGFuY2VzIHdpdGggdGVtcGxhdGUgZGVmYXVsdHMnLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzOiBGb3JtRmllbGRbXSA9IFtcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdncm91cF8xJyxcbiAgICAgICAgdmVyc2lvbklkOiAndjEnLFxuICAgICAgICBrZXk6ICdncm91cF8xJyxcbiAgICAgICAgbGFiZWw6ICdDb250YWN0IEdyb3VwJyxcbiAgICAgICAgdHlwZTogJ0ZJRUxEX0dST1VQJyxcbiAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICBvcmRlcjogMCxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgdGVtcGxhdGVGaWVsZHM6IFtcbiAgICAgICAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2ZpcnN0TmFtZScgfSksXG4gICAgICAgICAgICBtYWtlRmllbGQoeyBrZXk6ICdsYXN0TmFtZScgfSksXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXVxuXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgZW5naW5lLmFkZFJlcGVhdEluc3RhbmNlKCdncm91cF8xJylcblxuICAgIGNvbnN0IGluc3RhbmNlcyA9IGVuZ2luZS5nZXRSZXBlYXRJbnN0YW5jZXMoJ2dyb3VwXzEnKVxuICAgIGV4cGVjdChpbnN0YW5jZXNbMF0pLnRvSGF2ZVByb3BlcnR5KCdmaXJzdE5hbWUnKVxuICAgIGV4cGVjdChpbnN0YW5jZXNbMF0pLnRvSGF2ZVByb3BlcnR5KCdsYXN0TmFtZScpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCBoYW5kbGUgZ3JvdXAgd2l0aG91dCB0ZW1wbGF0ZSBmaWVsZHMnLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzOiBGb3JtRmllbGRbXSA9IFtcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdncm91cF8xJyxcbiAgICAgICAgdmVyc2lvbklkOiAndjEnLFxuICAgICAgICBrZXk6ICdncm91cF8xJyxcbiAgICAgICAgbGFiZWw6ICdHcm91cCcsXG4gICAgICAgIHR5cGU6ICdGSUVMRF9HUk9VUCcsXG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgIGNvbmZpZzoge30sXG4gICAgICB9LFxuICAgIF1cblxuICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuICAgIC8vIFNob3VsZCBub3QgY3Jhc2hcbiAgICBlbmdpbmUuYWRkUmVwZWF0SW5zdGFuY2UoJ2dyb3VwXzEnKVxuXG4gICAgY29uc3QgaW5zdGFuY2VzID0gZW5naW5lLmdldFJlcGVhdEluc3RhbmNlcygnZ3JvdXBfMScpXG4gICAgZXhwZWN0KGluc3RhbmNlcy5sZW5ndGgpLnRvQmUoMCkgLy8gTm8gaW5zdGFuY2VzIGFkZGVkIGlmIG5vIHRlbXBsYXRlXG4gIH0pXG59KVxuXG4vLyDilIDilIDilIAgU3RlcHBlciBCcmFuY2hpbmcgVGVzdHMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmRlc2NyaWJlKCdTdGVwcGVyIEJyYW5jaGluZycsICgpID0+IHtcbiAgaXQoJ3Nob3VsZCBnZXQgbmV4dCBicmFuY2ggd2hlbiBjb25kaXRpb24gbWF0Y2hlcycsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICBtYWtlRmllbGQoe1xuICAgICAgICBrZXk6ICd0eXBlJyxcbiAgICAgICAgdHlwZTogJ1NFTEVDVCcsXG4gICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICBtb2RlOiAnc3RhdGljJyxcbiAgICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAgICB7IGxhYmVsOiAnT3B0aW9uIEEnLCB2YWx1ZTogJ2EnIH0sXG4gICAgICAgICAgICB7IGxhYmVsOiAnT3B0aW9uIEInLCB2YWx1ZTogJ2InIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgIF1cblxuICAgIGNvbnN0IHN0ZXBzID0gW1xuICAgICAgbWFrZVN0ZXAoe1xuICAgICAgICBpZDogJ3N0ZXAxJyxcbiAgICAgICAgdGl0bGU6ICdDaG9vc2UgVHlwZScsXG4gICAgICAgIGJyYW5jaGVzOiBbXG4gICAgICAgICAgeyBjb25kaXRpb246ICd0eXBlID09PSBcImFcIicsIHRhcmdldFN0ZXBJZDogJ3N0ZXBfYScgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pLFxuICAgICAgbWFrZVN0ZXAoeyBpZDogJ3N0ZXBfYScsIHRpdGxlOiAnUGF0aCBBJyB9KSxcbiAgICAgIG1ha2VTdGVwKHsgaWQ6ICdzdGVwX2InLCB0aXRsZTogJ1BhdGggQicgfSksXG4gICAgXVxuXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgY29uc3Qgc3RlcHBlciA9IGNyZWF0ZUZvcm1TdGVwcGVyKHN0ZXBzLCBlbmdpbmUpXG5cbiAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgndHlwZScsICdhJylcbiAgICBjb25zdCBuZXh0QnJhbmNoID0gc3RlcHBlci5nZXROZXh0QnJhbmNoKClcblxuICAgIGV4cGVjdChuZXh0QnJhbmNoPy5zdGVwLmlkKS50b0JlKCdzdGVwX2EnKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgZXZhbHVhdGUgbXVsdGlwbGUgYnJhbmNoIGNvbmRpdGlvbnMnLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgbWFrZUZpZWxkKHtcbiAgICAgICAga2V5OiAnb3B0aW9uJyxcbiAgICAgICAgdHlwZTogJ1NFTEVDVCcsXG4gICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgIG1vZGU6ICdzdGF0aWMnLFxuICAgICAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAgICAgIHsgbGFiZWw6ICdBJywgdmFsdWU6ICdhJyB9LFxuICAgICAgICAgICAgeyBsYWJlbDogJ0InLCB2YWx1ZTogJ2InIH0sXG4gICAgICAgICAgICB7IGxhYmVsOiAnQycsIHZhbHVlOiAnYycgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgXVxuXG4gICAgY29uc3Qgc3RlcHMgPSBbXG4gICAgICBtYWtlU3RlcCh7XG4gICAgICAgIGlkOiAnc3RlcF9zdGFydCcsXG4gICAgICAgIHRpdGxlOiAnU3RhcnQnLFxuICAgICAgICBicmFuY2hlczogW1xuICAgICAgICAgIHsgY29uZGl0aW9uOiAnb3B0aW9uID09PSBcImFcIicsIHRhcmdldFN0ZXBJZDogJ3N0ZXBfYScgfSxcbiAgICAgICAgICB7IGNvbmRpdGlvbjogJ29wdGlvbiA9PT0gXCJiXCInLCB0YXJnZXRTdGVwSWQ6ICdzdGVwX2InIH0sXG4gICAgICAgICAgeyBjb25kaXRpb246ICdvcHRpb24gPT09IFwiY1wiJywgdGFyZ2V0U3RlcElkOiAnc3RlcF9jJyB9LFxuICAgICAgICBdLFxuICAgICAgfSksXG4gICAgICBtYWtlU3RlcCh7IGlkOiAnc3RlcF9hJywgdGl0bGU6ICdBJyB9KSxcbiAgICAgIG1ha2VTdGVwKHsgaWQ6ICdzdGVwX2InLCB0aXRsZTogJ0InIH0pLFxuICAgICAgbWFrZVN0ZXAoeyBpZDogJ3N0ZXBfYycsIHRpdGxlOiAnQycgfSksXG4gICAgXVxuXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgY29uc3Qgc3RlcHBlciA9IGNyZWF0ZUZvcm1TdGVwcGVyKHN0ZXBzLCBlbmdpbmUpXG5cbiAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnb3B0aW9uJywgJ2EnKVxuICAgIGV4cGVjdChzdGVwcGVyLmdldE5leHRCcmFuY2goKT8uc3RlcC5pZCkudG9CZSgnc3RlcF9hJylcblxuICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdvcHRpb24nLCAnYicpXG4gICAgZXhwZWN0KHN0ZXBwZXIuZ2V0TmV4dEJyYW5jaCgpPy5zdGVwLmlkKS50b0JlKCdzdGVwX2InKVxuXG4gICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ29wdGlvbicsICdjJylcbiAgICBleHBlY3Qoc3RlcHBlci5nZXROZXh0QnJhbmNoKCk/LnN0ZXAuaWQpLnRvQmUoJ3N0ZXBfYycpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCByZXR1cm4gbnVsbCB3aGVuIG5vIGJyYW5jaCBtYXRjaGVzJywgKCkgPT4ge1xuICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgIGtleTogJ3R5cGUnLFxuICAgICAgICB0eXBlOiAnU0VMRUNUJyxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgbW9kZTogJ3N0YXRpYycsXG4gICAgICAgICAgb3B0aW9uczogW3sgbGFiZWw6ICdBJywgdmFsdWU6ICdhJyB9XSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgIF1cblxuICAgIGNvbnN0IHN0ZXBzID0gW1xuICAgICAgbWFrZVN0ZXAoe1xuICAgICAgICBpZDogJ3N0ZXAxJyxcbiAgICAgICAgdGl0bGU6ICdDaG9vc2UnLFxuICAgICAgICBicmFuY2hlczogW1xuICAgICAgICAgIHsgY29uZGl0aW9uOiAndHlwZSA9PT0gXCJhXCInLCB0YXJnZXRTdGVwSWQ6ICdzdGVwX2EnIH0sXG4gICAgICAgIF0sXG4gICAgICB9KSxcbiAgICAgIG1ha2VTdGVwKHsgaWQ6ICdzdGVwX2EnLCB0aXRsZTogJ1BhdGggQScgfSksXG4gICAgXVxuXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgY29uc3Qgc3RlcHBlciA9IGNyZWF0ZUZvcm1TdGVwcGVyKHN0ZXBzLCBlbmdpbmUpXG5cbiAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgndHlwZScsICd4JylcbiAgICBjb25zdCBuZXh0QnJhbmNoID0gc3RlcHBlci5nZXROZXh0QnJhbmNoKClcblxuICAgIGV4cGVjdChuZXh0QnJhbmNoKS50b0JlTnVsbCgpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCBuYXZpZ2F0ZSB0byBicmFuY2ggdGFyZ2V0JywgKCkgPT4ge1xuICAgIGNvbnN0IGZpZWxkcyA9IFtcbiAgICAgIG1ha2VGaWVsZCh7XG4gICAgICAgIGtleTogJ3VzZUJhc2ljJyxcbiAgICAgICAgdHlwZTogJ0NIRUNLQk9YJyxcbiAgICAgIH0pLFxuICAgIF1cblxuICAgIGNvbnN0IHN0ZXBzID0gW1xuICAgICAgbWFrZVN0ZXAoe1xuICAgICAgICBpZDogJ2NvbmZpZycsXG4gICAgICAgIHRpdGxlOiAnQ29uZmlndXJhdGlvbicsXG4gICAgICAgIGJyYW5jaGVzOiBbXG4gICAgICAgICAgeyBjb25kaXRpb246ICd1c2VCYXNpYyA9PT0gdHJ1ZScsIHRhcmdldFN0ZXBJZDogJ2Jhc2ljJyB9LFxuICAgICAgICAgIHsgY29uZGl0aW9uOiAndXNlQmFzaWMgPT09IGZhbHNlJywgdGFyZ2V0U3RlcElkOiAnYWR2YW5jZWQnIH0sXG4gICAgICAgIF0sXG4gICAgICB9KSxcbiAgICAgIG1ha2VTdGVwKHsgaWQ6ICdiYXNpYycsIHRpdGxlOiAnQmFzaWMgU2V0dXAnIH0pLFxuICAgICAgbWFrZVN0ZXAoeyBpZDogJ2FkdmFuY2VkJywgdGl0bGU6ICdBZHZhbmNlZCBTZXR1cCcgfSksXG4gICAgXVxuXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgY29uc3Qgc3RlcHBlciA9IGNyZWF0ZUZvcm1TdGVwcGVyKHN0ZXBzLCBlbmdpbmUpXG5cbiAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgndXNlQmFzaWMnLCB0cnVlKVxuICAgIHN0ZXBwZXIuZ29OZXh0QnJhbmNoKClcblxuICAgIGV4cGVjdChzdGVwcGVyLmdldEN1cnJlbnRTdGVwKCk/LnN0ZXAuaWQpLnRvQmUoJ2Jhc2ljJylcbiAgfSlcblxuICBpdCgnc2hvdWxkIGZhbGwgYmFjayB0byBzZXF1ZW50aWFsIG5hdmlnYXRpb24gaWYgbm8gYnJhbmNoIG1hdGNoZXMnLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzID0gW21ha2VGaWVsZCh7IGtleTogJ3NraXAnLCB0eXBlOiAnQ0hFQ0tCT1gnIH0pXVxuXG4gICAgY29uc3Qgc3RlcHMgPSBbXG4gICAgICBtYWtlU3RlcCh7XG4gICAgICAgIGlkOiAnc3RlcDEnLFxuICAgICAgICB0aXRsZTogJ1N0ZXAgMScsXG4gICAgICAgIGJyYW5jaGVzOiBbXG4gICAgICAgICAgeyBjb25kaXRpb246ICdza2lwID09PSB0cnVlJywgdGFyZ2V0U3RlcElkOiAnc3RlcDMnIH0sXG4gICAgICAgIF0sXG4gICAgICB9KSxcbiAgICAgIG1ha2VTdGVwKHsgaWQ6ICdzdGVwMicsIHRpdGxlOiAnU3RlcCAyJyB9KSxcbiAgICAgIG1ha2VTdGVwKHsgaWQ6ICdzdGVwMycsIHRpdGxlOiAnU3RlcCAzJyB9KSxcbiAgICBdXG5cbiAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcbiAgICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIoc3RlcHMsIGVuZ2luZSlcblxuICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdza2lwJywgZmFsc2UpXG4gICAgc3RlcHBlci5nb05leHRCcmFuY2goKVxuXG4gICAgLy8gU2hvdWxkIGdvIHRvIHN0ZXAyIChuZXh0IHNlcXVlbnRpYWwgc3RlcClcbiAgICBleHBlY3Qoc3RlcHBlci5nZXRDdXJyZW50U3RlcCgpPy5zdGVwLmlkKS50b0JlKCdzdGVwMicpXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCBoYW5kbGUgY29tcGxleCBicmFuY2ggY29uZGl0aW9ucycsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMgPSBbXG4gICAgICBtYWtlRmllbGQoeyBrZXk6ICdhZ2UnLCB0eXBlOiAnTlVNQkVSJyB9KSxcbiAgICAgIG1ha2VGaWVsZCh7IGtleTogJ2hhc0xpY2Vuc2UnLCB0eXBlOiAnQ0hFQ0tCT1gnIH0pLFxuICAgIF1cblxuICAgIGNvbnN0IHN0ZXBzID0gW1xuICAgICAgbWFrZVN0ZXAoe1xuICAgICAgICBpZDogJ3ZlcmlmeScsXG4gICAgICAgIHRpdGxlOiAnVmVyaWZpY2F0aW9uJyxcbiAgICAgICAgYnJhbmNoZXM6IFtcbiAgICAgICAgICB7IGNvbmRpdGlvbjogJ2FnZSA+PSAxOCAmJiBoYXNMaWNlbnNlID09PSB0cnVlJywgdGFyZ2V0U3RlcElkOiAnYXBwcm92ZWQnIH0sXG4gICAgICAgICAgeyBjb25kaXRpb246ICdhZ2UgPj0gMTgnLCB0YXJnZXRTdGVwSWQ6ICdnZXRMaWNlbnNlJyB9LFxuICAgICAgICAgIHsgY29uZGl0aW9uOiAnYWdlIDwgMTgnLCB0YXJnZXRTdGVwSWQ6ICdkZW5pZWQnIH0sXG4gICAgICAgIF0sXG4gICAgICB9KSxcbiAgICAgIG1ha2VTdGVwKHsgaWQ6ICdhcHByb3ZlZCcsIHRpdGxlOiAnQXBwcm92ZWQnIH0pLFxuICAgICAgbWFrZVN0ZXAoeyBpZDogJ2dldExpY2Vuc2UnLCB0aXRsZTogJ0dldCBMaWNlbnNlJyB9KSxcbiAgICAgIG1ha2VTdGVwKHsgaWQ6ICdkZW5pZWQnLCB0aXRsZTogJ0RlbmllZCcgfSksXG4gICAgXVxuXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgY29uc3Qgc3RlcHBlciA9IGNyZWF0ZUZvcm1TdGVwcGVyKHN0ZXBzLCBlbmdpbmUpXG5cbiAgICAvLyBDYXNlIDE6IEFnZSA+PSAxOCAmJiBoYXMgbGljZW5zZVxuICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdhZ2UnLCAyNSlcbiAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnaGFzTGljZW5zZScsIHRydWUpXG4gICAgZXhwZWN0KHN0ZXBwZXIuZ2V0TmV4dEJyYW5jaCgpPy5zdGVwLmlkKS50b0JlKCdhcHByb3ZlZCcpXG5cbiAgICAvLyBDYXNlIDI6IEFnZSA+PSAxOCAmJiBubyBsaWNlbnNlXG4gICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2hhc0xpY2Vuc2UnLCBmYWxzZSlcbiAgICBleHBlY3Qoc3RlcHBlci5nZXROZXh0QnJhbmNoKCk/LnN0ZXAuaWQpLnRvQmUoJ2dldExpY2Vuc2UnKVxuXG4gICAgLy8gQ2FzZSAzOiBBZ2UgPCAxOFxuICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdhZ2UnLCAxNilcbiAgICBleHBlY3Qoc3RlcHBlci5nZXROZXh0QnJhbmNoKCk/LnN0ZXAuaWQpLnRvQmUoJ2RlbmllZCcpXG4gIH0pXG59KVxuIl19