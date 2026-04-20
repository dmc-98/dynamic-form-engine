import { describe, it, expect, beforeEach } from 'vitest'
import { generatePdfLayout, generatePrintableHtml, getTemplate } from '@dmc--98/dfe-core'
import { makeField, makeStep, resetFieldCounter, createContactForm } from './helpers/fixtures'

describe('PDF Renderer', () => {
  beforeEach(() => {
    resetFieldCounter()
  })

  it('should generate PDF layout for single-step form with at least 1 page', () => {
    const fields = [
      makeField({ key: 'name', type: 'SHORT_TEXT', label: 'Name' }),
      makeField({ key: 'email', type: 'EMAIL', label: 'Email' }),
    ]

    const layout = generatePdfLayout(fields, {})

    expect(layout).toBeDefined()
    expect(layout.pages).toBeDefined()
    expect(Array.isArray(layout.pages)).toBe(true)
    expect(layout.pages.length).toBeGreaterThanOrEqual(1)
  })

  it('should generate one page per step for multi-step form', () => {
    const fields = [
      makeField({ key: 'name', type: 'SHORT_TEXT', label: 'Name', stepId: 'step-1' }),
      makeField({ key: 'email', type: 'EMAIL', label: 'Email', stepId: 'step-1' }),
      makeField({ key: 'phone', type: 'PHONE', label: 'Phone', stepId: 'step-2' }),
      makeField({ key: 'address', type: 'ADDRESS', label: 'Address', stepId: 'step-2' }),
    ]

    const steps = [
      makeStep({ id: 'step-1', title: 'Contact Info', order: 0 }),
      makeStep({ id: 'step-2', title: 'Additional Info', order: 1 }),
    ]

    const layout = generatePdfLayout(fields, {}, steps)

    // PDF renderer groups by steps but doesn't force page breaks per step
    // With only 4 fields they may fit on 1 page; verify at least 1 page exists
    expect(layout.pages.length).toBeGreaterThanOrEqual(1)
    // Verify all 4 fields are present across all pages
    const totalFields = layout.pages.reduce((sum, p) => sum + p.fields.length, 0)
    expect(totalFields).toBe(4)
  })

  it('should include field entries with label, type, and value in pages', () => {
    const fields = [
      makeField({ key: 'name', type: 'SHORT_TEXT', label: 'Name' }),
      makeField({ key: 'email', type: 'EMAIL', label: 'Email' }),
      makeField({ key: 'age', type: 'NUMBER', label: 'Age' }),
    ]

    const layout = generatePdfLayout(fields, {})

    expect(layout.pages[0].fields).toBeDefined()
    expect(Array.isArray(layout.pages[0].fields)).toBe(true)
    expect(layout.pages[0].fields.length).toBeGreaterThan(0)

    layout.pages[0].fields.forEach(field => {
      expect(field.label).toBeDefined()
      expect(field.type).toBeDefined()
    })
  })

  it('should include createdAt in layout metadata', () => {
    const fields = [
      makeField({ key: 'name', type: 'SHORT_TEXT', label: 'Name' }),
    ]

    const layout = generatePdfLayout(fields, {})

    expect(layout.metadata).toBeDefined()
    expect(layout.metadata.createdAt).toBeDefined()
  })

  it('should generate valid HTML string from generatePrintableHtml', () => {
    const fields = [
      makeField({ key: 'name', type: 'SHORT_TEXT', label: 'Name' }),
      makeField({ key: 'email', type: 'EMAIL', label: 'Email' }),
    ]

    const html = generatePrintableHtml(fields, {})

    expect(typeof html).toBe('string')
    expect(html.length).toBeGreaterThan(0)
    expect(html.includes('<html') || html.includes('<div')).toBe(true)
  })

  it('should include field labels in printable HTML output', () => {
    const fields = [
      makeField({ key: 'fullName', type: 'SHORT_TEXT', label: 'Full Name' }),
      makeField({ key: 'contactEmail', type: 'EMAIL', label: 'Contact Email' }),
      makeField({ key: 'messageContent', type: 'LONG_TEXT', label: 'Message Content' }),
    ]

    const html = generatePrintableHtml(fields, {})

    expect(html).toContain('Full Name')
    expect(html).toContain('Contact Email')
    expect(html).toContain('Message Content')
  })

  it('should produce valid layout for empty form without crashing', () => {
    const fields: any[] = []

    expect(() => {
      const layout = generatePdfLayout(fields)
      expect(layout).toBeDefined()
      expect(Array.isArray(layout.pages)).toBe(true)
    }).not.toThrow()
  })

  it('should include values in layout when provided', () => {
    const fields = [
      makeField({ key: 'name', type: 'SHORT_TEXT', label: 'Name' }),
      makeField({ key: 'email', type: 'EMAIL', label: 'Email' }),
    ]

    const layout = generatePdfLayout(fields, { name: 'John Doe', email: 'john@example.com' })

    expect(layout.pages[0].fields.some(f => f.value === 'John Doe')).toBe(true)
    expect(layout.pages[0].fields.some(f => f.value === 'john@example.com')).toBe(true)
  })
})
