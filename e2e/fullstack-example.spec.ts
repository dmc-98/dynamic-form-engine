import { expect, test, type BrowserContext, type Page } from '@playwright/test'

const apiBaseUrl = process.env.DFE_E2E_API_URL ?? 'http://127.0.0.1:3001/api'

async function loadEmployeeOnboarding(page: Page, path: string = '/') {
  await page.goto(path)
  await expect(page.getByRole('heading', { name: 'Employee Onboarding' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible()
}

async function fillPersonalInformationStep(
  page: Page,
  values = {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada.lovelace@example.com',
    phone: '+1 555 0100',
  },
) {
  await page.getByLabel('First Name').fill(values.firstName)
  await page.getByLabel('Last Name').fill(values.lastName)
  await page.getByLabel('Email Address').fill(values.email)
  await page.getByLabel('Phone Number').fill(values.phone)
}

async function fillJobDetailsStep(page: Page) {
  await page.getByLabel('Department').selectOption('eng')
  await page.getByLabel('Team Search').fill('Platform')
  await expect(page.getByLabel('Team', { exact: true }).locator('option')).toContainText(['Platform Engineering'])
  await page.getByLabel('Team', { exact: true }).selectOption('platform')
  await page.getByLabel('Role Title').fill('Founding Engineer')
  await page.getByLabel('Start Date').fill('2026-03-12')
}

async function expectServiceWorkerRegistration(page: Page) {
  await expect.poll(async () => page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) {
      return false
    }

    const registration = await navigator.serviceWorker.getRegistration()
    return Boolean(registration)
  })).toBe(true)
}

async function openCollaboratorPage(context: BrowserContext, name: string, session: string) {
  const page = await context.newPage()
  await loadEmployeeOnboarding(page, `/?session=${session}&name=${encodeURIComponent(name)}`)
  return page
}

test.describe('Fullstack Example', () => {
  test('submits the employee onboarding flow end to end', async ({ page, request }) => {
    const submissionResponsePromise = page.waitForResponse(
      response =>
        response.url() === `${apiBaseUrl}/dfe/submissions`
        && response.request().method() === 'POST',
    )

    await test.step('Load the form', async () => {
      await loadEmployeeOnboarding(page)
    })

    const submissionResponse = await submissionResponsePromise
    const submission = await submissionResponse.json()

    await test.step('Show the assigned experiment banner', async () => {
      const banner = page.getByTestId('experiment-banner')
      await expect(banner).toBeVisible()
      await expect(banner).toContainText(/control|guided/i)
    })

    await test.step('Complete the personal information step', async () => {
      await fillPersonalInformationStep(page)
      await page.getByRole('button', { name: 'Next' }).click()

      await expect(page.getByRole('heading', { name: 'Job Details' })).toBeVisible()
      await expect(page.locator('[data-dfe-step][data-dfe-complete="true"]')).toHaveCount(1)
    })

    await test.step('Verify conditional field logic and complete job details', async () => {
      const equipmentNotesField = page.locator('[data-dfe-field="equipment_notes"]')
      const teamSelect = page.getByLabel('Team', { exact: true })

      await expect(equipmentNotesField).toHaveCount(0)
      await expect(teamSelect).toBeDisabled()
      await page.getByLabel('Department').selectOption('eng')
      await expect(teamSelect).toBeEnabled()
      await page.getByLabel('Team Search').fill('Platform')
      await expect(teamSelect.locator('option')).toContainText(['Platform Engineering'])
      await page.getByLabel('Team', { exact: true }).selectOption('platform')
      await page.getByLabel('Role Title').fill('Founding Engineer')
      await page.getByLabel('Start Date').fill('2026-03-12')
      await page.getByLabel('Needs Equipment?').check()
      await expect(equipmentNotesField).toHaveCount(1)
      await page.getByLabel('Equipment Notes').fill('Laptop, monitor, ergonomic keyboard')
      await page.getByRole('button', { name: 'Next' }).click()

      await expect(page.getByRole('heading', { name: 'Review & Submit' })).toBeVisible()
    })

    await test.step('Submit the flow and verify persisted status', async () => {
      await page.getByRole('button', { name: 'Submit', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'Thank You!' })).toBeVisible()
      await expect(page.getByText('Your onboarding form has been submitted successfully.')).toBeVisible()

      const persistedSubmissionResponse = await request.get(
        `${apiBaseUrl}/dfe/submissions/${submission.id}`,
      )

      expect(persistedSubmissionResponse.ok()).toBeTruthy()

      const persistedSubmission = await persistedSubmissionResponse.json()
      expect(persistedSubmission.status).toBe('COMPLETED')
      expect(persistedSubmission.userId).toBe('demo-user')

      const analyticsResponse = await request.get(`${apiBaseUrl}/dfe/analytics?formId=${submission.formId}`)
      expect(analyticsResponse.ok()).toBeTruthy()
      const analytics = await analyticsResponse.json()
      expect(analytics.totalStarts).toBeGreaterThanOrEqual(1)
      expect(analytics.variantComparison.length).toBeGreaterThanOrEqual(1)

      const tracesResponse = await request.get(`${apiBaseUrl}/observability/traces`)
      expect(tracesResponse.ok()).toBeTruthy()
      const traces = await tracesResponse.json()
      expect(traces.count).toBeGreaterThan(0)
    })
  })

  test('shows validation errors and lets the user recover on the first step', async ({ page }) => {
    await loadEmployeeOnboarding(page)

    await page.getByRole('button', { name: 'Next' }).click()

    await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(3)
    await expect(page.getByLabel('First Name')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByLabel('Last Name')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByLabel('Email Address')).toHaveAttribute('aria-invalid', 'true')

    await fillPersonalInformationStep(page, {
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace.hopper@example.com',
      phone: '+1 555 0200',
    })
    await page.getByRole('button', { name: 'Next' }).click()

    await expect(page.getByRole('heading', { name: 'Job Details' })).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)
  })

  test('preserves form state across back and forward navigation', async ({ page }) => {
    await loadEmployeeOnboarding(page)

    await fillPersonalInformationStep(page, {
      firstName: 'Katherine',
      lastName: 'Johnson',
      email: 'katherine.johnson@example.com',
      phone: '+1 555 0300',
    })
    await page.getByRole('button', { name: 'Next' }).click()

    await expect(page.getByRole('heading', { name: 'Job Details' })).toBeVisible()
    await page.getByLabel('Department').selectOption('eng')
    await page.getByLabel('Team', { exact: true }).selectOption('platform')
    await page.getByLabel('Role Title').fill('Staff Engineer')
    await page.getByLabel('Start Date').fill('2026-03-15')

    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible()
    await expect(page.getByLabel('First Name')).toHaveValue('Katherine')
    await expect(page.getByLabel('Last Name')).toHaveValue('Johnson')
    await expect(page.getByLabel('Email Address')).toHaveValue('katherine.johnson@example.com')
    await expect(page.getByLabel('Phone Number')).toHaveValue('+1 555 0300')

    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('heading', { name: 'Job Details' })).toBeVisible()
    await expect(page.getByLabel('Department')).toHaveValue('eng')
    await expect(page.getByLabel('Team', { exact: true })).toHaveValue('platform')
    await expect(page.getByLabel('Role Title')).toHaveValue('Staff Engineer')
    await expect(page.getByLabel('Start Date')).toHaveValue('2026-03-15')
  })

  test('loads dynamic team options based on the selected department', async ({ page }) => {
    await loadEmployeeOnboarding(page)
    await fillPersonalInformationStep(page)
    await page.getByRole('button', { name: 'Next' }).click()

    const teamSelect = page.getByLabel('Team', { exact: true })

    await expect(teamSelect).toBeDisabled()
    await expect(page.getByText('Select Department first to load team options.')).toBeVisible()

    await page.getByLabel('Department').selectOption('design')
    await expect(teamSelect).toBeEnabled()

    await page.getByLabel('Team Search').fill('Brand')
    await expect(teamSelect.locator('option')).toContainText(['Brand Studio'])
    await expect(teamSelect.locator('option')).not.toContainText(['Platform Engineering'])

    await page.getByLabel('Department').selectOption('eng')
    await page.getByLabel('Team Search').fill('')
    await expect(teamSelect.locator('option')).toContainText(['Platform Engineering', 'Infrastructure'])
    await expect(teamSelect.locator('option')).not.toContainText(['Brand Studio'])
  })

  test('syncs field edits and presence across collaborative tabs', async ({ browser }) => {
    const session = 'playwright-collab-session'
    const context = await browser.newContext()
    const ownerPage = await openCollaboratorPage(context, 'Owner', session)
    const teammatePage = await openCollaboratorPage(context, 'Teammate', session)

    await expect(ownerPage.getByTestId('participant-chip')).toHaveCount(2)

    await ownerPage.getByLabel('First Name').fill('Ada')
    await expect(teammatePage.getByLabel('First Name')).toHaveValue('Ada')

    await teammatePage.getByLabel('First Name').fill('Grace')
    await expect(ownerPage.getByLabel('First Name')).toHaveValue('Grace')

    await expect(ownerPage.getByText('Owner (You)')).toBeVisible()
    await expect(ownerPage.getByText('Teammate')).toBeVisible()

    await context.close()
  })

  test('queues offline progress and syncs it after reconnect', async ({ page }) => {
    await loadEmployeeOnboarding(page, '/?session=playwright-offline-session&name=Offline%20Owner')
    await expectServiceWorkerRegistration(page)

    await fillPersonalInformationStep(page)
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('heading', { name: 'Job Details' })).toBeVisible()

    await fillJobDetailsStep(page)

    await page.context().setOffline(true)
    await expect(page.getByText('Offline mode')).toBeVisible()

    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('heading', { name: 'Review & Submit' })).toBeVisible()

    await page.getByRole('button', { name: 'Queue Submission' }).click()
    await expect(page.getByTestId('completion-queued')).toBeVisible()
    await expect(page.getByText(/Pending actions:/)).toContainText(/[1-9]/)

    await page.context().setOffline(false)
    await expect(page.getByRole('heading', { name: 'Thank You!' })).toBeVisible()
  })
})
