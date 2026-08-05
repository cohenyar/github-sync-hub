import { expect, test } from './helpers.js'

// This environment has no Supabase project configured yet (no
// VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY), and Google's real OAuth screen
// can't be driven in Playwright anyway — so these specs cover exactly what's
// genuinely observable today: a guest can never reach /admin (fail-closed by
// construction, since an unresolved/absent role can never equal 'admin'),
// and removing the old in-game toggle didn't disturb /world or the shared
// page nav. Real signed-in-admin e2e coverage becomes possible once a real
// Supabase project + a seeded test-admin session exist (see the
// implementation report's "known limitations").
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

// Auth-access-in-main-flow: same environment limitation as above — no real
// Supabase project exists here, so Google/email sign-in never renders
// (configured === false) in every real-browser run here. Bug-fix pass: this
// used to mean AuthButton rendered *nothing at all*, indistinguishable from
// a broken build — it now shows a visible, honest not-configured notice
// instead, which is what these specs check for. The signed-out/signed-in/
// logout/redirect-back *behaviors* themselves are covered at the component
// level (AuthButton.test.tsx, AuthProvider.test.tsx) with a mocked Supabase
// client, since driving Google's real OAuth screen isn't possible in
// Playwright regardless of configuration.
test.describe('Auth access in the main flow', () => {
  test('a visible not-configured notice (not nothing) appears in /world while Supabase is unconfigured; the classic dashboard toggle still reaches the console normally', async ({
    page,
  }) => {
    await page.goto('/world')
    await expect(page.getByTestId('settings-menu-button')).toBeVisible()
    await expect(page.getByTestId('google-sign-in-button')).toHaveCount(0)
    await expect(page.getByTestId('auth-account')).toHaveCount(0)
    await expect(page.getByTestId('auth-not-configured')).toBeVisible()
    await expect(page.getByTestId('guest-mode-badge')).toBeVisible()

    await page.getByTestId('settings-menu-button').click()
    await page.getByTestId('toggle-world-scene-button').click()
    await expect(page.getByRole('button', { name: 'הרץ' })).toBeVisible()
  })

  test('the same visible not-configured notice appears on the shared page nav', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByTestId('google-sign-in-button')).toHaveCount(0)
    await expect(page.getByTestId('auth-account')).toHaveCount(0)
    await expect(page.getByTestId('auth-not-configured')).toBeVisible()
  })

  test('the not-configured notice and Guest badge are also visible on a phone-sized viewport, without overlapping the HUD', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 412, height: 915 })
    await page.goto('/world')
    await expect(page.getByTestId('auth-not-configured')).toBeVisible()
    await expect(page.getByTestId('guest-mode-badge')).toBeVisible()

    const notConfiguredBox = (await page.getByTestId('auth-not-configured').boundingBox())!
    expect(notConfiguredBox.y).toBeGreaterThanOrEqual(0)
    expect(notConfiguredBox.x + notConfiguredBox.width).toBeLessThanOrEqual(412)
  })
})
