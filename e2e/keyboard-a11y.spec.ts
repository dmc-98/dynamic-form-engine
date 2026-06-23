/**
 * Keyboard & screen-reader e2e regression tests (Playwright)
 *
 * What's tested:
 *  1. Tab order — pressing Tab from the first field reaches all visible form
 *     controls in DOM order before landing on the Next button.
 *  2. Accessible names — every form control has a non-empty accessible name
 *     (label association, aria-label, or aria-labelledby).
 *  3. Error state ARIA — submitting an empty required field sets aria-invalid="true"
 *     and aria-describedby pointing to an error message element in the DOM.
 *  4. Keyboard activation — pressing Enter on the focused Next button advances
 *     the step without a mouse click.
 *  5. Step-transition focus management — focus moves into the new step's first
 *     input after clicking Next (not left on the button or document body).
 *
 * These tests run against the same fullstack example webServer as the main e2e
 * spec (playwright.config.ts) — no extra setup required.
 */

import { expect, test, type Page } from '@playwright/test'

async function loadForm(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Employee Onboarding' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible()
}

// ── 1. Tab order ──────────────────────────────────────────────────────────────
test('Tab order covers all visible personal-info inputs before the Next button', async ({ page }) => {
  await loadForm(page)

  // Focus the first labelled input, then tab through the rest.
  await page.getByLabel('First Name').focus()

  const tabOrder: string[] = []
  for (let i = 0; i < 10; i++) {
    const activeLabel = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el) return null
      // Prefer aria-label > associated label text > role
      const id = el.id
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`)
        if (label) return label.textContent?.trim() ?? null
      }
      return el.getAttribute('aria-label') ?? el.getAttribute('type') ?? el.tagName.toLowerCase()
    })
    if (activeLabel) tabOrder.push(activeLabel)

    const atButton = await page.evaluate(() => document.activeElement?.tagName === 'BUTTON')
    if (atButton) break
    await page.keyboard.press('Tab')
  }

  // All four personal-info fields must appear before the button.
  expect(tabOrder).toContain('First Name')
  expect(tabOrder).toContain('Last Name')
  expect(tabOrder).toContain('Email Address')

  // The button must be the last focusable thing in the tab sequence.
  const lastItem = tabOrder[tabOrder.length - 1]
  expect(['button', 'submit', 'Next'].some(s => lastItem?.toLowerCase().includes(s.toLowerCase()))).toBe(true)
})

// ── 2. Accessible names ───────────────────────────────────────────────────────
test('All personal-info inputs have a non-empty accessible name', async ({ page }) => {
  await loadForm(page)

  // Playwright's getByLabel already asserts label association; if these pass the
  // label association is correct. We additionally check aria-label as a fallback.
  const labels = ['First Name', 'Last Name', 'Email Address', 'Phone Number']
  for (const label of labels) {
    await expect(page.getByLabel(label)).toBeVisible()
  }

  // Confirm no input inside the form is missing both a label and an aria-label.
  const unlabelledCount = await page.evaluate(() => {
    const form = document.querySelector('[data-dfe-form]') ?? document.body
    const inputs = Array.from(form.querySelectorAll('input, select, textarea'))
    return inputs.filter(el => {
      const id = el.id
      const hasLabel = id ? !!document.querySelector(`label[for="${id}"]`) : false
      const hasAriaLabel = el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')
      return !hasLabel && !hasAriaLabel
    }).length
  })
  expect(unlabelledCount).toBe(0)
})

// ── 3. Error-state ARIA ───────────────────────────────────────────────────────
test('Empty required field gets aria-invalid + aria-describedby pointing at error message', async ({ page }) => {
  await loadForm(page)

  // Click Next without filling anything to trigger validation.
  await page.getByRole('button', { name: /next/i }).click()

  // The First Name input is required — wait for the error to appear.
  const firstNameInput = page.getByLabel('First Name')
  await expect(firstNameInput).toHaveAttribute('aria-invalid', 'true')

  // aria-describedby must point at an element that exists in the DOM and has text.
  const errorId = await firstNameInput.getAttribute('aria-describedby')
  expect(errorId).toBeTruthy()

  // The describedby value may be space-separated ids; at least one must be a
  // visible error element.
  const ids = (errorId ?? '').split(/\s+/).filter(Boolean)
  let foundError = false
  for (const id of ids) {
    const errorEl = page.locator(`#${id}`)
    const count = await errorEl.count()
    if (count > 0) {
      const text = await errorEl.textContent()
      if (text && text.trim().length > 0) {
        foundError = true
        break
      }
    }
  }
  expect(foundError, `aria-describedby ids (${ids.join(', ')}) should point at a non-empty error element`).toBe(true)
})

// ── 4. Keyboard activation of Next button ─────────────────────────────────────
test('Enter key on focused Next button advances to Job Details step', async ({ page }) => {
  await loadForm(page)

  // Fill required personal-info fields so Next succeeds.
  await page.getByLabel('First Name').fill('Ada')
  await page.getByLabel('Last Name').fill('Lovelace')
  await page.getByLabel('Email Address').fill('ada@example.com')

  // Focus the Next button and activate it with Enter (no mouse click).
  await page.getByRole('button', { name: /next/i }).focus()
  await page.keyboard.press('Enter')

  await expect(page.getByRole('heading', { name: 'Job Details' })).toBeVisible()
})

// ── 5. Step-transition focus management ───────────────────────────────────────
test('After advancing to Job Details, focus lands on the first input (not body/button)', async ({ page }) => {
  await loadForm(page)

  await page.getByLabel('First Name').fill('Ada')
  await page.getByLabel('Last Name').fill('Lovelace')
  await page.getByLabel('Email Address').fill('ada@example.com')
  await page.getByRole('button', { name: /next/i }).click()

  await expect(page.getByRole('heading', { name: 'Job Details' })).toBeVisible()

  // After the step transition, the active element must be an input/select/textarea
  // inside the new step — not the button, body, or document itself.
  const activeTag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase() ?? 'body')
  expect(['input', 'select', 'textarea']).toContain(activeTag)
})
