"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
/**
 * Validates a DFE form configuration JSON file.
 * Checks for:
 * - Missing required fields (key, type, label)
 * - Invalid field types
 * - Duplicate field keys
 * - Self-referencing conditions
 * - Malformed JSON
 */
function validateDfeFile(document) {
    const errors = [];
    const content = document.getText();
    // Check if it's a valid JSON first
    let config;
    try {
        config = JSON.parse(content);
    }
    catch (err) {
        if (err instanceof SyntaxError) {
            const match = err.message.match(/position (\d+)/);
            if (match) {
                const pos = document.positionAt(parseInt(match[1], 10));
                errors.push({
                    line: pos.line,
                    column: pos.character,
                    message: `Invalid JSON: ${err.message}`,
                    severity: vscode.DiagnosticSeverity.Error,
                });
            }
        }
        return errors;
    }
    // Valid field types
    const validFieldTypes = [
        'SHORT_TEXT',
        'LONG_TEXT',
        'NUMBER',
        'EMAIL',
        'PHONE',
        'DATE',
        'DATE_RANGE',
        'TIME',
        'DATE_TIME',
        'SELECT',
        'MULTI_SELECT',
        'RADIO',
        'CHECKBOX',
        'FILE_UPLOAD',
        'RATING',
        'SCALE',
        'URL',
        'PASSWORD',
        'HIDDEN',
        'SECTION_BREAK',
        'FIELD_GROUP',
        'RICH_TEXT',
        'SIGNATURE',
        'ADDRESS',
    ];
    // Validate fields array
    if (config.fields && Array.isArray(config.fields)) {
        const fieldKeys = new Set();
        const fieldIds = new Set();
        config.fields.forEach((field, index) => {
            // Check required properties
            if (!field.id) {
                errors.push({
                    line: index,
                    column: 0,
                    message: 'Field is missing required property: id',
                    severity: vscode.DiagnosticSeverity.Error,
                });
            }
            else if (fieldIds.has(field.id)) {
                errors.push({
                    line: index,
                    column: 0,
                    message: `Duplicate field id: ${field.id}`,
                    severity: vscode.DiagnosticSeverity.Error,
                });
            }
            fieldIds.add(field.id);
            if (!field.key) {
                errors.push({
                    line: index,
                    column: 0,
                    message: 'Field is missing required property: key',
                    severity: vscode.DiagnosticSeverity.Error,
                });
            }
            else if (fieldKeys.has(field.key)) {
                errors.push({
                    line: index,
                    column: 0,
                    message: `Duplicate field key: ${field.key}`,
                    severity: vscode.DiagnosticSeverity.Error,
                });
            }
            fieldKeys.add(field.key);
            if (!field.type) {
                errors.push({
                    line: index,
                    column: 0,
                    message: 'Field is missing required property: type',
                    severity: vscode.DiagnosticSeverity.Error,
                });
            }
            else if (!validFieldTypes.includes(field.type)) {
                errors.push({
                    line: index,
                    column: 0,
                    message: `Invalid field type: ${field.type}. Valid types: ${validFieldTypes.join(', ')}`,
                    severity: vscode.DiagnosticSeverity.Error,
                });
            }
            if (!field.label) {
                errors.push({
                    line: index,
                    column: 0,
                    message: 'Field is missing required property: label',
                    severity: vscode.DiagnosticSeverity.Warning,
                });
            }
            // Validate conditions
            if (field.conditions && Array.isArray(field.conditions)) {
                field.conditions.forEach((condition) => {
                    if (condition.targetFieldId === field.id) {
                        errors.push({
                            line: index,
                            column: 0,
                            message: `Field ${field.id} has a self-referencing condition`,
                            severity: vscode.DiagnosticSeverity.Warning,
                        });
                    }
                    if (!condition.action) {
                        errors.push({
                            line: index,
                            column: 0,
                            message: 'Condition is missing required property: action',
                            severity: vscode.DiagnosticSeverity.Error,
                        });
                    }
                });
            }
        });
    }
    // Validate steps array
    if (config.steps && Array.isArray(config.steps)) {
        const stepIds = new Set();
        config.steps.forEach((step, index) => {
            if (!step.id) {
                errors.push({
                    line: index,
                    column: 0,
                    message: 'Step is missing required property: id',
                    severity: vscode.DiagnosticSeverity.Error,
                });
            }
            else if (stepIds.has(step.id)) {
                errors.push({
                    line: index,
                    column: 0,
                    message: `Duplicate step id: ${step.id}`,
                    severity: vscode.DiagnosticSeverity.Error,
                });
            }
            stepIds.add(step.id);
            if (!step.title) {
                errors.push({
                    line: index,
                    column: 0,
                    message: 'Step is missing required property: title',
                    severity: vscode.DiagnosticSeverity.Warning,
                });
            }
        });
    }
    return errors;
}
/**
 * Provides completion items for DFE configuration files
 */
function getCompletionItems() {
    const items = [];
    // Field type completions
    const fieldTypes = [
        'SHORT_TEXT',
        'LONG_TEXT',
        'NUMBER',
        'EMAIL',
        'PHONE',
        'DATE',
        'DATE_RANGE',
        'TIME',
        'DATE_TIME',
        'SELECT',
        'MULTI_SELECT',
        'RADIO',
        'CHECKBOX',
        'FILE_UPLOAD',
        'RATING',
        'SCALE',
        'URL',
        'PASSWORD',
        'HIDDEN',
        'SECTION_BREAK',
        'FIELD_GROUP',
        'RICH_TEXT',
        'SIGNATURE',
        'ADDRESS',
    ];
    fieldTypes.forEach((type) => {
        const item = new vscode.CompletionItem(type, vscode.CompletionItemKind.Enum);
        item.detail = `Field type: ${type}`;
        items.push(item);
    });
    // Condition action completions
    const actions = ['show', 'hide', 'enable', 'disable', 'require', 'optional'];
    actions.forEach((action) => {
        const item = new vscode.CompletionItem(action, vscode.CompletionItemKind.Keyword);
        item.detail = `Condition action: ${action}`;
        items.push(item);
    });
    // Condition operator completions
    const operators = [
        'equals',
        'notEquals',
        'contains',
        'notContains',
        'startsWith',
        'endsWith',
        'greaterThan',
        'lessThan',
        'greaterThanOrEqual',
        'lessThanOrEqual',
        'isEmpty',
        'isNotEmpty',
        'isChecked',
        'isNotChecked',
        'isSelected',
        'isNotSelected',
        'matches',
        'doesNotMatch',
    ];
    operators.forEach((op) => {
        const item = new vscode.CompletionItem(op, vscode.CompletionItemKind.Operator);
        item.detail = `Condition operator: ${op}`;
        items.push(item);
    });
    // HTTP method completions
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    methods.forEach((method) => {
        const item = new vscode.CompletionItem(method, vscode.CompletionItemKind.Keyword);
        item.detail = `HTTP method: ${method}`;
        items.push(item);
    });
    // Property name completions
    const propertyCompletions = [
        { label: 'id', kind: vscode.CompletionItemKind.Property, detail: 'Unique identifier' },
        { label: 'key', kind: vscode.CompletionItemKind.Property, detail: 'Field key for data binding' },
        { label: 'type', kind: vscode.CompletionItemKind.Property, detail: 'Field type' },
        { label: 'label', kind: vscode.CompletionItemKind.Property, detail: 'Field label' },
        { label: 'required', kind: vscode.CompletionItemKind.Property, detail: 'Is field required' },
        { label: 'config', kind: vscode.CompletionItemKind.Property, detail: 'Field configuration' },
        { label: 'conditions', kind: vscode.CompletionItemKind.Property, detail: 'Conditional rules' },
        { label: 'fields', kind: vscode.CompletionItemKind.Property, detail: 'Child fields' },
        { label: 'steps', kind: vscode.CompletionItemKind.Property, detail: 'Form steps' },
        { label: 'title', kind: vscode.CompletionItemKind.Property, detail: 'Title' },
        { label: 'description', kind: vscode.CompletionItemKind.Property, detail: 'Description' },
    ];
    propertyCompletions.forEach(({ label, kind, detail }) => {
        const item = new vscode.CompletionItem(label, kind);
        item.detail = detail;
        items.push(item);
    });
    return items;
}
/**
 * Activates the DFE VS Code extension
 */
function activate(context) {
    console.log('DFE VS Code extension activated');
    // Create a diagnostic collection for DFE files
    const diagnostics = vscode.languages.createDiagnosticCollection('dfe');
    context.subscriptions.push(diagnostics);
    /**
     * Validate a document and report diagnostics
     */
    const validate = (document) => {
        // Only validate relevant files
        if (!document.fileName.match(/\.(dfe\.json|dfe-form\.json|dfe\.config\.json)$/)) {
            return;
        }
        const errors = validateDfeFile(document);
        const diagnosticList = errors.map((error) => {
            const range = new vscode.Range(new vscode.Position(error.line, error.column), new vscode.Position(error.line, error.column + 50));
            const diagnostic = new vscode.Diagnostic(range, error.message, error.severity);
            diagnostic.source = 'DFE';
            return diagnostic;
        });
        diagnostics.set(document.uri, diagnosticList);
    };
    // Register validation on save and open
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(validate));
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(validate));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((e) => validate(e.document)));
    // Register completion provider
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider({ language: 'json', pattern: '**/*.{dfe.json,dfe-form.json,dfe.config.json}' }, {
        provideCompletionItems: () => {
            return getCompletionItems();
        },
    }, '"'));
    // Validate all open documents on activation
    vscode.workspace.textDocuments.forEach(validate);
    console.log('DFE VS Code extension fully initialized');
}
/**
 * Deactivates the DFE VS Code extension
 */
function deactivate() {
    console.log('DFE VS Code extension deactivated');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXh0ZW5zaW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbVRBLDRCQXdEQztBQUtELGdDQUVDO0FBbFhELCtDQUFnQztBQVNoQzs7Ozs7Ozs7R0FRRztBQUNILFNBQVMsZUFBZSxDQUFDLFFBQTZCO0lBQ3BELE1BQU0sTUFBTSxHQUFzQixFQUFFLENBQUE7SUFDcEMsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFBO0lBRWxDLG1DQUFtQztJQUNuQyxJQUFJLE1BQVcsQ0FBQTtJQUNmLElBQUksQ0FBQztRQUNILE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQzlCLENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2IsSUFBSSxHQUFHLFlBQVksV0FBVyxFQUFFLENBQUM7WUFDL0IsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtZQUNqRCxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNWLE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFBO2dCQUN2RCxNQUFNLENBQUMsSUFBSSxDQUFDO29CQUNWLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSTtvQkFDZCxNQUFNLEVBQUUsR0FBRyxDQUFDLFNBQVM7b0JBQ3JCLE9BQU8sRUFBRSxpQkFBaUIsR0FBRyxDQUFDLE9BQU8sRUFBRTtvQkFDdkMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLO2lCQUMxQyxDQUFDLENBQUE7WUFDSixDQUFDO1FBQ0gsQ0FBQztRQUNELE9BQU8sTUFBTSxDQUFBO0lBQ2YsQ0FBQztJ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QWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFFakcsK0JBQStCO0lBQy9CLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUN4QixNQUFNLENBQUMsU0FBUyxDQUFDLDhCQUE4QixDQUM3QyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLCtDQUErQyxFQUFFLEVBQzlFO1FBQ0Usc0JBQXNCLEVBQUUsR0FBRyxFQUFFO1lBQzNCLE9BQU8sa0JBQWtCLEVBQUUsQ0FBQTtRQUM3QixDQUFDO0tBQ0YsRUFDRCxHQUFHLENBQ0osQ0FDRixDQUFBO0lBRUQsNENBQTRDO0lBQzVDLE1BQU0sQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUVoRCxPQUFPLENBQUMsR0FBRyxDQUFDLHlDQUF5QyxDQUFDLENBQUE7QUFDeEQsQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBZ0IsVUFBVTtJQUN4QixPQUFPLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxDQUFDLENBQUE7QUFDbEQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHZzY29kZSBmcm9tICd2c2NvZGUnXG5cbmludGVyZmFjZSBWYWxpZGF0aW9uRXJyb3Ige1xuICBsaW5lOiBudW1iZXJcbiAgY29sdW1uOiBudW1iZXJcbiAgbWVzc2FnZTogc3RyaW5nXG4gIHNldmVyaXR5OiB2c2NvZGUuRGlhZ25vc3RpY1NldmVyaXR5XG59XG5cbi8qKlxuICogVmFsaWRhdGVzIGEgREZFIGZvcm0gY29uZmlndXJhdGlvbiBKU09OIGZpbGUuXG4gKiBDaGVja3MgZm9yOlxuICogLSBNaXNzaW5nIHJlcXVpcmVkIGZpZWxkcyAoa2V5LCB0eXBlLCBsYWJlbClcbiAqIC0gSW52YWxpZCBmaWVsZCB0eXBlc1xuICogLSBEdXBsaWNhdGUgZmllbGQga2V5c1xuICogLSBTZWxmLXJlZmVyZW5jaW5nIGNvbmRpdGlvbnNcbiAqIC0gTWFsZm9ybWVkIEpTT05cbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVEZmVGaWxlKGRvY3VtZW50OiB2c2NvZGUuVGV4dERvY3VtZW50KTogVmFsaWRhdGlvbkVycm9yW10ge1xuICBjb25zdCBlcnJvcnM6IFZhbGlkYXRpb25FcnJvcltdID0gW11cbiAgY29uc3QgY29udGVudCA9IGRvY3VtZW50LmdldFRleHQoKVxuXG4gIC8vIENoZWNrIGlmIGl0J3MgYSB2YWxpZCBKU09OIGZpcnN0XG4gIGxldCBjb25maWc6IGFueVxuICB0cnkge1xuICAgIGNvbmZpZyA9IEpTT04ucGFyc2UoY29udGVudClcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIFN5bnRheEVycm9yKSB7XG4gICAgICBjb25zdCBtYXRjaCA9IGVyci5tZXNzYWdlLm1hdGNoKC9wb3NpdGlvbiAoXFxkKykvKVxuICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIGNvbnN0IHBvcyA9IGRvY3VtZW50LnBvc2l0aW9uQXQocGFyc2VJbnQobWF0Y2hbMV0sIDEwKSlcbiAgICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICAgIGxpbmU6IHBvcy5saW5lLFxuICAgICAgICAgIGNvbHVtbjogcG9zLmNoYXJhY3RlcixcbiAgICAgICAgICBtZXNzYWdlOiBgSW52YWxpZCBKU09OOiAke2Vyci5tZXNzYWdlfWAsXG4gICAgICAgICAgc2V2ZXJpdHk6IHZzY29kZS5EaWFnbm9zdGljU2V2ZXJpdHkuRXJyb3IsXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBlcnJvcnNcbiAgfVxuXG4gIC8vIFZhbGlkIGZpZWxkIHR5cGVzXG4gIGNvbnN0IHZhbGlkRmllbGRUeXBlcyA9IFtcbiAgICAnU0hPUlRfVEVYVCcsXG4gICAgJ0xPTkdfVEVYVCcsXG4gICAgJ05VTUJFUicsXG4gICAgJ0VNQUlMJyxcbiAgICAnUEhPTkUnLFxuICAgICdEQVRFJyxcbiAgICAnREFURV9SQU5HRScsXG4gICAgJ1RJTUUnLFxuICAgICdEQVRFX1RJTUUnLFxuICAgICdTRUxFQ1QnLFxuICAgICdNVUxUSV9TRUxFQ1QnLFxuICAgICdSQURJTycsXG4gICAgJ0NIRUNLQk9YJyxcbiAgICAnRklMRV9VUExPQUQnLFxuICAgICdSQVRJTkcnLFxuICAgICdTQ0FMRScsXG4gICAgJ1VSTCcsXG4gICAgJ1BBU1NXT1JEJyxcbiAgICAnSElEREVOJyxcbiAgICAnU0VDVElPTl9CUkVBSycsXG4gICAgJ0ZJRUxEX0dST1VQJyxcbiAgICAnUklDSF9URVhUJyxcbiAgICAnU0lHTkFUVVJFJyxcbiAgICAnQUREUkVTUycsXG4gIF1cblxuICAvLyBWYWxpZGF0ZSBmaWVsZHMgYXJyYXlcbiAgaWYgKGNvbmZpZy5maWVsZHMgJiYgQXJyYXkuaXNBcnJheShjb25maWcuZmllbGRzKSkge1xuICAgIGNvbnN0IGZpZWxkS2V5cyA9IG5ldyBTZXQ8c3RyaW5nPigpXG4gICAgY29uc3QgZmllbGRJZHMgPSBuZXcgU2V0PHN0cmluZz4oKVxuXG4gICAgY29uZmlnLmZpZWxkcy5mb3JFYWNoKChmaWVsZDogYW55LCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAvLyBDaGVjayByZXF1aXJlZCBwcm9wZXJ0aWVzXG4gICAgICBpZiAoIWZpZWxkLmlkKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgICBsaW5lOiBpbmRleCxcbiAgICAgICAgICBjb2x1bW46IDAsXG4gICAgICAgICAgbWVzc2FnZTogJ0ZpZWxkIGlzIG1pc3NpbmcgcmVxdWlyZWQgcHJvcGVydHk6IGlkJyxcbiAgICAgICAgICBzZXZlcml0eTogdnNjb2RlLkRpYWdub3N0aWNTZXZlcml0eS5FcnJvcixcbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSBpZiAoZmllbGRJZHMuaGFzKGZpZWxkLmlkKSkge1xuICAgICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgICAgbGluZTogaW5kZXgsXG4gICAgICAgICAgY29sdW1uOiAwLFxuICAgICAgICAgIG1lc3NhZ2U6IGBEdXBsaWNhdGUgZmllbGQgaWQ6ICR7ZmllbGQuaWR9YCxcbiAgICAgICAgICBzZXZlcml0eTogdnNjb2RlLkRpYWdub3N0aWNTZXZlcml0eS5FcnJvcixcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIGZpZWxkSWRzLmFkZChmaWVsZC5pZClcblxuICAgICAgaWYgKCFmaWVsZC5rZXkpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICAgIGxpbmU6IGluZGV4LFxuICAgICAgICAgIGNvbHVtbjogMCxcbiAgICAgICAgICBtZXNzYWdlOiAnRmllbGQgaXMgbWlzc2luZyByZXF1aXJlZCBwcm9wZXJ0eToga2V5JyxcbiAgICAgICAgICBzZXZlcml0eTogdnNjb2RlLkRpYWdub3N0aWNTZXZlcml0eS5FcnJvcixcbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSBpZiAoZmllbGRLZXlzLmhhcyhmaWVsZC5rZXkpKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgICBsaW5lOiBpbmRleCxcbiAgICAgICAgICBjb2x1bW46IDAsXG4gICAgICAgICAgbWVzc2FnZTogYER1cGxpY2F0ZSBmaWVsZCBrZXk6ICR7ZmllbGQua2V5fWAsXG4gICAgICAgICAgc2V2ZXJpdHk6IHZzY29kZS5EaWFnbm9zdGljU2V2ZXJpdHkuRXJyb3IsXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICBmaWVsZEtleXMuYWRkKGZpZWxkLmtleSlcblxuICAgICAgaWYgKCFmaWVsZC50eXBlKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgICBsaW5lOiBpbmRleCxcbiAgICAgICAgICBjb2x1bW46IDAsXG4gICAgICAgICAgbWVzc2FnZTogJ0ZpZWxkIGlzIG1pc3NpbmcgcmVxdWlyZWQgcHJvcGVydHk6IHR5cGUnLFxuICAgICAgICAgIHNldmVyaXR5OiB2c2NvZGUuRGlhZ25vc3RpY1NldmVyaXR5LkVycm9yLFxuICAgICAgICB9KVxuICAgICAgfSBlbHNlIGlmICghdmFsaWRGaWVsZFR5cGVzLmluY2x1ZGVzKGZpZWxkLnR5cGUpKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgICBsaW5lOiBpbmRleCxcbiAgICAgICAgICBjb2x1bW46IDAsXG4gICAgICAgICAgbWVzc2FnZTogYEludmFsaWQgZmllbGQgdHlwZTogJHtmaWVsZC50eXBlfS4gVmFsaWQgdHlwZXM6ICR7dmFsaWRGaWVsZFR5cGVzLmpvaW4oJywgJyl9YCxcbiAgICAgICAgICBzZXZlcml0eTogdnNjb2RlLkRpYWdub3N0aWNTZXZlcml0eS5FcnJvcixcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgaWYgKCFmaWVsZC5sYWJlbCkge1xuICAgICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgICAgbGluZTogaW5kZXgsXG4gICAgICAgICAgY29sdW1uOiAwLFxuICAgICAgICAgIG1lc3NhZ2U6ICdGaWVsZCBpcyBtaXNzaW5nIHJlcXVpcmVkIHByb3BlcnR5OiBsYWJlbCcsXG4gICAgICAgICAgc2V2ZXJpdHk6IHZzY29kZS5EaWFnbm9zdGljU2V2ZXJpdHkuV2FybmluZyxcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgLy8gVmFsaWRhdGUgY29uZGl0aW9uc1xuICAgICAgaWYgKGZpZWxkLmNvbmRpdGlvbnMgJiYgQXJyYXkuaXNBcnJheShmaWVsZC5jb25kaXRpb25zKSkge1xuICAgICAgICBmaWVsZC5jb25kaXRpb25zLmZvckVhY2goKGNvbmRpdGlvbjogYW55KSA9PiB7XG4gICAgICAgICAgaWYgKGNvbmRpdGlvbi50YXJnZXRGaWVsZElkID09PSBmaWVsZC5pZCkge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICAgICAgICBsaW5lOiBpbmRleCxcbiAgICAgICAgICAgICAgY29sdW1uOiAwLFxuICAgICAgICAgICAgICBtZXNzYWdlOiBgRmllbGQgJHtmaWVsZC5pZH0gaGFzIGEgc2VsZi1yZWZlcmVuY2luZyBjb25kaXRpb25gLFxuICAgICAgICAgICAgICBzZXZlcml0eTogdnNjb2RlLkRpYWdub3N0aWNTZXZlcml0eS5XYXJuaW5nLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFjb25kaXRpb24uYWN0aW9uKSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgICAgICAgIGxpbmU6IGluZGV4LFxuICAgICAgICAgICAgICBjb2x1bW46IDAsXG4gICAgICAgICAgICAgIG1lc3NhZ2U6ICdDb25kaXRpb24gaXMgbWlzc2luZyByZXF1aXJlZCBwcm9wZXJ0eTogYWN0aW9uJyxcbiAgICAgICAgICAgICAgc2V2ZXJpdHk6IHZzY29kZS5EaWFnbm9zdGljU2V2ZXJpdHkuRXJyb3IsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgLy8gVmFsaWRhdGUgc3RlcHMgYXJyYXlcbiAgaWYgKGNvbmZpZy5zdGVwcyAmJiBBcnJheS5pc0FycmF5KGNvbmZpZy5zdGVwcykpIHtcbiAgICBjb25zdCBzdGVwSWRzID0gbmV3IFNldDxzdHJpbmc+KClcblxuICAgIGNvbmZpZy5zdGVwcy5mb3JFYWNoKChzdGVwOiBhbnksIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgIGlmICghc3RlcC5pZCkge1xuICAgICAgICBlcnJvcnMucHVzaCh7XG4gICAgICAgICAgbGluZTogaW5kZXgsXG4gICAgICAgICAgY29sdW1uOiAwLFxuICAgICAgICAgIG1lc3NhZ2U6ICdTdGVwIGlzIG1pc3NpbmcgcmVxdWlyZWQgcHJvcGVydHk6IGlkJyxcbiAgICAgICAgICBzZXZlcml0eTogdnNjb2RlLkRpYWdub3N0aWNTZXZlcml0eS5FcnJvcixcbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSBpZiAoc3RlcElkcy5oYXMoc3RlcC5pZCkpIHtcbiAgICAgICAgZXJyb3JzLnB1c2goe1xuICAgICAgICAgIGxpbmU6IGluZGV4LFxuICAgICAgICAgIGNvbHVtbjogMCxcbiAgICAgICAgICBtZXNzYWdlOiBgRHVwbGljYXRlIHN0ZXAgaWQ6ICR7c3RlcC5pZH1gLFxuICAgICAgICAgIHNldmVyaXR5OiB2c2NvZGUuRGlhZ25vc3RpY1NldmVyaXR5LkVycm9yLFxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgc3RlcElkcy5hZGQoc3RlcC5pZClcblxuICAgICAgaWYgKCFzdGVwLnRpdGxlKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKHtcbiAgICAgICAgICBsaW5lOiBpbmRleCxcbiAgICAgICAgICBjb2x1bW46IDAsXG4gICAgICAgICAgbWVzc2FnZTogJ1N0ZXAgaXMgbWlzc2luZyByZXF1aXJlZCBwcm9wZXJ0eTogdGl0bGUnLFxuICAgICAgICAgIHNldmVyaXR5OiB2c2NvZGUuRGlhZ25vc3RpY1NldmVyaXR5Lldhcm5pbmcsXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIHJldHVybiBlcnJvcnNcbn1cblxuLyoqXG4gKiBQcm92aWRlcyBjb21wbGV0aW9uIGl0ZW1zIGZvciBERkUgY29uZmlndXJhdGlvbiBmaWxlc1xuICovXG5mdW5jdGlvbiBnZXRDb21wbGV0aW9uSXRlbXMoKTogdnNjb2RlLkNvbXBsZXRpb25JdGVtW10ge1xuICBjb25zdCBpdGVtczogdnNjb2RlLkNvbXBsZXRpb25JdGVtW10gPSBbXVxuXG4gIC8vIEZpZWxkIHR5cGUgY29tcGxldGlvbnNcbiAgY29uc3QgZmllbGRUeXBlcyA9IFtcbiAgICAnU0hPUlRfVEVYVCcsXG4gICAgJ0xPTkdfVEVYVCcsXG4gICAgJ05VTUJFUicsXG4gICAgJ0VNQUlMJyxcbiAgICAnUEhPTkUnLFxuICAgICdEQVRFJyxcbiAgICAnREFURV9SQU5HRScsXG4gICAgJ1RJTUUnLFxuICAgICdEQVRFX1RJTUUnLFxuICAgICdTRUxFQ1QnLFxuICAgICdNVUxUSV9TRUxFQ1QnLFxuICAgICdSQURJTycsXG4gICAgJ0NIRUNLQk9YJyxcbiAgICAnRklMRV9VUExPQUQnLFxuICAgICdSQVRJTkcnLFxuICAgICdTQ0FMRScsXG4gICAgJ1VSTCcsXG4gICAgJ1BBU1NXT1JEJyxcbiAgICAnSElEREVOJyxcbiAgICAnU0VDVElPTl9CUkVBSycsXG4gICAgJ0ZJRUxEX0dST1VQJyxcbiAgICAnUklDSF9URVhUJyxcbiAgICAnU0lHTkFUVVJFJyxcbiAgICAnQUREUkVTUycsXG4gIF1cblxuICBmaWVsZFR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICBjb25zdCBpdGVtID0gbmV3IHZzY29kZS5Db21wbGV0aW9uSXRlbSh0eXBlLCB2c2NvZGUuQ29tcGxldGlvbkl0ZW1LaW5kLkVudW0pXG4gICAgaXRlbS5kZXRhaWwgPSBgRmllbGQgdHlwZTogJHt0eXBlfWBcbiAgICBpdGVtcy5wdXNoKGl0ZW0pXG4gIH0pXG5cbiAgLy8gQ29uZGl0aW9uIGFjdGlvbiBjb21wbGV0aW9uc1xuICBjb25zdCBhY3Rpb25zID0gWydzaG93JywgJ2hpZGUnLCAnZW5hYmxlJywgJ2Rpc2FibGUnLCAncmVxdWlyZScsICdvcHRpb25hbCddXG4gIGFjdGlvbnMuZm9yRWFjaCgoYWN0aW9uKSA9PiB7XG4gICAgY29uc3QgaXRlbSA9IG5ldyB2c2NvZGUuQ29tcGxldGlvbkl0ZW0oYWN0aW9uLCB2c2NvZGUuQ29tcGxldGlvbkl0ZW1LaW5kLktleXdvcmQpXG4gICAgaXRlbS5kZXRhaWwgPSBgQ29uZGl0aW9uIGFjdGlvbjogJHthY3Rpb259YFxuICAgIGl0ZW1zLnB1c2goaXRlbSlcbiAgfSlcblxuICAvLyBDb25kaXRpb24gb3BlcmF0b3IgY29tcGxldGlvbnNcbiAgY29uc3Qgb3BlcmF0b3JzID0gW1xuICAgICdlcXVhbHMnLFxuICAgICdub3RFcXVhbHMnLFxuICAgICdjb250YWlucycsXG4gICAgJ25vdENvbnRhaW5zJyxcbiAgICAnc3RhcnRzV2l0aCcsXG4gICAgJ2VuZHNXaXRoJyxcbiAgICAnZ3JlYXRlclRoYW4nLFxuICAgICdsZXNzVGhhbicsXG4gICAgJ2dyZWF0ZXJUaGFuT3JFcXVhbCcsXG4gICAgJ2xlc3NUaGFuT3JFcXVhbCcsXG4gICAgJ2lzRW1wdHknLFxuICAgICdpc05vdEVtcHR5JyxcbiAgICAnaXNDaGVja2VkJyxcbiAgICAnaXNOb3RDaGVja2VkJyxcbiAgICAnaXNTZWxlY3RlZCcsXG4gICAgJ2lzTm90U2VsZWN0ZWQnLFxuICAgICdtYXRjaGVzJyxcbiAgICAnZG9lc05vdE1hdGNoJyxcbiAgXVxuXG4gIG9wZXJhdG9ycy5mb3JFYWNoKChvcCkgPT4ge1xuICAgIGNvbnN0IGl0ZW0gPSBuZXcgdnNjb2RlLkNvbXBsZXRpb25JdGVtKG9wLCB2c2NvZGUuQ29tcGxldGlvbkl0ZW1LaW5kLk9wZXJhdG9yKVxuICAgIGl0ZW0uZGV0YWlsID0gYENvbmRpdGlvbiBvcGVyYXRvcjogJHtvcH1gXG4gICAgaXRlbXMucHVzaChpdGVtKVxuICB9KVxuXG4gIC8vIEhUVFAgbWV0aG9kIGNvbXBsZXRpb25zXG4gIGNvbnN0IG1ldGhvZHMgPSBbJ0dFVCcsICdQT1NUJywgJ1BVVCcsICdQQVRDSCcsICdERUxFVEUnXVxuICBtZXRob2RzLmZvckVhY2goKG1ldGhvZCkgPT4ge1xuICAgIGNvbnN0IGl0ZW0gPSBuZXcgdnNjb2RlLkNvbXBsZXRpb25JdGVtKG1ldGhvZCwgdnNjb2RlLkNvbXBsZXRpb25JdGVtS2luZC5LZXl3b3JkKVxuICAgIGl0ZW0uZGV0YWlsID0gYEhUVFAgbWV0aG9kOiAke21ldGhvZH1gXG4gICAgaXRlbXMucHVzaChpdGVtKVxuICB9KVxuXG4gIC8vIFByb3BlcnR5IG5hbWUgY29tcGxldGlvbnNcbiAgY29uc3QgcHJvcGVydHlDb21wbGV0aW9ucyA9IFtcbiAgICB7IGxhYmVsOiAnaWQnLCBraW5kOiB2c2NvZGUuQ29tcGxldGlvbkl0ZW1LaW5kLlByb3BlcnR5LCBkZXRhaWw6ICdVbmlxdWUgaWRlbnRpZmllcicgfSxcbiAgICB7IGxhYmVsOiAna2V5Jywga2luZDogdnNjb2RlLkNvbXBsZXRpb25JdGVtS2luZC5Qcm9wZXJ0eSwgZGV0YWlsOiAnRmllbGQga2V5IGZvciBkYXRhIGJpbmRpbmcnIH0sXG4gICAgeyBsYWJlbDogJ3R5cGUnLCBraW5kOiB2c2NvZGUuQ29tcGxldGlvbkl0ZW1LaW5kLlByb3BlcnR5LCBkZXRhaWw6ICdGaWVsZCB0eXBlJyB9LFxuICAgIHsgbGFiZWw6ICdsYWJlbCcsIGtpbmQ6IHZzY29kZS5Db21wbGV0aW9uSXRlbUtpbmQuUHJvcGVydHksIGRldGFpbDogJ0ZpZWxkIGxhYmVsJyB9LFxuICAgIHsgbGFiZWw6ICdyZXF1aXJlZCcsIGtpbmQ6IHZzY29kZS5Db21wbGV0aW9uSXRlbUtpbmQuUHJvcGVydHksIGRldGFpbDogJ0lzIGZpZWxkIHJlcXVpcmVkJyB9LFxuICAgIHsgbGFiZWw6ICdjb25maWcnLCBraW5kOiB2c2NvZGUuQ29tcGxldGlvbkl0ZW1LaW5kLlByb3BlcnR5LCBkZXRhaWw6ICdGaWVsZCBjb25maWd1cmF0aW9uJyB9LFxuICAgIHsgbGFiZWw6ICdjb25kaXRpb25zJywga2luZDogdnNjb2RlLkNvbXBsZXRpb25JdGVtS2luZC5Qcm9wZXJ0eSwgZGV0YWlsOiAnQ29uZGl0aW9uYWwgcnVsZXMnIH0sXG4gICAgeyBsYWJlbDogJ2ZpZWxkcycsIGtpbmQ6IHZzY29kZS5Db21wbGV0aW9uSXRlbUtpbmQuUHJvcGVydHksIGRldGFpbDogJ0NoaWxkIGZpZWxkcycgfSxcbiAgICB7IGxhYmVsOiAnc3RlcHMnLCBraW5kOiB2c2NvZGUuQ29tcGxldGlvbkl0ZW1LaW5kLlByb3BlcnR5LCBkZXRhaWw6ICdGb3JtIHN0ZXBzJyB9LFxuICAgIHsgbGFiZWw6ICd0aXRsZScsIGtpbmQ6IHZzY29kZS5Db21wbGV0aW9uSXRlbUtpbmQuUHJvcGVydHksIGRldGFpbDogJ1RpdGxlJyB9LFxuICAgIHsgbGFiZWw6ICdkZXNjcmlwdGlvbicsIGtpbmQ6IHZzY29kZS5Db21wbGV0aW9uSXRlbUtpbmQuUHJvcGVydHksIGRldGFpbDogJ0Rlc2NyaXB0aW9uJyB9LFxuICBdXG5cbiAgcHJvcGVydHlDb21wbGV0aW9ucy5mb3JFYWNoKCh7IGxhYmVsLCBraW5kLCBkZXRhaWwgfSkgPT4ge1xuICAgIGNvbnN0IGl0ZW0gPSBuZXcgdnNjb2RlLkNvbXBsZXRpb25JdGVtKGxhYmVsLCBraW5kKVxuICAgIGl0ZW0uZGV0YWlsID0gZGV0YWlsXG4gICAgaXRlbXMucHVzaChpdGVtKVxuICB9KVxuXG4gIHJldHVybiBpdGVtc1xufVxuXG4vKipcbiAqIEFjdGl2YXRlcyB0aGUgREZFIFZTIENvZGUgZXh0ZW5zaW9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhY3RpdmF0ZShjb250ZXh0OiB2c2NvZGUuRXh0ZW5zaW9uQ29udGV4dCkge1xuICBjb25zb2xlLmxvZygnREZFIFZTIENvZGUgZXh0ZW5zaW9uIGFjdGl2YXRlZCcpXG5cbiAgLy8gQ3JlYXRlIGEgZGlhZ25vc3RpYyBjb2xsZWN0aW9uIGZvciBERkUgZmlsZXNcbiAgY29uc3QgZGlhZ25vc3RpY3MgPSB2c2NvZGUubGFuZ3VhZ2VzLmNyZWF0ZURpYWdub3N0aWNDb2xsZWN0aW9uKCdkZmUnKVxuICBjb250ZXh0LnN1YnNjcmlwdGlvbnMucHVzaChkaWFnbm9zdGljcylcblxuICAvKipcbiAgICogVmFsaWRhdGUgYSBkb2N1bWVudCBhbmQgcmVwb3J0IGRpYWdub3N0aWNzXG4gICAqL1xuICBjb25zdCB2YWxpZGF0ZSA9IChkb2N1bWVudDogdnNjb2RlLlRleHREb2N1bWVudCkgPT4ge1xuICAgIC8vIE9ubHkgdmFsaWRhdGUgcmVsZXZhbnQgZmlsZXNcbiAgICBpZiAoXG4gICAgICAhZG9jdW1lbnQuZmlsZU5hbWUubWF0Y2goXG4gICAgICAgIC9cXC4oZGZlXFwuanNvbnxkZmUtZm9ybVxcLmpzb258ZGZlXFwuY29uZmlnXFwuanNvbikkL1xuICAgICAgKVxuICAgICkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgZXJyb3JzID0gdmFsaWRhdGVEZmVGaWxlKGRvY3VtZW50KVxuICAgIGNvbnN0IGRpYWdub3N0aWNMaXN0OiB2c2NvZGUuRGlhZ25vc3RpY1tdID0gZXJyb3JzLm1hcCgoZXJyb3IpID0+IHtcbiAgICAgIGNvbnN0IHJhbmdlID0gbmV3IHZzY29kZS5SYW5nZShcbiAgICAgICAgbmV3IHZzY29kZS5Qb3NpdGlvbihlcnJvci5saW5lLCBlcnJvci5jb2x1bW4pLFxuICAgICAgICBuZXcgdnNjb2RlLlBvc2l0aW9uKGVycm9yLmxpbmUsIGVycm9yLmNvbHVtbiArIDUwKVxuICAgICAgKVxuICAgICAgY29uc3QgZGlhZ25vc3RpYyA9IG5ldyB2c2NvZGUuRGlhZ25vc3RpYyhyYW5nZSwgZXJyb3IubWVzc2FnZSwgZXJyb3Iuc2V2ZXJpdHkpXG4gICAgICBkaWFnbm9zdGljLnNvdXJjZSA9ICdERkUnXG4gICAgICByZXR1cm4gZGlhZ25vc3RpY1xuICAgIH0pXG5cbiAgICBkaWFnbm9zdGljcy5zZXQoZG9jdW1lbnQudXJpLCBkaWFnbm9zdGljTGlzdClcbiAgfVxuXG4gIC8vIFJlZ2lzdGVyIHZhbGlkYXRpb24gb24gc2F2ZSBhbmQgb3BlblxuICBjb250ZXh0LnN1YnNjcmlwdGlvbnMucHVzaCh2c2NvZGUud29ya3NwYWNlLm9uRGlkU2F2ZVRleHREb2N1bWVudCh2YWxpZGF0ZSkpXG4gIGNvbnRleHQuc3Vic2NyaXB0aW9ucy5wdXNoKHZzY29kZS53b3Jrc3BhY2Uub25EaWRPcGVuVGV4dERvY3VtZW50KHZhbGlkYXRlKSlcbiAgY29udGV4dC5zdWJzY3JpcHRpb25zLnB1c2godnNjb2RlLndvcmtzcGFjZS5vbkRpZENoYW5nZVRleHREb2N1bWVudCgoZSkgPT4gdmFsaWRhdGUoZS5kb2N1bWVudCkpKVxuXG4gIC8vIFJlZ2lzdGVyIGNvbXBsZXRpb24gcHJvdmlkZXJcbiAgY29udGV4dC5zdWJzY3JpcHRpb25zLnB1c2goXG4gICAgdnNjb2RlLmxhbmd1YWdlcy5yZWdpc3RlckNvbXBsZXRpb25JdGVtUHJvdmlkZXIoXG4gICAgICB7IGxhbmd1YWdlOiAnanNvbicsIHBhdHRlcm46ICcqKi8qLntkZmUuanNvbixkZmUtZm9ybS5qc29uLGRmZS5jb25maWcuanNvbn0nIH0sXG4gICAgICB7XG4gICAgICAgIHByb3ZpZGVDb21wbGV0aW9uSXRlbXM6ICgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZ2V0Q29tcGxldGlvbkl0ZW1zKClcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICAnXCInXG4gICAgKVxuICApXG5cbiAgLy8gVmFsaWRhdGUgYWxsIG9wZW4gZG9jdW1lbnRzIG9uIGFjdGl2YXRpb25cbiAgdnNjb2RlLndvcmtzcGFjZS50ZXh0RG9jdW1lbnRzLmZvckVhY2godmFsaWRhdGUpXG5cbiAgY29uc29sZS5sb2coJ0RGRSBWUyBDb2RlIGV4dGVuc2lvbiBmdWxseSBpbml0aWFsaXplZCcpXG59XG5cbi8qKlxuICogRGVhY3RpdmF0ZXMgdGhlIERGRSBWUyBDb2RlIGV4dGVuc2lvblxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVhY3RpdmF0ZSgpIHtcbiAgY29uc29sZS5sb2coJ0RGRSBWUyBDb2RlIGV4dGVuc2lvbiBkZWFjdGl2YXRlZCcpXG59XG4iXX0=