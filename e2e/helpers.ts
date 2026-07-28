import { test as base, expect, type Locator, type Page } from '@playwright/test'

/**
 * Onboarding: every spec in this suite predates the first-time boot
 * sequence and was written assuming a returning player's experience — the
 * classic dashboard reachable immediately via the world-scene toggle, no
 * boot sequence in the way. Seeding the "already onboarded" flag via
 * addInitScript (so it's set before any page script runs, avoiding any
 * flash of the boot sequence) keeps every existing test's behavior
 * unchanged. Only e2e/onboarding.spec.ts deliberately clears this to
 * exercise the real first-time flow.
 */
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('meridian:onboarded', 'true')
    })
    await use(page)
  },
})

export { expect }

/**
 * Waits for the mission database to finish preparing and returns the Run
 * button. The World Scene (not the classic dashboard) is now the default
 * view at /world — every existing caller of this helper wants the classic
 * dashboard's SQL console specifically, so this switches to it first via
 * the existing toggle if we've landed in the 3D scene instead.
 */
export async function waitForMissionReady(page: Page): Promise<Locator> {
  const worldScene = page.getByTestId('world-scene-3d')
  if (await worldScene.isVisible().catch(() => false)) {
    await page.getByTestId('toggle-world-scene-button').click()
  }
  const runButton = page.getByTestId('run-button')
  await expect(runButton).toBeEnabled()
  return runButton
}

/** Types a query into the SQL editor and clicks Run. */
export async function runSql(page: Page, sql: string): Promise<void> {
  await page.getByTestId('sql-input').fill(sql)
  await page.getByTestId('run-button').click()
}

/** True once the verdict banner shows a passing result. */
export function verdictIsPass(page: Page) {
  return expect(page.getByTestId('verdict-banner')).toHaveAttribute('data-verdict', 'pass')
}

/** True once the verdict banner shows a failing result. */
export function verdictIsFail(page: Page) {
  return expect(page.getByTestId('verdict-banner')).toHaveAttribute('data-verdict', 'fail')
}
