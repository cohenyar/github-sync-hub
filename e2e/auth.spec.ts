import { expect, test } from './helpers.js'

// This environment runs against a local placeholder Supabase URL/key (see
// .env.example), not a real signed-in session, and Google's real OAuth
// screen can't be driven in Playwright anyway — so these specs cover exactly
// what's genuinely observable today: a guest can never reach /admin
// (fail-closed by construction, since an unresolved/absent role can never
// equal 'admin'), and removing the old in-game toggle didn't disturb /world
// or the shared page nav. Real signed-in-admin e2e coverage becomes possible
// once a real Lovable Cloud project + a seeded test-admin session exist.
test.describe('Auth Phase 1 — protected /admin route', () => {
  test('a guest visitor to /admin is redirected to the public home screen', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('region', { name: 'Admin Area' })).toHaveCount(0)
  })

  test('a guest never sees an Admin link in the shared page nav', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('navigation').getByRole('link', { name: 'ניהול' })).toHaveCount(0)
  })

  test('the removed in-game admin toggle is gone; /world renders and works normally without it', async ({ page }) => {
    await page.goto('/world')
    await expect(page.getByTestId('settings-menu-button')).toBeVisible()
    await expect(page.getByTestId('admin-toggle-button')).toHaveCount(0)
  })
})

// Auth-access-in-main-flow: Lovable Cloud auth pass — Lovable Cloud is now
// the only auth backend, and the generated client (src/integrations/supabase/
// client.ts) requires real-or-placeholder credentials just to boot at all
// (it throws at import time otherwise), so "configured" is always true in
// every real-browser run here, same as a real Lovable-hosted deployment.
// The not-configured/guest-badge-only UI branch still exists in AuthButton/
// WelcomeScreen (see AuthButton.test.tsx's mocked-unconfigured coverage) as
// defensive UI, but is no longer reachable end-to-end — Google's real OAuth
// screen also can't be driven in Playwright regardless of configuration, so
// what's genuinely e2e-observable is that the sign-in entry point renders
// correctly and navigation/HUD are undisturbed. Signed-in/logout/redirect
// behaviors are covered at the component level (AuthButton.test.tsx,
// AuthProvider.test.tsx) with a mocked Supabase client.
test.describe('Auth access in the main flow', () => {
  test('a visible Google sign-in entry point appears in /world; the classic dashboard toggle still reaches the console normally', async ({
    page,
  }) => {
    await page.goto('/world')
    await expect(page.getByTestId('settings-menu-button')).toBeVisible()
    await expect(page.getByTestId('google-sign-in-button')).toBeVisible()
    await expect(page.getByTestId('auth-account')).toHaveCount(0)
    await expect(page.getByTestId('guest-mode-badge')).toBeVisible()

    await page.getByTestId('settings-menu-button').click()
    await page.getByTestId('toggle-world-scene-button').click()
    await expect(page.getByRole('button', { name: 'הרץ' })).toBeVisible()
  })

  test('the same sign-in entry point appears on the shared page nav', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByTestId('google-sign-in-button')).toBeVisible()
    await expect(page.getByTestId('auth-account')).toHaveCount(0)
  })

  test('the Guest badge and a compact sign-in trigger are visible on a phone-sized viewport, without overlapping the HUD', async ({
    page,
  }) => {
    // Mobile UX pass — H2: below 480px the Google/auth-link/email row
    // collapses behind one compact trigger instead of overflowing the
    // corner HUD — see e2e/auth-mobile-layout.spec.ts for the full fix
    // coverage (all four required widths, reachability, overlap, RTL).
    await page.setViewportSize({ width: 412, height: 915 })
    await page.goto('/world')
    await expect(page.getByTestId('guest-mode-badge')).toBeVisible()
    await expect(page.getByTestId('auth-mobile-menu-trigger')).toBeVisible()

    const triggerBox = (await page.getByTestId('auth-mobile-menu-trigger').boundingBox())!
    expect(triggerBox.y).toBeGreaterThanOrEqual(0)
    expect(triggerBox.x + triggerBox.width).toBeLessThanOrEqual(412)

    await page.getByTestId('auth-mobile-menu-trigger').click()
    const signInBox = (await page.getByTestId('google-sign-in-button').boundingBox())!
    expect(signInBox.y).toBeGreaterThanOrEqual(0)
    expect(signInBox.x + signInBox.width).toBeLessThanOrEqual(412)
  })
})
