import { test, expect, type Page } from '@playwright/test'

// Storybook iframe URL for a given story id + global theme scheme.
function storyUrl(id: string, scheme: 'light' | 'dark'): string {
  return `/iframe.html?id=${id}&globals=dfeScheme:${scheme}&viewMode=story`
}

async function gotoStory(page: Page, id: string, scheme: 'light' | 'dark') {
  await page.goto(storyUrl(id, scheme))
  // Builder root present + fonts/layout settled.
  await page.waitForSelector('[data-testid="dfe-builder"], [data-dfe-builder]')
  await page.waitForTimeout(250)
}

const stories = [
  { id: 'builder-formbuilder--with-fields', name: 'formbuilder-with-fields' },
  { id: 'builder-formbuilder--panel-layout', name: 'formbuilder-panel-layout' },
]

for (const scheme of ['light', 'dark'] as const) {
  for (const story of stories) {
    test(`builder ${story.name} — ${scheme}`, async ({ page }) => {
      await gotoStory(page, story.id, scheme)
      await expect(page).toHaveScreenshot(`${story.name}-${scheme}.png`, { fullPage: true })
    })
  }
}

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('builder with-fields renders fully under reduced motion (light)', async ({ page }) => {
    await gotoStory(page, 'builder-formbuilder--with-fields', 'light')
    // The selected row + property editor must be present (no animation dependency).
    await expect(page.getByTestId('dfe-builder')).toBeVisible()
    await expect(page.getByTestId('prop-label')).toBeVisible()
  })
})
