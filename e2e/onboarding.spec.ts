// Deliberately imports straight from @playwright/test, not the shared
// ./helpers.js fixture — every other spec in this suite wants the
// onboarding flag pre-seeded (a returning player), but this file's entire
// purpose is to exercise both the first-time and returning states
// explicitly, so it manages localStorage itself per test.
import { expect, test } from '@playwright/test'

test.describe('Onboarding — first-time player', () => {
  test('Landing → guest entry → boot sequence → Skip → World Scene, with the default mission highlighted and enterable', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByTestId('landing-enter-world-link').click()

    await expect(page.getByTestId('boot-sequence')).toBeVisible()
    // No game chrome yet — the boot sequence fully owns the screen.
    await expect(page.getByTestId('settings-menu-button')).not.toBeVisible()

    await page.getByTestId('boot-sequence-skip-button').click()

    await expect(page.getByTestId('boot-sequence')).not.toBeVisible()
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    // Odin's one-time world-entry greeting.
    await expect(page.getByTestId('odin-presence')).toContainText('ברוך הבא למרידיאן')

    // The default (Math) destination is explicitly highlighted, not just
    // "the only unlocked one" — walk to it and start its lesson, proving
    // the highlighted marker is genuinely enterable.
    await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'north-warden')
    await page.waitForTimeout(500)
    await page.keyboard.down('KeyS')
    await page.waitForTimeout(600)
    await page.keyboard.up('KeyS')
    await page.keyboard.down('KeyA')
    await page.waitForTimeout(900)
    await page.keyboard.up('KeyA')
    await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'math-teacher')

    await page.keyboard.press('KeyE')
    await expect(page.getByTestId('npc-dialogue-start-lesson-button')).toBeVisible()
    await page.getByTestId('npc-dialogue-start-lesson-button').click()
    await expect(page.getByTestId('math-exercise-panel')).toBeVisible()
  })

  test('finishing the boot sequence naturally (no Skip) reaches the World Scene within the 10-15s budget', async ({
    page,
  }) => {
    await page.goto('/world')
    await expect(page.getByTestId('boot-sequence')).toBeVisible()

    await expect(page.getByTestId('world-scene-3d')).toBeVisible({ timeout: 16000 })
  })

  test('respects prefers-reduced-motion and still completes via Skip', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/world')

    await expect(page.getByTestId('boot-sequence')).toBeVisible()
    await page.getByTestId('boot-sequence-skip-button').click()
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()
  })
})

test.describe('Onboarding — returning player', () => {
  test('never shows the boot sequence; goes straight into the World Scene', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('meridian:onboarded', 'true')
    })
    await page.goto('/world')

    await expect(page.getByTestId('boot-sequence')).not.toBeVisible()
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()
    // Meridian 1.3: a returning player is not silent — Odin gives a
    // one-time welcome-back line (Core Loop §01), distinct from the
    // first-time greeting above.
    await expect(page.getByTestId('odin-presence')).toContainText('ברוך שובך למרידיאן')
  })
})

test.describe('Onboarding — New Game brings the boot sequence back', () => {
  test('New Game clears onboarding; the boot sequence reappears on the next fresh entry', async ({ page }) => {
    // addInitScript re-injects on every navigation, including the reload
    // below — which would silently re-seed the flag right after New Game
    // clears it. A one-time page.evaluate() after the first load avoids
    // that: it sets the flag exactly once, with nothing left to re-fire.
    await page.goto('/world')
    await page.evaluate(() => window.localStorage.setItem('meridian:onboarded', 'true'))
    await page.reload()
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    await page.getByTestId('settings-menu-button').click()
    await page.getByTestId('toggle-world-scene-button').click()
    await page.getByTestId('settings-menu-button').click()
    await page.getByTestId('new-game-button').click()
    await page.getByTestId('confirm-reset-yes-button').click()

    // Not immediately within this same session (an explicit product
    // decision) — only a fresh entry shows it again.
    await expect(page.getByTestId('boot-sequence')).not.toBeVisible()

    await page.reload()
    await expect(page.getByTestId('boot-sequence')).toBeVisible()
  })
})
