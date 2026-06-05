import * as vscode from 'vscode'

interface ValidationError {
  line: number
  column: number
  message: string
  severity: vscode.DiagnosticSeverity
}

/**
 * Validates a DFE form configuration JSON file.
 * Checks for:
 * - Missing required fields (key, type, label)
 * - Invalid field types
 * - Duplicate field keys
 * - Self-referencing conditions
 * - Malformed JSON
 */
function validateDfeFile(document: vscode.TextDocument): ValidationError[] {
  const errors: ValidationError[] = []
  const content = document.getText()

  // Check if it's a valid JSON first
  let config: any
  try {
    config = JSON.parse(content)
  } catch (err) {
    if (err instanceof SyntaxError) {
      const match = err.message.match(/position (\d+)/)
      if (match) {
        const pos = document.positionAt(parseInt(match[1], 10))
        errors.push({
          line: pos.line,
          column: pos.character,
          message: `Invalid JSON: ${err.message}`,
          severity: vscode.DiagnosticSeverity.Error,
        })
      }
    }
    return errors
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
  ]

  // Validate fields array
  if (config.fields && Array.isArray(config.fields)) {
    const fieldKeys = new Set<string>()
    const fieldIds = new Set<string>()

    config.fields.forEach((field: any, index: number) => {
      // Check required properties
      if (!field.id) {
        errors.push({
          line: index,
          column: 0,
          message: 'Field is missing required property: id',
          severity: vscode.DiagnosticSeverity.Error,
        })
      } else if (fieldIds.has(field.id)) {
        errors.push({
          line: index,
          column: 0,
          message: `Duplicate field id: ${field.id}`,
          severity: vscode.DiagnosticSeverity.Error,
        })
      }
      fieldIds.add(field.id)

      if (!field.key) {
        errors.push({
          line: index,
          column: 0,
          message: 'Field is missing required property: key',
          severity: vscode.DiagnosticSeverity.Error,
        })
      } else if (fieldKeys.has(field.key)) {
        errors.push({
          line: index,
          column: 0,
          message: `Duplicate field key: ${field.key}`,
          severity: vscode.DiagnosticSeverity.Error,
        })
      }
      fieldKeys.add(field.key)

      if (!field.type) {
        errors.push({
          line: index,
          column: 0,
          message: 'Field is missing required property: type',
          severity: vscode.DiagnosticSeverity.Error,
        })
      } else if (!validFieldTypes.includes(field.type)) {
        errors.push({
          line: index,
          column: 0,
          message: `Invalid field type: ${field.type}. Valid types: ${validFieldTypes.join(', ')}`,
          severity: vscode.DiagnosticSeverity.Error,
        })
      }

      if (!field.label) {
        errors.push({
          line: index,
          column: 0,
          message: 'Field is missing required property: label',
          severity: vscode.DiagnosticSeverity.Warning,
        })
      }

      // Validate conditions
      if (field.conditions && Array.isArray(field.conditions)) {
        field.conditions.forEach((condition: any) => {
          if (condition.targetFieldId === field.id) {
            errors.push({
              line: index,
              column: 0,
              message: `Field ${field.id} has a self-referencing condition`,
              severity: vscode.DiagnosticSeverity.Warning,
            })
          }
          if (!condition.action) {
            errors.push({
              line: index,
              column: 0,
              message: 'Condition is missing required property: action',
              severity: vscode.DiagnosticSeverity.Error,
            })
          }
        })
      }
    })
  }

  // Validate steps array
  if (config.steps && Array.isArray(config.steps)) {
    const stepIds = new Set<string>()

    config.steps.forEach((step: any, index: number) => {
      if (!step.id) {
        errors.push({
          line: index,
          column: 0,
          message: 'Step is missing required property: id',
          severity: vscode.DiagnosticSeverity.Error,
        })
      } else if (stepIds.has(step.id)) {
        errors.push({
          line: index,
          column: 0,
          message: `Duplicate step id: ${step.id}`,
          severity: vscode.DiagnosticSeverity.Error,
        })
      }
      stepIds.add(step.id)

      if (!step.title) {
        errors.push({
          line: index,
          column: 0,
          message: 'Step is missing required property: title',
          severity: vscode.DiagnosticSeverity.Warning,
        })
      }
    })
  }

  return errors
}

/**
 * Provides completion items for DFE configuration files
 */
function getCompletionItems(): vscode.CompletionItem[] {
  const items: vscode.CompletionItem[] = []

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
  ]

  fieldTypes.forEach((type) => {
    const item = new vscode.CompletionItem(type, vscode.CompletionItemKind.Enum)
    item.detail = `Field type: ${type}`
    items.push(item)
  })

  // Condition action completions
  const actions = ['show', 'hide', 'enable', 'disable', 'require', 'optional']
  actions.forEach((action) => {
    const item = new vscode.CompletionItem(action, vscode.CompletionItemKind.Keyword)
    item.detail = `Condition action: ${action}`
    items.push(item)
  })

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
  ]

  operators.forEach((op) => {
    const item = new vscode.CompletionItem(op, vscode.CompletionItemKind.Operator)
    item.detail = `Condition operator: ${op}`
    items.push(item)
  })

  // HTTP method completions
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  methods.forEach((method) => {
    const item = new vscode.CompletionItem(method, vscode.CompletionItemKind.Keyword)
    item.detail = `HTTP method: ${method}`
    items.push(item)
  })

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
  ]

  propertyCompletions.forEach(({ label, kind, detail }) => {
    const item = new vscode.CompletionItem(label, kind)
    item.detail = detail
    items.push(item)
  })

  return items
}

/**
 * Activates the DFE VS Code extension
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('DFE VS Code extension activated')

  // Create a diagnostic collection for DFE files
  const diagnostics = vscode.languages.createDiagnosticCollection('dfe')
  context.subscriptions.push(diagnostics)

  /**
   * Validate a document and report diagnostics
   */
  const validate = (document: vscode.TextDocument) => {
    // Only validate relevant files
    if (
      !document.fileName.match(
        /\.(dfe\.json|dfe-form\.json|dfe\.config\.json)$/
      )
    ) {
      return
    }

    const errors = validateDfeFile(document)
    const diagnosticList: vscode.Diagnostic[] = errors.map((error) => {
      const range = new vscode.Range(
        new vscode.Position(error.line, error.column),
        new vscode.Position(error.line, error.column + 50)
      )
      const diagnostic = new vscode.Diagnostic(range, error.message, error.severity)
      diagnostic.source = 'DFE'
      return diagnostic
    })

    diagnostics.set(document.uri, diagnosticList)
  }

  // Register validation on save and open
  context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(validate))
  context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(validate))
  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((e) => validate(e.document)))

  // Register completion provider
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { language: 'json', pattern: '**/*.{dfe.json,dfe-form.json,dfe.config.json}' },
      {
        provideCompletionItems: () => {
          return getCompletionItems()
        },
      },
      '"'
    )
  )

  // Validate all open documents on activation
  vscode.workspace.textDocuments.forEach(validate)

  console.log('DFE VS Code extension fully initialized')
}

/**
 * Deactivates the DFE VS Code extension
 */
export function deactivate() {
  console.log('DFE VS Code extension deactivated')
}
