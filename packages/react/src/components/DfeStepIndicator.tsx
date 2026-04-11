import React from 'react'
import type { StepNodeState } from '@dmc-98/dfe-core'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DfeStepIndicatorProps {
  /** All visible steps */
  steps: StepNodeState[]
  /** Current step index (zero-based) */
  currentIndex: number
  /** Callback when a step is clicked */
  onStepClick?: (index: number) => void
  /** Class name for the container */
  className?: string
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Headless step progress indicator for multi-step forms.
 * Renders an unstyled ordered list of steps with data attributes
 * for styling via CSS.
 *
 * Data attributes on each step:
 * - `data-dfe-step` — step ID
 * - `data-dfe-active` — "true" if this is the current step
 * - `data-dfe-complete` — "true" if the step is marked complete
 * - `data-dfe-clickable` — "true" if onStepClick is provided
 *
 * @example
 * ```tsx
 * <DfeStepIndicator
 *   steps={stepper.visibleSteps}
 *   currentIndex={stepper.currentIndex}
 *   onStepClick={stepper.jumpTo}
 * />
 * ```
 */
export function DfeStepIndicator({
  steps,
  currentIndex,
  onStepClick,
  className,
}: DfeStepIndicatorProps): React.ReactElement {
  const sharedItemStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--dfe-space-sm, 0.625rem)',
    padding: 'var(--dfe-space-sm, 0.625rem) var(--dfe-space-md, 0.875rem)',
    borderRadius: 'var(--dfe-radius-pill, 999px)',
    border: '1px solid var(--dfe-color-border, #cbd5e1)',
    background: 'var(--dfe-color-surface, #ffffff)',
    color: 'var(--dfe-color-text, #0f172a)',
    boxShadow: 'var(--dfe-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.06))',
    textAlign: 'left',
  }

  return (
    <nav className={className} data-dfe-steps aria-label="Form steps">
      <ol
        data-dfe-step-list
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 'var(--dfe-space-sm, 0.625rem)',
          listStyle: 'none',
          padding: 0,
          margin: 0,
        }}
      >
        {steps.map((stepNode, index) => {
          const isActive = index === currentIndex
          const isPast = index < currentIndex
          const itemStyle: React.CSSProperties = {
            ...sharedItemStyle,
            background: isActive
              ? 'var(--dfe-color-surface-muted, #eef2ff)'
              : 'var(--dfe-color-surface, #ffffff)',
            border: isActive
              ? '1px solid var(--dfe-color-primary, #0f766e)'
              : sharedItemStyle.border,
            opacity: !isPast && !isActive ? 0.72 : 1,
            cursor: onStepClick ? 'pointer' : 'default',
          }

          return (
            <li
              key={stepNode.step.id}
              data-dfe-step-item
              data-dfe-step={stepNode.step.id}
              data-dfe-active={isActive ? 'true' : undefined}
              data-dfe-complete={stepNode.isComplete ? 'true' : undefined}
              data-dfe-clickable={onStepClick ? 'true' : undefined}
              data-dfe-future={!isPast && !isActive ? 'true' : undefined}
              aria-current={isActive ? 'step' : undefined}
            >
              {onStepClick ? (
                <button
                  type="button"
                  onClick={() => onStepClick(index)}
                  data-dfe-step-button
                  style={itemStyle}
                >
                  <span
                    data-dfe-step-index
                    style={{
                      width: '1.75rem',
                      height: '1.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '999px',
                      background: 'var(--dfe-color-primary, #0f766e)',
                      color: 'var(--dfe-color-primary-foreground, #f8fafc)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </span>
                  <span>{stepNode.step.title}</span>
                  {stepNode.isComplete && <span aria-label="complete"> ✓</span>}
                </button>
              ) : (
                <span data-dfe-step-label style={itemStyle}>
                  <span
                    data-dfe-step-index
                    style={{
                      width: '1.75rem',
                      height: '1.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '999px',
                      background: 'var(--dfe-color-primary, #0f766e)',
                      color: 'var(--dfe-color-primary-foreground, #f8fafc)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </span>
                  <span>{stepNode.step.title}</span>
                  {stepNode.isComplete && <span aria-label="complete"> ✓</span>}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
