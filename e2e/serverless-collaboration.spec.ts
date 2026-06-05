import { expect, test, type BrowserContext, type Page } from '@playwright/test'

async function loadRemoteForm(page: Page, path: string = '/') {
  await page.goto(path)
  await expect(page.getByRole('heading', { name: 'Employee Onboarding' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible()
}

async function openCollaborator(
  context: BrowserContext,
  name: string,
  session: string,
) {
  const page = await context.newPage()
  await loadRemoteForm(page, `/?session=${session}&name=${encodeURIComponent(name)}`)
  return page
}

function createSessionId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

test.describe('Serverless Collaboration', () => {
  test('syncs edits and presence across isolated browser contexts', async ({ browser }) => {
    const session = createSessionId('serverless-collab-session')
    const ownerContext = await browser.newContext()
    const teammateContext = await browser.newContext()

    const ownerPage = await openCollaborator(ownerContext, 'Owner', session)
    const teammatePage = await openCollaborator(teammateContext, 'Teammate', session)

    await expect.poll(async () => ownerPage.getByTestId('participant-chip').count()).toBe(2)
    await expect.poll(async () => teammatePage.getByTestId('participant-chip').count()).toBe(2)

    await ownerPage.getByLabel('First Name').fill('Ada')
    await expect(teammatePage.getByLabel('First Name')).toHaveValue('Ada')

    await teammatePage.getByLabel('Last Name').fill('Lovelace')
    await expect(ownerPage.getByLabel('Last Name')).toHaveValue('Lovelace')

    await expect(ownerPage.getByText('Owner (You)')).toBeVisible()
    await expect(teammatePage.getByText('Owner')).toBeVisible()

    await ownerContext.close()
    await teammateContext.close()
  })

  test('restores the latest server snapshot when a collaborator rejoins', async ({ browser }) => {
    const session = createSessionId('serverless-snapshot-session')
    const ownerContext = await browser.newContext()
    const ownerPage = await openCollaborator(ownerContext, 'Owner', session)

    await ownerPage.getByLabel('First Name').fill('Grace')
    await ownerPage.getByLabel('Email Address').fill('grace.hopper@example.com')

    const returningContext = await browser.newContext()
    const returningPage = await openCollaborator(returningContext, 'Returning Teammate', session)

    await expect(returningPage.getByLabel('First Name')).toHaveValue('Grace')
    await expect(returningPage.getByLabel('Email Address')).toHaveValue('grace.hopper@example.com')

    await ownerContext.close()
    await returningContext.close()
  })
})
