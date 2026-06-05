import React, { useMemo } from 'react'
import type { FormField, FormValues } from '@dmc--98/dfe-core'
import { DefaultFieldRenderer } from './DfeFormRenderer'
import type { FieldRendererProps } from '../renderers'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DfeResponsiveLayoutProps {
  fields: FormField[]
  values: FormValues
  onFieldChange: (key: string, value: unknown) => void
  errors?: Record<string, string>
  renderField?: React.ComponentType<FieldRendererProps>
  breakpoints?: { sm: number; md: number; lg: number }
  columns?: { sm: number; md: number; lg: number }
  gap?: string
  className?: string
}

// ─── Layout Calculation ──────────────────────────────────────────────────────

/**
 * Calculate CSS grid column span based on width hint.
 * - 'full' → span all columns
 * - 'half' → span half (rounded up)
 * - 'third' → span 1/3 (rounded up)
 */
function getColumnSpan(
  widthHint: string | undefined,
  totalColumns: number
): number {
  if (!widthHint) return 1

  switch (widthHint) {
    case 'full':
      return totalColumns

    case 'half':
      return Math.ceil(totalColumns / 2)

    case 'third':
      return Math.ceil(totalColumns / 3)

    default:
      return 1
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Responsive form layout component using CSS Grid.
 *
 * Automatically adjusts column count based on viewport width.
 * Respects field width hints (full, half, third) to determine grid span.
 *
 * Default breakpoints:
 * - sm: 640px (1 column)
 * - md: 1024px (2 columns)
 * - lg: 1280px (3 columns)
 *
 * @example
 * ```tsx
 * <DfeResponsiveLayout
 *   fields={engine.visibleFields}
 *   values={engine.values}
 *   onFieldChange={engine.setFieldValue}
 *   errors={validationErrors}
 *   renderField={customFieldRenderer}
 *   columns={{ sm: 1, md: 2, lg: 3 }}
 *   gap="1.5rem"
 * />
 * ```
 */
export function DfeResponsiveLayout({
  fields,
  values,
  onFieldChange,
  errors = {},
  renderField,
  breakpoints = { sm: 640, md: 1024, lg: 1280 },
  columns = { sm: 1, md: 2, lg: 3 },
  gap = '1.5rem',
  className,
}: DfeResponsiveLayoutProps): React.ReactElement {
  const Renderer = renderField ?? DefaultFieldRenderer

  // Group fields by sections (if any use SECTION_BREAK)
  const sections = useMemo(() => {
    const result: Array<{ title?: string; fields: FormField[] }> = []
    let currentSection: { title?: string; fields: FormField[] } = {
      fields: [],
    }

    for (const field of fields) {
      if (field.type === 'SECTION_BREAK') {
        if (currentSection.fields.length > 0) {
          result.push(currentSection)
        }
        currentSection = { title: field.label, fields: [] }
      } else {
        currentSection.fields.push(field)
      }
    }

    if (currentSection.fields.length > 0) {
      result.push(currentSection)
    }

    return result.length > 0 ? result : [{ fields }]
  }, [fields])

  // Generate CSS for responsive layout
  const layoutCss = useMemo(
    () => `
      @media (min-width: ${breakpoints.sm}px) {
        [data-dfe-responsive-grid] {
          grid-template-columns: repeat(${columns.sm}, minmax(0, 1fr));
        }
      }
      @media (min-width: ${breakpoints.md}px) {
        [data-dfe-responsive-grid] {
          grid-template-columns: repeat(${columns.md}, minmax(0, 1fr));
        }
      }
      @media (min-width: ${breakpoints.lg}px) {
        [data-dfe-responsive-grid] {
          grid-template-columns: repeat(${columns.lg}, minmax(0, 1fr));
        }
      }
    `,
    [breakpoints, columns]
  )

  return (
    <div className={className} data-dfe-responsive-layout>
      <style>{layoutCss}</style>

      {sections.map((section, sectionIdx) => (
        <div key={sectionIdx}>
          {section.title && (
            <h2
              style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                marginBottom: '1rem',
                marginTop: sectionIdx > 0 ? '2rem' : 0,
              }}
            >
              {section.title}
            </h2>
          )}

          <div
            data-dfe-responsive-grid
            style={{
              display: 'grid',
              gap,
              gridTemplateColumns: `repeat(${columns.sm}, minmax(0, 1fr))`,
            }}
          >
            {section.fields.map((field) => {
              const columnSpan = getColumnSpan(
                (field.config as any)?.width,
                columns.sm
              )

              return (
                <div
                  key={field.key}
                  data-dfe-responsive-field={field.key}
                  style={{
                    gridColumn: `span ${Math.min(columnSpan, columns.sm)}`,
                  }}
                >
                  <Renderer
                    field={field}
                    value={values[field.key]}
                    onChange={(v: unknown) => onFieldChange(field.key, v)}
                    error={errors[field.key] ?? null}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
