import React from 'react'
import type { StepNodeState } from '@dmc--98/dfe-core'

export interface DfeMantineStepIndicatorProps {
  steps: StepNodeState[]
  currentIndex: number
  onStepClick?: (index: number) => void
  className?: string
}

/**
 * Styled step indicator using Mantine design patterns.
 */
export function DfeMantineStepIndicator({
  steps,
  currentIndex,
  onStepClick,
  className,
}: DfeMantineStepIndicatorProps): React.ReactElement {
  return (
    <nav
      className={className}
      data-dfe-steps
      aria-label="Form steps"
      style={{
        display: 'flex',
        gap: '16px',
        listStyle: 'none',
        padding: 0,
        margin: 0,
      }}
    >
      <ol style={{ display: 'flex', gap: '16px', listStyle: 'none', padding: 0, margin: 0 }}>
        {steps.map((stepNode, index) => {
          const isActive = index === currentIndex
          const isPast = index < currentIndex
          const isComplete = stepNode.isComplete

          return (
            <li
              key={stepNode.step.id}
              data-dfe-step={stepNode.step.id}
              data-dfe-active={isActive ? 'true' : undefined}
              data-dfe-complete={isComplete ? 'true' : undefined}
              data-dfe-clickable={onStepClick ? 'true' : undefined}
              aria-current={isActive ? 'step' : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  fontWeight: 600,
                  fontSize: '14px',
                  transition: 'all 150ms ease',
                  backgroundColor: isComplete
                    ? '#51cf66'
                    : isActive
                      ? '#1971c2'
                      : isPast
                        ? '#dee2e6'
                        : '#e9ecef',
                  color: isComplete || isActive ? 'white' : isActive ? 'white' : '#495057',
                  border: isActive ? '2px solid #1971c2' : 'none',
                }}
              >
                {isComplete ? (
                  <span style={{ fontSize: '20px' }}>✓</span>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {onStepClick ? (
                <button
                  type="button"
                  onClick={() => onStepClick(index)}
                  style={{
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    color: isActive ? '#1971c2' : '#495057',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>
                    {stepNode.step.title}
                  </div>
                  {stepNode.step.description && (
                    <div style={{ fontSize: '12px', color: '#868e96' }}>
                      {stepNode.step.description}
                    </div>
                  )}
                </button>
              ) : (
                <div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: isActive ? 500 : 400,
                      color: isActive ? '#1971c2' : '#495057',
                    }}
                  >
                    {stepNode.step.title}
                  </div>
                  {stepNode.step.description && (
                    <div style={{ fontSize: '12px', color: '#868e96' }}>
                      {stepNode.step.description}
                    </div>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
