import { describe, it, expect } from 'vitest'
import { buildReviewSummary, resolveRedirect } from '../src/review'
import type { FormField, FormStep, FormValues } from '../src/types'

function field(key: string, over: Partial<FormField> = {}): FormField {
  return { id: `id_${key}`, versionId: 'v1', key, label: key, type: 'SHORT_TEXT', required: false, order: 1, config: {}, ...over }
}

describe('buildReviewSummary', () => {
  const fields: FormField[] = [
    field('name', { label: 'Full Name', stepId: 's1', order: 1 }),
    field('email', { label: 'Email', type: 'EMAIL', stepId: 's1', order: 2 }),
    field('plan', { label: 'Plan', type: 'SELECT', stepId: 's2', order: 1,
      config: { mode: 'static', options: [{ label: 'Pro', value: 'pro' }, { label: 'Free', value: 'free' }] } }),
    field('divider', { label: 'Section', type: 'SECTION_BREAK', stepId: 's2', order: 2 }),
  ]
  const steps: FormStep[] = [
    { id: 's1', versionId: 'v1', title: 'About you', order: 1 },
    { id: 's2', versionId: 'v1', title: 'Plan', order: 2 },
  ]
  const values: FormValues = { name: 'Ada', email: 'ada@x.com', plan: 'pro' }

  it('groups answered fields by step, in order', () => {
    const summary = buildReviewSummary(fields, values, steps)
    expect(summary.map(g => g.stepTitle)).toEqual(['About you', 'Plan'])
    expect(summary[0].items.map(i => i.label)).toEqual(['Full Name', 'Email'])
  })

  it('resolves SELECT values to their option labels', () => {
    const summary = buildReviewSummary(fields, values, steps)
    const plan = summary[1].items.find(i => i.key === 'plan')
    expect(plan?.displayValue).toBe('Pro') // not "pro"
  })

  it('excludes layout fields (SECTION_BREAK) from the summary', () => {
    const summary = buildReviewSummary(fields, values, steps)
    const allKeys = summary.flatMap(g => g.items.map(i => i.key))
    expect(allKeys).not.toContain('divider')
  })

  it('marks each item with its step id for "edit" navigation', () => {
    const summary = buildReviewSummary(fields, values, steps)
    expect(summary[0].stepId).toBe('s1')
    expect(summary[0].items[0].stepId).toBe('s1')
  })

  it('shows an empty-state placeholder for unanswered optional fields', () => {
    const summary = buildReviewSummary(fields, { name: 'Ada' }, steps)
    const email = summary[0].items.find(i => i.key === 'email')
    expect(email?.displayValue).toBe('—')
    expect(email?.empty).toBe(true)
  })

  it('works without steps (single ungrouped section)', () => {
    const flat = [field('a', { label: 'A' }), field('b', { label: 'B' })]
    const summary = buildReviewSummary(flat, { a: '1', b: '2' })
    expect(summary).toHaveLength(1)
    expect(summary[0].items.map(i => i.key)).toEqual(['a', 'b'])
  })

  it('does not crash when a field has undefined config', () => {
    const f = [{ id: 'x', versionId: 'v1', key: 'x', label: 'X', type: 'SELECT', required: false, order: 1 } as never]
    expect(() => buildReviewSummary(f, { x: 'a' })).not.toThrow()
  })

  it('resolves numeric SELECT values to labels (string/number coercion)', () => {
    const f = [field('n', { label: 'N', type: 'SELECT',
      config: { mode: 'static', options: [{ label: 'One', value: 1 }, { label: 'Two', value: 2 }] } as never })]
    const summary = buildReviewSummary(f, { n: 1 })
    expect(summary[0].items[0].displayValue).toBe('One')
  })

  it('renders array values (multi-select) as a joined string', () => {
    const f = [field('tags', { label: 'Tags', type: 'MULTI_SELECT',
      config: { mode: 'static', options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }] } })]
    const summary = buildReviewSummary(f, { tags: ['a', 'b'] })
    expect(summary[0].items[0].displayValue).toBe('A, B')
  })
})

describe('resolveRedirect', () => {
  const steps: FormStep[] = [
    { id: 's1', versionId: 'v1', title: 'One', order: 1 },
    { id: 's2', versionId: 'v1', title: 'Done', order: 2, config: { review: { editMode: 'navigate', redirectAfterSubmit: '/thank-you' } } },
  ]

  it('returns the redirect URL from the submitted step config', () => {
    expect(resolveRedirect(steps, 's2')).toBe('/thank-you')
  })

  it('returns null when the step has no redirect', () => {
    expect(resolveRedirect(steps, 's1')).toBeNull()
  })

  it('returns null for an unknown step', () => {
    expect(resolveRedirect(steps, 'nope')).toBeNull()
  })
})
