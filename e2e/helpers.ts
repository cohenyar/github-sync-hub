import { test as base, expect, type Locator, type Page } from '@playwright/test'

/**
 * Meridian 1.4 — the Welcome Screen (title screen) now shows on every
 * mount of /world, and a first-time player (no local profile yet) is then
 * routed through the mandatory Profile Creation screen before anything
 * else. Every spec in this suite predates both and was written assuming
 * immediate access to the boot sequence/world scene. Rather than hardcode
 * a matching localStorage save blob (fragile — it would have to track
 * PlayerProgress's real shape by hand), these drive the actual screens via
 * their real UI, exactly as a first-time player would, so they stay
 * correct as those screens evolve. Both exported (not just used internally
 * by the page.goto/reload wrapper below) so a spec that reaches /world via
 * an in-app link click — or that re-triggers Profile Creation mid-session
 * via New Game, which clears the profile without remounting anything, so
 * the Welcome Screen never reappears for it — can call the relevant one
 * itself.
 */
export async function passProfileCreationIfShown(page: Page, name = 'אורח/ת'): Promise<void> {
  // Profile Creation only appears the very first time (no local profile
  // yet) — once created, it never shows again on later goto/reload calls
  // within the same test. A short timeout keeps that (common) later case
  // cheap: this always follows either a fresh navigation or a same-tick
  // re-render, never a case where it might still be about to appear later.
  const nameInput = page.getByTestId('profile-name-input')
  try {
    await nameInput.waitFor({ state: 'visible', timeout: 500 })
  } catch {
    return
  }
  await nameInput.fill(name)
  await page.getByTestId('profile-submit-button').click()
}

export async function passEntryGates(page: Page): Promise<void> {
  const continueButton = page.getByTestId('welcome-continue-button')
  try {
    await continueButton.waitFor({ state: 'visible', timeout: 3000 })
  } catch {
    return
  }
  await continueButton.click()
  await passProfileCreationIfShown(page)
}

/**
 * Onboarding: every spec in this suite predates the first-time boot
 * sequence and was written assuming a returning player's experience — the
 * classic dashboard reachable immediately via the world-scene toggle, no
 * boot sequence in the way. Seeding the "already onboarded" flag via
 * addInitScript (so it's set before any page script runs, avoiding any
 * flash of the boot sequence) keeps every existing test's behavior
 * unchanged. Only e2e/onboarding.spec.ts deliberately clears this to
 * exercise the real first-time flow.
 *
 * page.goto/page.reload are wrapped so every spec using this fixture
 * transparently passes through the Welcome Screen and (for a fresh
 * profile) Profile Creation, without needing its own per-test changes —
 * the same reasoning as the onboarding seed above, just for two screens
 * instead of a flag.
 */
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('meridian:onboarded', 'true')
    })

    // Scoped to /world specifically — the Welcome Screen only ever renders
    // there, so skipping this for every other route (routing.spec.ts alone
    // touches half a dozen) avoids paying passEntryGates' wait on
    // navigations that could never show it anyway.
    const originalGoto = page.goto.bind(page)
    page.goto = (async (url: string, options?: Parameters<Page['goto']>[1]) => {
      const response = await originalGoto(url, options)
      if (url.includes('/world')) await passEntryGates(page)
      return response
    }) as Page['goto']

    const originalReload = page.reload.bind(page)
    page.reload = (async (options?: Parameters<Page['reload']>[0]) => {
      const response = await originalReload(options)
      if (page.url().includes('/world')) await passEntryGates(page)
      return response
    }) as Page['reload']

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
    await openSettingsMenu(page)
    await page.getByTestId('toggle-world-scene-button').click()
  }
  const runButton = page.getByTestId('run-button')
  await expect(runButton).toBeEnabled()
  return runButton
}

/** Opens the corner HUD's settings popover (Save/Load/New Game/Mute/Classic View), Meridian 1.2. */
export async function openSettingsMenu(page: Page): Promise<void> {
  await page.getByTestId('settings-menu-button').click()
}

/** Opens the corner HUD's account menu (Meridian 1.2) for a signed-in player. */
export async function openAccountMenu(page: Page): Promise<void> {
  await page.getByTestId('auth-account').click()
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
