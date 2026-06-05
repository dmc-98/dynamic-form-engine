"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditFormAccessibility = auditFormAccessibility;
exports.summarizeA11yAudit = summarizeA11yAudit;
// ─── WCAG 2.1 AA Compliance Rules ───────────────────────────────────────────
/**
 * Audits a form for WCAG 2.1 AA accessibility compliance issues.
 *
 * Checks for:
 * - Missing labels (WCAG 1.3.1 Info and Relationships)
 * - Missing descriptions for complex fields (WCAG 1.3.1)
 * - Color contrast guidance (WCAG 1.4.3)
 * - Keyboard navigation support (WCAG 2.1.1 Keyboard)
 * - Missing ARIA attributes (WCAG 4.1.2 Name, Role, Value)
 * - Form error announcement (WCAG 3.3.1 Error Identification)
 * - Step indicator semantics (WCAG 1.3.1)
 * - Empty field groups (WCAG 1.3.1)
 * - Missing required field indicators (WCAG 3.3.2 Labels or Instructions)
 *
 * @example
 * ```ts
 * const issues = auditFormAccessibility(fields, steps)
 * const criticalIssues = issues.filter(i => i.severity === 'critical')
 * ```
 */
function auditFormAccessibility(fields, steps) {
    var _a, _b;
    const issues = [];
    const fieldKeyMap = new Map(fields.map((f) => [f.key, f]));
    // ─── Rule 1: Missing Labels (WCAG 1.3.1) ─────────────────────────────────
    for (const field of fields) {
        if (!field.label || field.label.trim() === '') {
            issues.push({
                severity: 'critical',
                rule: 'WCAG 1.3.1 - Missing Label',
                message: `Field "${field.key}" has no label. All inputs must be associated with a label.`,
                fieldKey: field.key,
                suggestion: `Add a descriptive label to field "${field.key}". Labels must be meaningful and identify the purpose of the field.`,
            });
        }
    }
    // ─── Rule 2: Complex Fields Without Descriptions (WCAG 1.3.1) ──────────────
    const complexFieldTypes = [
        'FIELD_GROUP',
        'RICH_TEXT',
        'DATE_RANGE',
        'ADDRESS',
        'RATING',
        'SCALE',
    ];
    for (const field of fields) {
        if (complexFieldTypes.includes(field.type) &&
            (!field.description || field.description.trim() === '')) {
            issues.push({
                severity: 'serious',
                rule: 'WCAG 1.3.1 - Missing Description for Complex Field',
                message: `${field.type} field "${field.key}" lacks a description to explain its purpose.`,
                fieldKey: field.key,
                suggestion: `Add a descriptive text to explain how to use the ${field.type} field. Use "field.description" to provide context.`,
            });
        }
    }
    // ─── Rule 3: Color-Only Instructions (WCAG 1.4.1 Use of Color) ────────────
    for (const field of fields) {
        const helpText = ((_a = field.config) === null || _a === void 0 ? void 0 : _a.helpText) || '';
        if (helpText && /color|red|blue|green|yellow/i.test(helpText)) {
            issues.push({
                severity: 'moderate',
                rule: 'WCAG 1.4.1 - Color-Only Information',
                message: `Field "${field.key}" help text relies on color to convey information.`,
                fieldKey: field.key,
                suggestion: `Avoid using color alone to convey information. Use text labels, icons, or patterns in addition to color.`,
            });
        }
    }
    // ─── Rule 4: Keyboard Navigation (WCAG 2.1.1 Keyboard) ───────────────────
    const nonKeyboardAccessibleTypes = ['SIGNATURE', 'FILE_UPLOAD'];
    for (const field of fields) {
        if (nonKeyboardAccessibleTypes.includes(field.type)) {
            issues.push({
                severity: 'serious',
                rule: 'WCAG 2.1.1 - Limited Keyboard Navigation',
                message: `${field.type} field "${field.key}" may have limited keyboard accessibility.`,
                fieldKey: field.key,
                suggestion: `Ensure the ${field.type} field has keyboard-accessible alternatives or clear instructions for keyboard users.`,
            });
        }
    }
    // ─── Rule 5: Missing ARIA Attributes (WCAG 4.1.2 Name, Role, Value) ───────
    for (const field of fields) {
        // Check for required fields without visual/aria indicator
        if (field.required &&
            (!field.label.includes('*') && !((_b = field.description) === null || _b === void 0 ? void 0 : _b.includes('required')))) {
            issues.push({
                severity: 'serious',
                rule: 'WCAG 3.3.2 - Required Field Not Indicated',
                message: `Required field "${field.key}" does not have a visual indicator (e.g., asterisk).`,
                fieldKey: field.key,
                suggestion: `Add a required field indicator (* or "required") to the label or description of field "${field.key}".`,
            });
        }
        // Check for fields that need aria-describedby
        if (field.description && field.type === 'RICH_TEXT') {
            issues.push({
                severity: 'moderate',
                rule: 'WCAG 4.1.2 - Missing aria-describedby',
                message: `${field.type} field "${field.key}" should have aria-describedby linking to description.`,
                fieldKey: field.key,
                suggestion: `Ensure the field renderer includes aria-describedby attribute linking to the description element.`,
            });
        }
    }
    // ─── Rule 6: Error Announcement (WCAG 3.3.1 Error Identification) ────────
    for (const field of fields) {
        if (field.type === 'EMAIL' || field.type === 'URL') {
            issues.push({
                severity: 'moderate',
                rule: 'WCAG 3.3.1 - Error Prevention',
                message: `${field.type} field "${field.key}" requires clear error messaging.`,
                fieldKey: field.key,
                suggestion: `Ensure validation errors for "${field.key}" are announced to screen readers using role="alert" and aria-live="polite".`,
            });
        }
    }
    // ─── Rule 7: Step Indicator Semantics (WCAG 1.3.1) ───────────────────────
    if (steps && steps.length > 0) {
        for (const step of steps) {
            if (!step.title || step.title.trim() === '') {
                issues.push({
                    severity: 'serious',
                    rule: 'WCAG 1.3.1 - Missing Step Title',
                    message: `Step "${step.id}" has no title to identify its purpose.`,
                    suggestion: `Add a descriptive title to step "${step.id}" to help users understand the form flow.`,
                });
            }
        }
    }
    // ─── Rule 8: Field Groups Must Have Fields (WCAG 1.3.1) ──────────────────
    for (const field of fields) {
        if (field.type === 'FIELD_GROUP') {
            const hasChildren = (field.children && field.children.length > 0) ||
                fields.some((f) => f.parentFieldId === field.id);
            if (!hasChildren) {
                issues.push({
                    severity: 'moderate',
                    rule: 'WCAG 1.3.1 - Empty Field Group',
                    message: `Field group "${field.key}" is empty and serves no semantic purpose.`,
                    fieldKey: field.key,
                    suggestion: `Either add fields to this group or remove it if not needed.`,
                });
            }
        }
    }
    // ─── Rule 9: Form Structure (WCAG 1.3.1) ──────────────────────────────────
    if (!steps || steps.length === 0) {
        if (fields.length > 15) {
            issues.push({
                severity: 'moderate',
                rule: 'WCAG 2.4.8 - Form Structure',
                message: `Form has ${fields.length} fields without step grouping, which may overwhelm users.`,
                suggestion: `Consider breaking the form into logical steps using FormStep definitions for better user experience and accessibility.`,
            });
        }
    }
    // ─── Rule 10: Placeholder Not Substituting Label (WCAG 1.3.5) ────────────
    for (const field of fields) {
        const config = field.config;
        if ((config === null || config === void 0 ? void 0 : config.placeholder) && !field.label) {
            issues.push({
                severity: 'critical',
                rule: 'WCAG 1.3.5 - Placeholder Instead of Label',
                message: `Field "${field.key}" uses placeholder as label, which disappears when user starts typing.`,
                fieldKey: field.key,
                suggestion: `Add an explicit label to field "${field.key}". Placeholders should only be used as hints, not as labels.`,
            });
        }
    }
    // ─── Rule 11: Radio Button Grouping (WCAG 1.3.1) ───────────────────────
    const radioFields = fields.filter((f) => f.type === 'RADIO');
    for (const field of radioFields) {
        if (!field.description) {
            issues.push({
                severity: 'moderate',
                rule: 'WCAG 1.3.1 - Radio Button Group Not Labeled',
                message: `Radio button group "${field.key}" lacks a group label/legend.`,
                fieldKey: field.key,
                suggestion: `Add a descriptive label or legend to the radio button group to identify its purpose.`,
            });
        }
    }
    // ─── Rule 12: Conditional Fields (WCAG 4.1.2) ──────────────────────────
    for (const field of fields) {
        if (field.conditions) {
            issues.push({
                severity: 'minor',
                rule: 'WCAG 4.1.2 - Conditional Field Visibility',
                message: `Field "${field.key}" has conditional visibility that may confuse screen reader users.`,
                fieldKey: field.key,
                suggestion: `Ensure field visibility changes are announced dynamically using aria-live regions or dynamic form notifications.`,
            });
        }
    }
    return issues;
}
/**
 * Summarize accessibility audit results by severity level.
 */
function summarizeA11yAudit(issues) {
    return {
        critical: issues.filter((i) => i.severity === 'critical').length,
        serious: issues.filter((i) => i.severity === 'serious').length,
        moderate: issues.filter((i) => i.severity === 'moderate').length,
        minor: issues.filter((i) => i.severity === 'minor').length,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFjY2Vzc2liaWxpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFvQ0Esd0RBc05DO0FBS0QsZ0RBT0M7QUF4UEQsK0VBQStFO0FBRS9FOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUJHO0FBQ0gsU0FBZ0Isc0JBQXNCLENBQ3BDLE1BQW1CLEVBQ25CLEtBQWtCOztJQUVsQixNQUFNLE1BQU0sR0FBZ0IsRUFBRSxDQUFBO0lBQzlCLE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFFMUQsNEVBQTRFO0lBRTVFLEtBQUssTUFBTSxLQUFLLElBQUksTUFBTSxFQUFFLENBQUM7UUFDM0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQztZQUM5QyxNQUFNLENBQUMsSUFBSSxDQUFDO2dCQUNWLFFBQVEsRUFBRSxVQUFVO2dCQUNwQixJQUFJLEVBQUUsNEJBQTRCO2dCQUNsQyxPQUFPLEVBQUUsVUFBVSxLQUFLLENBQUMsR0FBRyw2REFBNkQ7Z0JBQ3pGLFFBQVEsRUFBRSxLQUFLLENBQUMsR0FBRztnQkFDbkIsVUFBVSxFQUFFLHFDQUFxQyxLQUFLLENBQUMsR0FBRyxxRUFBcUU7YUFDaEksQ0FBQyxDQUFBO1FBQ0osQ0FBQztJQUNILENBQUM7SUFFRCw4RUFBOEU7SUFFOUUsTUFBTSxpQkFBaUIsR0FBRztRQUN4QixhQUFhO1FBQ2IsV0FBVztRQUNYLFlBQVk7UUFDWixTQUFTO1FBQ1QsUUFBUTtRQUNSLE9BQU87S0FDUixDQUFBO0lBRUQsS0FBSyxNQUFNLEtBQUssSUFBSSxNQUFNLEVBQUUsQ0FBQztR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UUFBUSxFQUFFLE9BQU87Z0JBQ2pCLElBQUksRUFBRSwyQ0FBMkM7Z0JBQ2pELE9BQU8sRUFBRSxVQUFVLEtBQUssQ0FBQyxHQUFHLG9FQUFvRTtnQkFDaEcsUUFBUSxFQUFFLEtBQUssQ0FBQyxHQUFHO2dCQUNuQixVQUFVLEVBQUUsa0hBQWtIO2FBQy9ILENBQUMsQ0FBQTtRQUNKLENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTyxNQUFNLENBQUE7QUFDZixDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFnQixrQkFBa0IsQ0FBQyxNQUFtQjtJQUNwRCxPQUFPO1FBQ0wsUUFBUSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLEtBQUssVUFBVSxDQUFDLENBQUMsTUFBTTtRQUNoRSxPQUFPLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsS0FBSyxTQUFTLENBQUMsQ0FBQyxNQUFNO1FBQzlELFFBQVEsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxLQUFLLFVBQVUsQ0FBQyxDQUFDLE1BQU07UUFDaEUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLEtBQUssT0FBTyxDQUFDLENBQUMsTUFBTTtLQUMzRCxDQUFBO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgRm9ybUZpZWxkLCBGb3JtU3RlcCB9IGZyb20gJy4vdHlwZXMnXG5cbi8vIOKUgOKUgOKUgCBUeXBlcyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuZXhwb3J0IHR5cGUgQTExeVNldmVyaXR5ID0gJ2NyaXRpY2FsJyB8ICdzZXJpb3VzJyB8ICdtb2RlcmF0ZScgfCAnbWlub3InXG5cbmV4cG9ydCBpbnRlcmZhY2UgQTExeUlzc3VlIHtcbiAgc2V2ZXJpdHk6IEExMXlTZXZlcml0eVxuICBydWxlOiBzdHJpbmdcbiAgbWVzc2FnZTogc3RyaW5nXG4gIGZpZWxkS2V5Pzogc3RyaW5nXG4gIHN1Z2dlc3Rpb246IHN0cmluZ1xufVxuXG4vLyDilIDilIDilIAgV0NBRyAyLjEgQUEgQ29tcGxpYW5jZSBSdWxlcyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuLyoqXG4gKiBBdWRpdHMgYSBmb3JtIGZvciBXQ0FHIDIuMSBBQSBhY2Nlc3NpYmlsaXR5IGNvbXBsaWFuY2UgaXNzdWVzLlxuICpcbiAqIENoZWNrcyBmb3I6XG4gKiAtIE1pc3NpbmcgbGFiZWxzIChXQ0FHIDEuMy4xIEluZm8gYW5kIFJlbGF0aW9uc2hpcHMpXG4gKiAtIE1pc3NpbmcgZGVzY3JpcHRpb25zIGZvciBjb21wbGV4IGZpZWxkcyAoV0NBRyAxLjMuMSlcbiAqIC0gQ29sb3IgY29udHJhc3QgZ3VpZGFuY2UgKFdDQUcgMS40LjMpXG4gKiAtIEtleWJvYXJkIG5hdmlnYXRpb24gc3VwcG9ydCAoV0NBRyAyLjEuMSBLZXlib2FyZClcbiAqIC0gTWlzc2luZyBBUklBIGF0dHJpYnV0ZXMgKFdDQUcgNC4xLjIgTmFtZSwgUm9sZSwgVmFsdWUpXG4gKiAtIEZvcm0gZXJyb3IgYW5ub3VuY2VtZW50IChXQ0FHIDMuMy4xIEVycm9yIElkZW50aWZpY2F0aW9uKVxuICogLSBTdGVwIGluZGljYXRvciBzZW1hbnRpY3MgKFdDQUcgMS4zLjEpXG4gKiAtIEVtcHR5IGZpZWxkIGdyb3VwcyAoV0NBRyAxLjMuMSlcbiAqIC0gTWlzc2luZyByZXF1aXJlZCBmaWVsZCBpbmRpY2F0b3JzIChXQ0FHIDMuMy4yIExhYmVscyBvciBJbnN0cnVjdGlvbnMpXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBjb25zdCBpc3N1ZXMgPSBhdWRpdEZvcm1BY2Nlc3NpYmlsaXR5KGZpZWxkcywgc3RlcHMpXG4gKiBjb25zdCBjcml0aWNhbElzc3VlcyA9IGlzc3Vlcy5maWx0ZXIoaSA9PiBpLnNldmVyaXR5ID09PSAnY3JpdGljYWwnKVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdWRpdEZvcm1BY2Nlc3NpYmlsaXR5KFxuICBmaWVsZHM6IEZvcm1GaWVsZFtdLFxuICBzdGVwcz86IEZvcm1TdGVwW11cbik6IEExMXlJc3N1ZVtdIHtcbiAgY29uc3QgaXNzdWVzOiBBMTF5SXNzdWVbXSA9IFtdXG4gIGNvbnN0IGZpZWxkS2V5TWFwID0gbmV3IE1hcChmaWVsZHMubWFwKChmKSA9PiBbZi5rZXksIGZdKSlcblxuICAvLyDilIDilIDilIAgUnVsZSAxOiBNaXNzaW5nIExhYmVscyAoV0NBRyAxLjMuMSkg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbiAgZm9yIChjb25zdCBmaWVsZCBvZiBmaWVsZHMpIHtcbiAgICBpZiAoIWZpZWxkLmxhYmVsIHx8IGZpZWxkLmxhYmVsLnRyaW0oKSA9PT0gJycpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgICAgc2V2ZXJpdHk6ICdjcml0aWNhbCcsXG4gICAgICAgIHJ1bGU6ICdXQ0FHIDEuMy4xIC0gTWlzc2luZyBMYWJlbCcsXG4gICAgICAgIG1lc3NhZ2U6IGBGaWVsZCBcIiR7ZmllbGQua2V5fVwiIGhhcyBubyBsYWJlbC4gQWxsIGlucHV0cyBtdXN0IGJlIGFzc29jaWF0ZWQgd2l0aCBhIGxhYmVsLmAsXG4gICAgICAgIGZpZWxkS2V5OiBmaWVsZC5rZXksXG4gICAgICAgIHN1Z2dlc3Rpb246IGBBZGQgYSBkZXNjcmlwdGl2ZSBsYWJlbCB0byBmaWVsZCBcIiR7ZmllbGQua2V5fVwiLiBMYWJlbHMgbXVzdCBiZSBtZWFuaW5nZnVsIGFuZCBpZGVudGlmeSB0aGUgcHVycG9zZSBvZiB0aGUgZmllbGQuYCxcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgLy8g4pSA4pSA4pSAIFJ1bGUgMjogQ29tcGxleCBGaWVsZHMgV2l0aG91dCBEZXNjcmlwdGlvbnMgKFdDQUcgMS4zLjEpIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gIGNvbnN0IGNvbXBsZXhGaWVsZFR5cGVzID0gW1xuICAgICdGSUVMRF9HUk9VUCcsXG4gICAgJ1JJQ0hfVEVYVCcsXG4gICAgJ0RBVEVfUkFOR0UnLFxuICAgICdBRERSRVNTJyxcbiAgICAnUkFUSU5HJyxcbiAgICAnU0NBTEUnLFxuICBdXG5cbiAgZm9yIChjb25zdCBmaWVsZCBvZiBmaWVsZHMpIHtcbiAgICBpZiAoXG4gICAgICBjb21wbGV4RmllbGRUeXBlcy5pbmNsdWRlcyhmaWVsZC50eXBlKSAmJlxuICAgICAgKCFmaWVsZC5kZXNjcmlwdGlvbiB8fCBmaWVsZC5kZXNjcmlwdGlvbi50cmltKCkgPT09ICcnKVxuICAgICkge1xuICAgICAgaXNzdWVzLnB1c2goe1xuICAgICAgICBzZXZlcml0eTogJ3NlcmlvdXMnLFxuICAgICAgICBydWxlOiAnV0NBRyAxLjMuMSAtIE1pc3NpbmcgRGVzY3JpcHRpb24gZm9yIENvbXBsZXggRmllbGQnLFxuICAgICAgICBtZXNzYWdlOiBgJHtmaWVsZC50eXBlfSBmaWVsZCBcIiR7ZmllbGQua2V5fVwiIGxhY2tzIGEgZGVzY3JpcHRpb24gdG8gZXhwbGFpbiBpdHMgcHVycG9zZS5gLFxuICAgICAgICBmaWVsZEtleTogZmllbGQua2V5LFxuICAgICAgICBzdWdnZXN0aW9uOiBgQWRkIGEgZGVzY3JpcHRpdmUgdGV4dCB0byBleHBsYWluIGhvdyB0byB1c2UgdGhlICR7ZmllbGQudHlwZX0gZmllbGQuIFVzZSBcImZpZWxkLmRlc2NyaXB0aW9uXCIgdG8gcHJvdmlkZSBjb250ZXh0LmAsXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIC8vIOKUgOKUgOKUgCBSdWxlIDM6IENvbG9yLU9ubHkgSW5zdHJ1Y3Rpb25zIChXQ0FHIDEuNC4xIFVzZSBvZiBDb2xvcikg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbiAgZm9yIChjb25zdCBmaWVsZCBvZiBmaWVsZHMpIHtcbiAgICBjb25zdCBoZWxwVGV4dCA9IChmaWVsZC5jb25maWcgYXMgYW55KT8uaGVscFRleHQgfHwgJydcbiAgICBpZiAoaGVscFRleHQgJiYgL2NvbG9yfHJlZHxibHVlfGdyZWVufHllbGxvdy9pLnRlc3QoaGVscFRleHQpKSB7XG4gICAgICBpc3N1ZXMucHVzaCh7XG4gICAgICAgIHNldmVyaXR5OiAnbW9kZXJhdGUnLFxuICAgICAgICBydWxlOiAnV0NBRyAxLjQuMSAtIENvbG9yLU9ubHkgSW5mb3JtYXRpb24nLFxuICAgICAgICBtZXNzYWdlOiBgRmllbGQgXCIke2ZpZWxkLmtleX1cIiBoZWxwIHRleHQgcmVsaWVzIG9uIGNvbG9yIHRvIGNvbnZleSBpbmZvcm1hdGlvbi5gLFxuICAgICAgICBmaWVsZEtleTogZmllbGQua2V5LFxuICAgICAgICBzdWdnZXN0aW9uOiBgQXZvaWQgdXNpbmcgY29sb3IgYWxvbmUgdG8gY29udmV5IGluZm9ybWF0aW9uLiBVc2UgdGV4dCBsYWJlbHMsIGljb25zLCBvciBwYXR0ZXJucyBpbiBhZGRpdGlvbiB0byBjb2xvci5gLFxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICAvLyDilIDilIDilIAgUnVsZSA0OiBLZXlib2FyZCBOYXZpZ2F0aW9uIChXQ0FHIDIuMS4xIEtleWJvYXJkKSDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuICBjb25zdCBub25LZXlib2FyZEFjY2Vzc2libGVUeXBlcyA9IFsnU0lHTkFUVVJFJywgJ0ZJTEVfVVBMT0FEJ11cblxuICBmb3IgKGNvbnN0IGZpZWxkIG9mIGZpZWxkcykge1xuICAgIGlmIChub25LZXlib2FyZEFjY2Vzc2libGVUeXBlcy5pbmNsdWRlcyhmaWVsZC50eXBlKSkge1xuICAgICAgaXNzdWVzLnB1c2goe1xuICAgICAgICBzZXZlcml0eTogJ3NlcmlvdXMnLFxuICAgICAgICBydWxlOiAnV0NBRyAyLjEuMSAtIExpbWl0ZWQgS2V5Ym9hcmQgTmF2aWdhdGlvbicsXG4gICAgICAgIG1lc3NhZ2U6IGAke2ZpZWxkLnR5cGV9IGZpZWxkIFwiJHtmaWVsZC5rZXl9XCIgbWF5IGhhdmUgbGltaXRlZCBrZXlib2FyZCBhY2Nlc3NpYmlsaXR5LmAsXG4gICAgICAgIGZpZWxkS2V5OiBmaWVsZC5rZXksXG4gICAgICAgIHN1Z2dlc3Rpb246IGBFbnN1cmUgdGhlICR7ZmllbGQudHlwZX0gZmllbGQgaGFzIGtleWJvYXJkLWFjY2Vzc2libGUgYWx0ZXJuYXRpdmVzIG9yIGNsZWFyIGluc3RydWN0aW9ucyBmb3Iga2V5Ym9hcmQgdXNlcnMuYCxcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgLy8g4pSA4pSA4pSAIFJ1bGUgNTogTWlzc2luZyBBUklBIEF0dHJpYnV0ZXMgKFdDQUcgNC4xLjIgTmFtZSwgUm9sZSwgVmFsdWUpIOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gIGZvciAoY29uc3QgZmllbGQgb2YgZmllbGRzKSB7XG4gICAgLy8gQ2hlY2sgZm9yIHJlcXVpcmVkIGZpZWxkcyB3aXRob3V0IHZpc3VhbC9hcmlhIGluZGljYXRvclxuICAgIGlmIChcbiAgICAgIGZpZWxkLnJlcXVpcmVkICYmXG4gICAgICAoIWZpZWxkLmxhYmVsLmluY2x1ZGVzKCcqJykgJiYgIWZpZWxkLmRlc2NyaXB0aW9uPy5pbmNsdWRlcygncmVxdWlyZWQnKSlcbiAgICApIHtcbiAgICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgICAgc2V2ZXJpdHk6ICdzZXJpb3VzJyxcbiAgICAgICAgcnVsZTogJ1dDQUcgMy4zLjIgLSBSZXF1aXJlZCBGaWVsZCBOb3QgSW5kaWNhdGVkJyxcbiAgICAgICAgbWVzc2FnZTogYFJlcXVpcmVkIGZpZWxkIFwiJHtmaWVsZC5rZXl9XCIgZG9lcyBub3QgaGF2ZSBhIHZpc3VhbCBpbmRpY2F0b3IgKGUuZy4sIGFzdGVyaXNrKS5gLFxuICAgICAgICBmaWVsZEtleTogZmllbGQua2V5LFxuICAgICAgICBzdWdnZXN0aW9uOiBgQWRkIGEgcmVxdWlyZWQgZmllbGQgaW5kaWNhdG9yICgqIG9yIFwicmVxdWlyZWRcIikgdG8gdGhlIGxhYmVsIG9yIGRlc2NyaXB0aW9uIG9mIGZpZWxkIFwiJHtmaWVsZC5rZXl9XCIuYCxcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIGZpZWxkcyB0aGF0IG5lZWQgYXJpYS1kZXNjcmliZWRieVxuICAgIGlmIChmaWVsZC5kZXNjcmlwdGlvbiAmJiBmaWVsZC50eXBlID09PSAnUklDSF9URVhUJykge1xuICAgICAgaXNzdWVzLnB1c2goe1xuICAgICAgICBzZXZlcml0eTogJ21vZGVyYXRlJyxcbiAgICAgICAgcnVsZTogJ1dDQUcgNC4xLjIgLSBNaXNzaW5nIGFyaWEtZGVzY3JpYmVkYnknLFxuICAgICAgICBtZXNzYWdlOiBgJHtmaWVsZC50eXBlfSBmaWVsZCBcIiR7ZmllbGQua2V5fVwiIHNob3VsZCBoYXZlIGFyaWEtZGVzY3JpYmVkYnkgbGlua2luZyB0byBkZXNjcmlwdGlvbi5gLFxuICAgICAgICBmaWVsZEtleTogZmllbGQua2V5LFxuICAgICAgICBzdWdnZXN0aW9uOiBgRW5zdXJlIHRoZSBmaWVsZCByZW5kZXJlciBpbmNsdWRlcyBhcmlhLWRlc2NyaWJlZGJ5IGF0dHJpYnV0ZSBsaW5raW5nIHRvIHRoZSBkZXNjcmlwdGlvbiBlbGVtZW50LmAsXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIC8vIOKUgOKUgOKUgCBSdWxlIDY6IEVycm9yIEFubm91bmNlbWVudCAoV0NBRyAzLjMuMSBFcnJvciBJZGVudGlmaWNhdGlvbikg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG5cbiAgZm9yIChjb25zdCBmaWVsZCBvZiBmaWVsZHMpIHtcbiAgICBpZiAoZmllbGQudHlwZSA9PT0gJ0VNQUlMJyB8fCBmaWVsZC50eXBlID09PSAnVVJMJykge1xuICAgICAgaXNzdWVzLnB1c2goe1xuICAgICAgICBzZXZlcml0eTogJ21vZGVyYXRlJyxcbiAgICAgICAgcnVsZTogJ1dDQUcgMy4zLjEgLSBFcnJvciBQcmV2ZW50aW9uJyxcbiAgICAgICAgbWVzc2FnZTogYCR7ZmllbGQudHlwZX0gZmllbGQgXCIke2ZpZWxkLmtleX1cIiByZXF1aXJlcyBjbGVhciBlcnJvciBtZXNzYWdpbmcuYCxcbiAgICAgICAgZmllbGRLZXk6IGZpZWxkLmtleSxcbiAgICAgICAgc3VnZ2VzdGlvbjogYEVuc3VyZSB2YWxpZGF0aW9uIGVycm9ycyBmb3IgXCIke2ZpZWxkLmtleX1cIiBhcmUgYW5ub3VuY2VkIHRvIHNjcmVlbiByZWFkZXJzIHVzaW5nIHJvbGU9XCJhbGVydFwiIGFuZCBhcmlhLWxpdmU9XCJwb2xpdGVcIi5gLFxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICAvLyDilIDilIDilIAgUnVsZSA3OiBTdGVwIEluZGljYXRvciBTZW1hbnRpY3MgKFdDQUcgMS4zLjEpIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gIGlmIChzdGVwcyAmJiBzdGVwcy5sZW5ndGggPiAwKSB7XG4gICAgZm9yIChjb25zdCBzdGVwIG9mIHN0ZXBzKSB7XG4gICAgICBpZiAoIXN0ZXAudGl0bGUgfHwgc3RlcC50aXRsZS50cmltKCkgPT09ICcnKSB7XG4gICAgICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgICAgICBzZXZlcml0eTogJ3NlcmlvdXMnLFxuICAgICAgICAgIHJ1bGU6ICdXQ0FHIDEuMy4xIC0gTWlzc2luZyBTdGVwIFRpdGxlJyxcbiAgICAgICAgICBtZXNzYWdlOiBgU3RlcCBcIiR7c3RlcC5pZH1cIiBoYXMgbm8gdGl0bGUgdG8gaWRlbnRpZnkgaXRzIHB1cnBvc2UuYCxcbiAgICAgICAgICBzdWdnZXN0aW9uOiBgQWRkIGEgZGVzY3JpcHRpdmUgdGl0bGUgdG8gc3RlcCBcIiR7c3RlcC5pZH1cIiB0byBoZWxwIHVzZXJzIHVuZGVyc3RhbmQgdGhlIGZvcm0gZmxvdy5gLFxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIOKUgOKUgOKUgCBSdWxlIDg6IEZpZWxkIEdyb3VwcyBNdXN0IEhhdmUgRmllbGRzIChXQ0FHIDEuMy4xKSDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuICBmb3IgKGNvbnN0IGZpZWxkIG9mIGZpZWxkcykge1xuICAgIGlmIChmaWVsZC50eXBlID09PSAnRklFTERfR1JPVVAnKSB7XG4gICAgICBjb25zdCBoYXNDaGlsZHJlbiA9XG4gICAgICAgIChmaWVsZC5jaGlsZHJlbiAmJiBmaWVsZC5jaGlsZHJlbi5sZW5ndGggPiAwKSB8fFxuICAgICAgICBmaWVsZHMuc29tZSgoZikgPT4gZi5wYXJlbnRGaWVsZElkID09PSBmaWVsZC5pZClcblxuICAgICAgaWYgKCFoYXNDaGlsZHJlbikge1xuICAgICAgICBpc3N1ZXMucHVzaCh7XG4gICAgICAgICAgc2V2ZXJpdHk6ICdtb2RlcmF0ZScsXG4gICAgICAgICAgcnVsZTogJ1dDQUcgMS4zLjEgLSBFbXB0eSBGaWVsZCBHcm91cCcsXG4gICAgICAgICAgbWVzc2FnZTogYEZpZWxkIGdyb3VwIFwiJHtmaWVsZC5rZXl9XCIgaXMgZW1wdHkgYW5kIHNlcnZlcyBubyBzZW1hbnRpYyBwdXJwb3NlLmAsXG4gICAgICAgICAgZmllbGRLZXk6IGZpZWxkLmtleSxcbiAgICAgICAgICBzdWdnZXN0aW9uOiBgRWl0aGVyIGFkZCBmaWVsZHMgdG8gdGhpcyBncm91cCBvciByZW1vdmUgaXQgaWYgbm90IG5lZWRlZC5gLFxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIOKUgOKUgOKUgCBSdWxlIDk6IEZvcm0gU3RydWN0dXJlIChXQ0FHIDEuMy4xKSDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcblxuICBpZiAoIXN0ZXBzIHx8IHN0ZXBzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChmaWVsZHMubGVuZ3RoID4gMTUpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgICAgc2V2ZXJpdHk6ICdtb2RlcmF0ZScsXG4gICAgICAgIHJ1bGU6ICdXQ0FHIDIuNC44IC0gRm9ybSBTdHJ1Y3R1cmUnLFxuICAgICAgICBtZXNzYWdlOiBgRm9ybSBoYXMgJHtmaWVsZHMubGVuZ3RofSBmaWVsZHMgd2l0aG91dCBzdGVwIGdyb3VwaW5nLCB3aGljaCBtYXkgb3ZlcndoZWxtIHVzZXJzLmAsXG4gICAgICAgIHN1Z2dlc3Rpb246IGBDb25zaWRlciBicmVha2luZyB0aGUgZm9ybSBpbnRvIGxvZ2ljYWwgc3RlcHMgdXNpbmcgRm9ybVN0ZXAgZGVmaW5pdGlvbnMgZm9yIGJldHRlciB1c2VyIGV4cGVyaWVuY2UgYW5kIGFjY2Vzc2liaWxpdHkuYCxcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgLy8g4pSA4pSA4pSAIFJ1bGUgMTA6IFBsYWNlaG9sZGVyIE5vdCBTdWJzdGl0dXRpbmcgTGFiZWwgKFdDQUcgMS4zLjUpIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gIGZvciAoY29uc3QgZmllbGQgb2YgZmllbGRzKSB7XG4gICAgY29uc3QgY29uZmlnID0gZmllbGQuY29uZmlnIGFzIGFueVxuICAgIGlmIChjb25maWc/LnBsYWNlaG9sZGVyICYmICFmaWVsZC5sYWJlbCkge1xuICAgICAgaXNzdWVzLnB1c2goe1xuICAgICAgICBzZXZlcml0eTogJ2NyaXRpY2FsJyxcbiAgICAgICAgcnVsZTogJ1dDQUcgMS4zLjUgLSBQbGFjZWhvbGRlciBJbnN0ZWFkIG9mIExhYmVsJyxcbiAgICAgICAgbWVzc2FnZTogYEZpZWxkIFwiJHtmaWVsZC5rZXl9XCIgdXNlcyBwbGFjZWhvbGRlciBhcyBsYWJlbCwgd2hpY2ggZGlzYXBwZWFycyB3aGVuIHVzZXIgc3RhcnRzIHR5cGluZy5gLFxuICAgICAgICBmaWVsZEtleTogZmllbGQua2V5LFxuICAgICAgICBzdWdnZXN0aW9uOiBgQWRkIGFuIGV4cGxpY2l0IGxhYmVsIHRvIGZpZWxkIFwiJHtmaWVsZC5rZXl9XCIuIFBsYWNlaG9sZGVycyBzaG91bGQgb25seSBiZSB1c2VkIGFzIGhpbnRzLCBub3QgYXMgbGFiZWxzLmAsXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIC8vIOKUgOKUgOKUgCBSdWxlIDExOiBSYWRpbyBCdXR0b24gR3JvdXBpbmcgKFdDQUcgMS4zLjEpIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gIGNvbnN0IHJhZGlvRmllbGRzID0gZmllbGRzLmZpbHRlcigoZikgPT4gZi50eXBlID09PSAnUkFESU8nKVxuICBmb3IgKGNvbnN0IGZpZWxkIG9mIHJhZGlvRmllbGRzKSB7XG4gICAgaWYgKCFmaWVsZC5kZXNjcmlwdGlvbikge1xuICAgICAgaXNzdWVzLnB1c2goe1xuICAgICAgICBzZXZlcml0eTogJ21vZGVyYXRlJyxcbiAgICAgICAgcnVsZTogJ1dDQUcgMS4zLjEgLSBSYWRpbyBCdXR0b24gR3JvdXAgTm90IExhYmVsZWQnLFxuICAgICAgICBtZXNzYWdlOiBgUmFkaW8gYnV0dG9uIGdyb3VwIFwiJHtmaWVsZC5rZXl9XCIgbGFja3MgYSBncm91cCBsYWJlbC9sZWdlbmQuYCxcbiAgICAgICAgZmllbGRLZXk6IGZpZWxkLmtleSxcbiAgICAgICAgc3VnZ2VzdGlvbjogYEFkZCBhIGRlc2NyaXB0aXZlIGxhYmVsIG9yIGxlZ2VuZCB0byB0aGUgcmFkaW8gYnV0dG9uIGdyb3VwIHRvIGlkZW50aWZ5IGl0cyBwdXJwb3NlLmAsXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIC8vIOKUgOKUgOKUgCBSdWxlIDEyOiBDb25kaXRpb25hbCBGaWVsZHMgKFdDQUcgNC4xLjIpIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuXG4gIGZvciAoY29uc3QgZmllbGQgb2YgZmllbGRzKSB7XG4gICAgaWYgKGZpZWxkLmNvbmRpdGlvbnMpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgICAgc2V2ZXJpdHk6ICdtaW5vcicsXG4gICAgICAgIHJ1bGU6ICdXQ0FHIDQuMS4yIC0gQ29uZGl0aW9uYWwgRmllbGQgVmlzaWJpbGl0eScsXG4gICAgICAgIG1lc3NhZ2U6IGBGaWVsZCBcIiR7ZmllbGQua2V5fVwiIGhhcyBjb25kaXRpb25hbCB2aXNpYmlsaXR5IHRoYXQgbWF5IGNvbmZ1c2Ugc2NyZWVuIHJlYWRlciB1c2Vycy5gLFxuICAgICAgICBmaWVsZEtleTogZmllbGQua2V5LFxuICAgICAgICBzdWdnZXN0aW9uOiBgRW5zdXJlIGZpZWxkIHZpc2liaWxpdHkgY2hhbmdlcyBhcmUgYW5ub3VuY2VkIGR5bmFtaWNhbGx5IHVzaW5nIGFyaWEtbGl2ZSByZWdpb25zIG9yIGR5bmFtaWMgZm9ybSBub3RpZmljYXRpb25zLmAsXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBpc3N1ZXNcbn1cblxuLyoqXG4gKiBTdW1tYXJpemUgYWNjZXNzaWJpbGl0eSBhdWRpdCByZXN1bHRzIGJ5IHNldmVyaXR5IGxldmVsLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3VtbWFyaXplQTExeUF1ZGl0KGlzc3VlczogQTExeUlzc3VlW10pOiBSZWNvcmQ8QTExeVNldmVyaXR5LCBudW1iZXI+IHtcbiAgcmV0dXJuIHtcbiAgICBjcml0aWNhbDogaXNzdWVzLmZpbHRlcigoaSkgPT4gaS5zZXZlcml0eSA9PT0gJ2NyaXRpY2FsJykubGVuZ3RoLFxuICAgIHNlcmlvdXM6IGlzc3Vlcy5maWx0ZXIoKGkpID0+IGkuc2V2ZXJpdHkgPT09ICdzZXJpb3VzJykubGVuZ3RoLFxuICAgIG1vZGVyYXRlOiBpc3N1ZXMuZmlsdGVyKChpKSA9PiBpLnNldmVyaXR5ID09PSAnbW9kZXJhdGUnKS5sZW5ndGgsXG4gICAgbWlub3I6IGlzc3Vlcy5maWx0ZXIoKGkpID0+IGkuc2V2ZXJpdHkgPT09ICdtaW5vcicpLmxlbmd0aCxcbiAgfVxufVxuIl19