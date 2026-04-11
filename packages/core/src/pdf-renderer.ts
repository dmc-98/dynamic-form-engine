import type { FormField, FormValues, FormStep } from './types'

// ─── Types ──────────────────────────────────────────────────────────────────

/** Position and layout information for a single field on a PDF page */
export interface PdfFieldLayout {
  label: string
  type: string
  value: string
  required: boolean
  x: number
  y: number
  width: number
  height: number
  fontSize?: number
  fontColor?: string
  backgroundColor?: string
}

/** Definition of a single page in the PDF document */
export interface PdfPage {
  stepTitle?: string
  stepDescription?: string
  fields: PdfFieldLayout[]
  pageNumber?: number
  totalPages?: number
}

/** Complete PDF layout descriptor that can be consumed by any PDF library */
export interface PdfFormLayout {
  title: string
  subtitle?: string
  pages: PdfPage[]
  metadata: {
    author?: string
    subject?: string
    keywords?: string[]
    createdAt: string
    formId?: string
  }
  styles?: {
    pageWidth?: number
    pageHeight?: number
    marginTop?: number
    marginBottom?: number
    marginLeft?: number
    marginRight?: number
    titleFontSize?: number
    headingFontSize?: number
    labelFontSize?: number
    valueFontSize?: number
    lineHeight?: number
  }
}

// ─── PDF Layout Generation ──────────────────────────────────────────────────

/**
 * Generate a PDF layout descriptor from form fields and values.
 * This descriptor is library-agnostic and can be consumed by jsPDF, pdfkit, reportlab, etc.
 *
 * Layout algorithm:
 * 1. Group fields by step if steps provided
 * 2. Position fields in a multi-column layout respecting width hints
 * 3. Break to new page when content exceeds page height
 * 4. Calculate absolute x, y positions for each field
 *
 * @example
 * ```ts
 * const layout = generatePdfLayout(fields, values, steps, {
 *   title: 'Customer Application Form',
 *   pageWidth: 210, // mm
 *   pageHeight: 297, // mm
 * })
 *
 * // Use with jsPDF:
 * const doc = new jsPDF()
 * layout.pages.forEach((page, idx) => {
 *   page.fields.forEach(field => {
 *     doc.text(field.label, field.x, field.y)
 *     doc.text(field.value, field.x, field.y + field.height)
 *   })
 *   if (idx < layout.pages.length - 1) doc.addPage()
 * })
 * ```
 */
export function generatePdfLayout(
  fields: FormField[],
  values: FormValues,
  steps?: FormStep[],
  options?: {
    title?: string
    pageWidth?: number
    pageHeight?: number
    margin?: number
  }
): PdfFormLayout {
  const title = options?.title ?? 'Form Submission'
  const pageWidth = options?.pageWidth ?? 210 // A4 width in mm
  const pageHeight = options?.pageHeight ?? 297 // A4 height in mm
  const margin = options?.margin ?? 20

  const contentWidth = pageWidth - 2 * margin
  const contentHeight = pageHeight - 2 * margin

  const pages: PdfPage[] = []

  // Group fields by step or create single group
  const fieldGroups = steps
    ? steps.map((step) => ({
        stepId: step.id,
        stepTitle: step.title,
        stepDescription: step.description ?? undefined,
        fields: fields.filter((f) => f.stepId === step.id),
      }))
    : [
        {
          stepId: 'default',
          stepTitle: undefined,
          stepDescription: undefined,
          fields,
        },
      ]

  let currentY = margin + 20 // Space for title
  let currentPage: PdfPage = { fields: [], pageNumber: 1 }
  let pageCount = 1

  for (const group of fieldGroups) {
    if (group.fields.length === 0) continue

    // Add step header if present
    if (group.stepTitle) {
      const stepHeaderHeight = 15
      if (currentY + stepHeaderHeight > pageHeight - margin) {
        // Need new page
        if (currentPage.fields.length > 0) {
          pages.push(currentPage)
        }
        pageCount++
        currentY = margin
        currentPage = { fields: [], pageNumber: pageCount }
      }

      currentPage.stepTitle = group.stepTitle
      currentPage.stepDescription = group.stepDescription
      currentY += stepHeaderHeight
    }

    // Layout fields in 2 columns for better space utilization
    const columnWidth = (contentWidth - 5) / 2 // 5mm gap between columns

    let columnIdx = 0
    let columnYs = [margin + 20, margin + 20] // Track Y position for each column

    for (const field of group.fields) {
      const fieldHeight = getEstimatedFieldHeight(field, columnWidth)
      const currentColumnY = columnYs[columnIdx]

      // Check if field fits on current page
      if (currentColumnY + fieldHeight > pageHeight - margin) {
        // Move to next column
        if (columnIdx === 0) {
          columnIdx = 1
        } else {
          // Both columns full, need new page
          pages.push(currentPage)
          pageCount++
          currentPage = {
            fields: [],
            stepTitle: group.stepTitle,
            stepDescription: group.stepDescription,
            pageNumber: pageCount,
          }
          columnIdx = 0
          columnYs = [margin + 20, margin + 20]
        }
      }

      const fieldX = margin + columnIdx * (columnWidth + 5)
      const fieldY = columnYs[columnIdx]

      const pdfField: PdfFieldLayout = {
        label: field.label,
        type: field.type,
        value: formatPdfValue(field, values[field.key]),
        required: field.required,
        x: fieldX,
        y: fieldY,
        width: columnWidth,
        height: fieldHeight,
        fontSize: 10,
        fontColor: '#000000',
        backgroundColor: field.required ? '#f9f9f9' : undefined,
      }

      currentPage.fields.push(pdfField)
      columnYs[columnIdx] += fieldHeight + 2 // 2mm spacing between fields
    }
  }

  // Add final page
  if (currentPage.fields.length > 0) {
    pages.push(currentPage)
  }

  // Update page numbers
  pages.forEach((page, idx) => {
    page.pageNumber = idx + 1
    page.totalPages = pages.length
  })

  return {
    title,
    pages,
    metadata: {
      createdAt: new Date().toISOString(),
      author: 'Dynamic Form Engine',
    },
    styles: {
      pageWidth,
      pageHeight,
      marginTop: margin,
      marginBottom: margin,
      marginLeft: margin,
      marginRight: margin,
      titleFontSize: 16,
      headingFontSize: 12,
      labelFontSize: 10,
      valueFontSize: 9,
      lineHeight: 1.5,
    },
  }
}

// ─── Printable HTML Generation ──────────────────────────────────────────────

/**
 * Generate a printable HTML representation of a form.
 * This can be rendered in a browser and printed to PDF, or converted via puppeteer.
 *
 * @example
 * ```ts
 * const html = generatePrintableHtml(fields, values, steps, {
 *   title: 'Form Submission Report',
 *   styles: customCss
 * })
 *
 * // Print to PDF via browser
 * const win = window.open()
 * win.document.write(html)
 * win.print()
 * ```
 */
export function generatePrintableHtml(
  fields: FormField[],
  values: FormValues,
  steps?: FormStep[],
  options?: { title?: string; styles?: string }
): string {
  const title = options?.title ?? 'Form Submission'
  const customStyles = options?.styles ?? ''

  const defaultStyles = `
    * { margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #333;
      line-height: 1.6;
      background: white;
    }
    .print-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 10px;
      border-bottom: 3px solid #007bff;
      padding-bottom: 10px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .print-section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    .print-section h2 {
      font-size: 16px;
      margin-bottom: 20px;
      color: #222;
      border-left: 4px solid #007bff;
      padding-left: 12px;
    }
    .print-section p {
      color: #666;
      margin-bottom: 15px;
      font-size: 13px;
    }
    .fields-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    .field-row {
      padding: 12px;
      border: 1px solid #e0e0e0;
      background: #fafafa;
      border-radius: 4px;
    }
    .field-row.required {
      border-left: 3px solid #ff6b6b;
    }
    .field-label {
      font-weight: 600;
      font-size: 12px;
      color: #444;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .field-value {
      font-size: 14px;
      color: #333;
      word-wrap: break-word;
    }
    .field-value.empty {
      color: #999;
      font-style: italic;
    }
    .print-metadata {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #999;
      font-size: 11px;
    }
    @media print {
      body { margin: 0; padding: 0; }
      .print-container { max-width: 100%; padding: 20mm; }
      .print-section { page-break-inside: avoid; }
    }
    @page { size: A4; margin: 20mm; }
  `

  // Group fields by step
  let sectionsHtml = ''

  if (steps && steps.length > 0) {
    for (const step of steps) {
      const stepFields = fields.filter((f) => f.stepId === step.id)
      if (stepFields.length === 0) continue

      sectionsHtml += `
        <div class="print-section">
          <h2>${escapeHtml(step.title)}</h2>
          ${step.description ? `<p>${escapeHtml(step.description)}</p>` : ''}
          <div class="fields-grid">
            ${stepFields.map((field) => renderPrintField(field, values[field.key])).join('')}
          </div>
        </div>
      `
    }
  } else {
    sectionsHtml = `
      <div class="fields-grid">
        ${fields.map((field) => renderPrintField(field, values[field.key])).join('')}
      </div>
    `
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(title)}</title>
      <style>${defaultStyles}${customStyles}</style>
    </head>
    <body>
      <div class="print-container">
        <h1>${escapeHtml(title)}</h1>
        <div class="subtitle">Generated on ${new Date().toLocaleString()}</div>
        ${sectionsHtml}
        <div class="print-metadata">
          <p>This is an automated form submission report generated by Dynamic Form Engine.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function formatPdfValue(field: FormField, value: unknown): string {
  if (value === null || value === undefined) {
    return '[Not provided]'
  }

  switch (field.type) {
    case 'CHECKBOX':
      return value ? 'Yes' : 'No'

    case 'DATE':
    case 'DATE_RANGE':
      if (typeof value === 'object') {
        const range = value as any
        const from = range.from ? new Date(range.from).toLocaleDateString() : ''
        const to = range.to ? new Date(range.to).toLocaleDateString() : ''
        return [from, to].filter(Boolean).join(' to ')
      }
      return new Date(value as string).toLocaleDateString()

    case 'DATE_TIME':
      return new Date(value as string).toLocaleString()

    case 'MULTI_SELECT':
      return Array.isArray(value) ? value.join(', ') : String(value)

    case 'FILE_UPLOAD':
      if (Array.isArray(value)) {
        return value.map((f: any) => f.name || String(f)).join(', ')
      }
      return (value as any)?.name ?? String(value)

    case 'ADDRESS':
      if (typeof value === 'object') {
        const addr = value as any
        return [addr.street, addr.city, addr.state, addr.zip, addr.country]
          .filter(Boolean)
          .join(', ')
      }
      return String(value)

    case 'RICH_TEXT':
      // Strip HTML tags
      return String(value).replace(/<[^>]*>/g, '')

    case 'SIGNATURE':
      return '[Signature on file]'

    default:
      return String(value)
  }
}

function getEstimatedFieldHeight(field: FormField, columnWidth: number): number {
  // Base height in mm
  switch (field.type) {
    case 'SHORT_TEXT':
    case 'EMAIL':
    case 'PHONE':
    case 'NUMBER':
    case 'DATE':
    case 'TIME':
    case 'URL':
      return 8

    case 'SELECT':
    case 'RADIO':
      return 10

    case 'CHECKBOX':
      return 6

    case 'LONG_TEXT':
    case 'RICH_TEXT':
      return 15

    case 'MULTI_SELECT':
      return 12

    case 'ADDRESS':
    case 'FIELD_GROUP':
      return 20

    case 'FILE_UPLOAD':
    case 'DATE_RANGE':
      return 10

    case 'RATING':
    case 'SCALE':
      return 12

    case 'SIGNATURE':
      return 25

    default:
      return 8
  }
}

function renderPrintField(field: FormField, value: unknown): string {
  const displayValue = value === null || value === undefined ? '—' : String(value)
  const requiredClass = field.required ? 'required' : ''

  return `
    <div class="field-row ${requiredClass}">
      <div class="field-label">
        ${escapeHtml(field.label)}
        ${field.required ? ' <span style="color: #ff6b6b;">*</span>' : ''}
      </div>
      <div class="field-value ${value === null || value === undefined ? 'empty' : ''}">
        ${escapeHtml(displayValue)}
      </div>
    </div>
  `
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (c) => map[c])
}
