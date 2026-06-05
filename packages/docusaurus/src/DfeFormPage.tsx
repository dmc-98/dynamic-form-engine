import React, { useEffect, useMemo, useState } from 'react'
import { createFormEngine, type FormValues } from '@dmc--98/dfe-core'
import { DfeFormRenderer } from '@dmc--98/dfe-react/components'
import type { DfeDocusaurusFormConfig } from './index'

export interface DfeFormPageProps {
  formConfig?: DfeDocusaurusFormConfig
  formMeta?: {
    id?: string
    title?: string
    description?: string | null
    path?: string
  }
}

export function DfeFormPage({ formConfig, formMeta }: DfeFormPageProps): React.ReactElement {
  const engine = useMemo(() => {
    if (!formConfig?.fields?.length) return null
    return createFormEngine(formConfig.fields)
  }, [formConfig])
  const [values, setValues] = useState<FormValues>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!engine) {
      setValues({})
      setErrors({})
      return
    }

    setValues(engine.getValues())
    setErrors(engine.validate().errors)
  }, [engine])

  if (!formConfig?.fields?.length || !engine) {
    return (
      <section data-dfe-docusaurus-empty>
        <h1>{formMeta?.title ?? 'DFE Example'}</h1>
        <p>No DFE form configuration was provided to this page.</p>
      </section>
    )
  }

  const handleFieldChange = (key: string, value: unknown) => {
    engine.setFieldValue(key, value)
    setValues({ ...engine.getValues() })
    setErrors(engine.validate().errors)
  }

  return (
    <section data-dfe-docusaurus-page>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1>{formMeta?.title ?? formConfig.title ?? 'DFE Example'}</h1>
        {(formMeta?.description ?? formConfig.description) && (
          <p>{formMeta?.description ?? formConfig.description}</p>
        )}
      </header>

      <DfeFormRenderer
        fields={engine.getVisibleFields()}
        values={values}
        onFieldChange={handleFieldChange}
        errors={errors}
      />
    </section>
  )
}
