import { expect, test } from '@playwright/test'

test.describe('Playground Authoring', () => {
  test('loads templates, generates configs, and applies authoring suggestions', async ({ page }) => {
    await page.goto('/playground')

    await expect(page.getByRole('heading', { name: 'DFE Playground', level: 1 })).toBeVisible()
    await page.locator('[data-dfe-playground-select]').selectOption('contact-form')
    await expect(page.getByText('Loaded the "Contact Form" template.')).toBeVisible()
    await expect(page.getByLabel('First Name')).toBeVisible()

    await page.locator('[data-dfe-playground-ai-description]').fill(
      'Registration form for a developer beta with first name, last name, email, password, and terms.',
    )
    await page.locator('[data-dfe-playground-ai-category]').selectOption('registration')
    await page.locator('[data-dfe-playground-ai-generate]').click()

    await expect(page.getByText('Generated a registration form config from the prompt.')).toBeVisible()
    await expect(page.getByLabel('First Name')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()

    const emailSuggestion = page.locator('[data-dfe-playground-validation-suggestion]').filter({
      hasText: 'Email',
    }).first()
    await emailSuggestion.getByRole('button', { name: 'Apply' }).click()
    await expect(page.getByText('Applied "format:email" to Email.')).toBeVisible()

    await page.locator('[data-dfe-playground-ai-description]').fill(
      'Contact form with full name and email for partnership inquiries.',
    )
    await page.locator('[data-dfe-playground-ai-category]').selectOption('contact')
    await page.locator('[data-dfe-playground-ai-generate]').click()

    const companySuggestion = page.locator('[data-dfe-playground-field-suggestion]').filter({
      hasText: 'Company Name',
    }).first()
    await companySuggestion.getByRole('button', { name: 'Add Field' }).click()
    await expect(page.getByText('Added "Company Name" to the form config.')).toBeVisible()
    await expect(page.locator('[data-dfe-playground-textarea]')).toContainText('"company"')
  })

  test('requires consent before applying reviewed draft answers', async ({ page }) => {
    await page.goto('/playground')

    await page.locator('[data-dfe-playground-ai-description]').fill(
      'Registration form for a developer beta with first name, last name, email, password, and terms.',
    )
    await page.locator('[data-dfe-playground-ai-category]').selectOption('registration')
    await page.locator('[data-dfe-playground-ai-generate]').click()

    await page.locator('[data-dfe-playground-autofill-source]').fill([
      'Name: Ada Lovelace',
      'Email: ada.lovelace@example.com',
      'Password: Secur3Pass!',
      'Agree Terms: yes',
    ].join('\n'))

    await page.locator('[data-dfe-playground-autofill-generate]').click()
    await expect(page.getByText('Confirm consent before generating AI-assisted draft answers.')).toBeVisible()

    await page.locator('[data-dfe-playground-autofill-consent]').check()
    await page.locator('[data-dfe-playground-autofill-generate]').click()

    await expect(page.locator('[data-dfe-playground-autofill-match]')).toHaveCount(5)

    await page.locator('[data-dfe-playground-autofill-apply]').click()
    await expect(page.getByLabel('First Name')).toHaveValue('Ada')
    await expect(page.getByLabel('Last Name')).toHaveValue('Lovelace')
    await expect(page.getByLabel('Email')).toHaveValue('ada.lovelace@example.com')
    await expect(page.getByLabel('Password')).toHaveValue('Secur3Pass!')
    await expect(page.getByLabel('I agree to the Terms and Conditions')).toBeChecked()
  })
})
