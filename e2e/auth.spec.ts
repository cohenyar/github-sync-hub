import { expect, test } from '@playwright/test'

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
    await expect(page.getByTestId('toggle-world-scene-button')).toBeVisible()
    await expect(page.getByTestId('admin-toggle-button')).toHaveCount(0)
  })
})
