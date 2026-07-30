import { expect, passProfileCreationIfShown, runSql, test, verdictIsPass, waitForMissionReady } from './helpers.js'

// The raw world-state JSON is a collapsed debug view (Sprint 1 polish) —
// expand it before asserting on its contents. Resets closed on every full
// page navigation, so it needs re-opening after each reload.
async function openDebugView(page: import('@playwright/test').Page) {
  // he.showRawWorldState
  await page.getByRole('button', { name: 'הצג מצב עולם גולמי' }).click()
}

test.describe('Save/Load and load-on-boot persist world and progress across a real reload', () => {
  test('auto-loads a save after reload, then New Game resets to a fresh session', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.goto('/world')
    await waitForMissionReady(page)
    await openDebugView(page)

    await runSql(page, 'SELECT * FROM citizens;')
    await verdictIsPass(page)
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '17')
    await expect(page.getByText(/"signal": 100/)).toBeVisible()

    await page.getByTestId('settings-menu-button').click()
    await page.getByTestId('save-button').click()
    await expect(page.getByTestId('saved-confirmation')).toBeVisible()

    await page.reload()
    await waitForMissionReady(page)
    await openDebugView(page)

    // Step 23: a reload now boots straight into the saved game, no Load
    // click needed.
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '17')
    await expect(page.getByTestId('next-mission-label')).toHaveAttribute('data-mission-id', 'district-ties')
    await expect(page.getByTestId('next-mission-label')).toHaveAttribute('data-status', 'available')
    await expect(page.getByText(/"signal": 100/)).toBeVisible()

    // New Game requires an explicit confirmation step (Sprint 2 polish).
    await page.getByTestId('settings-menu-button').click()
    await page.getByTestId('new-game-button').click()
    await expect(page.getByTestId('reset-confirm-prompt')).toBeVisible()
    await page.getByTestId('confirm-reset-yes-button').click()

    // The reset also clears the local profile — Profile Creation's own
    // mandatory gate reappears immediately (no Welcome Screen in between:
    // that one only shows on a fresh mount, and this reset didn't remount
    // anything), ahead of the dashboard.
    await passProfileCreationIfShown(page)

    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '0')
    await expect(page.getByTestId('next-mission-label')).toHaveAttribute('data-status', 'locked')
    await expect(page.getByText(/"signal": 0/)).toBeVisible()

    // New Game also cleared the save, so the reset isn't undone by a reload.
    await page.reload()
    await waitForMissionReady(page)
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '0')
    await expect(page.getByTestId('next-mission-label')).toHaveAttribute('data-status', 'locked')

    expect(errors).toEqual([])
  })

  test('Cancel dismisses the New Game confirmation without resetting progress', async ({ page }) => {
    await page.goto('/world')
    await waitForMissionReady(page)

    await runSql(page, 'SELECT * FROM citizens;')
    await verdictIsPass(page)
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '17')

    await page.getByTestId('settings-menu-button').click()
    await page.getByTestId('new-game-button').click()
    await expect(page.getByTestId('reset-confirm-prompt')).toBeVisible()

    await page.getByTestId('confirm-reset-cancel-button').click()
    await expect(page.getByTestId('reset-confirm-prompt')).not.toBeVisible()
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '17')
  })
})
