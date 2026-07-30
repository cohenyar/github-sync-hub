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
// Supabase project exists here, so AuthButton correctly renders nothing at
// all (configured === false) in every real-browser run. That's exactly the
// "don't show a broken control when unconfigured" requirement, and it's
// what's genuinely verifiable today. The signed-out/signed-in/logout/
// redirect-back *behaviors* themselves are covered at the component level
// (GameControlBar.test.tsx, AuthProvider.test.tsx) with a mocked Supabase
// client, since driving Google's real OAuth screen isn't possible in
// Playwright regardless of configuration.
test.describe('Auth access in the main flow', () => {
  test('no broken auth control appears in /world while Supabase is unconfigured; the classic dashboard toggle still reaches the console normally', async ({
    page,
  }) => {
    await page.goto('/world')
    await expect(page.getByTestId('settings-menu-button')).toBeVisible()
    await expect(page.getByTestId('google-sign-in-button')).toHaveCount(0)
    await expect(page.getByTestId('auth-account')).toHaveCount(0)

    await page.getByTestId('settings-menu-button').click()
    await page.getByTestId('toggle-world-scene-button').click()
    await expect(page.getByRole('button', { name: 'הרץ' })).toBeVisible()
  })

  test('no broken auth control appears on the shared page nav either', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByTestId('google-sign-in-button')).toHaveCount(0)
    await expect(page.getByTestId('auth-account')).toHaveCount(0)
  })
})
