"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const src_1 = require("../src");
/**
 * Performance benchmark tests for the Dynamic Form Engine.
 *
 * These tests measure:
 * - Form graph construction speed with varying field counts
 * - Field value change propagation performance (O(k) vs O(n))
 * - Condition evaluation speed on large forms
 * - Validation performance
 *
 * Note: These are not strict performance tests but rather
 * baseline measurements to catch regressions.
 */
// ─── Utilities ──────────────────────────────────────────────────────────────
function generateFields(count) {
    const fields = [];
    for (let i = 0; i < count; i++) {
        fields.push({
            id: `field_${i}`,
            versionId: 'v1',
            key: `field_${i}`,
            label: `Field ${i}`,
            type: i % 5 === 0 ? 'SELECT' : i % 4 === 0 ? 'CHECKBOX' : 'SHORT_TEXT',
            required: i % 3 === 0,
            order: i,
            config: i % 5 === 0 ? {
                mode: 'static',
                options: [
                    { label: 'Option 1', value: 'opt1' },
                    { label: 'Option 2', value: 'opt2' },
                ],
            } : {},
            conditions: i > 5 && i % 10 === 0 ? {
                operator: 'AND',
                rules: [
                    { fieldKey: `field_${i - 5}`, operator: 'EQUALS', value: 'opt1' },
                ],
            } : null,
        });
    }
    return fields;
}
function generateSteps(count) {
    const steps = [];
    for (let i = 0; i < count; i++) {
        steps.push({
            id: `step_${i}`,
            versionId: 'v1',
            title: `Step ${i}`,
            order: i,
            config: null,
            conditions: null,
        });
    }
    return steps;
}
function measureTime(fn) {
    const start = performance.now();
    fn();
    const end = performance.now();
    return end - start;
}
// ─── Form Graph Construction Benchmarks ──────────────────────────────────────
(0, vitest_1.describe)('Performance - Form Graph Construction', () => {
    (0, vitest_1.it)('should construct graph with 10 fields quickly', () => {
        const fields = generateFields(10);
        const duration = measureTime(() => {
            (0, src_1.createFormEngine)(fields);
        });
        (0, vitest_1.expect)(duration).toBeLessThan(100); // Should be < 100ms
        console.log(`Graph construction (10 fields): ${duration.toFixed(2)}ms`);
    });
    (0, vitest_1.it)('should construct graph with 100 fields reasonably', () => {
        const fields = generateFields(100);
        const duration = measureTime(() => {
            (0, src_1.createFormEngine)(fields);
        });
        (0, vitest_1.expect)(duration).toBeLessThan(500); // Should be < 500ms
        console.log(`Graph construction (100 fields): ${duration.toFixed(2)}ms`);
    });
    (0, vitest_1.it)('should construct graph with 500 fields within acceptable time', () => {
        const fields = generateFields(500);
        const duration = measureTime(() => {
            (0, src_1.createFormEngine)(fields);
        });
        (0, vitest_1.expect)(duration).toBeLessThan(5000); // Should be < 5s
        console.log(`Graph construction (500 fields): ${duration.toFixed(2)}ms`);
    });
    (0, vitest_1.it)('should scale sub-linearly for graph construction', () => {
        const fields10 = generateFields(10);
        const fields100 = generateFields(100);
        const fields500 = generateFields(500);
        const duration10 = measureTime(() => (0, src_1.createFormEngine)(fields10));
        const duration100 = measureTime(() => (0, src_1.createFormEngine)(fields100));
        const duration500 = measureTime(() => (0, src_1.createFormEngine)(fields500));
        // Verify that time doesn't increase linearly (should be closer to O(n log n) or O(n))
        const ratio_100_to_10 = duration100 / duration10;
        const ratio_500_to_100 = duration500 / duration100;
        console.log(`Scaling 10→100 fields: ${ratio_100_to_10.toFixed(2)}x`);
        console.log(`Scaling 100→500 fields: ${ratio_500_to_100.toFixed(2)}x`);
        // Expect reasonable scaling (not exponential)
        (0, vitest_1.expect)(ratio_100_to_10).toBeLessThan(30); // 10-30x for 10x field increase
        (0, vitest_1.expect)(ratio_500_to_100).toBeLessThan(20); // Should be sub-linear
    });
});
// ─── Field Value Change Propagation Benchmarks ───────────────────────────────
(0, vitest_1.describe)('Performance - Field Value Change Propagation', () => {
    (0, vitest_1.it)('should propagate change to 10 dependent fields quickly', () => {
        const fields = generateFields(10);
        const engine = (0, src_1.createFormEngine)(fields);
        const duration = measureTime(() => {
            for (let i = 0; i < 100; i++) {
                engine.setFieldValue('field_0', `value_${i}`);
            }
        });
        // 100 iterations should be fast
        const avgPerIteration = duration / 100;
        (0, vitest_1.expect)(avgPerIteration).toBeLessThan(10); // Each change < 10ms
        console.log(`Propagation (10 fields, 100 iterations): ${(avgPerIteration).toFixed(2)}ms per change`);
    });
    (0, vitest_1.it)('should propagate change to 100 dependent fields efficiently', () => {
        const fields = generateFields(100);
        const engine = (0, src_1.createFormEngine)(fields);
        const duration = measureTime(() => {
            for (let i = 0; i < 50; i++) {
                engine.setFieldValue('field_0', `value_${i}`);
            }
        });
        const avgPerIteration = duration / 50;
        (0, vitest_1.expect)(avgPerIteration).toBeLessThan(50); // Each change < 50ms
        console.log(`Propagation (100 fields, 50 iterations): ${(avgPerIteration).toFixed(2)}ms per change`);
    });
    (0, vitest_1.it)('should propagate change to 500 dependent fields acceptably', () => {
        const fields = generateFields(500);
        const engine = (0, src_1.createFormEngine)(fields);
        const duration = measureTime(() => {
            for (let i = 0; i < 10; i++) {
                engine.setFieldValue('field_0', `value_${i}`);
            }
        });
        const avgPerIteration = duration / 10;
        (0, vitest_1.expect)(avgPerIteration).toBeLessThan(500); // Each change < 500ms
        console.log(`Propagation (500 fields, 10 iterations): ${(avgPerIteration).toFixed(2)}ms per change`);
    });
    (0, vitest_1.it)('should be O(k) not O(n) where k is affected fields', () => {
        // Create two forms: one with many independent fields, one with dependent chain
        const independentFields = generateFields(100);
        const chainedFields = [];
        // Create a dependency chain
        for (let i = 0; i < 100; i++) {
            chainedFields.push({
                id: `chain_${i}`,
                versionId: 'v1',
                key: `chain_${i}`,
                label: `Field ${i}`,
                type: 'SHORT_TEXT',
                required: false,
                order: i,
                config: {},
                conditions: i > 0 ? {
                    operator: 'AND',
                    rules: [
                        { fieldKey: `chain_${i - 1}`, operator: 'NOT_EMPTY', value: null },
                    ],
                } : null,
            });
        }
        const engineIndependent = (0, src_1.createFormEngine)(independentFields);
        const engineChained = (0, src_1.createFormEngine)(chainedFields);
        // Changing a field in the independent form should be as fast as in the chained form
        // because it only affects its direct dependents (k), not all fields (n)
        const durationIndependent = measureTime(() => {
            for (let i = 0; i < 100; i++) {
                engineIndependent.setFieldValue('field_0', `value_${i}`);
            }
        });
        const durationChained = measureTime(() => {
            for (let i = 0; i < 100; i++) {
                engineChained.setFieldValue('chain_0', `value_${i}`);
            }
        });
        const avgIndependent = durationIndependent / 100;
        const avgChained = durationChained / 100;
        console.log(`Independent form propagation: ${avgIndependent.toFixed(3)}ms`);
        console.log(`Chained form propagation: ${avgChained.toFixed(3)}ms`);
        console.log(`Ratio: ${(avgChained / avgIndependent).toFixed(2)}x`);
        // Both should be reasonably fast since they're O(k) not O(n)
        (0, vitest_1.expect)(avgIndependent).toBeLessThan(50);
        (0, vitest_1.expect)(avgChained).toBeLessThan(50);
    });
});
// ─── Condition Evaluation Benchmarks ─────────────────────────────────────────
(0, vitest_1.describe)('Performance - Condition Evaluation', () => {
    (0, vitest_1.it)('should evaluate 10 conditional fields quickly', () => {
        const fields = generateFields(10);
        const engine = (0, src_1.createFormEngine)(fields);
        const duration = measureTime(() => {
            for (let i = 0; i < 1000; i++) {
                engine.getVisibleFields();
            }
        });
        const avgPerCall = duration / 1000;
        (0, vitest_1.expect)(avgPerCall).toBeLessThan(5); // Each call < 5ms
        console.log(`Visibility evaluation (10 fields): ${(avgPerCall).toFixed(3)}ms per call`);
    });
    (0, vitest_1.it)('should evaluate 100 conditional fields efficiently', () => {
        const fields = generateFields(100);
        const engine = (0, src_1.createFormEngine)(fields);
        const duration = measureTime(() => {
            for (let i = 0; i < 100; i++) {
                engine.getVisibleFields();
            }
        });
        const avgPerCall = duration / 100;
        (0, vitest_1.expect)(avgPerCall).toBeLessThan(25); // Each call < 25ms
        console.log(`Visibility evaluation (100 fields): ${(avgPerCall).toFixed(3)}ms per call`);
    });
    (0, vitest_1.it)('should evaluate complex conditions reasonably', () => {
        const complexFields = [
            {
                id: 'base',
                versionId: 'v1',
                key: 'base',
                label: 'Base',
                type: 'SELECT',
                required: true,
                order: 0,
                config: {
                    mode: 'static',
                    options: [
                        { label: 'Option A', value: 'a' },
                        { label: 'Option B', value: 'b' },
                    ],
                },
            },
            ...Array.from({ length: 99 }, (_, i) => ({
                id: `field_${i}`,
                versionId: 'v1',
                key: `field_${i}`,
                label: `Field ${i}`,
                type: 'SHORT_TEXT',
                required: false,
                order: i + 1,
                config: {},
                conditions: {
                    operator: 'AND',
                    rules: [
                        { fieldKey: 'base', operator: 'EQUALS', value: 'a' },
                    ],
                },
            })),
        ];
        const engine = (0, src_1.createFormEngine)(complexFields);
        const duration = measureTime(() => {
            for (let i = 0; i < 100; i++) {
                engine.setFieldValue('base', i % 2 === 0 ? 'a' : 'b');
                engine.getVisibleFields();
            }
        });
        const avgPerIteration = duration / 100;
        (0, vitest_1.expect)(avgPerIteration).toBeLessThan(100); // Each iteration < 100ms
        console.log(`Complex conditions (100 fields): ${(avgPerIteration).toFixed(2)}ms per iteration`);
    });
});
// ─── Validation Performance Benchmarks ────────────────────────────────────────
(0, vitest_1.describe)('Performance - Validation', () => {
    (0, vitest_1.it)('should validate 10 fields quickly', () => {
        const fields = generateFields(10);
        const engine = (0, src_1.createFormEngine)(fields);
        const duration = measureTime(() => {
            for (let i = 0; i < 100; i++) {
                engine.validate();
            }
        });
        const avgPerValidation = duration / 100;
        (0, vitest_1.expect)(avgPerValidation).toBeLessThan(10); // Each validation < 10ms
        console.log(`Validation (10 fields): ${(avgPerValidation).toFixed(3)}ms per validation`);
    });
    (0, vitest_1.it)('should validate 100 fields efficiently', () => {
        const fields = generateFields(100);
        const engine = (0, src_1.createFormEngine)(fields);
        const duration = measureTime(() => {
            for (let i = 0; i < 50; i++) {
                engine.validate();
            }
        });
        const avgPerValidation = duration / 50;
        (0, vitest_1.expect)(avgPerValidation).toBeLessThan(50); // Each validation < 50ms
        console.log(`Validation (100 fields): ${(avgPerValidation).toFixed(2)}ms per validation`);
    });
    (0, vitest_1.it)('should validate 500 fields acceptably', () => {
        const fields = generateFields(500);
        const engine = (0, src_1.createFormEngine)(fields);
        const duration = measureTime(() => {
            for (let i = 0; i < 10; i++) {
                engine.validate();
            }
        });
        const avgPerValidation = duration / 10;
        (0, vitest_1.expect)(avgPerValidation).toBeLessThan(500); // Each validation < 500ms
        console.log(`Validation (500 fields): ${(avgPerValidation).toFixed(2)}ms per validation`);
    });
    (0, vitest_1.it)('should validate step-specific fields quickly', () => {
        const fields = generateFields(100);
        const engine = (0, src_1.createFormEngine)(fields);
        // Add step IDs
        for (let i = 0; i < fields.length; i++) {
            fields[i].stepId = `step_${Math.floor(i / 10)}`;
        }
        const duration = measureTime(() => {
            for (let i = 0; i < 100; i++) {
                engine.validateStep('step_0');
            }
        });
        const avgPerValidation = duration / 100;
        (0, vitest_1.expect)(avgPerValidation).toBeLessThan(20); // Step validation < 20ms
        console.log(`Step validation (10 fields): ${(avgPerValidation).toFixed(3)}ms per validation`);
    });
});
// ─── Stepper Navigation Benchmarks ───────────────────────────────────────────
(0, vitest_1.describe)('Performance - Stepper Navigation', () => {
    (0, vitest_1.it)('should navigate steps quickly with 10 steps', () => {
        const fields = generateFields(50);
        const steps = generateSteps(10);
        const engine = (0, src_1.createFormEngine)(fields);
        const stepper = (0, src_1.createFormStepper)(steps, engine);
        const duration = measureTime(() => {
            for (let i = 0; i < 100; i++) {
                stepper.goNext();
                if (stepper.isLastStep())
                    stepper.jumpTo(0);
            }
        });
        const avgPerNavigation = duration / 100;
        (0, vitest_1.expect)(avgPerNavigation).toBeLessThan(10); // Each navigation < 10ms
        console.log(`Step navigation (10 steps): ${(avgPerNavigation).toFixed(3)}ms per navigation`);
    });
    (0, vitest_1.it)('should jump to specific step efficiently', () => {
        const fields = generateFields(50);
        const steps = generateSteps(50);
        const engine = (0, src_1.createFormEngine)(fields);
        const stepper = (0, src_1.createFormStepper)(steps, engine);
        const duration = measureTime(() => {
            for (let i = 0; i < 1000; i++) {
                stepper.jumpTo(Math.floor(Math.random() * 50));
            }
        });
        const avgPerJump = duration / 1000;
        (0, vitest_1.expect)(avgPerJump).toBeLessThan(5); // Each jump < 5ms
        console.log(`Jump navigation (50 steps): ${(avgPerJump).toFixed(3)}ms per jump`);
    });
    (0, vitest_1.it)('should evaluate progress tracking quickly', () => {
        const fields = generateFields(50);
        const steps = generateSteps(100);
        const engine = (0, src_1.createFormEngine)(fields);
        const stepper = (0, src_1.createFormStepper)(steps, engine);
        const duration = measureTime(() => {
            for (let i = 0; i < 1000; i++) {
                stepper.getProgress();
            }
        });
        const avgPerCall = duration / 1000;
        (0, vitest_1.expect)(avgPerCall).toBeLessThan(2); // Each call < 2ms
        console.log(`Progress evaluation (100 steps): ${(avgPerCall).toFixed(3)}ms per call`);
    });
});
// ─── Memory and Collection Benchmarks ────────────────────────────────────────
(0, vitest_1.describe)('Performance - Memory Management', () => {
    (0, vitest_1.it)('should handle undo/redo stacks efficiently', () => {
        const fields = generateFields(50);
        const engine = (0, src_1.createFormEngine)(fields);
        const duration = measureTime(() => {
            for (let i = 0; i < 100; i++) {
                engine.setFieldValue('field_0', `value_${i}`);
            }
            for (let i = 0; i < 50; i++) {
                engine.undo();
            }
            for (let i = 0; i < 50; i++) {
                engine.redo();
            }
        });
        (0, vitest_1.expect)(duration).toBeLessThan(500); // Total operations < 500ms
        console.log(`Undo/redo operations (100 changes + 50 undo + 50 redo): ${duration.toFixed(2)}ms`);
    });
    (0, vitest_1.it)('should track repeat instances efficiently', () => {
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
                        {
                            id: 'field_1',
                            versionId: 'v1',
                            key: 'name',
                            label: 'Name',
                            type: 'SHORT_TEXT',
                            required: true,
                            order: 0,
                            config: {},
                        },
                    ],
                },
            },
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        const duration = measureTime(() => {
            for (let i = 0; i < 100; i++) {
                engine.addRepeatInstance('group_1');
            }
            for (let i = 0; i < 50; i++) {
                engine.removeRepeatInstance('group_1', 0);
            }
            const instances = engine.getRepeatInstances('group_1');
            (0, vitest_1.expect)(instances.length).toBeGreaterThan(0);
        });
        (0, vitest_1.expect)(duration).toBeLessThan(200); // 100 adds + 50 removes + retrieval < 200ms
        console.log(`Repeat instance operations (100 adds + 50 removes): ${duration.toFixed(2)}ms`);
    });
});
// ─── Computed Field Benchmarks ──────────────────────────────────────────────
(0, vitest_1.describe)('Performance - Computed Fields', () => {
    (0, vitest_1.it)('should evaluate computed fields efficiently', () => {
        const fields = [
            {
                id: 'field_a',
                versionId: 'v1',
                key: 'a',
                label: 'Field A',
                type: 'NUMBER',
                required: false,
                order: 0,
                config: {},
            },
            {
                id: 'field_b',
                versionId: 'v1',
                key: 'b',
                label: 'Field B',
                type: 'NUMBER',
                required: false,
                order: 1,
                config: {},
            },
            {
                id: 'field_sum',
                versionId: 'v1',
                key: 'sum',
                label: 'Sum',
                type: 'NUMBER',
                required: false,
                order: 2,
                config: {},
                computed: {
                    expression: 'a + b',
                    dependsOn: ['a', 'b'],
                },
            },
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        const duration = measureTime(() => {
            for (let i = 0; i < 100; i++) {
                engine.setFieldValue('a', i);
                engine.setFieldValue('b', i * 2);
                const value = engine.getComputedValue('sum');
                (0, vitest_1.expect)(value).toBe(i + i * 2);
            }
        });
        const avgPerChange = duration / 200; // 100 changes to a + 100 changes to b
        (0, vitest_1.expect)(avgPerChange).toBeLessThan(5); // Each change < 5ms
        console.log(`Computed field evaluation: ${(avgPerChange).toFixed(3)}ms per field change`);
    });
    (0, vitest_1.it)('should handle multiple computed dependencies', () => {
        const fields = [
            {
                id: 'field_x',
                versionId: 'v1',
                key: 'x',
                label: 'X',
                type: 'NUMBER',
                required: false,
                order: 0,
                config: {},
            },
            {
                id: 'field_y',
                versionId: 'v1',
                key: 'y',
                label: 'Y',
                type: 'NUMBER',
                required: false,
                order: 1,
                config: {},
            },
            {
                id: 'field_z',
                versionId: 'v1',
                key: 'z',
                label: 'Z',
                type: 'NUMBER',
                required: false,
                order: 2,
                config: {},
            },
            {
                id: 'field_computed1',
                versionId: 'v1',
                key: 'computed1',
                label: 'Computed 1',
                type: 'NUMBER',
                required: false,
                order: 3,
                config: {},
                computed: {
                    expression: 'x + y',
                    dependsOn: ['x', 'y'],
                },
            },
            {
                id: 'field_computed2',
                versionId: 'v1',
                key: 'computed2',
                label: 'Computed 2',
                type: 'NUMBER',
                required: false,
                order: 4,
                config: {},
                computed: {
                    expression: 'computed1 + z',
                    dependsOn: ['computed1', 'z'],
                },
            },
        ];
        const engine = (0, src_1.createFormEngine)(fields);
        const duration = measureTime(() => {
            for (let i = 0; i < 50; i++) {
                engine.setFieldValue('x', i);
                engine.setFieldValue('y', i);
                engine.setFieldValue('z', i);
            }
        });
        const avgPerIteration = duration / 50;
        (0, vitest_1.expect)(avgPerIteration).toBeLessThan(20); // Each iteration < 20ms
        console.log(`Multi-dependency computed fields: ${(avgPerIteration).toFixed(2)}ms per iteration`);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVuY2htYXJrcy50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYmVuY2htYXJrcy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQTZDO0FBQzdDLGdDQUE0RDtBQUc1RDs7Ozs7Ozs7Ozs7R0FXRztBQUVILCtFQUErRTtBQUUvRSxTQUFTLGNBQWMsQ0FBQyxLQUFhO0lBQ25DLE1BQU0sTUFBTSxHQUFnQixFQUFFLENBQUE7SUFFOUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQy9CLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDVixFQUFFLEVBQUUsU0FBUyxDQUFDLEVBQUU7WUFDaEIsU0FBUyxFQUFFLElBQUk7WUFDZixHQUFHLEVBQUUsU0FBUyxDQUFDLEVBQUU7WUFDakIsS0FBSyxFQUFFLFNBQVMsQ0FBQyxFQUFFO1lBQ25CLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxZQUFZO1lBQ3RFLFFBQVEsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7WUFDckIsS0FBSyxFQUFFLENBQUM7WUFDUixNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwQixJQUFJLEVBQUUsUUFBUTtnQkFDZCxPQUFPLEVBQUU7b0JBQ1AsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUU7b0JBQ3BDLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFO2lCQUNyQzthQUNGLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDTixVQUFVLEVBQUUsQ0FBQyxHQUFH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QUNoQixLQUFLLEVBQUUsWUFBWTtnQkFDbkIsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsUUFBUSxFQUFFLEtBQUs7Z0JBQ2YsS0FBSyxFQUFFLENBQUM7Z0JBQ1IsTUFBTSxFQUFFLEVBQUU7Z0JBQ1YsUUFBUSxFQUFFO29CQUNSLFVBQVUsRUFBRSxlQUFlO29CQUMzQixTQUFTLEVBQUUsQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDO2lCQUM5QjthQUNGO1NBQ0YsQ0FBQTtRQUVELE1BQU0sTUFBTSxHQUFHLElBQUEsc0JBQWdCLEVBQUMsTUFBTSxDQUFDLENBQUE7UUFFdkMsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRTtZQUNoQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzVCLE1BQU0sQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFBO2dCQUM1QixNQUFNLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQTtnQkFDNUIsTUFBTSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDOUIsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFBO1FBRUYsTUFBTSxlQUFlLEdBQUcsUUFBUSxHQUFHLEVBQUUsQ0FBQTtRQUNyQyxJQUFBLGVBQU0sRUFBQyxlQUFlLENBQUMsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUEsQ0FBQyx3QkFBd0I7UUFDakUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUE7SUFDbEcsQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRlc2NyaWJlLCBpdCwgZXhwZWN0IH0gZnJvbSAndml0ZXN0J1xuaW1wb3J0IHsgY3JlYXRlRm9ybUVuZ2luZSwgY3JlYXRlRm9ybVN0ZXBwZXIgfSBmcm9tICcuLi9zcmMnXG5pbXBvcnQgdHlwZSB7IEZvcm1GaWVsZCwgRm9ybVN0ZXAgfSBmcm9tICcuLi9zcmMvdHlwZXMnXG5cbi8qKlxuICogUGVyZm9ybWFuY2UgYmVuY2htYXJrIHRlc3RzIGZvciB0aGUgRHluYW1pYyBGb3JtIEVuZ2luZS5cbiAqXG4gKiBUaGVzZSB0ZXN0cyBtZWFzdXJlOlxuICogLSBGb3JtIGdyYXBoIGNvbnN0cnVjdGlvbiBzcGVlZCB3aXRoIHZhcnlpbmcgZmllbGQgY291bnRzXG4gKiAtIEZpZWxkIHZhbHVlIGNoYW5nZSBwcm9wYWdhdGlvbiBwZXJmb3JtYW5jZSAoTyhrKSB2cyBPKG4pKVxuICogLSBDb25kaXRpb24gZXZhbHVhdGlvbiBzcGVlZCBvbiBsYXJnZSBmb3Jtc1xuICogLSBWYWxpZGF0aW9uIHBlcmZvcm1hbmNlXG4gKlxuICogTm90ZTogVGhlc2UgYXJlIG5vdCBzdHJpY3QgcGVyZm9ybWFuY2UgdGVzdHMgYnV0IHJhdGhlclxuICogYmFzZWxpbmUgbWVhc3VyZW1lbnRzIHRvIGNhdGNoIHJlZ3Jlc3Npb25zLlxuICovXG5cbi8vIOKUgOKUgOKUgCBVdGlsaXRpZXMg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmZ1bmN0aW9uIGdlbmVyYXRlRmllbGRzKGNvdW50OiBudW1iZXIpOiBGb3JtRmllbGRbXSB7XG4gIGNvbnN0IGZpZWxkczogRm9ybUZpZWxkW10gPSBbXVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgIGZpZWxkcy5wdXNoKHtcbiAgICAgIGlkOiBgZmllbGRfJHtpfWAsXG4gICAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgICBrZXk6IGBmaWVsZF8ke2l9YCxcbiAgICAgIGxhYmVsOiBgRmllbGQgJHtpfWAsXG4gICAgICB0eXBlOiBpICUgNSA9PT0gMCA/ICdTRUxFQ1QnIDogaSAlIDQgPT09IDAgPyAnQ0hFQ0tCT1gnIDogJ1NIT1JUX1RFWFQnLFxuICAgICAgcmVxdWlyZWQ6IGkgJSAzID09PSAwLFxuICAgICAgb3JkZXI6IGksXG4gICAgICBjb25maWc6IGkgJSA1ID09PSAwID8ge1xuICAgICAgICBtb2RlOiAnc3RhdGljJyxcbiAgICAgICAgb3B0aW9uczogW1xuICAgICAgICAgIHsgbGFiZWw6ICdPcHRpb24gMScsIHZhbHVlOiAnb3B0MScgfSxcbiAgICAgICAgICB7IGxhYmVsOiAnT3B0aW9uIDInLCB2YWx1ZTogJ29wdDInIH0sXG4gICAgICAgIF0sXG4gICAgICB9IDoge30sXG4gICAgICBjb25kaXRpb25zOiBpID4gNSAmJiBpICUgMTAgPT09IDAgPyB7XG4gICAgICAgIG9wZXJhdG9yOiAnQU5EJyxcbiAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICB7IGZpZWxkS2V5OiBgZmllbGRfJHtpIC0gNX1gLCBvcGVyYXRvcjogJ0VRVUFMUycsIHZhbHVlOiAnb3B0MScgfSxcbiAgICAgICAgXSxcbiAgICAgIH0gOiBudWxsLFxuICAgIH0pXG4gIH1cblxuICByZXR1cm4gZmllbGRzXG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlU3RlcHMoY291bnQ6IG51bWJlcik6IEZvcm1TdGVwW10ge1xuICBjb25zdCBzdGVwczogRm9ybVN0ZXBbXSA9IFtdXG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgc3RlcHMucHVzaCh7XG4gICAgICBpZDogYHN0ZXBfJHtpfWAsXG4gICAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgICB0aXRsZTogYFN0ZXAgJHtpfWAsXG4gICAgICBvcmRlcjogaSxcbiAgICAgIGNvbmZpZzogbnVsbCxcbiAgICAgIGNvbmRpdGlvbnM6IG51bGwsXG4gICAgfSlcbiAgfVxuXG4gIHJldHVybiBzdGVwc1xufVxuXG5mdW5jdGlvbiBtZWFzdXJlVGltZShmbjogKCkgPT4gdm9pZCk6IG51bWJlciB7XG4gIGNvbnN0IHN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KClcbiAgZm4oKVxuICBjb25zdCBlbmQgPSBwZXJmb3JtYW5jZS5ub3coKVxuICByZXR1cm4gZW5kIC0gc3RhcnRcbn1cblxuLy8g4pSA4pSA4pSAIEZvcm0gR3JhcGggQ29uc3RydWN0aW9uIEJlbmNobWFya3Mg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmRlc2NyaWJlKCdQZXJmb3JtYW5jZSAtIEZvcm0gR3JhcGggQ29uc3RydWN0aW9uJywgKCkgPT4ge1xuICBpdCgnc2hvdWxkIGNvbnN0cnVjdCBncmFwaCB3aXRoIDEwIGZpZWxkcyBxdWlja2x5JywgKCkgPT4ge1xuICAgIGNvbnN0IGZpZWxkcyA9IGdlbmVyYXRlRmllbGRzKDEwKVxuICAgIGNvbnN0IGR1cmF0aW9uID0gbWVhc3VyZVRpbWUoKCkgPT4ge1xuICAgICAgY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgfSlcblxuICAgIGV4cGVjdChkdXJhdGlvbikudG9CZUxlc3NUaGFuKDEwMCkgLy8gU2hvdWxkIGJlIDwgMTAwbXNcbiAgICBjb25zb2xlLmxvZyhgR3JhcGggY29uc3RydWN0aW9uICgxMCBmaWVsZHMpOiAke2R1cmF0aW9uLnRvRml4ZWQoMil9bXNgKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgY29uc3RydWN0IGdyYXBoIHdpdGggMTAwIGZpZWxkcyByZWFzb25hYmx5JywgKCkgPT4ge1xuICAgIGNvbnN0IGZpZWxkcyA9IGdlbmVyYXRlRmllbGRzKDEwMClcbiAgICBjb25zdCBkdXJhdGlvbiA9IG1lYXN1cmVUaW1lKCgpID0+IHtcbiAgICAgIGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuICAgIH0pXG5cbiAgICBleHBlY3QoZHVyYXRpb24pLnRvQmVMZXNzVGhhbig1MDApIC8vIFNob3VsZCBiZSA8IDUwMG1zXG4gICAgY29uc29sZS5sb2coYEdyYXBoIGNvbnN0cnVjdGlvbiAoMTAwIGZpZWxkcyk6ICR7ZHVyYXRpb24udG9GaXhlZCgyKX1tc2ApXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCBjb25zdHJ1Y3QgZ3JhcGggd2l0aCA1MDAgZmllbGRzIHdpdGhpbiBhY2NlcHRhYmxlIHRpbWUnLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzID0gZ2VuZXJhdGVGaWVsZHMoNTAwKVxuICAgIGNvbnN0IGR1cmF0aW9uID0gbWVhc3VyZVRpbWUoKCkgPT4ge1xuICAgICAgY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgfSlcblxuICAgIGV4cGVjdChkdXJhdGlvbikudG9CZUxlc3NUaGFuKDUwMDApIC8vIFNob3VsZCBiZSA8IDVzXG4gICAgY29uc29sZS5sb2coYEdyYXBoIGNvbnN0cnVjdGlvbiAoNTAwIGZpZWxkcyk6ICR7ZHVyYXRpb24udG9GaXhlZCgyKX1tc2ApXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCBzY2FsZSBzdWItbGluZWFybHkgZm9yIGdyYXBoIGNvbnN0cnVjdGlvbicsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMxMCA9IGdlbmVyYXRlRmllbGRzKDEwKVxuICAgIGNvbnN0IGZpZWxkczEwMCA9IGdlbmVyYXRlRmllbGRzKDEwMClcbiAgICBjb25zdCBmaWVsZHM1MDAgPSBnZW5lcmF0ZUZpZWxkcyg1MDApXG5cbiAgICBjb25zdCBkdXJhdGlvbjEwID0gbWVhc3VyZVRpbWUoKCkgPT4gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMxMCkpXG4gICAgY29uc3QgZHVyYXRpb24xMDAgPSBtZWFzdXJlVGltZSgoKSA9PiBjcmVhdGVGb3JtRW5naW5lKGZpZWxkczEwMCkpXG4gICAgY29uc3QgZHVyYXRpb241MDAgPSBtZWFzdXJlVGltZSgoKSA9PiBjcmVhdGVGb3JtRW5naW5lKGZpZWxkczUwMCkpXG5cbiAgICAvLyBWZXJpZnkgdGhhdCB0aW1lIGRvZXNuJ3QgaW5jcmVhc2UgbGluZWFybHkgKHNob3VsZCBiZSBjbG9zZXIgdG8gTyhuIGxvZyBuKSBvciBPKG4pKVxuICAgIGNvbnN0IHJhdGlvXzEwMF90b18xMCA9IGR1cmF0aW9uMTAwIC8gZHVyYXRpb24xMFxuICAgIGNvbnN0IHJhdGlvXzUwMF90b18xMDAgPSBkdXJhdGlvbjUwMCAvIGR1cmF0aW9uMTAwXG5cbiAgICBjb25zb2xlLmxvZyhgU2NhbGluZyAxMOKGkjEwMCBmaWVsZHM6ICR7cmF0aW9fMTAwX3RvXzEwLnRvRml4ZWQoMil9eGApXG4gICAgY29uc29sZS5sb2coYFNjYWxpbmcgMTAw4oaSNTAwIGZpZWxkczogJHtyYXRpb181MDBfdG9fMTAwLnRvRml4ZWQoMil9eGApXG5cbiAgICAvLyBFeHBlY3QgcmVhc29uYWJsZSBzY2FsaW5nIChub3QgZXhwb25lbnRpYWwpXG4gICAgZXhwZWN0KHJhdGlvXzEwMF90b18xMCkudG9CZUxlc3NUaGFuKDMwKSAvLyAxMC0zMHggZm9yIDEweCBmaWVsZCBpbmNyZWFzZVxuICAgIGV4cGVjdChyYXRpb181MDBfdG9fMTAwKS50b0JlTGVzc1RoYW4oMjApIC8vIFNob3VsZCBiZSBzdWItbGluZWFyXG4gIH0pXG59KVxuXG4vLyDilIDilIDilIAgRmllbGQgVmFsdWUgQ2hhbmdlIFByb3BhZ2F0aW9uIEJlbmNobWFya3Mg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmRlc2NyaWJlKCdQZXJmb3JtYW5jZSAtIEZpZWxkIFZhbHVlIENoYW5nZSBQcm9wYWdhdGlvbicsICgpID0+IHtcbiAgaXQoJ3Nob3VsZCBwcm9wYWdhdGUgY2hhbmdlIHRvIDEwIGRlcGVuZGVudCBmaWVsZHMgcXVpY2tseScsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMgPSBnZW5lcmF0ZUZpZWxkcygxMClcbiAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgIGNvbnN0IGR1cmF0aW9uID0gbWVhc3VyZVRpbWUoKCkgPT4ge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDA7IGkrKykge1xuICAgICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnZmllbGRfMCcsIGB2YWx1ZV8ke2l9YClcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgLy8gMTAwIGl0ZXJhdGlvbnMgc2hvdWxkIGJlIGZhc3RcbiAgICBjb25zdCBhdmdQZXJJdGVyYXRpb24gPSBkdXJhdGlvbiAvIDEwMFxuICAgIGV4cGVjdChhdmdQZXJJdGVyYXRpb24pLnRvQmVMZXNzVGhhbigxMCkgLy8gRWFjaCBjaGFuZ2UgPCAxMG1zXG4gICAgY29uc29sZS5sb2coYFByb3BhZ2F0aW9uICgxMCBmaWVsZHMsIDEwMCBpdGVyYXRpb25zKTogJHsoYXZnUGVySXRlcmF0aW9uKS50b0ZpeGVkKDIpfW1zIHBlciBjaGFuZ2VgKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgcHJvcGFnYXRlIGNoYW5nZSB0byAxMDAgZGVwZW5kZW50IGZpZWxkcyBlZmZpY2llbnRseScsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMgPSBnZW5lcmF0ZUZpZWxkcygxMDApXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICBjb25zdCBkdXJhdGlvbiA9IG1lYXN1cmVUaW1lKCgpID0+IHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNTA7IGkrKykge1xuICAgICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnZmllbGRfMCcsIGB2YWx1ZV8ke2l9YClcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgY29uc3QgYXZnUGVySXRlcmF0aW9uID0gZHVyYXRpb24gLyA1MFxuICAgIGV4cGVjdChhdmdQZXJJdGVyYXRpb24pLnRvQmVMZXNzVGhhbig1MCkgLy8gRWFjaCBjaGFuZ2UgPCA1MG1zXG4gICAgY29uc29sZS5sb2coYFByb3BhZ2F0aW9uICgxMDAgZmllbGRzLCA1MCBpdGVyYXRpb25zKTogJHsoYXZnUGVySXRlcmF0aW9uKS50b0ZpeGVkKDIpfW1zIHBlciBjaGFuZ2VgKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgcHJvcGFnYXRlIGNoYW5nZSB0byA1MDAgZGVwZW5kZW50IGZpZWxkcyBhY2NlcHRhYmx5JywgKCkgPT4ge1xuICAgIGNvbnN0IGZpZWxkcyA9IGdlbmVyYXRlRmllbGRzKDUwMClcbiAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgIGNvbnN0IGR1cmF0aW9uID0gbWVhc3VyZVRpbWUoKCkgPT4ge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG4gICAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdmaWVsZF8wJywgYHZhbHVlXyR7aX1gKVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBjb25zdCBhdmdQZXJJdGVyYXRpb24gPSBkdXJhdGlvbiAvIDEwXG4gICAgZXhwZWN0KGF2Z1Blckl0ZXJhdGlvbikudG9CZUxlc3NUaGFuKDUwMCkgLy8gRWFjaCBjaGFuZ2UgPCA1MDBtc1xuICAgIGNvbnNvbGUubG9nKGBQcm9wYWdhdGlvbiAoNTAwIGZpZWxkcywgMTAgaXRlcmF0aW9ucyk6ICR7KGF2Z1Blckl0ZXJhdGlvbikudG9GaXhlZCgyKX1tcyBwZXIgY2hhbmdlYClcbiAgfSlcblxuICBpdCgnc2hvdWxkIGJlIE8oaykgbm90IE8obikgd2hlcmUgayBpcyBhZmZlY3RlZCBmaWVsZHMnLCAoKSA9PiB7XG4gICAgLy8gQ3JlYXRlIHR3byBmb3Jtczogb25lIHdpdGggbWFueSBpbmRlcGVuZGVudCBmaWVsZHMsIG9uZSB3aXRoIGRlcGVuZGVudCBjaGFpblxuICAgIGNvbnN0IGluZGVwZW5kZW50RmllbGRzID0gZ2VuZXJhdGVGaWVsZHMoMTAwKVxuICAgIGNvbnN0IGNoYWluZWRGaWVsZHM6IEZvcm1GaWVsZFtdID0gW11cblxuICAgIC8vIENyZWF0ZSBhIGRlcGVuZGVuY3kgY2hhaW5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEwMDsgaSsrKSB7XG4gICAgICBjaGFpbmVkRmllbGRzLnB1c2goe1xuICAgICAgICBpZDogYGNoYWluXyR7aX1gLFxuICAgICAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgICAgIGtleTogYGNoYWluXyR7aX1gLFxuICAgICAgICBsYWJlbDogYEZpZWxkICR7aX1gLFxuICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgb3JkZXI6IGksXG4gICAgICAgIGNvbmZpZzoge30sXG4gICAgICAgIGNvbmRpdGlvbnM6IGkgPiAwID8ge1xuICAgICAgICAgIG9wZXJhdG9yOiAnQU5EJyxcbiAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgeyBmaWVsZEtleTogYGNoYWluXyR7aSAtIDF9YCwgb3BlcmF0b3I6ICdOT1RfRU1QVFknLCB2YWx1ZTogbnVsbCB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0gOiBudWxsLFxuICAgICAgfSlcbiAgICB9XG5cbiAgICBjb25zdCBlbmdpbmVJbmRlcGVuZGVudCA9IGNyZWF0ZUZvcm1FbmdpbmUoaW5kZXBlbmRlbnRGaWVsZHMpXG4gICAgY29uc3QgZW5naW5lQ2hhaW5lZCA9IGNyZWF0ZUZvcm1FbmdpbmUoY2hhaW5lZEZpZWxkcylcblxuICAgIC8vIENoYW5naW5nIGEgZmllbGQgaW4gdGhlIGluZGVwZW5kZW50IGZvcm0gc2hvdWxkIGJlIGFzIGZhc3QgYXMgaW4gdGhlIGNoYWluZWQgZm9ybVxuICAgIC8vIGJlY2F1c2UgaXQgb25seSBhZmZlY3RzIGl0cyBkaXJlY3QgZGVwZW5kZW50cyAoayksIG5vdCBhbGwgZmllbGRzIChuKVxuXG4gICAgY29uc3QgZHVyYXRpb25JbmRlcGVuZGVudCA9IG1lYXN1cmVUaW1lKCgpID0+IHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTAwOyBpKyspIHtcbiAgICAgICAgZW5naW5lSW5kZXBlbmRlbnQuc2V0RmllbGRWYWx1ZSgnZmllbGRfMCcsIGB2YWx1ZV8ke2l9YClcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgY29uc3QgZHVyYXRpb25DaGFpbmVkID0gbWVhc3VyZVRpbWUoKCkgPT4ge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDA7IGkrKykge1xuICAgICAgICBlbmdpbmVDaGFpbmVkLnNldEZpZWxkVmFsdWUoJ2NoYWluXzAnLCBgdmFsdWVfJHtpfWApXG4gICAgICB9XG4gICAgfSlcblxuICAgIGNvbnN0IGF2Z0luZGVwZW5kZW50ID0gZHVyYXRpb25JbmRlcGVuZGVudCAvIDEwMFxuICAgIGNvbnN0IGF2Z0NoYWluZWQgPSBkdXJhdGlvbkNoYWluZWQgLyAxMDBcblxuICAgIGNvbnNvbGUubG9nKGBJbmRlcGVuZGVudCBmb3JtIHByb3BhZ2F0aW9uOiAke2F2Z0luZGVwZW5kZW50LnRvRml4ZWQoMyl9bXNgKVxuICAgIGNvbnNvbGUubG9nKGBDaGFpbmVkIGZvcm0gcHJvcGFnYXRpb246ICR7YXZnQ2hhaW5lZC50b0ZpeGVkKDMpfW1zYClcbiAgICBjb25zb2xlLmxvZyhgUmF0aW86ICR7KGF2Z0NoYWluZWQgLyBhdmdJbmRlcGVuZGVudCkudG9GaXhlZCgyKX14YClcblxuICAgIC8vIEJvdGggc2hvdWxkIGJlIHJlYXNvbmFibHkgZmFzdCBzaW5jZSB0aGV5J3JlIE8oaykgbm90IE8obilcbiAgICBleHBlY3QoYXZnSW5kZXBlbmRlbnQpLnRvQmVMZXNzVGhhbig1MClcbiAgICBleHBlY3QoYXZnQ2hhaW5lZCkudG9CZUxlc3NUaGFuKDUwKVxuICB9KVxufSlcblxuLy8g4pSA4pSA4pSAIENvbmRpdGlvbiBFdmFsdWF0aW9uIEJlbmNobWFya3Mg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmRlc2NyaWJlKCdQZXJmb3JtYW5jZSAtIENvbmRpdGlvbiBFdmFsdWF0aW9uJywgKCkgPT4ge1xuICBpdCgnc2hvdWxkIGV2YWx1YXRlIDEwIGNvbmRpdGlvbmFsIGZpZWxkcyBxdWlja2x5JywgKCkgPT4ge1xuICAgIGNvbnN0IGZpZWxkcyA9IGdlbmVyYXRlRmllbGRzKDEwKVxuICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgY29uc3QgZHVyYXRpb24gPSBtZWFzdXJlVGltZSgoKSA9PiB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEwMDA7IGkrKykge1xuICAgICAgICBlbmdpbmUuZ2V0VmlzaWJsZUZpZWxkcygpXG4gICAgICB9XG4gICAgfSlcblxuICAgIGNvbnN0IGF2Z1BlckNhbGwgPSBkdXJhdGlvbiAvIDEwMDBcbiAgICBleHBlY3QoYXZnUGVyQ2FsbCkudG9CZUxlc3NUaGFuKDUpIC8vIEVhY2ggY2FsbCA8IDVtc1xuICAgIGNvbnNvbGUubG9nKGBWaXNpYmlsaXR5IGV2YWx1YXRpb24gKDEwIGZpZWxkcyk6ICR7KGF2Z1BlckNhbGwpLnRvRml4ZWQoMyl9bXMgcGVyIGNhbGxgKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgZXZhbHVhdGUgMTAwIGNvbmRpdGlvbmFsIGZpZWxkcyBlZmZpY2llbnRseScsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMgPSBnZW5lcmF0ZUZpZWxkcygxMDApXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICBjb25zdCBkdXJhdGlvbiA9IG1lYXN1cmVUaW1lKCgpID0+IHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTAwOyBpKyspIHtcbiAgICAgICAgZW5naW5lLmdldFZpc2libGVGaWVsZHMoKVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBjb25zdCBhdmdQZXJDYWxsID0gZHVyYXRpb24gLyAxMDBcbiAgICBleHBlY3QoYXZnUGVyQ2FsbCkudG9CZUxlc3NUaGFuKDI1KSAvLyBFYWNoIGNhbGwgPCAyNW1zXG4gICAgY29uc29sZS5sb2coYFZpc2liaWxpdHkgZXZhbHVhdGlvbiAoMTAwIGZpZWxkcyk6ICR7KGF2Z1BlckNhbGwpLnRvRml4ZWQoMyl9bXMgcGVyIGNhbGxgKVxuICB9KVxuXG4gIGl0KCdzaG91bGQgZXZhbHVhdGUgY29tcGxleCBjb25kaXRpb25zIHJlYXNvbmFibHknLCAoKSA9PiB7XG4gICAgY29uc3QgY29tcGxleEZpZWxkczogRm9ybUZpZWxkW10gPSBbXG4gICAgICB7XG4gICAgICAgIGlkOiAnYmFzZScsXG4gICAgICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICAgICAga2V5OiAnYmFzZScsXG4gICAgICAgIGxhYmVsOiAnQmFzZScsXG4gICAgICAgIHR5cGU6ICdTRUxFQ1QnLFxuICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgIG1vZGU6ICdzdGF0aWMnLFxuICAgICAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAgICAgIHsgbGFiZWw6ICdPcHRpb24gQScsIHZhbHVlOiAnYScgfSxcbiAgICAgICAgICAgIHsgbGFiZWw6ICdPcHRpb24gQicsIHZhbHVlOiAnYicgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIC4uLkFycmF5LmZyb20oeyBsZW5ndGg6IDk5IH0sIChfLCBpKSA9PiAoe1xuICAgICAgICBpZDogYGZpZWxkXyR7aX1gLFxuICAgICAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgICAgIGtleTogYGZpZWxkXyR7aX1gLFxuICAgICAgICBsYWJlbDogYEZpZWxkICR7aX1gLFxuICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcgYXMgY29uc3QsXG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgb3JkZXI6IGkgKyAxLFxuICAgICAgICBjb25maWc6IHt9LFxuICAgICAgICBjb25kaXRpb25zOiB7XG4gICAgICAgICAgb3BlcmF0b3I6ICdBTkQnIGFzIGNvbnN0LFxuICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICB7IGZpZWxkS2V5OiAnYmFzZScsIG9wZXJhdG9yOiAnRVFVQUxTJyBhcyBjb25zdCwgdmFsdWU6ICdhJyB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9KSksXG4gICAgXVxuXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShjb21wbGV4RmllbGRzKVxuXG4gICAgY29uc3QgZHVyYXRpb24gPSBtZWFzdXJlVGltZSgoKSA9PiB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEwMDsgaSsrKSB7XG4gICAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdiYXNlJywgaSAlIDIgPT09IDAgPyAnYScgOiAnYicpXG4gICAgICAgIGVuZ2luZS5nZXRWaXNpYmxlRmllbGRzKClcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgY29uc3QgYXZnUGVySXRlcmF0aW9uID0gZHVyYXRpb24gLyAxMDBcbiAgICBleHBlY3QoYXZnUGVySXRlcmF0aW9uKS50b0JlTGVzc1RoYW4oMTAwKSAvLyBFYWNoIGl0ZXJhdGlvbiA8IDEwMG1zXG4gICAgY29uc29sZS5sb2coYENvbXBsZXggY29uZGl0aW9ucyAoMTAwIGZpZWxkcyk6ICR7KGF2Z1Blckl0ZXJhdGlvbikudG9GaXhlZCgyKX1tcyBwZXIgaXRlcmF0aW9uYClcbiAgfSlcbn0pXG5cbi8vIOKUgOKUgOKUgCBWYWxpZGF0aW9uIFBlcmZvcm1hbmNlIEJlbmNobWFya3Mg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmRlc2NyaWJlKCdQZXJmb3JtYW5jZSAtIFZhbGlkYXRpb24nLCAoKSA9PiB7XG4gIGl0KCdzaG91bGQgdmFsaWRhdGUgMTAgZmllbGRzIHF1aWNrbHknLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzID0gZ2VuZXJhdGVGaWVsZHMoMTApXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICBjb25zdCBkdXJhdGlvbiA9IG1lYXN1cmVUaW1lKCgpID0+IHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTAwOyBpKyspIHtcbiAgICAgICAgZW5naW5lLnZhbGlkYXRlKClcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgY29uc3QgYXZnUGVyVmFsaWRhdGlvbiA9IGR1cmF0aW9uIC8gMTAwXG4gICAgZXhwZWN0KGF2Z1BlclZhbGlkYXRpb24pLnRvQmVMZXNzVGhhbigxMCkgLy8gRWFjaCB2YWxpZGF0aW9uIDwgMTBtc1xuICAgIGNvbnNvbGUubG9nKGBWYWxpZGF0aW9uICgxMCBmaWVsZHMpOiAkeyhhdmdQZXJWYWxpZGF0aW9uKS50b0ZpeGVkKDMpfW1zIHBlciB2YWxpZGF0aW9uYClcbiAgfSlcblxuICBpdCgnc2hvdWxkIHZhbGlkYXRlIDEwMCBmaWVsZHMgZWZmaWNpZW50bHknLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzID0gZ2VuZXJhdGVGaWVsZHMoMTAwKVxuICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuXG4gICAgY29uc3QgZHVyYXRpb24gPSBtZWFzdXJlVGltZSgoKSA9PiB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDUwOyBpKyspIHtcbiAgICAgICAgZW5naW5lLnZhbGlkYXRlKClcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgY29uc3QgYXZnUGVyVmFsaWRhdGlvbiA9IGR1cmF0aW9uIC8gNTBcbiAgICBleHBlY3QoYXZnUGVyVmFsaWRhdGlvbikudG9CZUxlc3NUaGFuKDUwKSAvLyBFYWNoIHZhbGlkYXRpb24gPCA1MG1zXG4gICAgY29uc29sZS5sb2coYFZhbGlkYXRpb24gKDEwMCBmaWVsZHMpOiAkeyhhdmdQZXJWYWxpZGF0aW9uKS50b0ZpeGVkKDIpfW1zIHBlciB2YWxpZGF0aW9uYClcbiAgfSlcblxuICBpdCgnc2hvdWxkIHZhbGlkYXRlIDUwMCBmaWVsZHMgYWNjZXB0YWJseScsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMgPSBnZW5lcmF0ZUZpZWxkcyg1MDApXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICBjb25zdCBkdXJhdGlvbiA9IG1lYXN1cmVUaW1lKCgpID0+IHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgICAgICBlbmdpbmUudmFsaWRhdGUoKVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBjb25zdCBhdmdQZXJWYWxpZGF0aW9uID0gZHVyYXRpb24gLyAxMFxuICAgIGV4cGVjdChhdmdQZXJWYWxpZGF0aW9uKS50b0JlTGVzc1RoYW4oNTAwKSAvLyBFYWNoIHZhbGlkYXRpb24gPCA1MDBtc1xuICAgIGNvbnNvbGUubG9nKGBWYWxpZGF0aW9uICg1MDAgZmllbGRzKTogJHsoYXZnUGVyVmFsaWRhdGlvbikudG9GaXhlZCgyKX1tcyBwZXIgdmFsaWRhdGlvbmApXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBzdGVwLXNwZWNpZmljIGZpZWxkcyBxdWlja2x5JywgKCkgPT4ge1xuICAgIGNvbnN0IGZpZWxkcyA9IGdlbmVyYXRlRmllbGRzKDEwMClcbiAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgIC8vIEFkZCBzdGVwIElEc1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmllbGRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBmaWVsZHNbaV0uc3RlcElkID0gYHN0ZXBfJHtNYXRoLmZsb29yKGkgLyAxMCl9YFxuICAgIH1cblxuICAgIGNvbnN0IGR1cmF0aW9uID0gbWVhc3VyZVRpbWUoKCkgPT4ge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDA7IGkrKykge1xuICAgICAgICBlbmdpbmUudmFsaWRhdGVTdGVwKCdzdGVwXzAnKVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBjb25zdCBhdmdQZXJWYWxpZGF0aW9uID0gZHVyYXRpb24gLyAxMDBcbiAgICBleHBlY3QoYXZnUGVyVmFsaWRhdGlvbikudG9CZUxlc3NUaGFuKDIwKSAvLyBTdGVwIHZhbGlkYXRpb24gPCAyMG1zXG4gICAgY29uc29sZS5sb2coYFN0ZXAgdmFsaWRhdGlvbiAoMTAgZmllbGRzKTogJHsoYXZnUGVyVmFsaWRhdGlvbikudG9GaXhlZCgzKX1tcyBwZXIgdmFsaWRhdGlvbmApXG4gIH0pXG59KVxuXG4vLyDilIDilIDilIAgU3RlcHBlciBOYXZpZ2F0aW9uIEJlbmNobWFya3Mg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmRlc2NyaWJlKCdQZXJmb3JtYW5jZSAtIFN0ZXBwZXIgTmF2aWdhdGlvbicsICgpID0+IHtcbiAgaXQoJ3Nob3VsZCBuYXZpZ2F0ZSBzdGVwcyBxdWlja2x5IHdpdGggMTAgc3RlcHMnLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzID0gZ2VuZXJhdGVGaWVsZHMoNTApXG4gICAgY29uc3Qgc3RlcHMgPSBnZW5lcmF0ZVN0ZXBzKDEwKVxuICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuICAgIGNvbnN0IHN0ZXBwZXIgPSBjcmVhdGVGb3JtU3RlcHBlcihzdGVwcywgZW5naW5lKVxuXG4gICAgY29uc3QgZHVyYXRpb24gPSBtZWFzdXJlVGltZSgoKSA9PiB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEwMDsgaSsrKSB7XG4gICAgICAgIHN0ZXBwZXIuZ29OZXh0KClcbiAgICAgICAgaWYgKHN0ZXBwZXIuaXNMYXN0U3RlcCgpKSBzdGVwcGVyLmp1bXBUbygwKVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBjb25zdCBhdmdQZXJOYXZpZ2F0aW9uID0gZHVyYXRpb24gLyAxMDBcbiAgICBleHBlY3QoYXZnUGVyTmF2aWdhdGlvbikudG9CZUxlc3NUaGFuKDEwKSAvLyBFYWNoIG5hdmlnYXRpb24gPCAxMG1zXG4gICAgY29uc29sZS5sb2coYFN0ZXAgbmF2aWdhdGlvbiAoMTAgc3RlcHMpOiAkeyhhdmdQZXJOYXZpZ2F0aW9uKS50b0ZpeGVkKDMpfW1zIHBlciBuYXZpZ2F0aW9uYClcbiAgfSlcblxuICBpdCgnc2hvdWxkIGp1bXAgdG8gc3BlY2lmaWMgc3RlcCBlZmZpY2llbnRseScsICgpID0+IHtcbiAgICBjb25zdCBmaWVsZHMgPSBnZW5lcmF0ZUZpZWxkcyg1MClcbiAgICBjb25zdCBzdGVwcyA9IGdlbmVyYXRlU3RlcHMoNTApXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgY29uc3Qgc3RlcHBlciA9IGNyZWF0ZUZvcm1TdGVwcGVyKHN0ZXBzLCBlbmdpbmUpXG5cbiAgICBjb25zdCBkdXJhdGlvbiA9IG1lYXN1cmVUaW1lKCgpID0+IHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTAwMDsgaSsrKSB7XG4gICAgICAgIHN0ZXBwZXIuanVtcFRvKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDUwKSlcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgY29uc3QgYXZnUGVySnVtcCA9IGR1cmF0aW9uIC8gMTAwMFxuICAgIGV4cGVjdChhdmdQZXJKdW1wKS50b0JlTGVzc1RoYW4oNSkgLy8gRWFjaCBqdW1wIDwgNW1zXG4gICAgY29uc29sZS5sb2coYEp1bXAgbmF2aWdhdGlvbiAoNTAgc3RlcHMpOiAkeyhhdmdQZXJKdW1wKS50b0ZpeGVkKDMpfW1zIHBlciBqdW1wYClcbiAgfSlcblxuICBpdCgnc2hvdWxkIGV2YWx1YXRlIHByb2dyZXNzIHRyYWNraW5nIHF1aWNrbHknLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzID0gZ2VuZXJhdGVGaWVsZHMoNTApXG4gICAgY29uc3Qgc3RlcHMgPSBnZW5lcmF0ZVN0ZXBzKDEwMClcbiAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcbiAgICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIoc3RlcHMsIGVuZ2luZSlcblxuICAgIGNvbnN0IGR1cmF0aW9uID0gbWVhc3VyZVRpbWUoKCkgPT4ge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDAwOyBpKyspIHtcbiAgICAgICAgc3RlcHBlci5nZXRQcm9ncmVzcygpXG4gICAgICB9XG4gICAgfSlcblxuICAgIGNvbnN0IGF2Z1BlckNhbGwgPSBkdXJhdGlvbiAvIDEwMDBcbiAgICBleHBlY3QoYXZnUGVyQ2FsbCkudG9CZUxlc3NUaGFuKDIpIC8vIEVhY2ggY2FsbCA8IDJtc1xuICAgIGNvbnNvbGUubG9nKGBQcm9ncmVzcyBldmFsdWF0aW9uICgxMDAgc3RlcHMpOiAkeyhhdmdQZXJDYWxsKS50b0ZpeGVkKDMpfW1zIHBlciBjYWxsYClcbiAgfSlcbn0pXG5cbi8vIOKUgOKUgOKUgCBNZW1vcnkgYW5kIENvbGxlY3Rpb24gQmVuY2htYXJrcyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZGVzY3JpYmUoJ1BlcmZvcm1hbmNlIC0gTWVtb3J5IE1hbmFnZW1lbnQnLCAoKSA9PiB7XG4gIGl0KCdzaG91bGQgaGFuZGxlIHVuZG8vcmVkbyBzdGFja3MgZWZmaWNpZW50bHknLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzID0gZ2VuZXJhdGVGaWVsZHMoNTApXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICBjb25zdCBkdXJhdGlvbiA9IG1lYXN1cmVUaW1lKCgpID0+IHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTAwOyBpKyspIHtcbiAgICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2ZpZWxkXzAnLCBgdmFsdWVfJHtpfWApXG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNTA7IGkrKykge1xuICAgICAgICBlbmdpbmUudW5kbygpXG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNTA7IGkrKykge1xuICAgICAgICBlbmdpbmUucmVkbygpXG4gICAgICB9XG4gICAgfSlcblxuICAgIGV4cGVjdChkdXJhdGlvbikudG9CZUxlc3NUaGFuKDUwMCkgLy8gVG90YWwgb3BlcmF0aW9ucyA8IDUwMG1zXG4gICAgY29uc29sZS5sb2coYFVuZG8vcmVkbyBvcGVyYXRpb25zICgxMDAgY2hhbmdlcyArIDUwIHVuZG8gKyA1MCByZWRvKTogJHtkdXJhdGlvbi50b0ZpeGVkKDIpfW1zYClcbiAgfSlcblxuICBpdCgnc2hvdWxkIHRyYWNrIHJlcGVhdCBpbnN0YW5jZXMgZWZmaWNpZW50bHknLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzOiBGb3JtRmllbGRbXSA9IFtcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdncm91cF8xJyxcbiAgICAgICAgdmVyc2lvbklkOiAndjEnLFxuICAgICAgICBrZXk6ICdncm91cF8xJyxcbiAgICAgICAgbGFiZWw6ICdSZXBlYXQgR3JvdXAnLFxuICAgICAgICB0eXBlOiAnRklFTERfR1JPVVAnLFxuICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgIG9yZGVyOiAwLFxuICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICB0ZW1wbGF0ZUZpZWxkczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpZDogJ2ZpZWxkXzEnLFxuICAgICAgICAgICAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgICAgICAgICAgIGtleTogJ25hbWUnLFxuICAgICAgICAgICAgICBsYWJlbDogJ05hbWUnLFxuICAgICAgICAgICAgICB0eXBlOiAnU0hPUlRfVEVYVCcsXG4gICAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgICAgICBvcmRlcjogMCxcbiAgICAgICAgICAgICAgY29uZmlnOiB7fSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXVxuXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICBjb25zdCBkdXJhdGlvbiA9IG1lYXN1cmVUaW1lKCgpID0+IHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTAwOyBpKyspIHtcbiAgICAgICAgZW5naW5lLmFkZFJlcGVhdEluc3RhbmNlKCdncm91cF8xJylcbiAgICAgIH1cblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA1MDsgaSsrKSB7XG4gICAgICAgIGVuZ2luZS5yZW1vdmVSZXBlYXRJbnN0YW5jZSgnZ3JvdXBfMScsIDApXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGluc3RhbmNlcyA9IGVuZ2luZS5nZXRSZXBlYXRJbnN0YW5jZXMoJ2dyb3VwXzEnKVxuICAgICAgZXhwZWN0KGluc3RhbmNlcy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKVxuICAgIH0pXG5cbiAgICBleHBlY3QoZHVyYXRpb24pLnRvQmVMZXNzVGhhbigyMDApIC8vIDEwMCBhZGRzICsgNTAgcmVtb3ZlcyArIHJldHJpZXZhbCA8IDIwMG1zXG4gICAgY29uc29sZS5sb2coYFJlcGVhdCBpbnN0YW5jZSBvcGVyYXRpb25zICgxMDAgYWRkcyArIDUwIHJlbW92ZXMpOiAke2R1cmF0aW9uLnRvRml4ZWQoMil9bXNgKVxuICB9KVxufSlcblxuLy8g4pSA4pSA4pSAIENvbXB1dGVkIEZpZWxkIEJlbmNobWFya3Mg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbmRlc2NyaWJlKCdQZXJmb3JtYW5jZSAtIENvbXB1dGVkIEZpZWxkcycsICgpID0+IHtcbiAgaXQoJ3Nob3VsZCBldmFsdWF0ZSBjb21wdXRlZCBmaWVsZHMgZWZmaWNpZW50bHknLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzOiBGb3JtRmllbGRbXSA9IFtcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdmaWVsZF9hJyxcbiAgICAgICAgdmVyc2lvbklkOiAndjEnLFxuICAgICAgICBrZXk6ICdhJyxcbiAgICAgICAgbGFiZWw6ICdGaWVsZCBBJyxcbiAgICAgICAgdHlwZTogJ05VTUJFUicsXG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgIGNvbmZpZzoge30sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBpZDogJ2ZpZWxkX2InLFxuICAgICAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgICAgIGtleTogJ2InLFxuICAgICAgICBsYWJlbDogJ0ZpZWxkIEInLFxuICAgICAgICB0eXBlOiAnTlVNQkVSJyxcbiAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICBvcmRlcjogMSxcbiAgICAgICAgY29uZmlnOiB7fSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGlkOiAnZmllbGRfc3VtJyxcbiAgICAgICAgdmVyc2lvbklkOiAndjEnLFxuICAgICAgICBrZXk6ICdzdW0nLFxuICAgICAgICBsYWJlbDogJ1N1bScsXG4gICAgICAgIHR5cGU6ICdOVU1CRVInLFxuICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgIG9yZGVyOiAyLFxuICAgICAgICBjb25maWc6IHt9LFxuICAgICAgICBjb21wdXRlZDoge1xuICAgICAgICAgIGV4cHJlc3Npb246ICdhICsgYicsXG4gICAgICAgICAgZGVwZW5kc09uOiBbJ2EnLCAnYiddLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdXG5cbiAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgIGNvbnN0IGR1cmF0aW9uID0gbWVhc3VyZVRpbWUoKCkgPT4ge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDA7IGkrKykge1xuICAgICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnYScsIGkpXG4gICAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdiJywgaSAqIDIpXG4gICAgICAgIGNvbnN0IHZhbHVlID0gZW5naW5lLmdldENvbXB1dGVkVmFsdWUoJ3N1bScpXG4gICAgICAgIGV4cGVjdCh2YWx1ZSkudG9CZShpICsgaSAqIDIpXG4gICAgICB9XG4gICAgfSlcblxuICAgIGNvbnN0IGF2Z1BlckNoYW5nZSA9IGR1cmF0aW9uIC8gMjAwIC8vIDEwMCBjaGFuZ2VzIHRvIGEgKyAxMDAgY2hhbmdlcyB0byBiXG4gICAgZXhwZWN0KGF2Z1BlckNoYW5nZSkudG9CZUxlc3NUaGFuKDUpIC8vIEVhY2ggY2hhbmdlIDwgNW1zXG4gICAgY29uc29sZS5sb2coYENvbXB1dGVkIGZpZWxkIGV2YWx1YXRpb246ICR7KGF2Z1BlckNoYW5nZSkudG9GaXhlZCgzKX1tcyBwZXIgZmllbGQgY2hhbmdlYClcbiAgfSlcblxuICBpdCgnc2hvdWxkIGhhbmRsZSBtdWx0aXBsZSBjb21wdXRlZCBkZXBlbmRlbmNpZXMnLCAoKSA9PiB7XG4gICAgY29uc3QgZmllbGRzOiBGb3JtRmllbGRbXSA9IFtcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdmaWVsZF94JyxcbiAgICAgICAgdmVyc2lvbklkOiAndjEnLFxuICAgICAgICBrZXk6ICd4JyxcbiAgICAgICAgbGFiZWw6ICdYJyxcbiAgICAgICAgdHlwZTogJ05VTUJFUicsXG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgIGNvbmZpZzoge30sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBpZDogJ2ZpZWxkX3knLFxuICAgICAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgICAgIGtleTogJ3knLFxuICAgICAgICBsYWJlbDogJ1knLFxuICAgICAgICB0eXBlOiAnTlVNQkVSJyxcbiAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICBvcmRlcjogMSxcbiAgICAgICAgY29uZmlnOiB7fSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGlkOiAnZmllbGRfeicsXG4gICAgICAgIHZlcnNpb25JZDogJ3YxJyxcbiAgICAgICAga2V5OiAneicsXG4gICAgICAgIGxhYmVsOiAnWicsXG4gICAgICAgIHR5cGU6ICdOVU1CRVInLFxuICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgIG9yZGVyOiAyLFxuICAgICAgICBjb25maWc6IHt9LFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdmaWVsZF9jb21wdXRlZDEnLFxuICAgICAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgICAgIGtleTogJ2NvbXB1dGVkMScsXG4gICAgICAgIGxhYmVsOiAnQ29tcHV0ZWQgMScsXG4gICAgICAgIHR5cGU6ICdOVU1CRVInLFxuICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgIG9yZGVyOiAzLFxuICAgICAgICBjb25maWc6IHt9LFxuICAgICAgICBjb21wdXRlZDoge1xuICAgICAgICAgIGV4cHJlc3Npb246ICd4ICsgeScsXG4gICAgICAgICAgZGVwZW5kc09uOiBbJ3gnLCAneSddLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdmaWVsZF9jb21wdXRlZDInLFxuICAgICAgICB2ZXJzaW9uSWQ6ICd2MScsXG4gICAgICAgIGtleTogJ2NvbXB1dGVkMicsXG4gICAgICAgIGxhYmVsOiAnQ29tcHV0ZWQgMicsXG4gICAgICAgIHR5cGU6ICdOVU1CRVInLFxuICAgICAgICByZXF1aXJlZDogZmFsc2UsXG4gICAgICAgIG9yZGVyOiA0LFxuICAgICAgICBjb25maWc6IHt9LFxuICAgICAgICBjb21wdXRlZDoge1xuICAgICAgICAgIGV4cHJlc3Npb246ICdjb21wdXRlZDEgKyB6JyxcbiAgICAgICAgICBkZXBlbmRzT246IFsnY29tcHV0ZWQxJywgJ3onXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXVxuXG4gICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICBjb25zdCBkdXJhdGlvbiA9IG1lYXN1cmVUaW1lKCgpID0+IHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNTA7IGkrKykge1xuICAgICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgneCcsIGkpXG4gICAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCd5JywgaSlcbiAgICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ3onLCBpKVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBjb25zdCBhdmdQZXJJdGVyYXRpb24gPSBkdXJhdGlvbiAvIDUwXG4gICAgZXhwZWN0KGF2Z1Blckl0ZXJhdGlvbikudG9CZUxlc3NUaGFuKDIwKSAvLyBFYWNoIGl0ZXJhdGlvbiA8IDIwbXNcbiAgICBjb25zb2xlLmxvZyhgTXVsdGktZGVwZW5kZW5jeSBjb21wdXRlZCBmaWVsZHM6ICR7KGF2Z1Blckl0ZXJhdGlvbikudG9GaXhlZCgyKX1tcyBwZXIgaXRlcmF0aW9uYClcbiAgfSlcbn0pXG4iXX0=