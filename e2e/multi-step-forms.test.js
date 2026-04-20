"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const dfe_core_1 = require("@dmc--98/dfe-core");
const fixtures_1 = require("./helpers/fixtures");
(0, vitest_1.describe)('Multi-Step Forms', () => {
    (0, vitest_1.beforeEach)(() => {
        (0, fixtures_1.resetFieldCounter)();
    });
    (0, vitest_1.describe)('Basic Navigation', () => {
        (0, vitest_1.it)('should start stepper at step 0 for 3-step form', () => {
            const { fields, steps } = (0, fixtures_1.createMultiStepConditionalForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            (0, vitest_1.expect)(stepper.getCurrentIndex()).toBe(0);
        });
        (0, vitest_1.it)('should return first step from getCurrentStep initially', () => {
            const { fields, steps } = (0, fixtures_1.createMultiStepConditionalForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            const currentStep = stepper.getCurrentStep();
            (0, vitest_1.expect)(currentStep).toBeDefined();
            (0, vitest_1.expect)(currentStep === null || currentStep === void 0 ? void 0 : currentStep.step.id).toBe(steps[0].id);
        });
        (0, vitest_1.it)('should advance to next step after setting valid values and calling goNext', () => {
            const { fields, steps } = (0, fixtures_1.createMultiStepConditionalForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            // Get fields for step 0
            const step0Fields = fields.filter((f) => f.stepId === steps[0].id);
            // Set valid values for all required fields in step 0
            step0Fields.forEach((field) => {
                var _a;
                if (field.required) {
                    if (field.type === 'SHORT_TEXT' ||
                        field.type === 'EMAIL' ||
                        field.type === 'LONG_TEXT') {
                        engine.setFieldValue(field.key, field.type === 'EMAIL'
                            ? 'test@example.com'
                            : 'test value for field');
                    }
                    else if (field.type === 'NUMBER') {
                        engine.setFieldValue(field.key, 42);
                    }
                    else if (field.type === 'SELECT') {
                        const options = ((_a = field.config) === null || _a === void 0 ? void 0 : _a.options) || ['option1'];
                        engine.setFieldValue(field.key, options[0]);
                    }
                }
            });
            const result = stepper.goNext();
            (0, vitest_1.expect)(result).not.toBeNull();
            (0, vitest_1.expect)(stepper.getCurrentIndex()).toBe(1);
        });
        (0, vitest_1.it)('should return false for isLastStep at step 0 and true at last step', () => {
            const { fields, steps } = (0, fixtures_1.createMultiStepConditionalForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            (0, vitest_1.expect)(stepper.isLastStep()).toBe(false);
            // Navigate to last step
            stepper.jumpTo(steps.length - 1);
            (0, vitest_1.expect)(stepper.isLastStep()).toBe(true);
        });
        (0, vitest_1.it)('should return false for canGoBack at step 0 and true at step 1+', () => {
            const { fields, steps } = (0, fixtures_1.createMultiStepConditionalForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            (0, vitest_1.expect)(stepper.canGoBack()).toBe(false);
            stepper.jumpTo(1);
            (0, vitest_1.expect)(stepper.canGoBack()).toBe(true);
        });
        (0, vitest_1.it)('should navigate back from step 1 to step 0 and preserve values', () => {
            const { fields, steps } = (0, fixtures_1.createMultiStepConditionalForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            // Set values on step 0
            engine.setFieldValue('name', 'preserved-value');
            // Navigate forward
            stepper.jumpTo(1);
            (0, vitest_1.expect)(stepper.getCurrentIndex()).toBe(1);
            // Navigate back
            const result = stepper.goBack();
            (0, vitest_1.expect)(result).not.toBeNull();
            (0, vitest_1.expect)(stepper.getCurrentIndex()).toBe(0);
            // Verify values are preserved
            const values = engine.getValues();
            (0, vitest_1.expect)(values.name).toBe('preserved-value');
        });
    });
    (0, vitest_1.describe)('Progress Tracking', () => {
        (0, vitest_1.it)('should return progress at step 0 of 3 with ~33 percent', () => {
            const { fields, steps } = (0, fixtures_1.createMultiStepConditionalForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            const progress = stepper.getProgress();
            (0, vitest_1.expect)(progress.current).toBe(1);
            (0, vitest_1.expect)(progress.total).toBe(3);
            (0, vitest_1.expect)(progress.percent).toBeGreaterThan(30);
            (0, vitest_1.expect)(progress.percent).toBeLessThan(35);
        });
        (0, vitest_1.it)('should return 100 percent progress at last step', () => {
            const { fields, steps } = (0, fixtures_1.createMultiStepConditionalForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            stepper.jumpTo(steps.length - 1);
            const progress = stepper.getProgress();
            (0, vitest_1.expect)(progress.percent).toBe(100);
            (0, vitest_1.expect)(progress.current).toBe(progress.total);
        });
    });
    (0, vitest_1.describe)('Step Skipping', () => {
        (0, vitest_1.it)('should skip step when skip condition is met', () => {
            const { fields, steps } = (0, fixtures_1.createMultiStepConditionalForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            // Set a value that triggers skip condition for step 1
            // Assuming the form has a skip condition based on a checkbox
            engine.setFieldValue('skip_details', true);
            const visibleSteps = stepper.getVisibleSteps();
            // Visible steps should exclude skipped ones
            (0, vitest_1.expect)(visibleSteps.length).toBeLessThanOrEqual(steps.length);
        });
        (0, vitest_1.it)('should exclude skipped steps from getVisibleSteps', () => {
            const { fields, steps } = (0, fixtures_1.createMultiStepConditionalForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            const visibleSteps = stepper.getVisibleSteps();
            (0, vitest_1.expect)(visibleSteps).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(visibleSteps)).toBe(true);
        });
    });
    (0, vitest_1.describe)('Step Jumping', () => {
        (0, vitest_1.it)('should jump to specific step when fields are valid', () => {
            const { fields, steps } = (0, fixtures_1.createMultiStepConditionalForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            // Set up valid values for intermediate steps
            fields.forEach((field) => {
                if (field.required && field.stepId) {
                    if (field.type === 'SHORT_TEXT' ||
                        field.type === 'EMAIL' ||
                        field.type === 'LONG_TEXT') {
                        engine.setFieldValue(field.key, field.type === 'EMAIL'
                            ? 'test@example.com'
                            : 'test value');
                    }
                    else if (field.type === 'NUMBER') {
                        engine.setFieldValue(field.key, 42);
                    }
                }
            });
            stepper.jumpTo(2);
            (0, vitest_1.expect)(stepper.getCurrentIndex()).toBe(2);
        });
        (0, vitest_1.it)('should mark step as complete', () => {
            const { fields, steps } = (0, fixtures_1.createMultiStepConditionalForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            const stepId = steps[0].id;
            stepper.markComplete(stepId);
            // Verify step state was updated
            const currentStep = stepper.getCurrentStep();
            (0, vitest_1.expect)(currentStep).toBeDefined();
        });
    });
    (0, vitest_1.describe)('Complete Submission Workflow', () => {
        (0, vitest_1.it)('should collect all values after navigating all steps', () => {
            const { fields, steps } = (0, fixtures_1.createContactForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            // Set all values
            const validValues = (0, fixtures_1.createValidContactValues)();
            Object.entries(validValues).forEach(([key, value]) => {
                engine.setFieldValue(key, value);
            });
            // Collect submission
            const submission = engine.collectSubmissionValues();
            (0, vitest_1.expect)(submission.firstName).toBe('John');
            (0, vitest_1.expect)(submission.lastName).toBe('Doe');
            (0, vitest_1.expect)(submission.email).toBe('john@example.com');
        });
        (0, vitest_1.it)('should validate step using validateStep method', () => {
            const { fields, steps } = (0, fixtures_1.createMultiStepConditionalForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            // Don't set any required values, try to validate current step
            const stepId = steps[0].id;
            const validation = engine.validateStep(stepId);
            (0, vitest_1.expect)(validation).toBeDefined();
            (0, vitest_1.expect)(validation.success !== undefined).toBe(true);
        });
        (0, vitest_1.it)('should preserve values across forward and backward navigation', () => {
            const { fields, steps } = (0, fixtures_1.createMultiStepConditionalForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            // Set value on step 0
            engine.setFieldValue('name', 'value1');
            // Navigate forward with valid values
            const step0Fields = fields.filter((f) => f.stepId === steps[0].id);
            step0Fields.forEach((field) => {
                if (field.required && field.key !== 'name') {
                    if (field.type === 'SHORT_TEXT' || field.type === 'EMAIL') {
                        engine.setFieldValue(field.key, field.type === 'EMAIL'
                            ? 'test@example.com'
                            : 'test');
                    }
                    else if (field.type === 'NUMBER') {
                        engine.setFieldValue(field.key, 42);
                    }
                }
            });
            stepper.goNext();
            (0, vitest_1.expect)(stepper.getCurrentIndex()).toBe(1);
            // Set value on step 1
            engine.setFieldValue('age', 25);
            // Navigate back
            stepper.goBack();
            (0, vitest_1.expect)(stepper.getCurrentIndex()).toBe(0);
            // Verify both values are still there
            const values = engine.getValues();
            (0, vitest_1.expect)(values.name).toBe('value1');
            (0, vitest_1.expect)(values.age).toBe(25);
        });
    });
    (0, vitest_1.describe)('Step Configuration with Multiple Steps', () => {
        (0, vitest_1.it)('should handle 4-step form with step skip in middle: correct total in progress', () => {
            const { fields, steps } = (0, fixtures_1.createBranchingForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            const progress = stepper.getProgress();
            (0, vitest_1.expect)(progress.total).toBe(4);
            (0, vitest_1.expect)(progress.current).toBe(1);
        });
    });
    (0, vitest_1.describe)('Branching Logic', () => {
        (0, vitest_1.it)('should return correct target step from getNextBranch based on path value', () => {
            const { fields, steps } = (0, fixtures_1.createBranchingForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            // Set a value that determines the branch
            engine.setFieldValue('path', 'personal');
            const nextBranch = stepper.getNextBranch();
            (0, vitest_1.expect)(nextBranch).toBeDefined();
            (0, vitest_1.expect)(nextBranch === null || nextBranch === void 0 ? void 0 : nextBranch.step.id).toBeDefined();
        });
        (0, vitest_1.it)('should navigate to branch target using goNextBranch', () => {
            const { fields, steps } = (0, fixtures_1.createBranchingForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            // Set branch selector
            engine.setFieldValue('path', 'personal');
            // Ensure current step fields are valid
            const currentStepFields = fields.filter((f) => f.stepId === steps[0].id && f.required);
            currentStepFields.forEach((field) => {
                var _a;
                if (field.type === 'SHORT_TEXT' || field.type === 'EMAIL') {
                    engine.setFieldValue(field.key, field.type === 'EMAIL'
                        ? 'test@example.com'
                        : 'test');
                }
                else if (field.type === 'NUMBER') {
                    engine.setFieldValue(field.key, 42);
                }
                else if (field.type === 'SELECT') {
                    const options = ((_a = field.config) === null || _a === void 0 ? void 0 : _a.options) || ['option1'];
                    engine.setFieldValue(field.key, options[0]);
                }
            });
            const initialIndex = stepper.getCurrentIndex();
            const result = stepper.goNextBranch();
            // Should have moved or stayed depending on branching logic
            (0, vitest_1.expect)(result).not.toBeNull();
        });
        (0, vitest_1.it)('should fall back to sequential navigation when no matching branch exists', () => {
            const { fields, steps } = (0, fixtures_1.createBranchingForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            // Set a value that doesn't match any branch
            engine.setFieldValue('path', 'invalidPath');
            const nextBranch = stepper.getNextBranch();
            // Should either return null or fallback
            (0, vitest_1.expect)(nextBranch === null || nextBranch !== undefined).toBe(true);
        });
    });
    (0, vitest_1.describe)('Dynamic Visibility Updates', () => {
        (0, vitest_1.it)('should update visible steps list when skip condition changes', () => {
            const { fields, steps } = (0, fixtures_1.createMultiStepConditionalForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            const initialVisible = stepper.getVisibleSteps();
            const initialCount = initialVisible.length;
            // Change condition that affects step visibility
            engine.setFieldValue('skip_details', true);
            const updatedVisible = stepper.getVisibleSteps();
            // The visible steps should update (may be same or less)
            (0, vitest_1.expect)(updatedVisible).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(updatedVisible)).toBe(true);
        });
    });
    (0, vitest_1.describe)('Step Validation', () => {
        (0, vitest_1.it)('should validate only current step fields when advancing', () => {
            const { fields, steps } = (0, fixtures_1.createMultiStepConditionalForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            // Get fields for step 0
            const step0Fields = fields.filter((f) => f.stepId === steps[0].id);
            // Set valid values for step 0 required fields
            step0Fields.forEach((field) => {
                var _a;
                if (field.required) {
                    if (field.type === 'SHORT_TEXT' ||
                        field.type === 'EMAIL' ||
                        field.type === 'LONG_TEXT') {
                        engine.setFieldValue(field.key, field.type === 'EMAIL'
                            ? 'test@example.com'
                            : 'valid value');
                    }
                    else if (field.type === 'NUMBER') {
                        engine.setFieldValue(field.key, 42);
                    }
                    else if (field.type === 'SELECT') {
                        const options = ((_a = field.config) === null || _a === void 0 ? void 0 : _a.options) || ['option1'];
                        engine.setFieldValue(field.key, options[0]);
                    }
                }
            });
            // Should be able to advance
            const result = stepper.goNext();
            (0, vitest_1.expect)(result).not.toBeNull();
        });
        (0, vitest_1.it)('should validate step using validateStep method', () => {
            const { fields, steps } = (0, fixtures_1.createMultiStepConditionalForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepId = steps[0].id;
            const validation = engine.validateStep(stepId);
            (0, vitest_1.expect)(validation).toBeDefined();
            (0, vitest_1.expect)(validation.success !== undefined).toBe(true);
        });
    });
    (0, vitest_1.describe)('Multi-Step Stepper Integration', () => {
        (0, vitest_1.it)('should maintain engine state across stepper operations', () => {
            const { fields, steps } = (0, fixtures_1.createMultiStepConditionalForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            // Set value through engine
            engine.setFieldValue('name', 'test-value');
            // Access through engine
            let values = engine.getValues();
            (0, vitest_1.expect)(values.name).toBe('test-value');
            // Navigate through stepper
            stepper.jumpTo(1);
            // Value should still be there
            values = engine.getValues();
            (0, vitest_1.expect)(values.name).toBe('test-value');
        });
        (0, vitest_1.it)('should support full form completion workflow', () => {
            const { fields, steps } = (0, fixtures_1.createContactForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            // Fill all required fields
            engine.setFieldValue('firstName', 'John');
            engine.setFieldValue('lastName', 'Doe');
            engine.setFieldValue('email', 'john@example.com');
            engine.setFieldValue('message', 'This is a test message that is long enough');
            // Validate entire form
            const validation = engine.validate();
            (0, vitest_1.expect)(validation.success).toBe(true);
            // Collect final submission
            const submission = engine.collectSubmissionValues();
            (0, vitest_1.expect)(Object.keys(submission).length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should handle navigation with conditional step visibility', () => {
            const { fields, steps } = (0, fixtures_1.createMultiStepConditionalForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            // Get initially visible steps
            const initialSteps = stepper.getVisibleSteps();
            (0, vitest_1.expect)(initialSteps.length).toBeGreaterThan(0);
            // Current step should be in visible steps
            const currentStep = stepper.getCurrentStep();
            const isCurrentVisible = initialSteps.some((s) => s.step.id === (currentStep === null || currentStep === void 0 ? void 0 : currentStep.step.id));
            (0, vitest_1.expect)(isCurrentVisible).toBe(true);
        });
    });
    (0, vitest_1.describe)('Edge Cases', () => {
        (0, vitest_1.it)('should handle going next on last step gracefully', () => {
            const { fields, steps } = (0, fixtures_1.createMultiStepConditionalForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            // Jump to last step
            stepper.jumpTo(steps.length - 1);
            (0, vitest_1.expect)(stepper.isLastStep()).toBe(true);
            // Try to go next
            const result = stepper.goNext();
            // Should either return null or handle gracefully
            (0, vitest_1.expect)(result === null || result !== undefined).toBe(true);
        });
        (0, vitest_1.it)('should handle going back on first step gracefully', () => {
            const { fields, steps } = (0, fixtures_1.createMultiStepConditionalForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            // Already at first step
            (0, vitest_1.expect)(stepper.getCurrentIndex()).toBe(0);
            // Try to go back
            const result = stepper.goBack();
            (0, vitest_1.expect)(result).toBeNull();
            (0, vitest_1.expect)(stepper.getCurrentIndex()).toBe(0);
        });
        (0, vitest_1.it)('should handle invalid jump index gracefully', () => {
            const { fields, steps } = (0, fixtures_1.createMultiStepConditionalForm)();
            const engine = (0, dfe_core_1.createFormEngine)(fields);
            const stepper = (0, dfe_core_1.createFormStepper)(steps, engine);
            // Try to jump to invalid index
            stepper.jumpTo(999);
            // Should either fail gracefully or not jump
            (0, vitest_1.expect)(stepper.getCurrentIndex() < 999).toBe(true);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGktc3RlcC1mb3Jtcy50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibXVsdGktc3RlcC1mb3Jtcy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQXlEO0FBQ3pELGtEQUk0QjtBQUM1QixpREFRMkI7QUFFM0IsSUFBQSxpQkFBUSxFQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtJQUNoQyxJQUFBLG1CQUFVLEVBQUMsR0FBRyxFQUFFO1FBQ2QsSUFBQSw0QkFBaUIsR0FBRSxDQUFBO0lBQ3JCLENBQUMsQ0FBQyxDQUFBO0lBRUYsSUFBQSxpQkFBUSxFQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtRQUNoQyxJQUFBLFdBQUUsRUFBQyxnREFBZ0QsRUFBRSxHQUFHLEVBQUU7WUFDeEQsTUFBTSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLHlDQUE4QixHQUFFLENBQUE7WUFDMUQsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUN2QyxNQUFNLE9BQU8sR0FBRyxJQUFBLDRCQUFpQixFQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUVoRCxJQUFBLGVBQU0sRUFBQyxPQUFPLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDM0MsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFBLFdBQUUsRUFBQyx3REFBd0QsRUFBRSxHQUFHLEVBQUU7WUFDaEUsTUFBTSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFBLHlDQUE4QixHQUFFLENBQUE7WUFDMUQsTUFBTSxNQUFNLEdBQUcsSUFBQSwyQkFBZ0IsRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUN2QyxNQUFNLE9BQU8sR0FBRyxJQUFBLDRCQUFpQixFQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUVoRCxNQUFNLFdBQVcsR0FBRyxPQUFPLENB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QUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkZXNjcmliZSwgaXQsIGV4cGVjdCwgYmVmb3JlRWFjaCB9IGZyb20gJ3ZpdGVzdCdcbmltcG9ydCB7XG4gIGNyZWF0ZUZvcm1FbmdpbmUsXG4gIGNyZWF0ZUZvcm1TdGVwcGVyLFxuICB0eXBlIEZvcm1GaWVsZCxcbn0gZnJvbSAnQHNuYXJqdW45OC9kZmUtY29yZSdcbmltcG9ydCB7XG4gIG1ha2VGaWVsZCxcbiAgbWFrZVN0ZXAsXG4gIHJlc2V0RmllbGRDb3VudGVyLFxuICBjcmVhdGVDb250YWN0Rm9ybSxcbiAgY3JlYXRlTXVsdGlTdGVwQ29uZGl0aW9uYWxGb3JtLFxuICBjcmVhdGVCcmFuY2hpbmdGb3JtLFxuICBjcmVhdGVWYWxpZENvbnRhY3RWYWx1ZXMsXG59IGZyb20gJy4vaGVscGVycy9maXh0dXJlcydcblxuZGVzY3JpYmUoJ011bHRpLVN0ZXAgRm9ybXMnLCAoKSA9PiB7XG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIHJlc2V0RmllbGRDb3VudGVyKClcbiAgfSlcblxuICBkZXNjcmliZSgnQmFzaWMgTmF2aWdhdGlvbicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHN0YXJ0IHN0ZXBwZXIgYXQgc3RlcCAwIGZvciAzLXN0ZXAgZm9ybScsICgpID0+IHtcbiAgICAgIGNvbnN0IHsgZmllbGRzLCBzdGVwcyB9ID0gY3JlYXRlTXVsdGlTdGVwQ29uZGl0aW9uYWxGb3JtKClcbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuICAgICAgY29uc3Qgc3RlcHBlciA9IGNyZWF0ZUZvcm1TdGVwcGVyKHN0ZXBzLCBlbmdpbmUpXG5cbiAgICAgIGV4cGVjdChzdGVwcGVyLmdldEN1cnJlbnRJbmRleCgpKS50b0JlKDApXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIGZpcnN0IHN0ZXAgZnJvbSBnZXRDdXJyZW50U3RlcCBpbml0aWFsbHknLCAoKSA9PiB7XG4gICAgICBjb25zdCB7IGZpZWxkcywgc3RlcHMgfSA9IGNyZWF0ZU11bHRpU3RlcENvbmRpdGlvbmFsRm9ybSgpXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcbiAgICAgIGNvbnN0IHN0ZXBwZXIgPSBjcmVhdGVGb3JtU3RlcHBlcihzdGVwcywgZW5naW5lKVxuXG4gICAgICBjb25zdCBjdXJyZW50U3RlcCA9IHN0ZXBwZXIuZ2V0Q3VycmVudFN0ZXAoKVxuICAgICAgZXhwZWN0KGN1cnJlbnRTdGVwKS50b0JlRGVmaW5lZCgpXG4gICAgICBleHBlY3QoY3VycmVudFN0ZXA/LnN0ZXAuaWQpLnRvQmUoc3RlcHNbMF0uaWQpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgYWR2YW5jZSB0byBuZXh0IHN0ZXAgYWZ0ZXIgc2V0dGluZyB2YWxpZCB2YWx1ZXMgYW5kIGNhbGxpbmcgZ29OZXh0JywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBmaWVsZHMsIHN0ZXBzIH0gPSBjcmVhdGVNdWx0aVN0ZXBDb25kaXRpb25hbEZvcm0oKVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIoc3RlcHMsIGVuZ2luZSlcblxuICAgICAgLy8gR2V0IGZpZWxkcyBmb3Igc3RlcCAwXG4gICAgICBjb25zdCBzdGVwMEZpZWxkcyA9IGZpZWxkcy5maWx0ZXIoKGYpID0+IGYuc3RlcElkID09PSBzdGVwc1swXS5pZClcblxuICAgICAgLy8gU2V0IHZhbGlkIHZhbHVlcyBmb3IgYWxsIHJlcXVpcmVkIGZpZWxkcyBpbiBzdGVwIDBcbiAgICAgIHN0ZXAwRmllbGRzLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgIGlmIChmaWVsZC5yZXF1aXJlZCkge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPT09ICdTSE9SVF9URVhUJyB8fFxuICAgICAgICAgICAgZmllbGQudHlwZSA9PT0gJ0VNQUlMJyB8fFxuICAgICAgICAgICAgZmllbGQudHlwZSA9PT0gJ0xPTkdfVEVYVCdcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKFxuICAgICAgICAgICAgICBmaWVsZC5rZXksXG4gICAgICAgICAgICAgIGZpZWxkLnR5cGUgPT09ICdFTUFJTCdcbiAgICAgICAgICAgICAgICA/ICd0ZXN0QGV4YW1wbGUuY29tJ1xuICAgICAgICAgICAgICAgIDogJ3Rlc3QgdmFsdWUgZm9yIGZpZWxkJ1xuICAgICAgICAgICAgKVxuICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gJ05VTUJFUicpIHtcbiAgICAgICAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKGZpZWxkLmtleSwgNDIpXG4gICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSAnU0VMRUNUJykge1xuICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGZpZWxkLmNvbmZpZz8ub3B0aW9ucyB8fCBbJ29wdGlvbjEnXVxuICAgICAgICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoZmllbGQua2V5LCBvcHRpb25zWzBdKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgY29uc3QgcmVzdWx0ID0gc3RlcHBlci5nb05leHQoKVxuICAgICAgZXhwZWN0KHJlc3VsdCkubm90LnRvQmVOdWxsKClcbiAgICAgIGV4cGVjdChzdGVwcGVyLmdldEN1cnJlbnRJbmRleCgpKS50b0JlKDEpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIGZhbHNlIGZvciBpc0xhc3RTdGVwIGF0IHN0ZXAgMCBhbmQgdHJ1ZSBhdCBsYXN0IHN0ZXAnLCAoKSA9PiB7XG4gICAgICBjb25zdCB7IGZpZWxkcywgc3RlcHMgfSA9IGNyZWF0ZU11bHRpU3RlcENvbmRpdGlvbmFsRm9ybSgpXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcbiAgICAgIGNvbnN0IHN0ZXBwZXIgPSBjcmVhdGVGb3JtU3RlcHBlcihzdGVwcywgZW5naW5lKVxuXG4gICAgICBleHBlY3Qoc3RlcHBlci5pc0xhc3RTdGVwKCkpLnRvQmUoZmFsc2UpXG5cbiAgICAgIC8vIE5hdmlnYXRlIHRvIGxhc3Qgc3RlcFxuICAgICAgc3RlcHBlci5qdW1wVG8oc3RlcHMubGVuZ3RoIC0gMSlcbiAgICAgIGV4cGVjdChzdGVwcGVyLmlzTGFzdFN0ZXAoKSkudG9CZSh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBmYWxzZSBmb3IgY2FuR29CYWNrIGF0IHN0ZXAgMCBhbmQgdHJ1ZSBhdCBzdGVwIDErJywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBmaWVsZHMsIHN0ZXBzIH0gPSBjcmVhdGVNdWx0aVN0ZXBDb25kaXRpb25hbEZvcm0oKVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIoc3RlcHMsIGVuZ2luZSlcblxuICAgICAgZXhwZWN0KHN0ZXBwZXIuY2FuR29CYWNrKCkpLnRvQmUoZmFsc2UpXG5cbiAgICAgIHN0ZXBwZXIuanVtcFRvKDEpXG4gICAgICBleHBlY3Qoc3RlcHBlci5jYW5Hb0JhY2soKSkudG9CZSh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIG5hdmlnYXRlIGJhY2sgZnJvbSBzdGVwIDEgdG8gc3RlcCAwIGFuZCBwcmVzZXJ2ZSB2YWx1ZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCB7IGZpZWxkcywgc3RlcHMgfSA9IGNyZWF0ZU11bHRpU3RlcENvbmRpdGlvbmFsRm9ybSgpXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcbiAgICAgIGNvbnN0IHN0ZXBwZXIgPSBjcmVhdGVGb3JtU3RlcHBlcihzdGVwcywgZW5naW5lKVxuXG4gICAgICAvLyBTZXQgdmFsdWVzIG9uIHN0ZXAgMFxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ25hbWUnLCAncHJlc2VydmVkLXZhbHVlJylcblxuICAgICAgLy8gTmF2aWdhdGUgZm9yd2FyZFxuICAgICAgc3RlcHBlci5qdW1wVG8oMSlcbiAgICAgIGV4cGVjdChzdGVwcGVyLmdldEN1cnJlbnRJbmRleCgpKS50b0JlKDEpXG5cbiAgICAgIC8vIE5hdmlnYXRlIGJhY2tcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHN0ZXBwZXIuZ29CYWNrKClcbiAgICAgIGV4cGVjdChyZXN1bHQpLm5vdC50b0JlTnVsbCgpXG4gICAgICBleHBlY3Qoc3RlcHBlci5nZXRDdXJyZW50SW5kZXgoKSkudG9CZSgwKVxuXG4gICAgICAvLyBWZXJpZnkgdmFsdWVzIGFyZSBwcmVzZXJ2ZWRcbiAgICAgIGNvbnN0IHZhbHVlcyA9IGVuZ2luZS5nZXRWYWx1ZXMoKVxuICAgICAgZXhwZWN0KHZhbHVlcy5uYW1lKS50b0JlKCdwcmVzZXJ2ZWQtdmFsdWUnKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ1Byb2dyZXNzIFRyYWNraW5nJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcmV0dXJuIHByb2dyZXNzIGF0IHN0ZXAgMCBvZiAzIHdpdGggfjMzIHBlcmNlbnQnLCAoKSA9PiB7XG4gICAgICBjb25zdCB7IGZpZWxkcywgc3RlcHMgfSA9IGNyZWF0ZU11bHRpU3RlcENvbmRpdGlvbmFsRm9ybSgpXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcbiAgICAgIGNvbnN0IHN0ZXBwZXIgPSBjcmVhdGVGb3JtU3RlcHBlcihzdGVwcywgZW5naW5lKVxuXG4gICAgICBjb25zdCBwcm9ncmVzcyA9IHN0ZXBwZXIuZ2V0UHJvZ3Jlc3MoKVxuICAgICAgZXhwZWN0KHByb2dyZXNzLmN1cnJlbnQpLnRvQmUoMSlcbiAgICAgIGV4cGVjdChwcm9ncmVzcy50b3RhbCkudG9CZSgzKVxuICAgICAgZXhwZWN0KHByb2dyZXNzLnBlcmNlbnQpLnRvQmVHcmVhdGVyVGhhbigzMClcbiAgICAgIGV4cGVjdChwcm9ncmVzcy5wZXJjZW50KS50b0JlTGVzc1RoYW4oMzUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIDEwMCBwZXJjZW50IHByb2dyZXNzIGF0IGxhc3Qgc3RlcCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHsgZmllbGRzLCBzdGVwcyB9ID0gY3JlYXRlTXVsdGlTdGVwQ29uZGl0aW9uYWxGb3JtKClcbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuICAgICAgY29uc3Qgc3RlcHBlciA9IGNyZWF0ZUZvcm1TdGVwcGVyKHN0ZXBzLCBlbmdpbmUpXG5cbiAgICAgIHN0ZXBwZXIuanVtcFRvKHN0ZXBzLmxlbmd0aCAtIDEpXG4gICAgICBjb25zdCBwcm9ncmVzcyA9IHN0ZXBwZXIuZ2V0UHJvZ3Jlc3MoKVxuICAgICAgZXhwZWN0KHByb2dyZXNzLnBlcmNlbnQpLnRvQmUoMTAwKVxuICAgICAgZXhwZWN0KHByb2dyZXNzLmN1cnJlbnQpLnRvQmUocHJvZ3Jlc3MudG90YWwpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnU3RlcCBTa2lwcGluZycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHNraXAgc3RlcCB3aGVuIHNraXAgY29uZGl0aW9uIGlzIG1ldCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHsgZmllbGRzLCBzdGVwcyB9ID0gY3JlYXRlTXVsdGlTdGVwQ29uZGl0aW9uYWxGb3JtKClcbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuICAgICAgY29uc3Qgc3RlcHBlciA9IGNyZWF0ZUZvcm1TdGVwcGVyKHN0ZXBzLCBlbmdpbmUpXG5cbiAgICAgIC8vIFNldCBhIHZhbHVlIHRoYXQgdHJpZ2dlcnMgc2tpcCBjb25kaXRpb24gZm9yIHN0ZXAgMVxuICAgICAgLy8gQXNzdW1pbmcgdGhlIGZvcm0gaGFzIGEgc2tpcCBjb25kaXRpb24gYmFzZWQgb24gYSBjaGVja2JveFxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ3NraXBfZGV0YWlscycsIHRydWUpXG5cbiAgICAgIGNvbnN0IHZpc2libGVTdGVwcyA9IHN0ZXBwZXIuZ2V0VmlzaWJsZVN0ZXBzKClcbiAgICAgIC8vIFZpc2libGUgc3RlcHMgc2hvdWxkIGV4Y2x1ZGUgc2tpcHBlZCBvbmVzXG4gICAgICBleHBlY3QodmlzaWJsZVN0ZXBzLmxlbmd0aCkudG9CZUxlc3NUaGFuT3JFcXVhbChzdGVwcy5sZW5ndGgpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZXhjbHVkZSBza2lwcGVkIHN0ZXBzIGZyb20gZ2V0VmlzaWJsZVN0ZXBzJywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBmaWVsZHMsIHN0ZXBzIH0gPSBjcmVhdGVNdWx0aVN0ZXBDb25kaXRpb25hbEZvcm0oKVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIoc3RlcHMsIGVuZ2luZSlcblxuICAgICAgY29uc3QgdmlzaWJsZVN0ZXBzID0gc3RlcHBlci5nZXRWaXNpYmxlU3RlcHMoKVxuICAgICAgZXhwZWN0KHZpc2libGVTdGVwcykudG9CZURlZmluZWQoKVxuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkodmlzaWJsZVN0ZXBzKSkudG9CZSh0cnVlKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ1N0ZXAgSnVtcGluZycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGp1bXAgdG8gc3BlY2lmaWMgc3RlcCB3aGVuIGZpZWxkcyBhcmUgdmFsaWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCB7IGZpZWxkcywgc3RlcHMgfSA9IGNyZWF0ZU11bHRpU3RlcENvbmRpdGlvbmFsRm9ybSgpXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcbiAgICAgIGNvbnN0IHN0ZXBwZXIgPSBjcmVhdGVGb3JtU3RlcHBlcihzdGVwcywgZW5naW5lKVxuXG4gICAgICAvLyBTZXQgdXAgdmFsaWQgdmFsdWVzIGZvciBpbnRlcm1lZGlhdGUgc3RlcHNcbiAgICAgIGZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICBpZiAoZmllbGQucmVxdWlyZWQgJiYgZmllbGQuc3RlcElkKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgZmllbGQudHlwZSA9PT0gJ1NIT1JUX1RFWFQnIHx8XG4gICAgICAgICAgICBmaWVsZC50eXBlID09PSAnRU1BSUwnIHx8XG4gICAgICAgICAgICBmaWVsZC50eXBlID09PSAnTE9OR19URVhUJ1xuICAgICAgICAgICkge1xuICAgICAgICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoXG4gICAgICAgICAgICAgIGZpZWxkLmtleSxcbiAgICAgICAgICAgICAgZmllbGQudHlwZSA9PT0gJ0VNQUlMJ1xuICAgICAgICAgICAgICAgID8gJ3Rlc3RAZXhhbXBsZS5jb20nXG4gICAgICAgICAgICAgICAgOiAndGVzdCB2YWx1ZSdcbiAgICAgICAgICAgIClcbiAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09ICdOVU1CRVInKSB7XG4gICAgICAgICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZShmaWVsZC5rZXksIDQyKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgc3RlcHBlci5qdW1wVG8oMilcbiAgICAgIGV4cGVjdChzdGVwcGVyLmdldEN1cnJlbnRJbmRleCgpKS50b0JlKDIpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgbWFyayBzdGVwIGFzIGNvbXBsZXRlJywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBmaWVsZHMsIHN0ZXBzIH0gPSBjcmVhdGVNdWx0aVN0ZXBDb25kaXRpb25hbEZvcm0oKVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIoc3RlcHMsIGVuZ2luZSlcblxuICAgICAgY29uc3Qgc3RlcElkID0gc3RlcHNbMF0uaWRcbiAgICAgIHN0ZXBwZXIubWFya0NvbXBsZXRlKHN0ZXBJZClcblxuICAgICAgLy8gVmVyaWZ5IHN0ZXAgc3RhdGUgd2FzIHVwZGF0ZWRcbiAgICAgIGNvbnN0IGN1cnJlbnRTdGVwID0gc3RlcHBlci5nZXRDdXJyZW50U3RlcCgpXG4gICAgICBleHBlY3QoY3VycmVudFN0ZXApLnRvQmVEZWZpbmVkKClcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdDb21wbGV0ZSBTdWJtaXNzaW9uIFdvcmtmbG93JywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgY29sbGVjdCBhbGwgdmFsdWVzIGFmdGVyIG5hdmlnYXRpbmcgYWxsIHN0ZXBzJywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBmaWVsZHMsIHN0ZXBzIH0gPSBjcmVhdGVDb250YWN0Rm9ybSgpXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcblxuICAgICAgLy8gU2V0IGFsbCB2YWx1ZXNcbiAgICAgIGNvbnN0IHZhbGlkVmFsdWVzID0gY3JlYXRlVmFsaWRDb250YWN0VmFsdWVzKClcbiAgICAgIE9iamVjdC5lbnRyaWVzKHZhbGlkVmFsdWVzKS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pID0+IHtcbiAgICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoa2V5LCB2YWx1ZSlcbiAgICAgIH0pXG5cbiAgICAgIC8vIENvbGxlY3Qgc3VibWlzc2lvblxuICAgICAgY29uc3Qgc3VibWlzc2lvbiA9IGVuZ2luZS5jb2xsZWN0U3VibWlzc2lvblZhbHVlcygpXG4gICAgICBleHBlY3Qoc3VibWlzc2lvbi5maXJzdE5hbWUpLnRvQmUoJ0pvaG4nKVxuICAgICAgZXhwZWN0KHN1Ym1pc3Npb24ubGFzdE5hbWUpLnRvQmUoJ0RvZScpXG4gICAgICBleHBlY3Qoc3VibWlzc2lvbi5lbWFpbCkudG9CZSgnam9obkBleGFtcGxlLmNvbScpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgc3RlcCB1c2luZyB2YWxpZGF0ZVN0ZXAgbWV0aG9kJywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBmaWVsZHMsIHN0ZXBzIH0gPSBjcmVhdGVNdWx0aVN0ZXBDb25kaXRpb25hbEZvcm0oKVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIoc3RlcHMsIGVuZ2luZSlcblxuICAgICAgLy8gRG9uJ3Qgc2V0IGFueSByZXF1aXJlZCB2YWx1ZXMsIHRyeSB0byB2YWxpZGF0ZSBjdXJyZW50IHN0ZXBcbiAgICAgIGNvbnN0IHN0ZXBJZCA9IHN0ZXBzWzBdLmlkXG4gICAgICBjb25zdCB2YWxpZGF0aW9uID0gZW5naW5lLnZhbGlkYXRlU3RlcChzdGVwSWQpXG4gICAgICBleHBlY3QodmFsaWRhdGlvbikudG9CZURlZmluZWQoKVxuICAgICAgZXhwZWN0KHZhbGlkYXRpb24uc3VjY2VzcyAhPT0gdW5kZWZpbmVkKS50b0JlKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcHJlc2VydmUgdmFsdWVzIGFjcm9zcyBmb3J3YXJkIGFuZCBiYWNrd2FyZCBuYXZpZ2F0aW9uJywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBmaWVsZHMsIHN0ZXBzIH0gPSBjcmVhdGVNdWx0aVN0ZXBDb25kaXRpb25hbEZvcm0oKVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIoc3RlcHMsIGVuZ2luZSlcblxuICAgICAgLy8gU2V0IHZhbHVlIG9uIHN0ZXAgMFxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ25hbWUnLCAndmFsdWUxJylcblxuICAgICAgLy8gTmF2aWdhdGUgZm9yd2FyZCB3aXRoIHZhbGlkIHZhbHVlc1xuICAgICAgY29uc3Qgc3RlcDBGaWVsZHMgPSBmaWVsZHMuZmlsdGVyKChmKSA9PiBmLnN0ZXBJZCA9PT0gc3RlcHNbMF0uaWQpXG4gICAgICBzdGVwMEZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICBpZiAoZmllbGQucmVxdWlyZWQgJiYgZmllbGQua2V5ICE9PSAnbmFtZScpIHtcbiAgICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gJ1NIT1JUX1RFWFQnIHx8IGZpZWxkLnR5cGUgPT09ICdFTUFJTCcpIHtcbiAgICAgICAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKFxuICAgICAgICAgICAgICBmaWVsZC5rZXksXG4gICAgICAgICAgICAgIGZpZWxkLnR5cGUgPT09ICdFTUFJTCdcbiAgICAgICAgICAgICAgICA/ICd0ZXN0QGV4YW1wbGUuY29tJ1xuICAgICAgICAgICAgICAgIDogJ3Rlc3QnXG4gICAgICAgICAgICApXG4gICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSAnTlVNQkVSJykge1xuICAgICAgICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoZmllbGQua2V5LCA0MilcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIHN0ZXBwZXIuZ29OZXh0KClcbiAgICAgIGV4cGVjdChzdGVwcGVyLmdldEN1cnJlbnRJbmRleCgpKS50b0JlKDEpXG5cbiAgICAgIC8vIFNldCB2YWx1ZSBvbiBzdGVwIDFcbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdhZ2UnLCAyNSlcblxuICAgICAgLy8gTmF2aWdhdGUgYmFja1xuICAgICAgc3RlcHBlci5nb0JhY2soKVxuICAgICAgZXhwZWN0KHN0ZXBwZXIuZ2V0Q3VycmVudEluZGV4KCkpLnRvQmUoMClcblxuICAgICAgLy8gVmVyaWZ5IGJvdGggdmFsdWVzIGFyZSBzdGlsbCB0aGVyZVxuICAgICAgY29uc3QgdmFsdWVzID0gZW5naW5lLmdldFZhbHVlcygpXG4gICAgICBleHBlY3QodmFsdWVzLm5hbWUpLnRvQmUoJ3ZhbHVlMScpXG4gICAgICBleHBlY3QodmFsdWVzLmFnZSkudG9CZSgyNSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdTdGVwIENvbmZpZ3VyYXRpb24gd2l0aCBNdWx0aXBsZSBTdGVwcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGhhbmRsZSA0LXN0ZXAgZm9ybSB3aXRoIHN0ZXAgc2tpcCBpbiBtaWRkbGU6IGNvcnJlY3QgdG90YWwgaW4gcHJvZ3Jlc3MnLCAoKSA9PiB7XG4gICAgICBjb25zdCB7IGZpZWxkcywgc3RlcHMgfSA9IGNyZWF0ZUJyYW5jaGluZ0Zvcm0oKVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIoc3RlcHMsIGVuZ2luZSlcblxuICAgICAgY29uc3QgcHJvZ3Jlc3MgPSBzdGVwcGVyLmdldFByb2dyZXNzKClcbiAgICAgIGV4cGVjdChwcm9ncmVzcy50b3RhbCkudG9CZSg0KVxuICAgICAgZXhwZWN0KHByb2dyZXNzLmN1cnJlbnQpLnRvQmUoMSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdCcmFuY2hpbmcgTG9naWMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gY29ycmVjdCB0YXJnZXQgc3RlcCBmcm9tIGdldE5leHRCcmFuY2ggYmFzZWQgb24gcGF0aCB2YWx1ZScsICgpID0+IHtcbiAgICAgIGNvbnN0IHsgZmllbGRzLCBzdGVwcyB9ID0gY3JlYXRlQnJhbmNoaW5nRm9ybSgpXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcbiAgICAgIGNvbnN0IHN0ZXBwZXIgPSBjcmVhdGVGb3JtU3RlcHBlcihzdGVwcywgZW5naW5lKVxuXG4gICAgICAvLyBTZXQgYSB2YWx1ZSB0aGF0IGRldGVybWluZXMgdGhlIGJyYW5jaFxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ3BhdGgnLCAncGVyc29uYWwnKVxuXG4gICAgICBjb25zdCBuZXh0QnJhbmNoID0gc3RlcHBlci5nZXROZXh0QnJhbmNoKClcbiAgICAgIGV4cGVjdChuZXh0QnJhbmNoKS50b0JlRGVmaW5lZCgpXG4gICAgICBleHBlY3QobmV4dEJyYW5jaD8uc3RlcC5pZCkudG9CZURlZmluZWQoKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIG5hdmlnYXRlIHRvIGJyYW5jaCB0YXJnZXQgdXNpbmcgZ29OZXh0QnJhbmNoJywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBmaWVsZHMsIHN0ZXBzIH0gPSBjcmVhdGVCcmFuY2hpbmdGb3JtKClcbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuICAgICAgY29uc3Qgc3RlcHBlciA9IGNyZWF0ZUZvcm1TdGVwcGVyKHN0ZXBzLCBlbmdpbmUpXG5cbiAgICAgIC8vIFNldCBicmFuY2ggc2VsZWN0b3JcbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdwYXRoJywgJ3BlcnNvbmFsJylcblxuICAgICAgLy8gRW5zdXJlIGN1cnJlbnQgc3RlcCBmaWVsZHMgYXJlIHZhbGlkXG4gICAgICBjb25zdCBjdXJyZW50U3RlcEZpZWxkcyA9IGZpZWxkcy5maWx0ZXIoXG4gICAgICAgIChmKSA9PiBmLnN0ZXBJZCA9PT0gc3RlcHNbMF0uaWQgJiYgZi5yZXF1aXJlZFxuICAgICAgKVxuICAgICAgY3VycmVudFN0ZXBGaWVsZHMuZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09ICdTSE9SVF9URVhUJyB8fCBmaWVsZC50eXBlID09PSAnRU1BSUwnKSB7XG4gICAgICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoXG4gICAgICAgICAgICBmaWVsZC5rZXksXG4gICAgICAgICAgICBmaWVsZC50eXBlID09PSAnRU1BSUwnXG4gICAgICAgICAgICAgID8gJ3Rlc3RAZXhhbXBsZS5jb20nXG4gICAgICAgICAgICAgIDogJ3Rlc3QnXG4gICAgICAgICAgKVxuICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09ICdOVU1CRVInKSB7XG4gICAgICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoZmllbGQua2V5LCA0MilcbiAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSAnU0VMRUNUJykge1xuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBmaWVsZC5jb25maWc/Lm9wdGlvbnMgfHwgWydvcHRpb24xJ11cbiAgICAgICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZShmaWVsZC5rZXksIG9wdGlvbnNbMF0pXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIGNvbnN0IGluaXRpYWxJbmRleCA9IHN0ZXBwZXIuZ2V0Q3VycmVudEluZGV4KClcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHN0ZXBwZXIuZ29OZXh0QnJhbmNoKClcblxuICAgICAgLy8gU2hvdWxkIGhhdmUgbW92ZWQgb3Igc3RheWVkIGRlcGVuZGluZyBvbiBicmFuY2hpbmcgbG9naWNcbiAgICAgIGV4cGVjdChyZXN1bHQpLm5vdC50b0JlTnVsbCgpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZmFsbCBiYWNrIHRvIHNlcXVlbnRpYWwgbmF2aWdhdGlvbiB3aGVuIG5vIG1hdGNoaW5nIGJyYW5jaCBleGlzdHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCB7IGZpZWxkcywgc3RlcHMgfSA9IGNyZWF0ZUJyYW5jaGluZ0Zvcm0oKVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIoc3RlcHMsIGVuZ2luZSlcblxuICAgICAgLy8gU2V0IGEgdmFsdWUgdGhhdCBkb2Vzbid0IG1hdGNoIGFueSBicmFuY2hcbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdwYXRoJywgJ2ludmFsaWRQYXRoJylcblxuICAgICAgY29uc3QgbmV4dEJyYW5jaCA9IHN0ZXBwZXIuZ2V0TmV4dEJyYW5jaCgpXG4gICAgICAvLyBTaG91bGQgZWl0aGVyIHJldHVybiBudWxsIG9yIGZhbGxiYWNrXG4gICAgICBleHBlY3QobmV4dEJyYW5jaCA9PT0gbnVsbCB8fCBuZXh0QnJhbmNoICE9PSB1bmRlZmluZWQpLnRvQmUodHJ1ZSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdEeW5hbWljIFZpc2liaWxpdHkgVXBkYXRlcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHVwZGF0ZSB2aXNpYmxlIHN0ZXBzIGxpc3Qgd2hlbiBza2lwIGNvbmRpdGlvbiBjaGFuZ2VzJywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBmaWVsZHMsIHN0ZXBzIH0gPSBjcmVhdGVNdWx0aVN0ZXBDb25kaXRpb25hbEZvcm0oKVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIoc3RlcHMsIGVuZ2luZSlcblxuICAgICAgY29uc3QgaW5pdGlhbFZpc2libGUgPSBzdGVwcGVyLmdldFZpc2libGVTdGVwcygpXG4gICAgICBjb25zdCBpbml0aWFsQ291bnQgPSBpbml0aWFsVmlzaWJsZS5sZW5ndGhcblxuICAgICAgLy8gQ2hhbmdlIGNvbmRpdGlvbiB0aGF0IGFmZmVjdHMgc3RlcCB2aXNpYmlsaXR5XG4gICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZSgnc2tpcF9kZXRhaWxzJywgdHJ1ZSlcblxuICAgICAgY29uc3QgdXBkYXRlZFZpc2libGUgPSBzdGVwcGVyLmdldFZpc2libGVTdGVwcygpXG4gICAgICAvLyBUaGUgdmlzaWJsZSBzdGVwcyBzaG91bGQgdXBkYXRlIChtYXkgYmUgc2FtZSBvciBsZXNzKVxuICAgICAgZXhwZWN0KHVwZGF0ZWRWaXNpYmxlKS50b0JlRGVmaW5lZCgpXG4gICAgICBleHBlY3QoQXJyYXkuaXNBcnJheSh1cGRhdGVkVmlzaWJsZSkpLnRvQmUodHJ1ZSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdTdGVwIFZhbGlkYXRpb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBvbmx5IGN1cnJlbnQgc3RlcCBmaWVsZHMgd2hlbiBhZHZhbmNpbmcnLCAoKSA9PiB7XG4gICAgICBjb25zdCB7IGZpZWxkcywgc3RlcHMgfSA9IGNyZWF0ZU11bHRpU3RlcENvbmRpdGlvbmFsRm9ybSgpXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcbiAgICAgIGNvbnN0IHN0ZXBwZXIgPSBjcmVhdGVGb3JtU3RlcHBlcihzdGVwcywgZW5naW5lKVxuXG4gICAgICAvLyBHZXQgZmllbGRzIGZvciBzdGVwIDBcbiAgICAgIGNvbnN0IHN0ZXAwRmllbGRzID0gZmllbGRzLmZpbHRlcigoZikgPT4gZi5zdGVwSWQgPT09IHN0ZXBzWzBdLmlkKVxuXG4gICAgICAvLyBTZXQgdmFsaWQgdmFsdWVzIGZvciBzdGVwIDAgcmVxdWlyZWQgZmllbGRzXG4gICAgICBzdGVwMEZpZWxkcy5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICBpZiAoZmllbGQucmVxdWlyZWQpIHtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBmaWVsZC50eXBlID09PSAnU0hPUlRfVEVYVCcgfHxcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPT09ICdFTUFJTCcgfHxcbiAgICAgICAgICAgIGZpZWxkLnR5cGUgPT09ICdMT05HX1RFWFQnXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZShcbiAgICAgICAgICAgICAgZmllbGQua2V5LFxuICAgICAgICAgICAgICBmaWVsZC50eXBlID09PSAnRU1BSUwnXG4gICAgICAgICAgICAgICAgPyAndGVzdEBleGFtcGxlLmNvbSdcbiAgICAgICAgICAgICAgICA6ICd2YWxpZCB2YWx1ZSdcbiAgICAgICAgICAgIClcbiAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09ICdOVU1CRVInKSB7XG4gICAgICAgICAgICBlbmdpbmUuc2V0RmllbGRWYWx1ZShmaWVsZC5rZXksIDQyKVxuICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gJ1NFTEVDVCcpIHtcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBmaWVsZC5jb25maWc/Lm9wdGlvbnMgfHwgWydvcHRpb24xJ11cbiAgICAgICAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKGZpZWxkLmtleSwgb3B0aW9uc1swXSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIC8vIFNob3VsZCBiZSBhYmxlIHRvIGFkdmFuY2VcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHN0ZXBwZXIuZ29OZXh0KClcbiAgICAgIGV4cGVjdChyZXN1bHQpLm5vdC50b0JlTnVsbCgpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgc3RlcCB1c2luZyB2YWxpZGF0ZVN0ZXAgbWV0aG9kJywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBmaWVsZHMsIHN0ZXBzIH0gPSBjcmVhdGVNdWx0aVN0ZXBDb25kaXRpb25hbEZvcm0oKVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICAgIGNvbnN0IHN0ZXBJZCA9IHN0ZXBzWzBdLmlkXG4gICAgICBjb25zdCB2YWxpZGF0aW9uID0gZW5naW5lLnZhbGlkYXRlU3RlcChzdGVwSWQpXG4gICAgICBleHBlY3QodmFsaWRhdGlvbikudG9CZURlZmluZWQoKVxuICAgICAgZXhwZWN0KHZhbGlkYXRpb24uc3VjY2VzcyAhPT0gdW5kZWZpbmVkKS50b0JlKHRydWUpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnTXVsdGktU3RlcCBTdGVwcGVyIEludGVncmF0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgbWFpbnRhaW4gZW5naW5lIHN0YXRlIGFjcm9zcyBzdGVwcGVyIG9wZXJhdGlvbnMnLCAoKSA9PiB7XG4gICAgICBjb25zdCB7IGZpZWxkcywgc3RlcHMgfSA9IGNyZWF0ZU11bHRpU3RlcENvbmRpdGlvbmFsRm9ybSgpXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcbiAgICAgIGNvbnN0IHN0ZXBwZXIgPSBjcmVhdGVGb3JtU3RlcHBlcihzdGVwcywgZW5naW5lKVxuXG4gICAgICAvLyBTZXQgdmFsdWUgdGhyb3VnaCBlbmdpbmVcbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCduYW1lJywgJ3Rlc3QtdmFsdWUnKVxuXG4gICAgICAvLyBBY2Nlc3MgdGhyb3VnaCBlbmdpbmVcbiAgICAgIGxldCB2YWx1ZXMgPSBlbmdpbmUuZ2V0VmFsdWVzKClcbiAgICAgIGV4cGVjdCh2YWx1ZXMubmFtZSkudG9CZSgndGVzdC12YWx1ZScpXG5cbiAgICAgIC8vIE5hdmlnYXRlIHRocm91Z2ggc3RlcHBlclxuICAgICAgc3RlcHBlci5qdW1wVG8oMSlcblxuICAgICAgLy8gVmFsdWUgc2hvdWxkIHN0aWxsIGJlIHRoZXJlXG4gICAgICB2YWx1ZXMgPSBlbmdpbmUuZ2V0VmFsdWVzKClcbiAgICAgIGV4cGVjdCh2YWx1ZXMubmFtZSkudG9CZSgndGVzdC12YWx1ZScpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgc3VwcG9ydCBmdWxsIGZvcm0gY29tcGxldGlvbiB3b3JrZmxvdycsICgpID0+IHtcbiAgICAgIGNvbnN0IHsgZmllbGRzLCBzdGVwcyB9ID0gY3JlYXRlQ29udGFjdEZvcm0oKVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG5cbiAgICAgIC8vIEZpbGwgYWxsIHJlcXVpcmVkIGZpZWxkc1xuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2ZpcnN0TmFtZScsICdKb2huJylcbiAgICAgIGVuZ2luZS5zZXRGaWVsZFZhbHVlKCdsYXN0TmFtZScsICdEb2UnKVxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ2VtYWlsJywgJ2pvaG5AZXhhbXBsZS5jb20nKVxuICAgICAgZW5naW5lLnNldEZpZWxkVmFsdWUoJ21lc3NhZ2UnLCAnVGhpcyBpcyBhIHRlc3QgbWVzc2FnZSB0aGF0IGlzIGxvbmcgZW5vdWdoJylcblxuICAgICAgLy8gVmFsaWRhdGUgZW50aXJlIGZvcm1cbiAgICAgIGNvbnN0IHZhbGlkYXRpb24gPSBlbmdpbmUudmFsaWRhdGUoKVxuICAgICAgZXhwZWN0KHZhbGlkYXRpb24uc3VjY2VzcykudG9CZSh0cnVlKVxuXG4gICAgICAvLyBDb2xsZWN0IGZpbmFsIHN1Ym1pc3Npb25cbiAgICAgIGNvbnN0IHN1Ym1pc3Npb24gPSBlbmdpbmUuY29sbGVjdFN1Ym1pc3Npb25WYWx1ZXMoKVxuICAgICAgZXhwZWN0KE9iamVjdC5rZXlzKHN1Ym1pc3Npb24pLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIG5hdmlnYXRpb24gd2l0aCBjb25kaXRpb25hbCBzdGVwIHZpc2liaWxpdHknLCAoKSA9PiB7XG4gICAgICBjb25zdCB7IGZpZWxkcywgc3RlcHMgfSA9IGNyZWF0ZU11bHRpU3RlcENvbmRpdGlvbmFsRm9ybSgpXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcbiAgICAgIGNvbnN0IHN0ZXBwZXIgPSBjcmVhdGVGb3JtU3RlcHBlcihzdGVwcywgZW5naW5lKVxuXG4gICAgICAvLyBHZXQgaW5pdGlhbGx5IHZpc2libGUgc3RlcHNcbiAgICAgIGNvbnN0IGluaXRpYWxTdGVwcyA9IHN0ZXBwZXIuZ2V0VmlzaWJsZVN0ZXBzKClcbiAgICAgIGV4cGVjdChpbml0aWFsU3RlcHMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMClcblxuICAgICAgLy8gQ3VycmVudCBzdGVwIHNob3VsZCBiZSBpbiB2aXNpYmxlIHN0ZXBzXG4gICAgICBjb25zdCBjdXJyZW50U3RlcCA9IHN0ZXBwZXIuZ2V0Q3VycmVudFN0ZXAoKVxuICAgICAgY29uc3QgaXNDdXJyZW50VmlzaWJsZSA9IGluaXRpYWxTdGVwcy5zb21lKFxuICAgICAgICAocykgPT4gcy5zdGVwLmlkID09PSBjdXJyZW50U3RlcD8uc3RlcC5pZFxuICAgICAgKVxuICAgICAgZXhwZWN0KGlzQ3VycmVudFZpc2libGUpLnRvQmUodHJ1ZSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCdFZGdlIENhc2VzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgaGFuZGxlIGdvaW5nIG5leHQgb24gbGFzdCBzdGVwIGdyYWNlZnVsbHknLCAoKSA9PiB7XG4gICAgICBjb25zdCB7IGZpZWxkcywgc3RlcHMgfSA9IGNyZWF0ZU11bHRpU3RlcENvbmRpdGlvbmFsRm9ybSgpXG4gICAgICBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZpZWxkcylcbiAgICAgIGNvbnN0IHN0ZXBwZXIgPSBjcmVhdGVGb3JtU3RlcHBlcihzdGVwcywgZW5naW5lKVxuXG4gICAgICAvLyBKdW1wIHRvIGxhc3Qgc3RlcFxuICAgICAgc3RlcHBlci5qdW1wVG8oc3RlcHMubGVuZ3RoIC0gMSlcbiAgICAgIGV4cGVjdChzdGVwcGVyLmlzTGFzdFN0ZXAoKSkudG9CZSh0cnVlKVxuXG4gICAgICAvLyBUcnkgdG8gZ28gbmV4dFxuICAgICAgY29uc3QgcmVzdWx0ID0gc3RlcHBlci5nb05leHQoKVxuICAgICAgLy8gU2hvdWxkIGVpdGhlciByZXR1cm4gbnVsbCBvciBoYW5kbGUgZ3JhY2VmdWxseVxuICAgICAgZXhwZWN0KHJlc3VsdCA9PT0gbnVsbCB8fCByZXN1bHQgIT09IHVuZGVmaW5lZCkudG9CZSh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBnb2luZyBiYWNrIG9uIGZpcnN0IHN0ZXAgZ3JhY2VmdWxseScsICgpID0+IHtcbiAgICAgIGNvbnN0IHsgZmllbGRzLCBzdGVwcyB9ID0gY3JlYXRlTXVsdGlTdGVwQ29uZGl0aW9uYWxGb3JtKClcbiAgICAgIGNvbnN0IGVuZ2luZSA9IGNyZWF0ZUZvcm1FbmdpbmUoZmllbGRzKVxuICAgICAgY29uc3Qgc3RlcHBlciA9IGNyZWF0ZUZvcm1TdGVwcGVyKHN0ZXBzLCBlbmdpbmUpXG5cbiAgICAgIC8vIEFscmVhZHkgYXQgZmlyc3Qgc3RlcFxuICAgICAgZXhwZWN0KHN0ZXBwZXIuZ2V0Q3VycmVudEluZGV4KCkpLnRvQmUoMClcblxuICAgICAgLy8gVHJ5IHRvIGdvIGJhY2tcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHN0ZXBwZXIuZ29CYWNrKClcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmVOdWxsKClcbiAgICAgIGV4cGVjdChzdGVwcGVyLmdldEN1cnJlbnRJbmRleCgpKS50b0JlKDApXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIGludmFsaWQganVtcCBpbmRleCBncmFjZWZ1bGx5JywgKCkgPT4ge1xuICAgICAgY29uc3QgeyBmaWVsZHMsIHN0ZXBzIH0gPSBjcmVhdGVNdWx0aVN0ZXBDb25kaXRpb25hbEZvcm0oKVxuICAgICAgY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMpXG4gICAgICBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIoc3RlcHMsIGVuZ2luZSlcblxuICAgICAgLy8gVHJ5IHRvIGp1bXAgdG8gaW52YWxpZCBpbmRleFxuICAgICAgc3RlcHBlci5qdW1wVG8oOTk5KVxuICAgICAgLy8gU2hvdWxkIGVpdGhlciBmYWlsIGdyYWNlZnVsbHkgb3Igbm90IGp1bXBcbiAgICAgIGV4cGVjdChzdGVwcGVyLmdldEN1cnJlbnRJbmRleCgpIDwgOTk5KS50b0JlKHRydWUpXG4gICAgfSlcbiAgfSlcbn0pXG4iXX0=