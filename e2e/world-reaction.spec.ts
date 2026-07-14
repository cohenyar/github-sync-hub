import { expect, test } from '@playwright/test'
import { runSql, verdictIsFail, verdictIsPass, waitForMissionReady } from './helpers.js'

test.describe('World reacts to verified queries', () => {
  test('districts show their starting statuses', async ({ page }) => {
    await page.goto('/world')
    await waitForMissionReady(page)

    await expect(page.locator('[data-district-id="north"]')).toContainText('Stable')
    await expect(page.locator('[data-district-id="south"]')).toContainText('Unstable')
    await expect(page.locator('[data-district-id="east"]')).toContainText('Thriving')
    await expect(page.locator('[data-district-id="core"]')).toContainText('Unstable')
  })

  test('the Core district goes from Unstable to Thriving once First Contact passes', async ({ page }) => {
    await page.goto('/world')
    await waitForMissionReady(page)

    const core = page.locator('[data-district-id="core"]')
    await expect(core).toContainText('Unstable')

    await runSql(page, 'SELECT * FROM citizens;')
    await verdictIsPass(page)

    await expect(core).toContainText('Thriving')
    await expect(core).toHaveCSS('opacity', '1')
  })

  test('the world state dump reflects the signal change', async ({ page }) => {
    await page.goto('/world')
    await waitForMissionReady(page)

    // The raw world-state JSON is a collapsed debug view (Sprint 1 polish).
    await page.getByRole('button', { name: 'Show Raw World State' }).click()
    await expect(page.getByText(/"signal": 0/)).toBeVisible()

    await runSql(page, 'SELECT * FROM citizens;')
    await verdictIsPass(page)

    await expect(page.getByText(/"signal": 100/)).toBeVisible()
  })

  test('a failing query leaves the world state unchanged', async ({ page }) => {
    await page.goto('/world')
    await waitForMissionReady(page)
    await page.getByRole('button', { name: 'Show Raw World State' }).click()

    await runSql(page, 'SELECT * FROM citizens WHERE id = 1;')
    await verdictIsFail(page)

    await expect(page.getByText(/"signal": 0/)).toBeVisible()
    await expect(page.locator('[data-district-id="core"]')).toContainText('Unstable')
  })
})
