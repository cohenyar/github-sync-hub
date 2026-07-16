import { expect, test } from '@playwright/test'

test.describe('Admin panel', () => {
  test('is hidden by default and toggles open with correct read-only section counts', async ({ page }) => {
    await page.goto('/world')

    await expect(page.getByText('Admin Area')).not.toBeVisible()

    await page.getByTestId('admin-toggle-button').click()
    await expect(page.getByText('Admin Area')).toBeVisible()

    const expectedCounts: Record<string, string> = {
      missions: 'Items: 6',
      'sql-reference-answers': 'Items: 6',
      districts: 'Items: 4',
      npcs: 'Items: 7',
      rewards: 'Items: 6',
      progression: 'Items: 6',
      'player-state': 'Items: 0',
    }
    const crudEnabledSections = new Set(['missions', 'npcs'])

    for (const [sectionId, expectedText] of Object.entries(expectedCounts)) {
      await expect(page.locator(`[data-section-id="${sectionId}"]`)).toContainText(expectedText)
      await expect(page.locator(`[data-section-id="${sectionId}"]`)).toContainText(
        crudEnabledSections.has(sectionId) ? 'Status: CRUD enabled' : 'Status: Read-only foundation',
      )
    }

    await page.getByTestId('admin-toggle-button').click()
    await expect(page.getByText('Admin Area')).not.toBeVisible()
  })
})
