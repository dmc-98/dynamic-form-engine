import React from 'react'
import type { StepNodeState } from '@dmc--98/dfe-core'

export interface DfeShadcnStepIndicatorProps {
  steps: StepNodeState[]
  currentIndex: number
  onStepClick?: (index: number) => void
  className?: string
}

/**
 * Styled step indicator using shadcn/ui design patterns.
 */
export function DfeShadcnStepIndicator({
  steps,
  currentIndex,
  onStepClick,
  className,
}: DfeShadcnStepIndicatorProps): React.ReactElement {
  return (
    <nav
      className={`${className || ''}`}
      data-dfe-steps
      aria-label="Form steps"
    >
      <ol className="flex gap-4 list-none p-0 m-0">
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
              className="flex items-center gap-2"
            >
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full font-semibold
                  text-sm transition-all
                  ${
                    isComplete
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : isActive
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-400'
                        : isPast
                          ? 'bg-gray-200 text-gray-700'
                          : 'bg-gray-100 text-gray-500'
                  }
                `}
              >
                {isComplete ? (
                  <span className="text-lg">✓</span>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {onStepClick ? (
                <button
                  type="button"
                  onClick={() => onStepClick(index)}
                  className={`
                    text-left transition-all
                    ${isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'}
                    cursor-pointer hover:text-foreground
                  `}
                >
                  <div className="text-sm font-medium">{stepNode.step.title}</div>
                  {stepNode.step.description && (
                    <div className="text-xs text-muted-foreground">
                      {stepNode.step.description}
                    </div>
                  )}
                </button>
              ) : (
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {stepNode.step.title}
                  </div>
                  {stepNode.step.description && (
                    <div className="text-xs text-muted-foreground">
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
