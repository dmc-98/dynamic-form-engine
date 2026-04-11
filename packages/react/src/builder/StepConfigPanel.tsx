import React, { useCallback } from 'react'
import type { StepConfig, StepApiContract, ReviewConfig } from '@dmc-98/dfe-core'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StepConfigPanelProps {
  /** Current step configuration */
  config: StepConfig
  /** Callback when configuration changes */
  onChange: (config: StepConfig) => void
  /** Class name for the container */
  className?: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function emptyContract(): StepApiContract {
  return {
    resourceName: '',
    endpoint: '',
    method: 'POST',
    fieldMapping: {},
    responseToContext: {},
    contextToBody: {},
  }
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

interface ApiContractEditorProps {
  contract: StepApiContract
  index: number
  onChange: (index: number, contract: StepApiContract) => void
  onRemove: (index: number) => void
}

function ApiContractEditor({ contract, index, onChange, onRemove }: ApiContractEditorProps) {
  const update = (partial: Partial<StepApiContract>) => {
    onChange(index, { ...contract, ...partial })
  }

  return (
    <fieldset data-dfe-builder-contract={index}>
      <legend>API Endpoint #{index + 1}</legend>

      <div data-dfe-builder-field>
        <label htmlFor={`contract-resource-${index}`}>Resource name</label>
        <small>Internal identifier for this API resource</small>
        <input
          id={`contract-resource-${index}`}
          type="text"
          value={contract.resourceName}
          onChange={e => update({ resourceName: e.target.value })}
          placeholder="e.g., Employee"
        />
      </div>

      <div data-dfe-builder-field>
        <label htmlFor={`contract-endpoint-${index}`}>API Endpoint</label>
        <small>URL with placeholders, e.g., /api/employees/&#123;employeeId&#125;</small>
        <input
          id={`contract-endpoint-${index}`}
          type="text"
          value={contract.endpoint}
          onChange={e => update({ endpoint: e.target.value })}
          placeholder="/api/resource/{id}"
        />
      </div>

      <div data-dfe-builder-field>
        <label htmlFor={`contract-method-${index}`}>HTTP Method</label>
        <select
          id={`contract-method-${index}`}
          value={contract.method}
          onChange={e => update({ method: e.target.value as 'POST' | 'PUT' })}
        >
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
        </select>
      </div>

      <div data-dfe-builder-section>
        <h4>Request Body Mapping</h4>
        <small>Map form field keys to API request body keys</small>
        <MappingEditor
          mapping={contract.fieldMapping}
          onChange={fieldMapping => update({ fieldMapping })}
          fromLabel="Form field key"
          toLabel="Request body key"
        />
      </div>

      <div data-dfe-builder-section>
        <h4>Context → Request Body</h4>
        <small>Inject runtime context values into the request (e.g., foreign keys)</small>
        <MappingEditor
          mapping={contract.contextToBody ?? {}}
          onChange={contextToBody => update({ contextToBody })}
          fromLabel="Context key"
          toLabel="Request body key"
        />
      </div>

      <div data-dfe-builder-section>
        <h4>Response → Context</h4>
        <small>Extract response values to propagate across steps</small>
        <MappingEditor
          mapping={contract.responseToContext ?? {}}
          onChange={responseToContext => update({ responseToContext })}
          fromLabel="Response key"
          toLabel="Context key"
        />
      </div>

      <button type="button" onClick={() => onRemove(index)} data-dfe-builder-remove>
        Remove API Endpoint
      </button>
    </fieldset>
  )
}

interface MappingEditorProps {
  mapping: Record<string, string>
  onChange: (mapping: Record<string, string>) => void
  fromLabel: string
  toLabel: string
}

function MappingEditor({ mapping, onChange, fromLabel, toLabel }: MappingEditorProps) {
  const entries = Object.entries(mapping)

  const addEntry = () => {
    onChange({ ...mapping, '': '' })
  }

  const updateEntry = (oldKey: string, newKey: string, newValue: string) => {
    const updated = { ...mapping }
    if (oldKey !== newKey) {
      delete updated[oldKey]
    }
    updated[newKey] = newValue
    onChange(updated)
  }

  const removeEntry = (key: string) => {
    const updated = { ...mapping }
    delete updated[key]
    onChange(updated)
  }

  return (
    <div data-dfe-builder-mapping>
      {entries.map(([key, value], i) => (
        <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            value={key}
            onChange={e => updateEntry(key, e.target.value, value)}
            placeholder={fromLabel}
            aria-label={fromLabel}
          />
          <span>→</span>
          <input
            type="text"
            value={value}
            onChange={e => updateEntry(key, key, e.target.value)}
            placeholder={toLabel}
            aria-label={toLabel}
          />
          <button type="button" onClick={() => removeEntry(key)} aria-label="Remove mapping">
            ×
          </button>
        </div>
      ))}
      <button type="button" onClick={addEntry}>
        + Add mapping
      </button>
    </div>
  )
}

// ─── Review Config Editor ───────────────────────────────────────────────────

interface ReviewConfigEditorProps {
  review?: ReviewConfig
  onChange: (review: ReviewConfig | undefined) => void
}

function ReviewConfigEditor({ review, onChange }: ReviewConfigEditorProps) {
  const enabled = !!review

  return (
    <div data-dfe-builder-section>
      <h3>Review Step</h3>
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={e => {
            if (e.target.checked) {
              onChange({ editMode: 'navigate' })
            } else {
              onChange(undefined)
            }
          }}
        />
        This step is a review/summary step
      </label>

      {review && (
        <>
          <div data-dfe-builder-field>
            <label htmlFor="review-edit-mode">Edit mode</label>
            <select
              id="review-edit-mode"
              value={review.editMode}
              onChange={e => onChange({ ...review, editMode: e.target.value as ReviewConfig['editMode'] })}
            >
              <option value="navigate">Navigate to step</option>
              <option value="modal">Edit in modal</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div data-dfe-builder-field>
            <label htmlFor="review-redirect">Redirect after submit</label>
            <input
              id="review-redirect"
              type="text"
              value={review.redirectAfterSubmit ?? ''}
              onChange={e => onChange({
                ...review,
                redirectAfterSubmit: e.target.value || undefined,
              })}
              placeholder="/thank-you"
            />
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

/**
 * Builder panel for configuring a form step's API contracts and review settings.
 *
 * Uses API-centric terminology throughout:
 * - "API Configuration" (not "Model Bindings")
 * - "API Endpoint" (not "Model")
 * - "Resource name" (not "Model name")
 * - "Request Body Mapping" (not "Field Mapping")
 * - "Context → Request Body" (not "Context → Model")
 *
 * @example
 * ```tsx
 * <StepConfigPanel
 *   config={step.config ?? {}}
 *   onChange={(newConfig) => updateStep(step.id, { config: newConfig })}
 * />
 * ```
 */
export function StepConfigPanel({ config, onChange, className }: StepConfigPanelProps) {
  const contracts = config.apiContracts ?? []

  const updateContract = useCallback((index: number, contract: StepApiContract) => {
    const updated = [...contracts]
    updated[index] = contract
    onChange({ ...config, apiContracts: updated })
  }, [contracts, config, onChange])

  const removeContract = useCallback((index: number) => {
    const updated = contracts.filter((_, i) => i !== index)
    onChange({ ...config, apiContracts: updated })
  }, [contracts, config, onChange])

  const addContract = useCallback(() => {
    onChange({ ...config, apiContracts: [...contracts, emptyContract()] })
  }, [contracts, config, onChange])

  const updateReview = useCallback((review: ReviewConfig | undefined) => {
    onChange({ ...config, review })
  }, [config, onChange])

  return (
    <div className={className} data-dfe-builder-step-config>
      <h2>API Configuration</h2>

      {contracts.map((contract, i) => (
        <ApiContractEditor
          key={i}
          contract={contract}
          index={i}
          onChange={updateContract}
          onRemove={removeContract}
        />
      ))}

      <button type="button" onClick={addContract} data-dfe-builder-add>
        + Add API Endpoint
      </button>

      <ReviewConfigEditor
        review={config.review}
        onChange={updateReview}
      />
    </div>
  )
}
