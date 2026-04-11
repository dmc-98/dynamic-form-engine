import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { DfeFormRenderer, DfeStepIndicator } from '../src/components.ts'
import { useFormEngine, useFormStepper } from '../src/index.ts'
import { sampleFields, sampleSteps } from './fixtures'

function MultiStepDemo(): React.ReactElement {
  const engine = useFormEngine({ fields: sampleFields })
  const stepper = useFormStepper({ steps: sampleSteps, engine: engine.engine })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const currentStepId = stepper.currentStep?.step.id
  const stepFields = engine.visibleFields.filter(field => field.stepId === currentStepId)

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <header>
        <h1 style={{ marginBottom: '0.5rem' }}>Team Setup Flow</h1>
        <p style={{ margin: 0, color: 'var(--dfe-color-text-muted, #475569)' }}>
          Interactive story showing the default renderer, stepper state, and conditional fields.
        </p>
      </header>

      <DfeStepIndicator
        steps={stepper.visibleSteps}
        currentIndex={stepper.currentIndex}
        onStepClick={stepper.jumpTo}
      />

      <section
        style={{
          padding: '1.5rem',
          borderRadius: 'var(--dfe-radius-lg, 1.25rem)',
          border: '1px solid var(--dfe-color-border, #cbd5e1)',
          background: 'var(--dfe-color-surface, #ffffff)',
          boxShadow: 'var(--dfe-shadow-md, 0 10px 30px rgba(15, 23, 42, 0.08))',
        }}
      >
        <h2 style={{ marginTop: 0 }}>{stepper.currentStep?.step.title}</h2>
        <DfeFormRenderer
          fields={stepFields}
          values={engine.values}
          onFieldChange={engine.setFieldValue}
          errors={errors}
        />

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          {stepper.canGoBack && (
            <button type="button" onClick={stepper.goBack}>
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (!currentStepId) {
                return
              }

              const validation = engine.validateStep(currentStepId)
              if (!validation.success) {
                setErrors(validation.errors)
                return
              }

              setErrors({})
              stepper.markComplete(currentStepId)
              if (!stepper.isLastStep) {
                stepper.goNext()
              }
            }}
          >
            {stepper.isLastStep ? 'Finish' : 'Next'}
          </button>
        </div>
      </section>
    </div>
  )
}

const meta = {
  title: 'React/MultiStepFlow',
  component: MultiStepDemo,
  tags: ['autodocs'],
} satisfies Meta<typeof MultiStepDemo>

export default meta

type Story = StoryObj<typeof meta>

export const Interactive: Story = {}
