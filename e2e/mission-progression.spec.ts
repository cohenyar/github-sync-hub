import { expect, test } from '@playwright/test'
import { runSql, verdictIsFail, verdictIsPass, waitForMissionReady } from './helpers.js'

test.describe('Mission progression and unlock gating', () => {
  test('starts at Mission 1 of 6, 0% progress, with District Ties locked', async ({ page }) => {
    await page.goto('/world')
    await waitForMissionReady(page)

    await expect(page.getByTestId('mission-index-badge')).toHaveAttribute('data-current', '1')
    await expect(page.getByTestId('mission-index-badge')).toHaveAttribute('data-total', '6')
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '0')
    await expect(page.getByTestId('content-status-badge')).toHaveAttribute('data-status', 'available')
    await expect(page.getByTestId('next-mission-label')).toHaveAttribute('data-mission-id', 'district-ties')
    await expect(page.getByTestId('next-mission-label')).toHaveAttribute('data-status', 'locked')
  })

  test('advances to Mission 2 of 6 and unlocks District Ties once First Contact passes', async ({ page }) => {
    await page.goto('/world')
    await waitForMissionReady(page)

    await runSql(page, 'SELECT * FROM citizens;')
    await verdictIsPass(page)

    await expect(page.getByTestId('mission-index-badge')).toHaveAttribute('data-current', '2')
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '17')
    await expect(page.getByTestId('content-status-badge')).toHaveAttribute('data-status', 'completed')
    await expect(page.getByTestId('next-mission-label')).toHaveAttribute('data-mission-id', 'district-ties')
    await expect(page.getByTestId('next-mission-label')).toHaveAttribute('data-status', 'available')
  })

  test('a failing query leaves progression and unlocks unchanged', async ({ page }) => {
    await page.goto('/world')
    await waitForMissionReady(page)

    await runSql(page, 'SELECT * FROM citizens WHERE id = 1;')
    await verdictIsFail(page)

    await expect(page.getByTestId('mission-index-badge')).toHaveAttribute('data-current', '1')
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '0')
    await expect(page.getByTestId('next-mission-label')).toHaveAttribute('data-status', 'locked')
  })

  test('revisiting an already-completed mission shows a completed phase, never an active one', async ({ page }) => {
    await page.goto('/world')
    await waitForMissionReady(page)

    await runSql(page, 'SELECT * FROM citizens;')
    await verdictIsPass(page)

    await page.getByTestId('mission-option-district-ties').click()
    await waitForMissionReady(page)

    await page.getByTestId('mission-option-first-contact').click()

    await expect(page.getByTestId('phase-badge')).toHaveAttribute('data-phase', 'completed')
    await expect(page.getByTestId('phase-badge')).not.toHaveAttribute('data-phase', 'active')
  })
})
