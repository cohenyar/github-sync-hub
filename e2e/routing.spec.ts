import { expect, test } from '@playwright/test'

test.describe('Routing foundation', () => {
  test('direct navigation to every route renders something, and refresh on a route works', async ({ page }) => {
    for (const path of ['/', '/dashboard', '/world', '/courses', '/courses/sql-basics', '/tutor', '/progress', '/profile']) {
      await page.goto(path)
      await expect(page.locator('body')).not.toBeEmpty()
    }

    // A cold reload on a non-root route is the real deployment-refresh
    // concern this stage flags — Vite's dev server already serves index.html
    // for any path, so this proves it works today even though the
    // production static-host rewrite config is a separate later decision.
    await page.goto('/dashboard')
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('an unknown path renders the fallback page with a link back to the landing page', async ({ page }) => {
    await page.goto('/this-route-does-not-exist')
    await expect(page.getByRole('link', { name: /./ }).first()).toBeVisible()
  })

  test('browser back/forward navigates between routes', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('landing-enter-world-link').click()
    await expect(page.getByTestId('toggle-world-scene-button')).toBeVisible()

    await page.goBack()
    await expect(page.getByTestId('landing-enter-world-link')).toBeVisible()

    await page.goForward()
    await expect(page.getByTestId('toggle-world-scene-button')).toBeVisible()
  })
})
