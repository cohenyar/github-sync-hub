import { expect, runSql, test, verdictIsPass, waitForMissionReady } from './helpers.js'

test.describe('Vertical slice: the full six-mission campaign is playable end to end', () => {
  test('switches missions, unlocks the full chain, and completes the campaign', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.goto('/world')
    await waitForMissionReady(page)

    // 1. First Contact
    await runSql(page, 'SELECT * FROM citizens;')
    await verdictIsPass(page)
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '17')

    // 2. Switch to District Ties and complete it
    await page.getByTestId('mission-option-district-ties').click()
    await waitForMissionReady(page)
    await runSql(page, "SELECT * FROM citizens WHERE district = 'north';")
    await verdictIsPass(page)
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '33')

    // 3. Switch to South Stability and complete it
    await page.getByTestId('mission-option-south-stability').click()
    await waitForMissionReady(page)
    await runSql(page, "SELECT * FROM district_reports WHERE district = 'south' AND severity >= 3;")
    await verdictIsPass(page)
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '50')
    await expect(page.locator('[data-npc-id="south-engineer"]')).toBeVisible()

    // 4. Switch to Full Signal and complete it (not the finale)
    await page.getByTestId('mission-option-full-signal').click()
    await waitForMissionReady(page)
    await runSql(page, 'SELECT district, COUNT(*) AS total FROM citizens GROUP BY district;')
    await verdictIsPass(page)
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '67')
    await expect(page.getByTestId('campaign-complete-banner')).not.toBeVisible()

    // 5. Switch to Linked Records and complete it (not the finale either)
    await page.getByTestId('mission-option-linked-records').click()
    await waitForMissionReady(page)
    await runSql(
      page,
      'SELECT citizens.name, district_officials.official ' +
        'FROM citizens JOIN district_officials ON citizens.district = district_officials.district;',
    )
    await verdictIsPass(page)
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '83')
    await expect(page.getByTestId('campaign-complete-banner')).not.toBeVisible()

    // 6. Switch to Priority Signal — the true finale, introducing ORDER BY
    await page.getByTestId('mission-option-priority-signal').click()
    await waitForMissionReady(page)
    await runSql(page, 'SELECT * FROM signal_reports ORDER BY severity DESC;')
    await verdictIsPass(page)
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '100')

    // The campaign-completion-gated NPC appears, and Odin narrates the close.
    await expect(page.locator('[data-npc-id="city-voice"]')).toBeVisible()
    await expect(page.getByText('כל החוטים התחברו. מרידיאן עונה כעת כעיר אחת.')).toBeVisible()

    // The distinct campaign-completion visual moment (Sprint 1 polish).
    await expect(page.getByTestId('campaign-complete-banner')).toBeVisible()

    expect(errors).toEqual([])
  })
})
