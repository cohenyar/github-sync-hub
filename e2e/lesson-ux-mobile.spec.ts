import { expect, test } from './helpers.js'

/**
 * Lesson UX bug-fix pass — coverage for two independent fixes verified
 * together because both came out of the same mobile-lesson-UX audit:
 *
 * 1. LessonStage's "unreachable return button" fix (see LessonStage.tsx and
 *    LessonStage.module.css): the header housing lesson-return-to-world-
 *    button is now a fixed toolbar outside the single scroll region
 *    (.body), so the button is reachable immediately on any viewport,
 *    including a short/narrow phone screen, with zero scrolling. This file
 *    proves that with a real bounding-box check against the viewport, not a
 *    screenshot diff, and also proves the button still safely returns to
 *    the world mid-exercise (before answering) without marking the lesson
 *    complete — mirroring the exact "still offers תרגל/י שוב only after a
 *    real pass" pattern world-scene-3d.spec.ts already uses.
 *
 * 2. QuestionAnswerPanel's option-row box-sizing fix (see
 *    QuestionAnswerPanel.module.css's .option comment): a <label> doesn't
 *    get box-sizing: border-box for free, so min-height: 44px used to
 *    inflate every option row to ~62px regardless of how short the text
 *    was. This file walks into the Records Core's first mission (First
 *    Contact — a short multiple-choice question, see firstContact.ts) and
 *    measures the real rendered row heights at phone widths.
 *
 * Runs under the `mobile-chromium` Playwright project (see
 * playwright.config.ts) for touch-emulated phone breakpoints, the same
 * reasoning world-scene-mobile-layout.spec.ts documents — this file's name
 * is listed in both that project's testMatch and the desktop `chromium`
 * project's testIgnore, so it never double-matches (see that config's own
 * comments for why both regexes have to move together).
 */

async function hasNoHorizontalOverflow(page: import('@playwright/test').Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
}

/** Mirrors world-scene-3d.spec.ts's own walkToMathTeacher exactly. */
async function walkToMathTeacher(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.getByTestId('world-scene-3d')).toBeVisible()
  await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'north-warden')
  await page.waitForTimeout(500)
  await page.keyboard.down('KeyS')
  await page.waitForTimeout(600)
  await page.keyboard.up('KeyS')
  await page.keyboard.down('KeyA')
  await page.waitForTimeout(900)
  await page.keyboard.up('KeyA')
  await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'math-teacher')
}

/** Mirrors world-scene-3d.spec.ts's own walkToEnglishTeacher exactly. */
async function walkToEnglishTeacher(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.getByTestId('world-scene-3d')).toBeVisible()
  await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'north-warden')
  await page.waitForTimeout(500)
  await page.keyboard.down('KeyS')
  await page.waitForTimeout(600)
  await page.keyboard.up('KeyS')
  await page.keyboard.down('KeyD')
  await page.waitForTimeout(800)
  await page.keyboard.up('KeyD')
  await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'english-teacher')
}

/**
 * Mirrors the canonical loop test's outbound walk in world-scene-3d.spec.ts:
 * from spawn (0, -9), holding KeyS for 900ms lands within interaction range
 * of the Core, with it as the nearest interactable. This helper's first
 * action IS the walk (no prior dialogue open/close to settle the frame
 * loop), so — same as walkToMathTeacher/walkToEnglishTeacher above — it
 * adds the same explicit settle margin before the first held key.
 */
async function walkToRecordsCore(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.getByTestId('world-scene-3d')).toBeVisible()
  await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'north-warden')
  await page.waitForTimeout(500)
  await page.keyboard.down('KeyS')
  await page.waitForTimeout(900)
  await page.keyboard.up('KeyS')
  await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'core')
}

test.describe('Lesson return-to-world button — mobile (390x844, touch)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('starting the English lesson shows the return button fully within the viewport, with no scrolling required', async ({
    page,
  }) => {
    await page.goto('/world')
    await walkToEnglishTeacher(page)
    await page.keyboard.press('KeyE')
    await page.getByTestId('npc-dialogue-start-lesson-button').click()

    const lessonStage = page.getByTestId('lesson-stage')
    await expect(lessonStage).toBeVisible()

    // Asserted immediately after the lesson stage appears — no
    // page.mouse.wheel/scroll call anywhere before this check.
    const returnButton = page.getByTestId('lesson-return-to-world-button')
    await expect(returnButton).toBeVisible()

    const viewport = page.viewportSize()
    if (!viewport) throw new Error('viewport not set')
    const box = await returnButton.boundingBox()
    if (!box) throw new Error('missing return button box')
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1)
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1)
  })

  // Uses the math teacher, not English, for the return-then-reopen check
  // below: walkToEnglishTeacher's final KeyD hold is already documented
  // (Batch 3A.5, see the helper's own comment) as sitting close enough to
  // the East district's boundary that a few extra frames of movement
  // easing can tip the avatar's *district* reading over to East right
  // after the walk — which would silently drop english-teacher out of
  // getVisibleNpcs (NPCs are filtered by current district) and make a
  // same-spot re-interact flaky. world-scene-3d.spec.ts's own "return, then
  // reopen to prove no completion" tests (e.g. "after completing the Math
  // lesson, talking to the math teacher again...") always use the math
  // teacher for exactly this kind of round-trip; this test mirrors that
  // same proven-stable pattern instead of introducing a new, flakier one.
  // Item 1 above still covers English specifically, per its own
  // no-scrolling requirement, but never needs a return-then-reopen step.
  test('clicking it mid-exercise (before answering) returns to the world and does not mark the lesson completed', async ({
    page,
  }) => {
    await page.goto('/world')
    await walkToMathTeacher(page)
    await page.keyboard.press('KeyE')

    // Before starting: no return button mounted anywhere yet.
    await expect(page.getByTestId('lesson-return-to-world-button')).toHaveCount(0)

    await page.getByTestId('npc-dialogue-start-lesson-button').click()
    await expect(page.getByTestId('lesson-stage')).toBeVisible()
    await expect(page.getByTestId('math-exercise-panel')).toBeVisible()

    // Exactly one return button exists while the lesson overlay is open —
    // not just visible, but a single DOM node.
    await expect(page.getByTestId('lesson-return-to-world-button')).toHaveCount(1)

    // Mid-exercise: no answer typed into the math input yet.
    await page.getByTestId('lesson-return-to-world-button').click()
    await expect(page.getByTestId('lesson-stage')).toHaveCount(0)
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    // No return button lingers once back in the world.
    await expect(page.getByTestId('lesson-return-to-world-button')).toHaveCount(0)

    // Re-opening the dialogue still offers the fresh-start wording, not the
    // "תרגל/י שוב" replay wording — the same signal world-scene-3d.spec.ts's
    // own replay tests use to prove a lesson was (or wasn't) completed.
    await page.keyboard.press('KeyE')
    const startButton = page.getByTestId('npc-dialogue-start-lesson-button')
    await expect(startButton).toContainText('התחל/התחילי שיעור')
    await expect(startButton).not.toContainText('תרגל/י שוב')
  })
})

test.describe('Lesson return-to-world button — desktop (1280x800, no touch)', () => {
  // deviceScaleFactor: 1 overrides the mobile-chromium project's inherited
  // Pixel 7 DPR (~2.6x) — this describe block is emulating a real desktop
  // browser (which is DPR 1 in practice), and leaving the high mobile DPR
  // in place makes the 3D canvas render at several times the pixel count
  // for no reason, which measurably slowed every click's actionability
  // check in a throwaway timing run (~27s total vs. ~11s with this set) —
  // enough to risk tipping over this suite's default 30s per-test timeout
  // under any extra system load, the exact "resource contention flakiness"
  // class other specs in this repo already call out.
  test.use({ viewport: { width: 1280, height: 800 }, hasTouch: false, isMobile: false, deviceScaleFactor: 1 })

  test('button visible, click returns to the world safely, no regression', async ({ page }) => {
    await page.goto('/world')
    await walkToMathTeacher(page)
    await page.keyboard.press('KeyE')
    await page.getByTestId('npc-dialogue-start-lesson-button').click()

    const lessonStage = page.getByTestId('lesson-stage')
    await expect(lessonStage).toBeVisible()

    const returnButton = page.getByTestId('lesson-return-to-world-button')
    await expect(returnButton).toBeVisible()
    await expect(returnButton).toHaveCount(1)

    const viewport = page.viewportSize()
    if (!viewport) throw new Error('viewport not set')
    const box = await returnButton.boundingBox()
    if (!box) throw new Error('missing return button box')
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1)
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1)

    await returnButton.click()
    await expect(lessonStage).toHaveCount(0)
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()
    await expect(page.getByTestId('lesson-return-to-world-button')).toHaveCount(0)

    // Not marked completed here either — same signal as the mobile case.
    await page.keyboard.press('KeyE')
    const startButton = page.getByTestId('npc-dialogue-start-lesson-button')
    await expect(startButton).toContainText('התחל/התחילי שיעור')
    await expect(startButton).not.toContainText('תרגל/י שוב')
  })
})

test.describe('QuestionAnswerPanel mobile audit — Records Core (first mission)', () => {
  const PHONE_BREAKPOINTS = [
    { name: '360x800', width: 360, height: 800 },
    { name: '390x844', width: 390, height: 844 },
    { name: '412x915', width: 412, height: 915 },
  ] as const

  // Measured via a throwaway Playwright run against the real .option fix
  // (box-sizing: border-box, min-height: 44px, see QuestionAnswerPanel
  // .module.css) at all three breakpoints below: First Contact's four
  // short Hebrew options ("אוגוסטוס"/"נירון"/"יוליוס קיסר"/"טראיאנוס") each
  // render at 45px. The cap allows headroom over that measured value while
  // still catching a regression back toward the pre-fix ~62px.
  const MAX_OPTION_ROW_HEIGHT = 52

  for (const bp of PHONE_BREAKPOINTS) {
    test(`${bp.name}: question option rows stay compact, with no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height })
      await page.goto('/world')
      await walkToRecordsCore(page)
      await page.keyboard.press('KeyE')
      await expect(page.getByTestId('terminal-view')).toBeVisible()
      await expect(page.getByTestId('question-panel')).toBeVisible()

      expect(await hasNoHorizontalOverflow(page)).toBe(true)

      const options = page.getByTestId(/^question-option-\d+$/)
      const count = await options.count()
      expect(count).toBeGreaterThan(0)

      for (let i = 0; i < count; i += 1) {
        const box = await page.getByTestId(`question-option-${i}`).boundingBox()
        if (!box) throw new Error(`missing bounding box for question-option-${i}`)
        expect(box.height).toBeLessThanOrEqual(MAX_OPTION_ROW_HEIGHT)
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(bp.width + 1)
      }
    })
  }
})
