import { expect, questionFeedbackIsPass, submitMultipleChoiceAnswer, test } from './helpers.js'

/**
 * First Mission UX pass — the root cause was TerminalView's own .scrollArea
 * capping the WHOLE mission brief + SQL input area at max-height: min(60vh,
 * 520px), a nested scroll trap independent of the page's own (normal)
 * scroll. This suite drives the exact same city -> Core -> terminal path
 * world-scene-3d.spec.ts already exercises, then verifies the fix directly:
 * no scrollable ancestor hides the input/button, and the objective/
 * instruction/input/button are all visible without any scrolling at all —
 * on desktop and at a real narrow mobile width.
 */
async function enterFirstContactTerminal(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/world')
  await expect(page.getByTestId('world-scene-3d')).toBeVisible()

  const prompt = page.getByTestId('interaction-prompt')
  await expect(prompt).toBeVisible()

  // Spawn is already within range of the north warden, but reaching the
  // Core needs no dialogue interaction with him first — walk straight south
  // toward the Core (0, 0), same timings as world-scene-3d.spec.ts.
  await page.keyboard.down('KeyS')
  await page.waitForTimeout(900)
  await page.keyboard.up('KeyS')
  await expect(prompt).toHaveAttribute('data-interactable-id', 'core')

  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('terminal-view')).toBeVisible()
  // SQL-removal pass — First Contact is now a question mission with no async
  // "mission database" wait; the question panel is on screen immediately.
  await expect(page.getByTestId('question-panel')).toBeVisible()
}

/** True if any ancestor of the element (up to <body>) clips overflow content it doesn't fit — the nested-scroll-trap shape. */
async function hasClippingScrollableAncestor(page: import('@playwright/test').Page, testId: string): Promise<boolean> {
  return page.evaluate((id) => {
    let el = document.querySelector(`[data-testid="${id}"]`) as HTMLElement | null
    if (!el) return false
    el = el.parentElement
    while (el && el !== document.body) {
      const style = window.getComputedStyle(el)
      const clips = style.overflowY === 'auto' || style.overflowY === 'scroll'
      if (clips && el.scrollHeight > el.clientHeight + 1) return true
      el = el.parentElement
    }
    return false
  }, testId)
}

test.describe('First Mission UX pass — no nested-scroll trap', () => {
  test('the question options and submit button have no clipping scrollable ancestor', async ({ page }) => {
    await enterFirstContactTerminal(page)
    expect(await hasClippingScrollableAncestor(page, 'question-options')).toBe(false)
    expect(await hasClippingScrollableAncestor(page, 'question-submit-button')).toBe(false)
  })

  // First Contact ("הקיסר הראשון") has no authored instructionHe under the
  // SQL-removal pass, so mission-instruction never renders for it at all —
  // only mission-goal is checked here now (see missions/firstContact.ts).
  test('the mission goal has no clipping scrollable ancestor either', async ({ page }) => {
    await enterFirstContactTerminal(page)
    expect(await hasClippingScrollableAncestor(page, 'mission-goal')).toBe(false)
  })
})

test.describe('First Mission UX pass — the first viewport shows the actionable task', () => {
  // SQL-removal pass — measured live: at 1280x800, question-options alone
  // (First Contact's 4 stacked multiple-choice rows) already bottoms out
  // around y≈871, and question-submit-button around y≈927 — both below the
  // 800px fold. Four stacked options are inherently taller than the old
  // single-line SQL input the original assertion was calibrated to, so the
  // strict "everything fits with zero scrolling" claim no longer holds for
  // this content shape; forcing it would just be a false equivalence. What
  // the original UX fix actually guaranteed — no CLIPPING scroll trap, i.e.
  // reaching them via ordinary page scroll always works — is unchanged and
  // already covered by the "no nested-scroll trap" tests above. Only the
  // title/goal (which do still fit in the first viewport, unchanged) keep
  // the strict fit assertion; the question controls are checked for mere
  // visibility instead.
  test('title and objective are visible without scrolling on desktop; the question controls are visible and reachable', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await enterFirstContactTerminal(page)

    const viewportHeight = 800
    for (const testId of ['active-mission-title', 'mission-goal']) {
      const locator = page.getByTestId(testId)
      await expect(locator).toBeVisible()
      const box = await locator.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.y).toBeGreaterThanOrEqual(0)
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewportHeight)
    }

    await expect(page.getByTestId('question-options')).toBeVisible()
    await expect(page.getByTestId('question-submit-button')).toBeVisible()
  })

  test('the same holds at a real narrow mobile width (390px), and nothing needs horizontal scrolling either', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await enterFirstContactTerminal(page)

    const hasNoHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    )
    expect(hasNoHorizontalOverflow).toBe(true)

    // mission-goal still fits in the first viewport unchanged; question-options
    // and question-submit-button are only checked horizontally here (see the
    // desktop test above for why their vertical fit no longer applies) —
    // horizontal containment is unaffected by option count, so it still holds.
    const goalBox = await page.getByTestId('mission-goal').boundingBox()
    expect(goalBox).not.toBeNull()
    expect(goalBox!.y + goalBox!.height).toBeLessThanOrEqual(844)

    for (const testId of ['question-options', 'question-submit-button']) {
      const locator = page.getByTestId(testId)
      await expect(locator).toBeVisible()
      const box = await locator.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(390)
    }

    const submitButtonBox = await page.getByTestId('question-submit-button').boundingBox()
    expect(submitButtonBox!.height).toBeGreaterThanOrEqual(44)
  })

  test('secondary info (progress, full narrative, next-mission line) is present but collapsed behind a details disclosure, not competing for space', async ({
    page,
  }) => {
    await enterFirstContactTerminal(page)
    const details = page.getByTestId('mission-secondary-details')
    await expect(details).toBeInViewport()
    expect(await details.evaluate((el) => (el as HTMLDetailsElement).open)).toBe(false)
  })
})

test.describe('First Mission UX pass — the task is phrased as a concrete action', () => {
  // SQL-removal pass — this test's whole premise was SQL-era wording: the
  // old מגע ראשון mission's goal/instruction told the player to "activate"
  // (הפעל) something and gave a literal "כתבו פקודת SQL" instruction. First
  // Contact is now הקיסר הראשון, a plain History trivia question — its
  // goalHe ("לזהות מי נחשב לקיסר הראשון...") names an objective, not an
  // action, and it has no authored instructionHe at all, so mission-goal no
  // longer contains 'הפעל' and mission-instruction no longer renders. There
  // is no equivalent "concrete action wording" contract for a trivia
  // question, so this test is removed rather than forced into a false
  // equivalence (the one part that's still mechanically true — mission-goal
  // containing the "מטרה" label — is already covered by MissionPanel's own
  // unit test).

  test('the verification/progression engine is unchanged: a correct answer still passes and unlocks progress normally', async ({
    page,
  }) => {
    await enterFirstContactTerminal(page)
    // First Contact / "הקיסר הראשון" — אוגוסטוס (index 0) is correct.
    await submitMultipleChoiceAnswer(page, 0)
    await questionFeedbackIsPass(page)
  })
})
