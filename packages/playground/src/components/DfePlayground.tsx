import React, { useEffect, useState, useCallback, useMemo } from 'react'
import type {
  AutofillDraftResult,
  FieldSuggestion,
  FormValues,
  ValidationSuggestion,
} from '@dmc--98/dfe-core'
import {
  TEMPLATES,
  createFormEngine,
  detectFormType,
  generateAutofillDraft,
  generateFormFromDescription,
  groupSuggestionsByCategory,
  suggestAdditionalFields,
  suggestValidationRules,
} from '@dmc--98/dfe-core'
import { DfeFormRenderer } from '@dmc--98/dfe-react/components'
import {
  appendFieldSuggestion,
  applyValidationSuggestion,
  canApplyValidationSuggestion,
  createGeneratedConfig,
  createTemplateConfig,
  parsePlaygroundConfig,
  stringifyPlaygroundConfig,
} from '../playground-utils'
import { validateFormConfigData } from '../validateConfig'
import type { PlaygroundFormConfig, PlaygroundValidationIssue } from '../validateConfig'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DfePlaygroundProps {
  /** Initial form configuration JSON string */
  initialConfig?: string
  /** Class name for the container */
  className?: string
}

type ActionTone = 'success' | 'warning' | 'error'

interface ActionState {
  tone: ActionTone
  message: string
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Interactive playground for testing Dynamic Form Engine configurations.
 * Split pane with JSON editor on left and live form preview on right.
 * Includes validation, template loading, and field value inspection.
 */
export function DfePlayground({ initialConfig, className }: DfePlaygroundProps): React.ReactElement {
  const defaultTemplate = TEMPLATES[0]
  const [jsonText, setJsonText] = useState<string>(
    initialConfig || stringifyPlaygroundConfig(createTemplateConfig(defaultTemplate))
  )
  const [formValues, setFormValues] = useState<FormValues>(() => createFormEngine(defaultTemplate.fields).getValues())
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [validationIssues, setValidationIssues] = useState<PlaygroundValidationIssue[]>([])
  const [actionState, setActionState] = useState<ActionState | null>(null)
  const [generationPrompt, setGenerationPrompt] = useState('')
  const [generationCategory, setGenerationCategory] = useState('auto')
  const [multiStepGeneration, setMultiStepGeneration] = useState(true)
  const [autofillSource, setAutofillSource] = useState('')
  const [autofillConsent, setAutofillConsent] = useState(false)
  const [autofillDraft, setAutofillDraft] = useState<AutofillDraftResult | null>(null)

  const { config, parseError } = useMemo(
    () => parsePlaygroundConfig(jsonText),
    [jsonText],
  )
  const configFields = config?.fields ?? []
  const configSteps = config?.steps ?? []

  const engine = useMemo(() => {
    if (!config || configFields.length === 0) return null
    try {
      return createFormEngine(configFields)
    } catch {
      return null
    }
  }, [config, configFields])

  const visibleFields = engine?.getVisibleFields() ?? []
  const detectedCategory = useMemo(() => {
    if (!config) return 'general'

    const searchText = [config.title, config.description, config.category, ...configFields.map((field) => field.label)]
      .filter(Boolean)
      .join(' ')

    return detectFormType(searchText)
  }, [config, configFields])
  const validationSuggestions = useMemo<ValidationSuggestion[]>(
    () => configFields.length > 0 ? suggestValidationRules(configFields) : [],
    [configFields],
  )
  const additionalFieldSuggestions = useMemo<FieldSuggestion[]>(
    () => configFields.length > 0 ? suggestAdditionalFields(configFields, detectedCategory) : [],
    [configFields, detectedCategory],
  )
  const groupedFieldSuggestions = useMemo(
    () => groupSuggestionsByCategory(additionalFieldSuggestions),
    [additionalFieldSuggestions],
  )

  useEffect(() => {
    if (!engine) {
      setFormValues({})
      setValidationErrors({})
      return
    }

    setFormValues(engine.getValues())
    setValidationErrors(engine.validate().errors)
  }, [engine])

  useEffect(() => {
    setAutofillDraft(null)
  }, [jsonText])

  const handleFieldChange = useCallback(
    (key: string, value: unknown) => {
      if (!engine) return
      engine.setFieldValue(key, value)
      setFormValues(engine.getValues())

      const { errors } = engine.validate()
      setValidationErrors(errors)
    },
    [engine]
  )

  const handleLoadTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId)
    if (template) {
      setJsonText(stringifyPlaygroundConfig(createTemplateConfig(template)))
      setValidationIssues([])
      setActionState({
        tone: 'success',
        message: `Loaded the "${template.name}" template.`,
      })
    }
  }

  const handleCopyToClipboard = async () => {
    const clipboard = navigator?.clipboard
    if (!clipboard) {
      setActionState({
        tone: 'warning',
        message: 'Clipboard access is not available in this browser context.',
      })
      return
    }

    try {
      await clipboard.writeText(jsonText)
      setActionState({
        tone: 'success',
        message: 'Copied the current configuration JSON to the clipboard.',
      })
    } catch (error) {
      setActionState({
        tone: 'error',
        message: `Failed to copy the configuration: ${(error as Error).message}`,
      })
    }
  }

  const handleValidateConfig = () => {
    if (!config) {
      setValidationIssues([])
      setActionState({
        tone: 'error',
        message: parseError ?? 'Fix the configuration JSON before validating it.',
      })
      return
    }

    const { issues } = validateFormConfigData(config)
    const errors = issues.filter((issue) => issue.severity === 'error').length
    const warnings = issues.filter((issue) => issue.severity === 'warning').length

    setValidationIssues(issues)
    setActionState({
      tone: errors > 0 ? 'error' : warnings > 0 ? 'warning' : 'success',
      message: issues.length === 0
        ? 'Configuration is valid.'
        : `Found ${errors} error(s) and ${warnings} warning(s).`,
    })
  }

  const handleGenerateConfig = () => {
    const description = generationPrompt.trim()
    if (!description) {
      setActionState({
        tone: 'warning',
        message: 'Describe the form you want before generating a config.',
      })
      return
    }

    const generatedConfig = generateFormFromDescription({
      description,
      category: generationCategory === 'auto' ? undefined : generationCategory,
      multiStep: multiStepGeneration,
    })

    setJsonText(stringifyPlaygroundConfig(createGeneratedConfig(generatedConfig)))
    setValidationIssues([])
    setActionState({
      tone: 'success',
      message: `Generated a ${generatedConfig.category} form config from the prompt.`,
    })
  }

  const handleApplyValidationSuggestion = (suggestion: ValidationSuggestion) => {
    if (!config || !canApplyValidationSuggestion(suggestion)) {
      setActionState({
        tone: 'warning',
        message: `The suggestion "${suggestion.rule}" is advisory only and cannot be applied automatically.`,
      })
      return
    }

    const nextConfig = applyValidationSuggestion(config, suggestion)
    setJsonText(stringifyPlaygroundConfig(nextConfig))
    setActionState({
      tone: 'success',
      message: `Applied "${suggestion.rule}" to ${suggestion.fieldLabel}.`,
    })
  }

  const handleAddFieldSuggestion = (suggestion: FieldSuggestion) => {
    if (!config) {
      return
    }

    const nextConfig = appendFieldSuggestion(config, suggestion)
    setJsonText(stringifyPlaygroundConfig(nextConfig))
    setActionState({
      tone: 'success',
      message: `Added "${suggestion.label}" to the form config.`,
    })
  }

  const handleGenerateAutofillDraft = () => {
    if (!engine || visibleFields.length === 0) {
      setActionState({
        tone: 'warning',
        message: 'Load a valid form config before generating draft answers.',
      })
      return
    }

    if (!autofillConsent) {
      setActionState({
        tone: 'warning',
        message: 'Confirm consent before generating AI-assisted draft answers.',
      })
      return
    }

    const draft = generateAutofillDraft({
      fields: visibleFields,
      sourceText: autofillSource,
    })

    setAutofillDraft(draft)
    setActionState({
      tone: draft.matches.length > 0 ? 'success' : 'warning',
      message: draft.matches.length > 0
        ? `Generated ${draft.matches.length} review-only draft answer(s).`
        : 'No draft answers could be inferred from the provided text.',
    })
  }

  const handleApplyAutofillDraft = () => {
    if (!engine || !autofillDraft) {
      return
    }

    for (const [key, value] of Object.entries(autofillDraft.values)) {
      engine.setFieldValue(key, value)
    }

    setFormValues(engine.getValues())
    setValidationErrors(engine.validate().errors)
    setActionState({
      tone: 'success',
      message: `Applied ${autofillDraft.matches.length} reviewed draft answer(s) to the preview form.`,
    })
  }

  return (
    <div className={className} data-dfe-playground>
      <div data-dfe-playground-header>
        <h2>DFE Playground</h2>
        <p data-dfe-playground-description>
          Browser-verified authoring, AI-assisted config generation, and review-first draft fill for Dynamic Form Engine configs.
        </p>
        <div data-dfe-playground-meta>
          <span data-dfe-playground-meta-item>
            Detected form type: <strong>{detectedCategory}</strong>
          </span>
          <span data-dfe-playground-meta-item>
            Preview fields: <strong>{visibleFields.length}</strong>
          </span>
          <span data-dfe-playground-meta-item>
            Steps: <strong>{configSteps.length}</strong>
          </span>
        </div>
      </div>

      {actionState && (
        <div
          data-dfe-playground-status={actionState.tone}
          role={actionState.tone === 'error' ? 'alert' : 'status'}
        >
          {actionState.message}
        </div>
      )}

      <div data-dfe-playground-toolbar>
        <div data-dfe-playground-toolbar-group>
          <label htmlFor="template-select" data-dfe-playground-label>
            Load Template:
          </label>
          <select
            id="template-select"
            onChange={e => handleLoadTemplate(e.target.value)}
            data-dfe-playground-select
          >
            <option value="">Select a template...</option>
            {TEMPLATES.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div data-dfe-playground-toolbar-group>
          <button type="button" onClick={handleValidateConfig} data-dfe-playground-action>
            Validate Config
          </button>
          <button type="button" onClick={handleCopyToClipboard} data-dfe-playground-action>
            Copy to Clipboard
          </button>
        </div>
      </div>

      <div data-dfe-playground-ai-workspace>
        <div data-dfe-playground-pane data-dfe-playground-ai-authoring>
          <div data-dfe-playground-pane-header>
            <h3>AI-Assisted Authoring</h3>
            <p data-dfe-playground-pane-copy>
              Uses the deterministic DFE core helpers to generate configs and authoring suggestions locally.
            </p>
          </div>

          <label htmlFor="ai-description" data-dfe-playground-label>
            Describe the form you want
          </label>
          <textarea
            id="ai-description"
            value={generationPrompt}
            onChange={(event) => setGenerationPrompt(event.target.value)}
            placeholder="Example: Registration form for a developer beta with name, email, password, and terms."
            data-dfe-playground-ai-description
            rows={4}
            spellCheck="false"
          />

          <div data-dfe-playground-inline-controls>
            <label data-dfe-playground-inline-field>
              Category
              <select
                value={generationCategory}
                onChange={(event) => setGenerationCategory(event.target.value)}
                data-dfe-playground-ai-category
              >
                <option value="auto">Auto detect</option>
                <option value="contact">Contact</option>
                <option value="registration">Registration</option>
                <option value="onboarding">Onboarding</option>
                <option value="survey">Survey</option>
                <option value="support">Support</option>
                <option value="application">Application</option>
                <option value="event">Event</option>
                <option value="booking">Booking</option>
              </select>
            </label>

            <label data-dfe-playground-inline-checkbox>
              <input
                type="checkbox"
                checked={multiStepGeneration}
                onChange={(event) => setMultiStepGeneration(event.target.checked)}
                data-dfe-playground-ai-multistep
              />
              Generate step structure
            </label>
          </div>

          <button
            type="button"
            onClick={handleGenerateConfig}
            data-dfe-playground-ai-generate
          >
            Generate Form Config
          </button>

          <div data-dfe-playground-ai-suggestions>
            <div data-dfe-playground-section>
              <h4>Validation Suggestions</h4>
              {validationSuggestions.length === 0 ? (
                <p data-dfe-playground-empty>Load or generate a config to see validation suggestions.</p>
              ) : (
                <ul data-dfe-playground-suggestion-list>
                  {validationSuggestions.map((suggestion) => (
                    <li
                      key={`${suggestion.fieldKey}:${suggestion.rule}`}
                      data-dfe-playground-validation-suggestion
                    >
                      <div>
                        <strong>{suggestion.fieldLabel}</strong> <span>{suggestion.rule}</span>
                        <p>{suggestion.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyValidationSuggestion(suggestion)}
                        disabled={!canApplyValidationSuggestion(suggestion)}
                        data-dfe-playground-apply-validation
                      >
                        {canApplyValidationSuggestion(suggestion) ? 'Apply' : 'Advisory Only'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div data-dfe-playground-section>
              <h4>Suggested Additional Fields</h4>
              {additionalFieldSuggestions.length === 0 ? (
                <p data-dfe-playground-empty>No additional field suggestions right now.</p>
              ) : (
                <div data-dfe-playground-grouped-suggestions>
                  {Object.entries(groupedFieldSuggestions).map(([category, suggestions]) => (
                    <div key={category} data-dfe-playground-suggestion-group>
                      <h5>{category}</h5>
                      <ul data-dfe-playground-suggestion-list>
                        {suggestions.map((suggestion) => (
                          <li
                            key={suggestion.key}
                            data-dfe-playground-field-suggestion
                          >
                            <div>
                              <strong>{suggestion.label}</strong> <span>{suggestion.type}</span>
                              <p>{suggestion.reason}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddFieldSuggestion(suggestion)}
                              data-dfe-playground-add-field
                            >
                              Add Field
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div data-dfe-playground-pane data-dfe-playground-ai-autofill>
          <div data-dfe-playground-pane-header>
            <h3>AI-Assisted Draft Fill</h3>
            <p data-dfe-playground-pane-copy>
              Paste profile text, review the proposed values, and then choose whether to apply them. Draft generation never auto-submits the form.
            </p>
          </div>

          <label htmlFor="autofill-source" data-dfe-playground-label>
            Profile text or structured answers
          </label>
          <textarea
            id="autofill-source"
            value={autofillSource}
            onChange={(event) => setAutofillSource(event.target.value)}
            placeholder="Example:\nName: Ada Lovelace\nEmail: ada@example.com\nDepartment: Engineering"
            data-dfe-playground-autofill-source
            rows={8}
            spellCheck="false"
          />

          <label data-dfe-playground-inline-checkbox>
            <input
              type="checkbox"
              checked={autofillConsent}
              onChange={(event) => setAutofillConsent(event.target.checked)}
              data-dfe-playground-autofill-consent
            />
            I confirm that this text can be used locally to draft form answers for review.
          </label>

          <div data-dfe-playground-inline-controls>
            <button
              type="button"
              onClick={handleGenerateAutofillDraft}
              data-dfe-playground-autofill-generate
            >
              Generate Draft Answers
            </button>
            <button
              type="button"
              onClick={handleApplyAutofillDraft}
              disabled={!autofillDraft || autofillDraft.matches.length === 0}
              data-dfe-playground-autofill-apply
            >
              Apply Reviewed Draft
            </button>
          </div>

          {autofillDraft && (
            <div data-dfe-playground-autofill-review>
              <h4>Draft Review</h4>

              {autofillDraft.matches.length === 0 ? (
                <p data-dfe-playground-empty>No draft answers were generated.</p>
              ) : (
                <ul data-dfe-playground-suggestion-list>
                  {autofillDraft.matches.map((match: AutofillDraftResult['matches'][number]) => (
                    <li
                      key={`${match.fieldKey}:${String(match.value)}`}
                      data-dfe-playground-autofill-match
                    >
                      <div>
                        <strong>{match.fieldLabel}</strong>
                        <p>
                          <code>{String(match.value)}</code>
                        </p>
                        <p>{match.reason}</p>
                      </div>
                      <span data-dfe-playground-confidence>
                        {(match.confidence * 100).toFixed(0)}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {autofillDraft.warnings.length > 0 && (
                <div data-dfe-playground-section>
                  <h5>Warnings</h5>
                  <ul data-dfe-playground-warning-list>
                    {autofillDraft.warnings.map((warning: string) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div data-dfe-playground-content>
        <div data-dfe-playground-pane data-dfe-playground-editor>
          <div data-dfe-playground-pane-header>
            <h3>Form Configuration (JSON)</h3>
          </div>
          <textarea
            value={jsonText}
            onChange={e => setJsonText(e.target.value)}
            data-dfe-playground-textarea
            spellCheck="false"
          />
        </div>

        <div data-dfe-playground-pane data-dfe-playground-preview>
          <div data-dfe-playground-pane-header>
            <h3>Live Preview</h3>
          </div>

          <div data-dfe-playground-preview-content>
            {parseError ? (
              <div data-dfe-playground-error>
                <strong>Error:</strong> {parseError}
              </div>
            ) : !engine ? (
              <div data-dfe-playground-empty>Form configuration could not be loaded</div>
            ) : (
              <>
                {config?.title && <h4 data-dfe-playground-preview-title>{config.title}</h4>}
                {config?.description && (
                  <p data-dfe-playground-preview-description>{config.description}</p>
                )}
                <DfeFormRenderer
                  fields={visibleFields}
                  values={formValues}
                  onFieldChange={handleFieldChange}
                  errors={validationErrors}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <div data-dfe-playground-footer>
        <div data-dfe-playground-section>
          <h4>Field Values</h4>
          <pre data-dfe-playground-json>
            {JSON.stringify(formValues, null, 2)}
          </pre>
        </div>

        {validationIssues.length > 0 && (
          <div data-dfe-playground-section>
            <h4>Config Validation Report</h4>
            <ul data-dfe-playground-issues>
              {validationIssues.map((issue) => (
                <li key={`${issue.severity}:${issue.path}:${issue.message}`}>
                  <strong>[{issue.severity}]</strong> {issue.path}: {issue.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {Object.keys(validationErrors).length > 0 && (
          <div data-dfe-playground-section>
            <h4>Preview Validation Errors</h4>
            <pre data-dfe-playground-errors>
              {JSON.stringify(validationErrors, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
