// Deliberately imports straight from @playwright/test, not the shared
// ./helpers.js fixture — every other spec in this suite wants the
// onboarding flag pre-seeded (a returning player) and the Meridian 1.4
// Welcome Screen/Profile Creation gates passed through transparently, but
// this file's entire purpose is to exercise the real first-time and
// returning entry flow explicitly, including those two gates themselves —
// so it drives them directly instead of hiding them behind a helper.
import { expect, test, type Page } from '@playwright/test'

/** Fills and submits Profile Creation, if it's the screen currently showing — a no-op otherwise (a profile already exists). */
async function passProfileCreationIfShown(page: Page, name = 'אורח/ת'): Promise<void> {
  const nameInput = page.getByTestId('profile-name-input')
  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill(name)
    await page.getByTestId('profile-submit-button').click()
  }
}

/** The Welcome Screen's Continue Journey action, then (a first-ever visit only) filling and submitting Profile Creation — the two steps ahead of the boot sequence that every test in this file needs, but that aren't themselves what most of these tests are about. */
async function passWelcomeAndProfile(page: Page, name = 'אורח/ת'): Promise<void> {
  await expect(page.getByTestId('welcome-screen')).toBeVisible()
  await page.getByTestId('welcome-continue-button').click()
  await passProfileCreationIfShown(page, name)
}

test.describe('Onboarding — first-time player', () => {
  test('Landing → guest entry → Welcome → Profile Creation → boot sequence → Skip → World Scene, with the default mission highlighted and enterable', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByTestId('landing-enter-world-link').click()

    // Meridian 1.4 — the title screen and the mandatory profile step, ahead
    // of the boot sequence, on a genuinely first-ever visit.
    await passWelcomeAndProfile(page)

    await expect(page.getByTestId('boot-sequence')).toBeVisible()
    // No game chrome yet — the boot sequence fully owns the screen.
    await expect(page.getByTestId('settings-menu-button')).not.toBeVisible()

    await page.getByTestId('boot-sequence-skip-button').click()

    await expect(page.getByTestId('boot-sequence')).not.toBeVisible()
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    // Odin's one-time world-entry greeting.
    await expect(page.getByTestId('odin-presence')).toContainText('ברוך/ה הבא/ה למרידיאן')

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
    await passWelcomeAndProfile(page)
    await expect(page.getByTestId('boot-sequence')).toBeVisible()

    await expect(page.getByTestId('world-scene-3d')).toBeVisible({ timeout: 16000 })
  })

  test('respects prefers-reduced-motion and still completes via Skip', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/world')
    await passWelcomeAndProfile(page)

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

    // Meridian 1.4: the Welcome Screen shows on every launch regardless of
    // onboarding status — this browser context has no local profile yet
    // either, so Profile Creation still gates once, same as a first-timer.
    await passWelcomeAndProfile(page)

    await expect(page.getByTestId('boot-sequence')).not.toBeVisible()
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()
    // Meridian 1.3 gives a returning player a one-time welcome-back line
    // (Core Loop §01) — not asserted here: Meridian 1.4's Profile Creation
    // step (mandatory for this fresh browser context) adds real wall-clock
    // delay before the World Scene — and therefore OdinPresence — ever
    // mounts, racing against the mission database's own async prep, whose
    // MissionStarted narration can legitimately land first in a real
    // browser. Odin's presence banner only ever shows the latest entry by
    // design (see OdinPresence.tsx); which of the two wins that race is not
    // this test's concern. The welcome-back line itself is verified
    // deterministically at the Vitest level (onboardingFlow.test.tsx),
    // where synchronous fireEvent has no such race to lose.
  })

  test('a profile created on an earlier visit is remembered: Continue Journey shows it directly, with no Profile Creation gate', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('meridian:onboarded', 'true')
    })
    await page.goto('/world')
    await passWelcomeAndProfile(page, 'נועה')
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    await page.reload()

    await expect(page.getByTestId('welcome-screen')).toBeVisible()
    await expect(page.getByTestId('welcome-profile-chip')).toContainText('נועה')
    await expect(page.getByTestId('profile-name-input')).not.toBeVisible()
    await page.getByTestId('welcome-continue-button').click()

    await expect(page.getByTestId('profile-creation-screen')).not.toBeVisible()
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()
  })
})

// Lovable Cloud auth pass — Cloud is always configured now (see auth.spec.ts's
// own note on the generated client requiring real-or-placeholder credentials
// just to boot), so the Welcome Screen's real sign-in choice (Google/email or
// Guest) is what's genuinely reachable end-to-end today. The not-configured
// notice itself still exists in WelcomeScreen.tsx (see WelcomeScreen.test.tsx's
// mocked-unconfigured coverage) as defensive UI, but is no longer e2e-visible.
test.describe('Onboarding — Welcome Screen auth state (bug-fix pass)', () => {
  test('shows a visible Guest label alongside a real Google sign-in choice, instead of silently hiding all sign-in UI', async ({
    page,
  }) => {
    await page.goto('/world')
    await expect(page.getByTestId('welcome-screen')).toBeVisible()
    await expect(page.getByTestId('welcome-guest-label')).toBeVisible()
    await expect(page.getByTestId('welcome-google-signin-button')).toBeVisible()
    // The primary "Continue as Guest"-equivalent action still works
    // regardless — signing in is additive, never blocking.
    await expect(page.getByTestId('welcome-continue-button')).toBeEnabled()
  })

  test('same Guest label and sign-in choice on a phone-sized viewport, without clipping', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 })
    await page.goto('/world')
    await expect(page.getByTestId('welcome-screen')).toBeVisible()
    const signInButton = page.getByTestId('welcome-google-signin-button')
    await expect(signInButton).toBeVisible()
    const box = (await signInButton.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(412)
  })
})

test.describe('Onboarding — New Game brings the boot sequence back', () => {
  test('New Game clears onboarding; the boot sequence reappears on the next fresh entry', async ({ page }) => {
    // addInitScript re-injects on every navigation, including the reload
    // below — which would silently re-seed the flag right after New Game
    // clears it. A one-time page.evaluate() after the first load avoids
    // that: it sets the flag exactly once, with nothing left to re-fire.
    await page.goto('/world')
    await passWelcomeAndProfile(page)
    await page.evaluate(() => window.localStorage.setItem('meridian:onboarded', 'true'))
    await page.reload()
    await passWelcomeAndProfile(page)
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    await page.getByTestId('settings-menu-button').click()
    await page.getByTestId('toggle-world-scene-button').click()
    await page.getByTestId('settings-menu-button').click()
    await page.getByTestId('new-game-button').click()
    await page.getByTestId('confirm-reset-yes-button').click()

    // The reset also clears the local profile — Profile Creation's own
    // mandatory gate reappears immediately (no Welcome Screen in between:
    // that one only shows on a fresh mount, and this reset didn't remount
    // anything), ahead of the dashboard.
    await passProfileCreationIfShown(page)

    // Not immediately within this same session (an explicit product
    // decision) — only a fresh entry shows it again.
    await expect(page.getByTestId('boot-sequence')).not.toBeVisible()

    await page.reload()
    await passWelcomeAndProfile(page)
    await expect(page.getByTestId('boot-sequence')).toBeVisible()
  })
})
