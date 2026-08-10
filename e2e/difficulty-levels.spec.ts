import { expect, openSettingsMenu, passProfileCreationIfShown, test, waitForMissionReady } from './helpers.js'
import { expect as rawExpect, test as rawTest, type Page } from '@playwright/test'

/**
 * First Mission UX pass — learning difficulty (scaffolding/help only, never
 * a different campaign: same missions, same story, same world, same unlock
 * rules — see src/progression/services/setDifficultyLevel.ts). The shared
 * ./helpers.js fixture pre-seeds onboarding and passes Profile Creation
 * through with its default (Easy) selection, which is exactly what most
 * tests here want; the one test that needs to choose a level DURING
 * onboarding drives Profile Creation directly instead (same reasoning as
 * onboarding.spec.ts).
 *
 * SettingsMenu's difficulty buttons deliberately do NOT close the popover on
 * selection (same convention as the mute toggle — a setting you might flip
 * more than once — unlike Save/Load/New Game's one-shot runAndClose
 * actions), so tests that pick a level and then need the menu closed do so
 * explicitly via Escape, matching the component's own documented behavior.
 */
async function passProfileCreationChoosingDifficulty(page: Page, level: 1 | 2 | 3, name = 'אורח/ת'): Promise<void> {
  const nameInput = page.getByTestId('profile-name-input')
  await nameInput.waitFor({ state: 'visible', timeout: 3000 })
  await nameInput.fill(name)
  await page.getByTestId(`difficulty-option-${level}`).click()
  await page.getByTestId('profile-submit-button').click()
}

rawTest.describe('First Mission UX pass — difficulty selector during onboarding', () => {
  rawTest('shows three levels with descriptions, defaults to Easy, and the chosen level carries into the world', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByTestId('landing-enter-world-link').click()
    await rawExpect(page.getByTestId('welcome-screen')).toBeVisible()
    await page.getByTestId('welcome-continue-button').click()

    await rawExpect(page.getByTestId('profile-creation-screen')).toBeVisible()
    await rawExpect(page.getByTestId('difficulty-option-1')).toContainText('קל')
    await rawExpect(page.getByTestId('difficulty-option-2')).toContainText('בינוני')
    await rawExpect(page.getByTestId('difficulty-option-3')).toContainText('קשה')
    await rawExpect(page.getByTestId('difficulty-option-1')).toHaveAttribute('aria-checked', 'true')

    await passProfileCreationChoosingDifficulty(page, 3)

    await rawExpect(page.getByTestId('boot-sequence')).toBeVisible()
    await page.getByTestId('boot-sequence-skip-button').click()
    await rawExpect(page.getByTestId('world-scene-3d')).toBeVisible()

    await openSettingsMenu(page)
    await rawExpect(page.getByTestId('difficulty-level-3-button')).toHaveAttribute('aria-checked', 'true')
  })
})

test.describe('First Mission UX pass — difficulty persistence and Settings', () => {
  test('selecting a level from Settings persists across a real reload', async ({ page }) => {
    await page.goto('/world')
    await openSettingsMenu(page)
    await page.getByTestId('difficulty-level-2-button').click()
    await expect(page.getByTestId('difficulty-level-2-button')).toHaveAttribute('aria-checked', 'true')

    // Difficulty selection doesn't close the popover (see file header); Save does.
    await page.getByTestId('save-button').click()
    await expect(page.getByTestId('saved-confirmation')).toBeVisible()

    await page.reload()
    await openSettingsMenu(page)
    await expect(page.getByTestId('difficulty-level-2-button')).toHaveAttribute('aria-checked', 'true')
  })

  test('changing difficulty from Settings never resets mission progress', async ({ page }) => {
    await page.goto('/world')
    await waitForMissionReady(page)
    await page.getByTestId('sql-input').fill('SELECT * FROM citizens;')
    await page.getByTestId('run-button').click()
    await expect(page.getByTestId('verdict-banner')).toHaveAttribute('data-verdict', 'pass')
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '17')

    await openSettingsMenu(page)
    await page.getByTestId('difficulty-level-3-button').click()

    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '17')
    await expect(page.getByTestId('verdict-banner')).toHaveAttribute('data-verdict', 'pass')
  })

  test('Save/Load round-trips the chosen difficulty level', async ({ page }) => {
    await page.goto('/world')
    await openSettingsMenu(page)
    await page.getByTestId('difficulty-level-3-button').click()
    // The menu is still open here (difficulty selection doesn't close it) —
    // Save does, via its own one-shot runAndClose.
    await page.getByTestId('save-button').click()
    await expect(page.getByTestId('saved-confirmation')).toBeVisible()

    await openSettingsMenu(page)
    await page.getByTestId('difficulty-level-1-button').click()
    await expect(page.getByTestId('difficulty-level-1-button')).toHaveAttribute('aria-checked', 'true')
    // Menu is still open (same reason) — Load closes it after loading.
    await page.getByTestId('load-button').click()

    await openSettingsMenu(page)
    await expect(page.getByTestId('difficulty-level-3-button')).toHaveAttribute('aria-checked', 'true')
  })

  // difficultyLevel is a learning-preference setting, not gameplay
  // progression — New Game resets missions/lessons/campaign progress but
  // deliberately preserves the selected level (see handleConfirmNewGame in
  // GameApp.tsx). Exact scenario: (1) select difficulty 3, (2) make
  // gameplay progress, (3) start New Game, (4) gameplay progress resets,
  // (5) difficultyLevel remains 3.
  test('New Game resets gameplay progress but preserves the selected difficulty level', async ({ page }) => {
    await page.goto('/world')

    // 1. Select difficulty 3.
    await openSettingsMenu(page)
    await page.getByTestId('difficulty-level-3-button').click()
    await page.keyboard.press('Escape')

    // 2. Make gameplay progress.
    await waitForMissionReady(page)
    await page.getByTestId('sql-input').fill('SELECT * FROM citizens;')
    await page.getByTestId('run-button').click()
    await expect(page.getByTestId('verdict-banner')).toHaveAttribute('data-verdict', 'pass')
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '17')

    // 3. Start New Game. (difficulty is already 3 from step 1 — no need to
    // re-select it; the settings menu was closed by waitForMissionReady's
    // own toggle-world-scene-button click, so it needs reopening here.)
    await openSettingsMenu(page)
    await page.getByTestId('new-game-button').click()
    await expect(page.getByTestId('reset-confirm-prompt')).toBeVisible()
    await page.getByTestId('confirm-reset-yes-button').click()

    // The reset also clears the local profile — Profile Creation's mandatory
    // gate reappears immediately (unchanged New Game behavior). Its
    // difficulty radiogroup is pre-selected to the PRESERVED level (3), not
    // the picker's own unrelated default — checked here before submitting,
    // so what follows is the preservation speaking, not a fresh choice this
    // test makes.
    await expect(page.getByTestId('profile-name-input')).toBeVisible()
    await expect(page.getByTestId('difficulty-option-3')).toHaveAttribute('aria-checked', 'true')
    await passProfileCreationIfShown(page)

    // 4. Gameplay progress reset.
    await waitForMissionReady(page)
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '0')

    // 5. difficultyLevel remains 3.
    await openSettingsMenu(page)
    await expect(page.getByTestId('difficulty-level-3-button')).toHaveAttribute('aria-checked', 'true')
  })

  test('a fresh save with no prior difficultyLevel still defaults to Easy after New Game', async ({ page }) => {
    await page.goto('/world')
    await openSettingsMenu(page)
    await expect(page.getByTestId('difficulty-level-1-button')).toHaveAttribute('aria-checked', 'true')

    await page.getByTestId('new-game-button').click()
    await expect(page.getByTestId('reset-confirm-prompt')).toBeVisible()
    await page.getByTestId('confirm-reset-yes-button').click()
    await passProfileCreationIfShown(page)

    await openSettingsMenu(page)
    await expect(page.getByTestId('difficulty-level-1-button')).toHaveAttribute('aria-checked', 'true')
  })
})

test.describe('First Mission UX pass — scaffolding differences are visible in the SQL editor', () => {
  test('Easy shows the syntax example; Medium and Hard hide it', async ({ page }) => {
    await page.goto('/world')
    await waitForMissionReady(page)

    await openSettingsMenu(page)
    await page.getByTestId('difficulty-level-1-button').click()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('sql-example-hint')).toBeVisible()

    await openSettingsMenu(page)
    await page.getByTestId('difficulty-level-2-button').click()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('sql-example-hint')).not.toBeVisible()

    await openSettingsMenu(page)
    await page.getByTestId('difficulty-level-3-button').click()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('sql-example-hint')).not.toBeVisible()
  })

  test('Hard feedback on a wrong query identifies the mistake type without exact row counts', async ({ page }) => {
    await page.goto('/world')
    await waitForMissionReady(page)
    await openSettingsMenu(page)
    await page.getByTestId('difficulty-level-3-button').click()
    await page.keyboard.press('Escape')

    await page.getByTestId('sql-input').fill('SELECT * FROM citizens WHERE id = 1;')
    await page.getByTestId('run-button').click()

    await expect(page.getByTestId('verdict-banner')).toHaveAttribute('data-verdict', 'fail')
    await expect(page.locator('body')).not.toContainText('ציפינו')
  })
})
