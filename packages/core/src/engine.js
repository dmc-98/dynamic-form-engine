"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFormEngine = createFormEngine;
exports.createFormStepper = createFormStepper;
const dag_1 = require("./dag");
const stepper_1 = require("./stepper");
const zod_generator_1 = require("./zod-generator");
const condition_compiler_1 = require("./condition-compiler");
// ─── Form Engine Factory ─────────────────────────────────────────────────────
/**
 * Create a new form engine instance.
 * This is the primary entry point for using the Dynamic Form Engine.
 *
 * The engine manages a dependency graph of form fields, handles conditional
 * visibility/requirement logic, generates Zod validation schemas, and
 * collects submission values.
 *
 * @param fields - Array of FormField definitions (flat or nested tree)
 * @param hydrationData - Optional pre-existing values to pre-fill the form
 * @returns A FormEngine instance with methods for field management and validation
 *
 * @example
 * ```ts
 * import { createFormEngine } from '@dmc--98/dfe-core'
 *
 * const engine = createFormEngine(formDefinition.fields, existingData)
 *
 * // Set a field value (triggers condition evaluation)
 * const patch = engine.setFieldValue('role', 'admin')
 * console.log(patch.visibilityChanges) // fields that became visible/hidden
 *
 * // Get visible fields for rendering
 * const visibleFields = engine.getVisibleFields()
 *
 * // Validate before submission
 * const { success, errors } = engine.validate()
 * if (success) {
 *   const values = engine.collectSubmissionValues()
 *   await submitToApi(values)
 * }
 * ```
 */
function createFormEngine(fields, hydrationData) {
    // Validate input fields have required properties
    for (const field of fields) {
        if (!field.key) {
            throw new Error(`FormEngine: field "${field.id}" is missing a "key" property`);
        }
        if (!field.type) {
            throw new Error(`FormEngine: field "${field.key}" is missing a "type" property`);
        }
        if (field.config === undefined || field.config === null) {
            // Auto-fix: default to empty config instead of crashing downstream
            ;
            field.config = {};
        }
    }
    // Flatten field tree if nested
    const flatFields = (0, dag_1.flattenFieldTree)(fields);
    // Build the dependency graph
    const graph = (0, dag_1.buildFormGraph)(flatFields, hydrationData);
    // Initialize computed field tracking
    const computedExpressions = new Map();
    const fieldKeyToField = new Map(flatFields.map(f => [f.key, f]));
    // Scan fields for computed config and register them
    for (const field of flatFields) {
        if (field.computed) {
            computedExpressions.set(field.key, {
                expression: field.computed.expression,
                dependsOn: field.computed.dependsOn,
            });
        }
    }
    // Initialize undo/redo stacks
    const undoStack = [];
    const redoStack = [];
    const maxHistory = 50;
    // Initialize repeat instances tracker
    const repeatInstances = new Map();
    return {
        graph,
        getFields() {
            return fields;
        },
        setFieldValue(key, value) {
            // Push current values to undoStack before changing
            undoStack.push((0, dag_1.getCurrentValues)(graph));
            if (undoStack.length > maxHistory) {
                undoStack.shift();
            }
            redoStack.length = 0; // Clear redo stack on new change
            const patch = (0, dag_1.handleFieldChange)(graph, key, value);
            // Re-evaluate computed fields whose dependencies changed
            for (const [computedKey, config] of computedExpressions) {
                const dependencyChanged = config.dependsOn.some(dep => patch.updatedKeys.has(dep));
                if (dependencyChanged) {
                    const computedValue = evaluateSafeExpression(config.expression, (0, dag_1.getCurrentValues)(graph));
                    const computedNode = graph.nodes.get(computedKey);
                    if (computedNode) {
                        computedNode.value = computedValue;
                    }
                }
            }
            return patch;
        },
        getValues() {
            return (0, dag_1.getCurrentValues)(graph);
        },
        getVisibleFields() {
            const visible = [];
            for (const [, node] of graph.nodes) {
                if (node.isVisible) {
                    visible.push(node.field);
                }
            }
            return visible.sort((a, b) => a.order - b.order);
        },
        getFieldState(key) {
            return graph.nodes.get(key);
        },
        validate() {
            const visibleFields = this.getVisibleFields().filter(f => f.type !== 'SECTION_BREAK' && f.type !== 'FIELD_GROUP');
            const schema = (0, zod_generator_1.generateZodSchema)(visibleFields);
            const values = this.getValues();
            const result = schema.safeParse(values);
            if (result.success) {
                return { success: true, errors: {} };
            }
            const errors = {};
            for (const issue of result.error.issues) {
                const fieldKey = issue.path.join('.');
                errors[fieldKey] = issue.message;
            }
            return { success: false, errors };
        },
        validateStep(stepId) {
            const stepFields = [];
            for (const [, node] of graph.nodes) {
                if (node.field.stepId === stepId && node.isVisible &&
                    node.field.type !== 'SECTION_BREAK' && node.field.type !== 'FIELD_GROUP') {
                    stepFields.push(node.field);
                }
            }
            if (stepFields.length === 0) {
                return { success: true, errors: {} };
            }
            const schema = (0, zod_generator_1.generateStepZodSchema)(stepFields);
            const values = this.getValues();
            const stepValues = {};
            for (const f of stepFields) {
                stepValues[f.key] = values[f.key];
            }
            const result = schema.safeParse(stepValues);
            if (result.success) {
                return { success: true, errors: {} };
            }
            const errors = {};
            for (const issue of result.error.issues) {
                const fieldKey = issue.path.join('.');
                errors[fieldKey] = issue.message;
            }
            return { success: false, errors };
        },
        collectSubmissionValues() {
            return (0, dag_1.collectSubmissionValues)(graph);
        },
        getComputedValue(key) {
            const config = computedExpressions.get(key);
            if (!config) {
                return undefined;
            }
            return evaluateSafeExpression(config.expression, (0, dag_1.getCurrentValues)(graph));
        },
        registerComputed(key, expression, dependsOn) {
            computedExpressions.set(key, { expression, dependsOn });
            // Add dependency edges to the graph
            for (const depKey of dependsOn) {
                if (graph.dependents.has(depKey)) {
                    graph.dependents.get(depKey).add(key);
                }
            }
        },
        undo() {
            if (undoStack.length === 0) {
                return null;
            }
            const previousValues = undoStack.pop();
            const currentValues = (0, dag_1.getCurrentValues)(graph);
            redoStack.push(currentValues);
            // Restore all values from the previous state
            for (const [key, value] of Object.entries(previousValues)) {
                const node = graph.nodes.get(key);
                if (node) {
                    node.value = value;
                }
            }
            return previousValues;
        },
        redo() {
            if (redoStack.length === 0) {
                return null;
            }
            const nextValues = redoStack.pop();
            const currentValues = (0, dag_1.getCurrentValues)(graph);
            undoStack.push(currentValues);
            // Restore all values from the next state
            for (const [key, value] of Object.entries(nextValues)) {
                const node = graph.nodes.get(key);
                if (node) {
                    node.value = value;
                }
            }
            return nextValues;
        },
        canUndo() {
            return undoStack.length > 0;
        },
        canRedo() {
            return redoStack.length > 0;
        },
        getFieldPermission(key, role) {
            var _a;
            const field = fieldKeyToField.get(key);
            if (!field || !field.permissions) {
                return 'editable';
            }
            const permission = field.permissions.find(p => p.role === role);
            return (_a = permission === null || permission === void 0 ? void 0 : permission.level) !== null && _a !== void 0 ? _a : 'editable';
        },
        getLocalizedLabel(key, locale) {
            var _a, _b;
            const field = fieldKeyToField.get(key);
            if (!field) {
                return '';
            }
            return (_b = (_a = field.i18nLabels) === null || _a === void 0 ? void 0 : _a[locale]) !== null && _b !== void 0 ? _b : field.label;
        },
        addRepeatInstance(groupKey) {
            var _a;
            const groupField = fieldKeyToField.get(groupKey);
            if (!groupField) {
                return;
            }
            const repeatConfig = groupField.config;
            if (!repeatConfig.templateFields) {
                return;
            }
            // Clone template fields' default values
            const newInstance = {};
            for (const templateField of repeatConfig.templateFields) {
                newInstance[templateField.key] = (_a = (0, dag_1.getCurrentValues)(graph)[templateField.key]) !== null && _a !== void 0 ? _a : (0, dag_1.getDefaultValue)(templateField);
            }
            if (!repeatInstances.has(groupKey)) {
                repeatInstances.set(groupKey, []);
            }
            repeatInstances.get(groupKey).push(newInstance);
        },
        removeRepeatInstance(groupKey, index) {
            const instances = repeatInstances.get(groupKey);
            if (instances && index >= 0 && index < instances.length) {
                instances.splice(index, 1);
            }
        },
        getRepeatInstances(groupKey) {
            var _a;
            return (_a = repeatInstances.get(groupKey)) !== null && _a !== void 0 ? _a : [];
        },
    };
}
/**
 * Safely evaluate a mathematical/logical expression with field values as context.
 * Uses Function constructor to create a scoped evaluator.
 */
function evaluateSafeExpression(expression, values) {
    try {
        // Create a safe evaluator function with field values as parameters
        const keys = Object.keys(values);
        const args = keys.map(k => values[k]);
        // eslint-disable-next-line no-new-func
        const evaluator = new Function(...keys, `return (${expression})`);
        return evaluator(...args);
    }
    catch (e) {
        console.error(`Failed to evaluate computed expression: ${expression}`, e);
        return null;
    }
}
// ─── Form Stepper Factory ────────────────────────────────────────────────────
/**
 * Create a form stepper instance for multi-step form navigation.
 *
 * The stepper manages step ordering, skip conditions, completion tracking,
 * and navigation (next/back/jump). It works independently of any framework.
 *
 * @param steps - Array of FormStep definitions in order
 * @param engine - A FormEngine instance (for field graph access)
 * @param initialIndex - Starting step index (default: 0)
 *
 * @example
 * ```ts
 * import { createFormEngine, createFormStepper } from '@dmc--98/dfe-core'
 *
 * const engine = createFormEngine(fields, data)
 * const stepper = createFormStepper(steps, engine)
 *
 * console.log(stepper.getCurrentStep()?.step.title) // "Personal Info"
 *
 * const nextStep = stepper.goNext()
 * if (nextStep) {
 *   console.log(nextStep.step.title) // "Job Details"
 * }
 * ```
 */
function createFormStepper(steps, engine, initialIndex = 0) {
    const stepGraph = (0, stepper_1.buildStepGraph)(steps, engine.graph);
    let currentIndex = initialIndex;
    return {
        stepGraph,
        getCurrentStep() {
            var _a;
            const visible = (0, stepper_1.getVisibleSteps)(stepGraph);
            return (_a = visible[currentIndex]) !== null && _a !== void 0 ? _a : null;
        },
        getVisibleSteps() {
            return (0, stepper_1.getVisibleSteps)(stepGraph);
        },
        getCurrentIndex() {
            return currentIndex;
        },
        canGoBack() {
            return currentIndex > 0;
        },
        isLastStep() {
            const visible = (0, stepper_1.getVisibleSteps)(stepGraph);
            return currentIndex === visible.length - 1;
        },
        goNext() {
            const visible = (0, stepper_1.getVisibleSteps)(stepGraph);
            if (currentIndex < visible.length - 1) {
                currentIndex++;
                return visible[currentIndex];
            }
            return null;
        },
        goBack() {
            if (currentIndex > 0) {
                currentIndex--;
                const visible = (0, stepper_1.getVisibleSteps)(stepGraph);
                return visible[currentIndex];
            }
            return null;
        },
        jumpTo(index) {
            const visible = (0, stepper_1.getVisibleSteps)(stepGraph);
            if (index >= 0 && index < visible.length) {
                currentIndex = index;
            }
        },
        markComplete(stepId) {
            const stepNode = stepGraph.steps.get(stepId);
            if (stepNode) {
                stepNode.isComplete = true;
            }
        },
        getProgress() {
            const visible = (0, stepper_1.getVisibleSteps)(stepGraph);
            return {
                current: currentIndex + 1,
                total: visible.length,
                percent: visible.length > 0
                    ? Math.round(((currentIndex + 1) / visible.length) * 100)
                    : 0,
            };
        },
        getNextBranch() {
            const currentStep = this.getCurrentStep();
            if (!currentStep || !currentStep.step.branches) {
                return null;
            }
            const values = engine.getValues();
            // Evaluate each branch condition in order
            for (const branch of currentStep.step.branches) {
                let matches = false;
                if (typeof branch.condition === 'string') {
                    // String expression: evaluate as a safe expression
                    try {
                        matches = !!evaluateSafeExpression(branch.condition, values);
                    }
                    catch (_a) {
                        matches = false;
                    }
                }
                else {
                    // FieldConditions object: compile and evaluate
                    const compiledCondition = (0, condition_compiler_1.compileCondition)(branch.condition);
                    matches = compiledCondition(values);
                }
                if (matches) {
                    // Find the target step in the stepGraph
                    const targetStep = stepGraph.steps.get(branch.targetStepId);
                    if (targetStep && targetStep.isVisible) {
                        return targetStep;
                    }
                }
            }
            return null;
        },
        goNextBranch() {
            const branchTarget = this.getNextBranch();
            if (branchTarget) {
                // Find the visible step index of the target
                const visible = (0, stepper_1.getVisibleSteps)(stepGraph);
                const targetIndex = visible.findIndex(s => s.step.id === branchTarget.step.id);
                if (targetIndex >= 0) {
                    currentIndex = targetIndex;
                    return visible[targetIndex];
                }
            }
            // Fall back to sequential navigation if no branch matches
            return this.goNext();
        },
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5naW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZW5naW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBaURBLDRDQWdSQztBQStDRCw4Q0ErSEM7QUF6ZUQsK0JBR2M7QUFDZCx1Q0FBK0U7QUFDL0UsbURBQTBFO0FBQzFFLDZEQUF1RDtBQUV2RCxnRkFBZ0Y7QUFFaEY7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBZ0NHO0FBQ0gsU0FBZ0IsZ0JBQWdCLENBQzlCLE1BQW1CLEVBQ25CLGFBQTBCO0lBRTFCLGlEQUFpRDtJQUNqRCxLQUFLLE1BQU0sS0FBSyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQzNCLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDZixNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQixLQUFLLENBQUMsRUFBRSwrQkFBK0IsQ0FBQyxDQUFBO1FBQ2hGLENBQUM7UUFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2hCLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLEtBQUssQ0FBQyxHQUFHLGdDQUFnQyxDQUFDLENBQUE7UUFDbEYsQ0FBQztRQUNELElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxTQUFTLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUN4RCxtRUFBbUU7WUFDbkUsQ0FBQztZQUFDLEtBQWEsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFBO1FBQzdCLENBQUM7SUFDSCxDQUFDO0lBRUQsK0JBQStCO0lBQy9CLE1BQU0sVUFBVSxHQUFHLElBQUEsc0JBQWdCLEVBQUMsTUFBTSxDQUFDLENBQUE7SUFFM0MsNkJBQTZCO0lBQzdCLE1BQU0sS0FBSyxHQUFHLElBQUEsb0JBQWMsRUFBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUE7SUFFdkQscUNBQXFDO0lBQ3JDLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxHQUFHLEVB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LE1BQU0sRUFBRSxDQUFBO1FBQ3RCLENBQUM7S0FDRixDQUFBO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgRm9ybUZpZWxkLCBGb3JtVmFsdWVzLCBGb3JtRW5naW5lLCBGb3JtU3RlcHBlcixcbiAgRm9ybVN0ZXAsIEZvcm1HcmFwaCwgU3RlcEdyYXBoLCBHcmFwaFBhdGNoLFxuICBGaWVsZE5vZGVTdGF0ZSwgU3RlcE5vZGVTdGF0ZSwgRmllbGRLZXksIFBlcm1pc3Npb25MZXZlbCxcbiAgQ29tcHV0ZWRGaWVsZENvbmZpZyxcbn0gZnJvbSAnLi90eXBlcydcbmltcG9ydCB7XG4gIGJ1aWxkRm9ybUdyYXBoLCBoYW5kbGVGaWVsZENoYW5nZSwgZ2V0Q3VycmVudFZhbHVlcyxcbiAgY29sbGVjdFN1Ym1pc3Npb25WYWx1ZXMsIGZsYXR0ZW5GaWVsZFRyZWUsIGdldERlZmF1bHRWYWx1ZSxcbn0gZnJvbSAnLi9kYWcnXG5pbXBvcnQgeyBidWlsZFN0ZXBHcmFwaCwgZ2V0VmlzaWJsZVN0ZXBzLCBjYW5Qcm9jZWVkRnJvbVN0ZXAgfSBmcm9tICcuL3N0ZXBwZXInXG5pbXBvcnQgeyBnZW5lcmF0ZVpvZFNjaGVtYSwgZ2VuZXJhdGVTdGVwWm9kU2NoZW1hIH0gZnJvbSAnLi96b2QtZ2VuZXJhdG9yJ1xuaW1wb3J0IHsgY29tcGlsZUNvbmRpdGlvbiB9IGZyb20gJy4vY29uZGl0aW9uLWNvbXBpbGVyJ1xuXG4vLyDilIDilIDilIAgRm9ybSBFbmdpbmUgRmFjdG9yeSDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuLyoqXG4gKiBDcmVhdGUgYSBuZXcgZm9ybSBlbmdpbmUgaW5zdGFuY2UuXG4gKiBUaGlzIGlzIHRoZSBwcmltYXJ5IGVudHJ5IHBvaW50IGZvciB1c2luZyB0aGUgRHluYW1pYyBGb3JtIEVuZ2luZS5cbiAqXG4gKiBUaGUgZW5naW5lIG1hbmFnZXMgYSBkZXBlbmRlbmN5IGdyYXBoIG9mIGZvcm0gZmllbGRzLCBoYW5kbGVzIGNvbmRpdGlvbmFsXG4gKiB2aXNpYmlsaXR5L3JlcXVpcmVtZW50IGxvZ2ljLCBnZW5lcmF0ZXMgWm9kIHZhbGlkYXRpb24gc2NoZW1hcywgYW5kXG4gKiBjb2xsZWN0cyBzdWJtaXNzaW9uIHZhbHVlcy5cbiAqXG4gKiBAcGFyYW0gZmllbGRzIC0gQXJyYXkgb2YgRm9ybUZpZWxkIGRlZmluaXRpb25zIChmbGF0IG9yIG5lc3RlZCB0cmVlKVxuICogQHBhcmFtIGh5ZHJhdGlvbkRhdGEgLSBPcHRpb25hbCBwcmUtZXhpc3RpbmcgdmFsdWVzIHRvIHByZS1maWxsIHRoZSBmb3JtXG4gKiBAcmV0dXJucyBBIEZvcm1FbmdpbmUgaW5zdGFuY2Ugd2l0aCBtZXRob2RzIGZvciBmaWVsZCBtYW5hZ2VtZW50IGFuZCB2YWxpZGF0aW9uXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBjcmVhdGVGb3JtRW5naW5lIH0gZnJvbSAnQHNuYXJqdW45OC9kZmUtY29yZSdcbiAqXG4gKiBjb25zdCBlbmdpbmUgPSBjcmVhdGVGb3JtRW5naW5lKGZvcm1EZWZpbml0aW9uLmZpZWxkcywgZXhpc3RpbmdEYXRhKVxuICpcbiAqIC8vIFNldCBhIGZpZWxkIHZhbHVlICh0cmlnZ2VycyBjb25kaXRpb24gZXZhbHVhdGlvbilcbiAqIGNvbnN0IHBhdGNoID0gZW5naW5lLnNldEZpZWxkVmFsdWUoJ3JvbGUnLCAnYWRtaW4nKVxuICogY29uc29sZS5sb2cocGF0Y2gudmlzaWJpbGl0eUNoYW5nZXMpIC8vIGZpZWxkcyB0aGF0IGJlY2FtZSB2aXNpYmxlL2hpZGRlblxuICpcbiAqIC8vIEdldCB2aXNpYmxlIGZpZWxkcyBmb3IgcmVuZGVyaW5nXG4gKiBjb25zdCB2aXNpYmxlRmllbGRzID0gZW5naW5lLmdldFZpc2libGVGaWVsZHMoKVxuICpcbiAqIC8vIFZhbGlkYXRlIGJlZm9yZSBzdWJtaXNzaW9uXG4gKiBjb25zdCB7IHN1Y2Nlc3MsIGVycm9ycyB9ID0gZW5naW5lLnZhbGlkYXRlKClcbiAqIGlmIChzdWNjZXNzKSB7XG4gKiAgIGNvbnN0IHZhbHVlcyA9IGVuZ2luZS5jb2xsZWN0U3VibWlzc2lvblZhbHVlcygpXG4gKiAgIGF3YWl0IHN1Ym1pdFRvQXBpKHZhbHVlcylcbiAqIH1cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRm9ybUVuZ2luZShcbiAgZmllbGRzOiBGb3JtRmllbGRbXSxcbiAgaHlkcmF0aW9uRGF0YT86IEZvcm1WYWx1ZXMsXG4pOiBGb3JtRW5naW5lIHtcbiAgLy8gVmFsaWRhdGUgaW5wdXQgZmllbGRzIGhhdmUgcmVxdWlyZWQgcHJvcGVydGllc1xuICBmb3IgKGNvbnN0IGZpZWxkIG9mIGZpZWxkcykge1xuICAgIGlmICghZmllbGQua2V5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEZvcm1FbmdpbmU6IGZpZWxkIFwiJHtmaWVsZC5pZH1cIiBpcyBtaXNzaW5nIGEgXCJrZXlcIiBwcm9wZXJ0eWApXG4gICAgfVxuICAgIGlmICghZmllbGQudHlwZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBGb3JtRW5naW5lOiBmaWVsZCBcIiR7ZmllbGQua2V5fVwiIGlzIG1pc3NpbmcgYSBcInR5cGVcIiBwcm9wZXJ0eWApXG4gICAgfVxuICAgIGlmIChmaWVsZC5jb25maWcgPT09IHVuZGVmaW5lZCB8fCBmaWVsZC5jb25maWcgPT09IG51bGwpIHtcbiAgICAgIC8vIEF1dG8tZml4OiBkZWZhdWx0IHRvIGVtcHR5IGNvbmZpZyBpbnN0ZWFkIG9mIGNyYXNoaW5nIGRvd25zdHJlYW1cbiAgICAgIDsoZmllbGQgYXMgYW55KS5jb25maWcgPSB7fVxuICAgIH1cbiAgfVxuXG4gIC8vIEZsYXR0ZW4gZmllbGQgdHJlZSBpZiBuZXN0ZWRcbiAgY29uc3QgZmxhdEZpZWxkcyA9IGZsYXR0ZW5GaWVsZFRyZWUoZmllbGRzKVxuXG4gIC8vIEJ1aWxkIHRoZSBkZXBlbmRlbmN5IGdyYXBoXG4gIGNvbnN0IGdyYXBoID0gYnVpbGRGb3JtR3JhcGgoZmxhdEZpZWxkcywgaHlkcmF0aW9uRGF0YSlcblxuICAvLyBJbml0aWFsaXplIGNvbXB1dGVkIGZpZWxkIHRyYWNraW5nXG4gIGNvbnN0IGNvbXB1dGVkRXhwcmVzc2lvbnMgPSBuZXcgTWFwPEZpZWxkS2V5LCB7IGV4cHJlc3Npb246IHN0cmluZzsgZGVwZW5kc09uOiBGaWVsZEtleVtdIH0+KClcbiAgY29uc3QgZmllbGRLZXlUb0ZpZWxkID0gbmV3IE1hcDxGaWVsZEtleSwgRm9ybUZpZWxkPihmbGF0RmllbGRzLm1hcChmID0+IFtmLmtleSwgZl0pKVxuXG4gIC8vIFNjYW4gZmllbGRzIGZvciBjb21wdXRlZCBjb25maWcgYW5kIHJlZ2lzdGVyIHRoZW1cbiAgZm9yIChjb25zdCBmaWVsZCBvZiBmbGF0RmllbGRzKSB7XG4gICAgaWYgKGZpZWxkLmNvbXB1dGVkKSB7XG4gICAgICBjb21wdXRlZEV4cHJlc3Npb25zLnNldChmaWVsZC5rZXksIHtcbiAgICAgICAgZXhwcmVzc2lvbjogZmllbGQuY29tcHV0ZWQuZXhwcmVzc2lvbixcbiAgICAgICAgZGVwZW5kc09uOiBmaWVsZC5jb21wdXRlZC5kZXBlbmRzT24sXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIC8vIEluaXRpYWxpemUgdW5kby9yZWRvIHN0YWNrc1xuICBjb25zdCB1bmRvU3RhY2s6IEZvcm1WYWx1ZXNbXSA9IFtdXG4gIGNvbnN0IHJlZG9TdGFjazogRm9ybVZhbHVlc1tdID0gW11cbiAgY29uc3QgbWF4SGlzdG9yeSA9IDUwXG5cbiAgLy8gSW5pdGlhbGl6ZSByZXBlYXQgaW5zdGFuY2VzIHRyYWNrZXJcbiAgY29uc3QgcmVwZWF0SW5zdGFuY2VzID0gbmV3IE1hcDxGaWVsZEtleSwgRm9ybVZhbHVlc1tdPigpXG5cbiAgcmV0dXJuIHtcbiAgICBncmFwaCxcblxuICAgIGdldEZpZWxkcygpOiBGb3JtRmllbGRbXSB7XG4gICAgICByZXR1cm4gZmllbGRzXG4gICAgfSxcblxuICAgIHNldEZpZWxkVmFsdWUoa2V5LCB2YWx1ZSk6IEdyYXBoUGF0Y2gge1xuICAgICAgLy8gUHVzaCBjdXJyZW50IHZhbHVlcyB0byB1bmRvU3RhY2sgYmVmb3JlIGNoYW5naW5nXG4gICAgICB1bmRvU3RhY2sucHVzaChnZXRDdXJyZW50VmFsdWVzKGdyYXBoKSlcbiAgICAgIGlmICh1bmRvU3RhY2subGVuZ3RoID4gbWF4SGlzdG9yeSkge1xuICAgICAgICB1bmRvU3RhY2suc2hpZnQoKVxuICAgICAgfVxuICAgICAgcmVkb1N0YWNrLmxlbmd0aCA9IDAgLy8gQ2xlYXIgcmVkbyBzdGFjayBvbiBuZXcgY2hhbmdlXG5cbiAgICAgIGNvbnN0IHBhdGNoID0gaGFuZGxlRmllbGRDaGFuZ2UoZ3JhcGgsIGtleSwgdmFsdWUpXG5cbiAgICAgIC8vIFJlLWV2YWx1YXRlIGNvbXB1dGVkIGZpZWxkcyB3aG9zZSBkZXBlbmRlbmNpZXMgY2hhbmdlZFxuICAgICAgZm9yIChjb25zdCBbY29tcHV0ZWRLZXksIGNvbmZpZ10gb2YgY29tcHV0ZWRFeHByZXNzaW9ucykge1xuICAgICAgICBjb25zdCBkZXBlbmRlbmN5Q2hhbmdlZCA9IGNvbmZpZy5kZXBlbmRzT24uc29tZShkZXAgPT4gcGF0Y2gudXBkYXRlZEtleXMuaGFzKGRlcCkpXG4gICAgICAgIGlmIChkZXBlbmRlbmN5Q2hhbmdlZCkge1xuICAgICAgICAgIGNvbnN0IGNvbXB1dGVkVmFsdWUgPSBldmFsdWF0ZVNhZmVFeHByZXNzaW9uKFxuICAgICAgICAgICAgY29uZmlnLmV4cHJlc3Npb24sXG4gICAgICAgICAgICBnZXRDdXJyZW50VmFsdWVzKGdyYXBoKSxcbiAgICAgICAgICApXG4gICAgICAgICAgY29uc3QgY29tcHV0ZWROb2RlID0gZ3JhcGgubm9kZXMuZ2V0KGNvbXB1dGVkS2V5KVxuICAgICAgICAgIGlmIChjb21wdXRlZE5vZGUpIHtcbiAgICAgICAgICAgIGNvbXB1dGVkTm9kZS52YWx1ZSA9IGNvbXB1dGVkVmFsdWVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHBhdGNoXG4gICAgfSxcblxuICAgIGdldFZhbHVlcygpOiBGb3JtVmFsdWVzIHtcbiAgICAgIHJldHVybiBnZXRDdXJyZW50VmFsdWVzKGdyYXBoKVxuICAgIH0sXG5cbiAgICBnZXRWaXNpYmxlRmllbGRzKCk6IEZvcm1GaWVsZFtdIHtcbiAgICAgIGNvbnN0IHZpc2libGU6IEZvcm1GaWVsZFtdID0gW11cbiAgICAgIGZvciAoY29uc3QgWywgbm9kZV0gb2YgZ3JhcGgubm9kZXMpIHtcbiAgICAgICAgaWYgKG5vZGUuaXNWaXNpYmxlKSB7XG4gICAgICAgICAgdmlzaWJsZS5wdXNoKG5vZGUuZmllbGQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB2aXNpYmxlLnNvcnQoKGEsIGIpID0+IGEub3JkZXIgLSBiLm9yZGVyKVxuICAgIH0sXG5cbiAgICBnZXRGaWVsZFN0YXRlKGtleSk6IEZpZWxkTm9kZVN0YXRlIHwgdW5kZWZpbmVkIHtcbiAgICAgIHJldHVybiBncmFwaC5ub2Rlcy5nZXQoa2V5KVxuICAgIH0sXG5cbiAgICB2YWxpZGF0ZSgpIHtcbiAgICAgIGNvbnN0IHZpc2libGVGaWVsZHMgPSB0aGlzLmdldFZpc2libGVGaWVsZHMoKS5maWx0ZXIoXG4gICAgICAgIGYgPT4gZi50eXBlICE9PSAnU0VDVElPTl9CUkVBSycgJiYgZi50eXBlICE9PSAnRklFTERfR1JPVVAnXG4gICAgICApXG4gICAgICBjb25zdCBzY2hlbWEgPSBnZW5lcmF0ZVpvZFNjaGVtYSh2aXNpYmxlRmllbGRzKVxuICAgICAgY29uc3QgdmFsdWVzID0gdGhpcy5nZXRWYWx1ZXMoKVxuICAgICAgY29uc3QgcmVzdWx0ID0gc2NoZW1hLnNhZmVQYXJzZSh2YWx1ZXMpXG5cbiAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBlcnJvcnM6IHt9IH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgZXJyb3JzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge31cbiAgICAgIGZvciAoY29uc3QgaXNzdWUgb2YgcmVzdWx0LmVycm9yLmlzc3Vlcykge1xuICAgICAgICBjb25zdCBmaWVsZEtleSA9IGlzc3VlLnBhdGguam9pbignLicpXG4gICAgICAgIGVycm9yc1tmaWVsZEtleV0gPSBpc3N1ZS5tZXNzYWdlXG4gICAgICB9XG4gICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3JzIH1cbiAgICB9LFxuXG4gICAgdmFsaWRhdGVTdGVwKHN0ZXBJZDogc3RyaW5nKSB7XG4gICAgICBjb25zdCBzdGVwRmllbGRzOiBGb3JtRmllbGRbXSA9IFtdXG4gICAgICBmb3IgKGNvbnN0IFssIG5vZGVdIG9mIGdyYXBoLm5vZGVzKSB7XG4gICAgICAgIGlmIChub2RlLmZpZWxkLnN0ZXBJZCA9PT0gc3RlcElkICYmIG5vZGUuaXNWaXNpYmxlICYmXG4gICAgICAgICAgICBub2RlLmZpZWxkLnR5cGUgIT09ICdTRUNUSU9OX0JSRUFLJyAmJiBub2RlLmZpZWxkLnR5cGUgIT09ICdGSUVMRF9HUk9VUCcpIHtcbiAgICAgICAgICBzdGVwRmllbGRzLnB1c2gobm9kZS5maWVsZClcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoc3RlcEZpZWxkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgZXJyb3JzOiB7fSB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNjaGVtYSA9IGdlbmVyYXRlU3RlcFpvZFNjaGVtYShzdGVwRmllbGRzKVxuICAgICAgY29uc3QgdmFsdWVzID0gdGhpcy5nZXRWYWx1ZXMoKVxuICAgICAgY29uc3Qgc3RlcFZhbHVlczogRm9ybVZhbHVlcyA9IHt9XG4gICAgICBmb3IgKGNvbnN0IGYgb2Ygc3RlcEZpZWxkcykge1xuICAgICAgICBzdGVwVmFsdWVzW2Yua2V5XSA9IHZhbHVlc1tmLmtleV1cbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVzdWx0ID0gc2NoZW1hLnNhZmVQYXJzZShzdGVwVmFsdWVzKVxuICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGVycm9yczoge30gfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBlcnJvcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fVxuICAgICAgZm9yIChjb25zdCBpc3N1ZSBvZiByZXN1bHQuZXJyb3IuaXNzdWVzKSB7XG4gICAgICAgIGNvbnN0IGZpZWxkS2V5ID0gaXNzdWUucGF0aC5qb2luKCcuJylcbiAgICAgICAgZXJyb3JzW2ZpZWxkS2V5XSA9IGlzc3VlLm1lc3NhZ2VcbiAgICAgIH1cbiAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcnMgfVxuICAgIH0sXG5cbiAgICBjb2xsZWN0U3VibWlzc2lvblZhbHVlcygpOiBGb3JtVmFsdWVzIHtcbiAgICAgIHJldHVybiBjb2xsZWN0U3VibWlzc2lvblZhbHVlcyhncmFwaClcbiAgICB9LFxuXG4gICAgZ2V0Q29tcHV0ZWRWYWx1ZShrZXk6IEZpZWxkS2V5KTogdW5rbm93biB7XG4gICAgICBjb25zdCBjb25maWcgPSBjb21wdXRlZEV4cHJlc3Npb25zLmdldChrZXkpXG4gICAgICBpZiAoIWNvbmZpZykge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICB9XG4gICAgICByZXR1cm4gZXZhbHVhdGVTYWZlRXhwcmVzc2lvbihjb25maWcuZXhwcmVzc2lvbiwgZ2V0Q3VycmVudFZhbHVlcyhncmFwaCkpXG4gICAgfSxcblxuICAgIHJlZ2lzdGVyQ29tcHV0ZWQoa2V5OiBGaWVsZEtleSwgZXhwcmVzc2lvbjogc3RyaW5nLCBkZXBlbmRzT246IEZpZWxkS2V5W10pOiB2b2lkIHtcbiAgICAgIGNvbXB1dGVkRXhwcmVzc2lvbnMuc2V0KGtleSwgeyBleHByZXNzaW9uLCBkZXBlbmRzT24gfSlcbiAgICAgIC8vIEFkZCBkZXBlbmRlbmN5IGVkZ2VzIHRvIHRoZSBncmFwaFxuICAgICAgZm9yIChjb25zdCBkZXBLZXkgb2YgZGVwZW5kc09uKSB7XG4gICAgICAgIGlmIChncmFwaC5kZXBlbmRlbnRzLmhhcyhkZXBLZXkpKSB7XG4gICAgICAgICAgZ3JhcGguZGVwZW5kZW50cy5nZXQoZGVwS2V5KSEuYWRkKGtleSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICB1bmRvKCk6IEZvcm1WYWx1ZXMgfCBudWxsIHtcbiAgICAgIGlmICh1bmRvU3RhY2subGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBudWxsXG4gICAgICB9XG4gICAgICBjb25zdCBwcmV2aW91c1ZhbHVlcyA9IHVuZG9TdGFjay5wb3AoKSFcbiAgICAgIGNvbnN0IGN1cnJlbnRWYWx1ZXMgPSBnZXRDdXJyZW50VmFsdWVzKGdyYXBoKVxuICAgICAgcmVkb1N0YWNrLnB1c2goY3VycmVudFZhbHVlcylcblxuICAgICAgLy8gUmVzdG9yZSBhbGwgdmFsdWVzIGZyb20gdGhlIHByZXZpb3VzIHN0YXRlXG4gICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhwcmV2aW91c1ZhbHVlcykpIHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IGdyYXBoLm5vZGVzLmdldChrZXkpXG4gICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgbm9kZS52YWx1ZSA9IHZhbHVlXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHByZXZpb3VzVmFsdWVzXG4gICAgfSxcblxuICAgIHJlZG8oKTogRm9ybVZhbHVlcyB8IG51bGwge1xuICAgICAgaWYgKHJlZG9TdGFjay5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgIH1cbiAgICAgIGNvbnN0IG5leHRWYWx1ZXMgPSByZWRvU3RhY2sucG9wKCkhXG4gICAgICBjb25zdCBjdXJyZW50VmFsdWVzID0gZ2V0Q3VycmVudFZhbHVlcyhncmFwaClcbiAgICAgIHVuZG9TdGFjay5wdXNoKGN1cnJlbnRWYWx1ZXMpXG5cbiAgICAgIC8vIFJlc3RvcmUgYWxsIHZhbHVlcyBmcm9tIHRoZSBuZXh0IHN0YXRlXG4gICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhuZXh0VmFsdWVzKSkge1xuICAgICAgICBjb25zdCBub2RlID0gZ3JhcGgubm9kZXMuZ2V0KGtleSlcbiAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICBub2RlLnZhbHVlID0gdmFsdWVcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV4dFZhbHVlc1xuICAgIH0sXG5cbiAgICBjYW5VbmRvKCk6IGJvb2xlYW4ge1xuICAgICAgcmV0dXJuIHVuZG9TdGFjay5sZW5ndGggPiAwXG4gICAgfSxcblxuICAgIGNhblJlZG8oKTogYm9vbGVhbiB7XG4gICAgICByZXR1cm4gcmVkb1N0YWNrLmxlbmd0aCA+IDBcbiAgICB9LFxuXG4gICAgZ2V0RmllbGRQZXJtaXNzaW9uKGtleTogRmllbGRLZXksIHJvbGU6IHN0cmluZyk6IFBlcm1pc3Npb25MZXZlbCB7XG4gICAgICBjb25zdCBmaWVsZCA9IGZpZWxkS2V5VG9GaWVsZC5nZXQoa2V5KVxuICAgICAgaWYgKCFmaWVsZCB8fCAhZmllbGQucGVybWlzc2lvbnMpIHtcbiAgICAgICAgcmV0dXJuICdlZGl0YWJsZSdcbiAgICAgIH1cblxuICAgICAgY29uc3QgcGVybWlzc2lvbiA9IGZpZWxkLnBlcm1pc3Npb25zLmZpbmQocCA9PiBwLnJvbGUgPT09IHJvbGUpXG4gICAgICByZXR1cm4gcGVybWlzc2lvbj8ubGV2ZWwgPz8gJ2VkaXRhYmxlJ1xuICAgIH0sXG5cbiAgICBnZXRMb2NhbGl6ZWRMYWJlbChrZXk6IEZpZWxkS2V5LCBsb2NhbGU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICBjb25zdCBmaWVsZCA9IGZpZWxkS2V5VG9GaWVsZC5nZXQoa2V5KVxuICAgICAgaWYgKCFmaWVsZCkge1xuICAgICAgICByZXR1cm4gJydcbiAgICAgIH1cbiAgICAgIHJldHVybiBmaWVsZC5pMThuTGFiZWxzPy5bbG9jYWxlXSA/PyBmaWVsZC5sYWJlbFxuICAgIH0sXG5cbiAgICBhZGRSZXBlYXRJbnN0YW5jZShncm91cEtleTogRmllbGRLZXkpOiB2b2lkIHtcbiAgICAgIGNvbnN0IGdyb3VwRmllbGQgPSBmaWVsZEtleVRvRmllbGQuZ2V0KGdyb3VwS2V5KVxuICAgICAgaWYgKCFncm91cEZpZWxkKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBjb25zdCByZXBlYXRDb25maWcgPSBncm91cEZpZWxkLmNvbmZpZyBhcyBhbnlcbiAgICAgIGlmICghcmVwZWF0Q29uZmlnLnRlbXBsYXRlRmllbGRzKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICAvLyBDbG9uZSB0ZW1wbGF0ZSBmaWVsZHMnIGRlZmF1bHQgdmFsdWVzXG4gICAgICBjb25zdCBuZXdJbnN0YW5jZTogRm9ybVZhbHVlcyA9IHt9XG4gICAgICBmb3IgKGNvbnN0IHRlbXBsYXRlRmllbGQgb2YgcmVwZWF0Q29uZmlnLnRlbXBsYXRlRmllbGRzKSB7XG4gICAgICAgIG5ld0luc3RhbmNlW3RlbXBsYXRlRmllbGQua2V5XSA9IGdldEN1cnJlbnRWYWx1ZXMoZ3JhcGgpW3RlbXBsYXRlRmllbGQua2V5XSA/PyBnZXREZWZhdWx0VmFsdWUodGVtcGxhdGVGaWVsZClcbiAgICAgIH1cblxuICAgICAgaWYgKCFyZXBlYXRJbnN0YW5jZXMuaGFzKGdyb3VwS2V5KSkge1xuICAgICAgICByZXBlYXRJbnN0YW5jZXMuc2V0KGdyb3VwS2V5LCBbXSlcbiAgICAgIH1cbiAgICAgIHJlcGVhdEluc3RhbmNlcy5nZXQoZ3JvdXBLZXkpIS5wdXNoKG5ld0luc3RhbmNlKVxuICAgIH0sXG5cbiAgICByZW1vdmVSZXBlYXRJbnN0YW5jZShncm91cEtleTogRmllbGRLZXksIGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgICAgIGNvbnN0IGluc3RhbmNlcyA9IHJlcGVhdEluc3RhbmNlcy5nZXQoZ3JvdXBLZXkpXG4gICAgICBpZiAoaW5zdGFuY2VzICYmIGluZGV4ID49IDAgJiYgaW5kZXggPCBpbnN0YW5jZXMubGVuZ3RoKSB7XG4gICAgICAgIGluc3RhbmNlcy5zcGxpY2UoaW5kZXgsIDEpXG4gICAgICB9XG4gICAgfSxcblxuICAgIGdldFJlcGVhdEluc3RhbmNlcyhncm91cEtleTogRmllbGRLZXkpOiBGb3JtVmFsdWVzW10ge1xuICAgICAgcmV0dXJuIHJlcGVhdEluc3RhbmNlcy5nZXQoZ3JvdXBLZXkpID8/IFtdXG4gICAgfSxcbiAgfVxufVxuXG4vKipcbiAqIFNhZmVseSBldmFsdWF0ZSBhIG1hdGhlbWF0aWNhbC9sb2dpY2FsIGV4cHJlc3Npb24gd2l0aCBmaWVsZCB2YWx1ZXMgYXMgY29udGV4dC5cbiAqIFVzZXMgRnVuY3Rpb24gY29uc3RydWN0b3IgdG8gY3JlYXRlIGEgc2NvcGVkIGV2YWx1YXRvci5cbiAqL1xuZnVuY3Rpb24gZXZhbHVhdGVTYWZlRXhwcmVzc2lvbihleHByZXNzaW9uOiBzdHJpbmcsIHZhbHVlczogRm9ybVZhbHVlcyk6IHVua25vd24ge1xuICB0cnkge1xuICAgIC8vIENyZWF0ZSBhIHNhZmUgZXZhbHVhdG9yIGZ1bmN0aW9uIHdpdGggZmllbGQgdmFsdWVzIGFzIHBhcmFtZXRlcnNcbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXModmFsdWVzKVxuICAgIGNvbnN0IGFyZ3MgPSBrZXlzLm1hcChrID0+IHZhbHVlc1trXSlcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbmV3LWZ1bmNcbiAgICBjb25zdCBldmFsdWF0b3IgPSBuZXcgRnVuY3Rpb24oLi4ua2V5cywgYHJldHVybiAoJHtleHByZXNzaW9ufSlgKVxuICAgIHJldHVybiBldmFsdWF0b3IoLi4uYXJncylcbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byBldmFsdWF0ZSBjb21wdXRlZCBleHByZXNzaW9uOiAke2V4cHJlc3Npb259YCwgZSlcbiAgICByZXR1cm4gbnVsbFxuICB9XG59XG5cbi8vIOKUgOKUgOKUgCBGb3JtIFN0ZXBwZXIgRmFjdG9yeSDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuLyoqXG4gKiBDcmVhdGUgYSBmb3JtIHN0ZXBwZXIgaW5zdGFuY2UgZm9yIG11bHRpLXN0ZXAgZm9ybSBuYXZpZ2F0aW9uLlxuICpcbiAqIFRoZSBzdGVwcGVyIG1hbmFnZXMgc3RlcCBvcmRlcmluZywgc2tpcCBjb25kaXRpb25zLCBjb21wbGV0aW9uIHRyYWNraW5nLFxuICogYW5kIG5hdmlnYXRpb24gKG5leHQvYmFjay9qdW1wKS4gSXQgd29ya3MgaW5kZXBlbmRlbnRseSBvZiBhbnkgZnJhbWV3b3JrLlxuICpcbiAqIEBwYXJhbSBzdGVwcyAtIEFycmF5IG9mIEZvcm1TdGVwIGRlZmluaXRpb25zIGluIG9yZGVyXG4gKiBAcGFyYW0gZW5naW5lIC0gQSBGb3JtRW5naW5lIGluc3RhbmNlIChmb3IgZmllbGQgZ3JhcGggYWNjZXNzKVxuICogQHBhcmFtIGluaXRpYWxJbmRleCAtIFN0YXJ0aW5nIHN0ZXAgaW5kZXggKGRlZmF1bHQ6IDApXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBjcmVhdGVGb3JtRW5naW5lLCBjcmVhdGVGb3JtU3RlcHBlciB9IGZyb20gJ0BzbmFyanVuOTgvZGZlLWNvcmUnXG4gKlxuICogY29uc3QgZW5naW5lID0gY3JlYXRlRm9ybUVuZ2luZShmaWVsZHMsIGRhdGEpXG4gKiBjb25zdCBzdGVwcGVyID0gY3JlYXRlRm9ybVN0ZXBwZXIoc3RlcHMsIGVuZ2luZSlcbiAqXG4gKiBjb25zb2xlLmxvZyhzdGVwcGVyLmdldEN1cnJlbnRTdGVwKCk/LnN0ZXAudGl0bGUpIC8vIFwiUGVyc29uYWwgSW5mb1wiXG4gKlxuICogY29uc3QgbmV4dFN0ZXAgPSBzdGVwcGVyLmdvTmV4dCgpXG4gKiBpZiAobmV4dFN0ZXApIHtcbiAqICAgY29uc29sZS5sb2cobmV4dFN0ZXAuc3RlcC50aXRsZSkgLy8gXCJKb2IgRGV0YWlsc1wiXG4gKiB9XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZvcm1TdGVwcGVyKFxuICBzdGVwczogRm9ybVN0ZXBbXSxcbiAgZW5naW5lOiBGb3JtRW5naW5lLFxuICBpbml0aWFsSW5kZXg6IG51bWJlciA9IDAsXG4pOiBGb3JtU3RlcHBlciB7XG4gIGNvbnN0IHN0ZXBHcmFwaCA9IGJ1aWxkU3RlcEdyYXBoKHN0ZXBzLCBlbmdpbmUuZ3JhcGgpXG4gIGxldCBjdXJyZW50SW5kZXggPSBpbml0aWFsSW5kZXhcblxuICByZXR1cm4ge1xuICAgIHN0ZXBHcmFwaCxcblxuICAgIGdldEN1cnJlbnRTdGVwKCk6IFN0ZXBOb2RlU3RhdGUgfCBudWxsIHtcbiAgICAgIGNvbnN0IHZpc2libGUgPSBnZXRWaXNpYmxlU3RlcHMoc3RlcEdyYXBoKVxuICAgICAgcmV0dXJuIHZpc2libGVbY3VycmVudEluZGV4XSA/PyBudWxsXG4gICAgfSxcblxuICAgIGdldFZpc2libGVTdGVwcygpOiBTdGVwTm9kZVN0YXRlW10ge1xuICAgICAgcmV0dXJuIGdldFZpc2libGVTdGVwcyhzdGVwR3JhcGgpXG4gICAgfSxcblxuICAgIGdldEN1cnJlbnRJbmRleCgpOiBudW1iZXIge1xuICAgICAgcmV0dXJuIGN1cnJlbnRJbmRleFxuICAgIH0sXG5cbiAgICBjYW5Hb0JhY2soKTogYm9vbGVhbiB7XG4gICAgICByZXR1cm4gY3VycmVudEluZGV4ID4gMFxuICAgIH0sXG5cbiAgICBpc0xhc3RTdGVwKCk6IGJvb2xlYW4ge1xuICAgICAgY29uc3QgdmlzaWJsZSA9IGdldFZpc2libGVTdGVwcyhzdGVwR3JhcGgpXG4gICAgICByZXR1cm4gY3VycmVudEluZGV4ID09PSB2aXNpYmxlLmxlbmd0aCAtIDFcbiAgICB9LFxuXG4gICAgZ29OZXh0KCk6IFN0ZXBOb2RlU3RhdGUgfCBudWxsIHtcbiAgICAgIGNvbnN0IHZpc2libGUgPSBnZXRWaXNpYmxlU3RlcHMoc3RlcEdyYXBoKVxuICAgICAgaWYgKGN1cnJlbnRJbmRleCA8IHZpc2libGUubGVuZ3RoIC0gMSkge1xuICAgICAgICBjdXJyZW50SW5kZXgrK1xuICAgICAgICByZXR1cm4gdmlzaWJsZVtjdXJyZW50SW5kZXhdXG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH0sXG5cbiAgICBnb0JhY2soKTogU3RlcE5vZGVTdGF0ZSB8IG51bGwge1xuICAgICAgaWYgKGN1cnJlbnRJbmRleCA+IDApIHtcbiAgICAgICAgY3VycmVudEluZGV4LS1cbiAgICAgICAgY29uc3QgdmlzaWJsZSA9IGdldFZpc2libGVTdGVwcyhzdGVwR3JhcGgpXG4gICAgICAgIHJldHVybiB2aXNpYmxlW2N1cnJlbnRJbmRleF1cbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsXG4gICAgfSxcblxuICAgIGp1bXBUbyhpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gICAgICBjb25zdCB2aXNpYmxlID0gZ2V0VmlzaWJsZVN0ZXBzKHN0ZXBHcmFwaClcbiAgICAgIGlmIChpbmRleCA+PSAwICYmIGluZGV4IDwgdmlzaWJsZS5sZW5ndGgpIHtcbiAgICAgICAgY3VycmVudEluZGV4ID0gaW5kZXhcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgbWFya0NvbXBsZXRlKHN0ZXBJZDogc3RyaW5nKTogdm9pZCB7XG4gICAgICBjb25zdCBzdGVwTm9kZSA9IHN0ZXBHcmFwaC5zdGVwcy5nZXQoc3RlcElkKVxuICAgICAgaWYgKHN0ZXBOb2RlKSB7XG4gICAgICAgIHN0ZXBOb2RlLmlzQ29tcGxldGUgPSB0cnVlXG4gICAgICB9XG4gICAgfSxcblxuICAgIGdldFByb2dyZXNzKCkge1xuICAgICAgY29uc3QgdmlzaWJsZSA9IGdldFZpc2libGVTdGVwcyhzdGVwR3JhcGgpXG4gICAgICByZXR1cm4ge1xuICAgICAgICBjdXJyZW50OiBjdXJyZW50SW5kZXggKyAxLFxuICAgICAgICB0b3RhbDogdmlzaWJsZS5sZW5ndGgsXG4gICAgICAgIHBlcmNlbnQ6IHZpc2libGUubGVuZ3RoID4gMFxuICAgICAgICAgID8gTWF0aC5yb3VuZCgoKGN1cnJlbnRJbmRleCArIDEpIC8gdmlzaWJsZS5sZW5ndGgpICogMTAwKVxuICAgICAgICAgIDogMCxcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgZ2V0TmV4dEJyYW5jaCgpOiBTdGVwTm9kZVN0YXRlIHwgbnVsbCB7XG4gICAgICBjb25zdCBjdXJyZW50U3RlcCA9IHRoaXMuZ2V0Q3VycmVudFN0ZXAoKVxuICAgICAgaWYgKCFjdXJyZW50U3RlcCB8fCAhY3VycmVudFN0ZXAuc3RlcC5icmFuY2hlcykge1xuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgfVxuXG4gICAgICBjb25zdCB2YWx1ZXMgPSBlbmdpbmUuZ2V0VmFsdWVzKClcblxuICAgICAgLy8gRXZhbHVhdGUgZWFjaCBicmFuY2ggY29uZGl0aW9uIGluIG9yZGVyXG4gICAgICBmb3IgKGNvbnN0IGJyYW5jaCBvZiBjdXJyZW50U3RlcC5zdGVwLmJyYW5jaGVzKSB7XG4gICAgICAgIGxldCBtYXRjaGVzID0gZmFsc2VcbiAgICAgICAgaWYgKHR5cGVvZiBicmFuY2guY29uZGl0aW9uID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIC8vIFN0cmluZyBleHByZXNzaW9uOiBldmFsdWF0ZSBhcyBhIHNhZmUgZXhwcmVzc2lvblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBtYXRjaGVzID0gISFldmFsdWF0ZVNhZmVFeHByZXNzaW9uKGJyYW5jaC5jb25kaXRpb24sIHZhbHVlcylcbiAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIG1hdGNoZXMgPSBmYWxzZVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBGaWVsZENvbmRpdGlvbnMgb2JqZWN0OiBjb21waWxlIGFuZCBldmFsdWF0ZVxuICAgICAgICAgIGNvbnN0IGNvbXBpbGVkQ29uZGl0aW9uID0gY29tcGlsZUNvbmRpdGlvbihicmFuY2guY29uZGl0aW9uKVxuICAgICAgICAgIG1hdGNoZXMgPSBjb21waWxlZENvbmRpdGlvbih2YWx1ZXMpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hdGNoZXMpIHtcbiAgICAgICAgICAvLyBGaW5kIHRoZSB0YXJnZXQgc3RlcCBpbiB0aGUgc3RlcEdyYXBoXG4gICAgICAgICAgY29uc3QgdGFyZ2V0U3RlcCA9IHN0ZXBHcmFwaC5zdGVwcy5nZXQoYnJhbmNoLnRhcmdldFN0ZXBJZClcbiAgICAgICAgICBpZiAodGFyZ2V0U3RlcCAmJiB0YXJnZXRTdGVwLmlzVmlzaWJsZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRhcmdldFN0ZXBcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG51bGxcbiAgICB9LFxuXG4gICAgZ29OZXh0QnJhbmNoKCk6IFN0ZXBOb2RlU3RhdGUgfCBudWxsIHtcbiAgICAgIGNvbnN0IGJyYW5jaFRhcmdldCA9IHRoaXMuZ2V0TmV4dEJyYW5jaCgpXG4gICAgICBpZiAoYnJhbmNoVGFyZ2V0KSB7XG4gICAgICAgIC8vIEZpbmQgdGhlIHZpc2libGUgc3RlcCBpbmRleCBvZiB0aGUgdGFyZ2V0XG4gICAgICAgIGNvbnN0IHZpc2libGUgPSBnZXRWaXNpYmxlU3RlcHMoc3RlcEdyYXBoKVxuICAgICAgICBjb25zdCB0YXJnZXRJbmRleCA9IHZpc2libGUuZmluZEluZGV4KHMgPT4gcy5zdGVwLmlkID09PSBicmFuY2hUYXJnZXQuc3RlcC5pZClcbiAgICAgICAgaWYgKHRhcmdldEluZGV4ID49IDApIHtcbiAgICAgICAgICBjdXJyZW50SW5kZXggPSB0YXJnZXRJbmRleFxuICAgICAgICAgIHJldHVybiB2aXNpYmxlW3RhcmdldEluZGV4XVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEZhbGwgYmFjayB0byBzZXF1ZW50aWFsIG5hdmlnYXRpb24gaWYgbm8gYnJhbmNoIG1hdGNoZXNcbiAgICAgIHJldHVybiB0aGlzLmdvTmV4dCgpXG4gICAgfSxcbiAgfVxufVxuIl19