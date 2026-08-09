// Deliberately imports straight from @playwright/test, not the shared
// ./helpers.js fixture — this file's entire purpose is to drive the
// Welcome Screen's real sign-in/guest choices directly (see
// onboarding.spec.ts for the same reasoning), not to skip past them.
import { expect, test, type Page } from '@playwright/test'

async function passProfileCreationIfShown(page: Page, name = 'אורח/ת'): Promise<void> {
  const nameInput = page.getByTestId('profile-name-input')
  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill(name)
    await page.getByTestId('profile-submit-button').click()
  }
}

/**
 * Playtest fix pass (issue 1) — H1 (localhost Google sign-in 404) plus the
 * Guest/Continue Journey/signed-in differentiation. This suite runs against
 * the real local Vite dev server (npm run test:e2e's own webServer, not a
 * Lovable-hosted deployment), reached at `localhost` — exactly the hostname
 * AuthProvider.signInWithGoogle now checks for (see runtimeEnvironment.ts).
 *
 * The check was briefly `import.meta.env.DEV`-based, then dropped entirely
 * by an unrelated OAuth-preload refactor, which silently reintroduced H1: a
 * real click here navigated straight to `/~oauth/initiate` and 404'd. It's
 * hostname-based now specifically because DEV can't tell this bare dev
 * server apart from Lovable Preview, which also runs in Vite dev mode but
 * has the managed broker and must keep working — every test in this file is
 * exactly the regression coverage for that history.
 */
test.describe('Google sign-in on a true local host never reaches the generic 404 (H1)', () => {
  test('clicking Google on the Welcome Screen shows the local-dev explanation and never navigates away from /world', async ({
    page,
  }) => {
    await page.goto('/world')
    await expect(page.getByTestId('welcome-screen')).toBeVisible()

    await page.getByTestId('welcome-google-signin-button').click()

    // The one thing this playtest fix must guarantee: no navigation to
    // /~oauth/initiate, and never landing on the generic 404 page.
    await expect(page).toHaveURL(/\/world/)
    await expect(page.getByTestId('welcome-google-local-dev-notice')).toBeVisible()
    await expect(page.getByTestId('welcome-google-local-dev-notice')).toContainText(
      'התחברות Google זמינה בגרסת Lovable המפורסמת',
    )
    await expect(page).not.toHaveURL(/oauth/)
  })

  test('offers all three required follow-ups: Guest, Email, and a way back to the plain choices', async ({ page }) => {
    await page.goto('/world')
    await page.getByTestId('welcome-google-signin-button').click()

    await expect(page.getByTestId('welcome-local-dev-guest-button')).toBeVisible()
    await expect(page.getByTestId('welcome-local-dev-email-button')).toBeVisible()
    await expect(page.getByTestId('welcome-local-dev-dismiss-button')).toBeVisible()
  })

  test('the notice\'s Guest button continues into the world, the same as the primary Guest choice', async ({ page }) => {
    await page.goto('/world')
    await page.getByTestId('welcome-google-signin-button').click()
    await page.getByTestId('welcome-local-dev-guest-button').click()
    await passProfileCreationIfShown(page)

    await expect(page.getByTestId('welcome-screen')).not.toBeVisible()
  })

  test('the notice\'s Email button reveals the email sign-in form in place, with no navigation', async ({ page }) => {
    await page.goto('/world')
    await page.getByTestId('welcome-google-signin-button').click()
    await page.getByTestId('welcome-local-dev-email-button').click()

    await expect(page.getByTestId('email-password-form')).toBeVisible()
    await expect(page).toHaveURL(/\/world/)
  })

  test('the same local-dev notice appears on a phone-sized (Pixel 7) viewport, fully reachable', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 })
    await page.goto('/world')
    await page.getByTestId('welcome-google-signin-button').click()

    const notice = page.getByTestId('welcome-google-local-dev-notice')
    await expect(notice).toBeVisible()
    const box = (await notice.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(412)

    await expect(page.getByTestId('welcome-local-dev-guest-button')).toBeVisible()
  })
})

// Playtest fix pass (issue 1B) — Guest / returning-local-player / signed-in
// are now three genuinely distinguishable states, not two buttons that
// silently did the same thing. Authenticated-state coverage stays at the
// component level (WelcomeScreen.test.tsx's mocked signed-in describe
// block) — a real signed-in e2e session isn't reachable in this
// environment without a real Lovable Cloud project + a seeded test
// session (same documented limitation as auth.spec.ts).
test.describe('Guest vs. returning local player are shown distinctly (issue 1B)', () => {
  test('a brand-new visitor sees the generic Guest label, and choosing Guest is a real, distinct action', async ({
    page,
  }) => {
    await page.goto('/world')
    await expect(page.getByTestId('welcome-guest-label')).toContainText('מצב אורח');

    await page.getByTestId('welcome-guest-button').click()
    await passProfileCreationIfShown(page)
    await expect(page.getByTestId('welcome-screen')).not.toBeVisible()

    // A first-ever visit goes through the boot sequence before any game
    // chrome (including AuthButton's Guest badge) mounts.
    await expect(page.getByTestId('boot-sequence')).toBeVisible()
    await page.getByTestId('boot-sequence-skip-button').click()
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()
    await expect(page.getByTestId('guest-mode-badge')).toBeVisible()
  })

  test('a returning local player (an existing profile on this device) sees the more specific label, not the generic Guest one', async ({
    page,
  }) => {
    await page.goto('/world')
    await page.getByTestId('welcome-continue-button').click()
    await passProfileCreationIfShown(page, 'נועה')
    await expect(page.getByTestId('welcome-screen')).not.toBeVisible()

    await page.reload()

    await expect(page.getByTestId('welcome-screen')).toBeVisible()
    await expect(page.getByTestId('welcome-profile-chip')).toContainText('נועה')
    const guestLabel = page.getByTestId('welcome-guest-label')
    await expect(guestLabel).toBeVisible()
    await expect(guestLabel).not.toContainText('עדיין לא מחוברים לחשבון')
  })
})
