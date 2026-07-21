import { expect, test } from '@playwright/test'
import { runSql, verdictIsFail, verdictIsPass, waitForMissionReady } from './helpers.js'

test.describe('World reacts to verified queries', () => {
  test('districts show their starting statuses', async ({ page }) => {
    await page.goto('/world')
    await waitForMissionReady(page)

    // District status labels are Hebrew (he.districtStable/Unstable/Thriving):
    // 'יציב' / 'לא יציב' / 'משגשג'. Selected by the stable data-district-id.
    await expect(page.locator('[data-district-id="north"]')).toContainText('יציב')
    await expect(page.locator('[data-district-id="south"]')).toContainText('לא יציב')
    await expect(page.locator('[data-district-id="east"]')).toContainText('משגשג')
    await expect(page.locator('[data-district-id="core"]')).toContainText('לא יציב')
  })

  test('the Core district goes from Unstable to Thriving once First Contact passes', async ({ page }) => {
    await page.goto('/world')
    await waitForMissionReady(page)

    const core = page.locator('[data-district-id="core"]')
    await expect(core).toContainText('לא יציב')

    await runSql(page, 'SELECT * FROM citizens;')
    await verdictIsPass(page)

    await expect(core).toContainText('משגשג')
    await expect(core).toHaveCSS('opacity', '1')
  })

  test('the world state dump reflects the signal change', async ({ page }) => {
    await page.goto('/world')
    await waitForMissionReady(page)

    // The raw world-state JSON is a collapsed debug view (Sprint 1 polish).
    await page.getByRole('button', { name: 'הצג מצב עולם גולמי' /* he.showRawWorldState */ }).click()
    await expect(page.getByText(/"signal": 0/)).toBeVisible()

    await runSql(page, 'SELECT * FROM citizens;')
    await verdictIsPass(page)

    await expect(page.getByText(/"signal": 100/)).toBeVisible()
  })

  test('a failing query leaves the world state unchanged', async ({ page }) => {
    await page.goto('/world')
    await waitForMissionReady(page)
    await page.getByRole('button', { name: 'הצג מצב עולם גולמי' /* he.showRawWorldState */ }).click()

    await runSql(page, 'SELECT * FROM citizens WHERE id = 1;')
    await verdictIsFail(page)

    await expect(page.getByText(/"signal": 0/)).toBeVisible()
    await expect(page.locator('[data-district-id="core"]')).toContainText('לא יציב')
  })
})
