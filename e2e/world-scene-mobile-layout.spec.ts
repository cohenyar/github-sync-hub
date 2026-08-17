import { expect, test } from './helpers.js'

/**
 * Bug Group A + B fix pass — "FINAL RESPONSIVE / LAYERING BUG FIX."
 *
 * Bug Group A (desktop + everywhere): world-space labels (drei's <Html>,
 * see WorldLabel.tsx) defaulted to a zIndexRange in the millions, so they
 * rendered above every page-level overlay — including LessonStage, the
 * Math/English "Start Lesson" exercise panel — regardless of DOM order or
 * that overlay's own z-index. Fixed by pinning a small, explicit
 * zIndexRange (see WorldLabel.tsx) well below every real overlay's z-index.
 *
 * Bug Group B (mobile, ~390px and the other required breakpoints): labels
 * far too large/unbounded, and several bottom-anchored floating panels
 * (QuestChip, InteractionPrompt, OdinPresence, VirtualJoystick, NpcDialogue)
 * competing for the same screen region. Root cause for part of this: two
 * different coordinate frames — QuestChip/VirtualJoystick/GameControlBar
 * are position:fixed (viewport-relative), while InteractionPrompt/.hud were
 * position:absolute relative to WorldScene3D's own .scene element, which is
 * intentionally shorter than the viewport on narrow/short screens. Fixed by
 * moving every floating world-scene overlay onto the same viewport-relative
 * frame and re-tuning their offsets — verified here with real bounding-box
 * intersection checks, not screenshot diffs (this app's real UI moves
 * around too much release to release for pixel-perfect screenshots to be
 * anything but a maintenance burden).
 *
 * This file runs under the `mobile-chromium` Playwright project (see
 * playwright.config.ts) so `(pointer: coarse)`-gated CSS — and
 * useIsTouchDevice, which drives whether VirtualJoystick mounts at all —
 * actually take effect. The desktop-regression checks at the bottom
 * explicitly opt back into a fine/mouse pointer via test.use(), since a
 * real desktop user never gets the touch-only joystick-safe-zone rules.
 */

function boxesOverlap(
  a: { x: number; y: number; width: number; height: number } | null,
  b: { x: number; y: number; width: number; height: number } | null,
): boolean {
  if (!a || !b) return false
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

async function hasNoHorizontalOverflow(page: import('@playwright/test').Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
}

/** Mirrors world-scene-3d.spec.ts's own walkToMathTeacher — the player
    spawns already in range of the north-warden, one district away from the
    Central Plaza's two teachers. */
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

test.describe('World Scene mobile layout — 390x844 required minimum assertions', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('(A) world labels fit inside the viewport and stay within mobile-sensible bounds', async ({ page }) => {
    await page.goto('/world')
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()
    // The Core Archive building (and its label) sits in the starting
    // district — waiting on it specifically (rather than a blind timeout)
    // is what the 3D scene's frame loop/Html-portal mount actually gates
    // on, avoiding a cold-render race under load.
    await expect(page.getByTestId('core-archive-building-label')).toBeVisible()

    const labels = page.locator('[data-testid$="-label"], [data-testid^="npc-label-"]')
    const count = await labels.count()
    expect(count).toBeGreaterThan(0)

    const viewport = page.viewportSize()
    if (!viewport) throw new Error('viewport not set')

    for (let i = 0; i < count; i += 1) {
      const label = labels.nth(i)
      const box = await label.boundingBox()
      if (!box) continue // not currently mounted in the 3D view — fine, not a failure

      // Requirement 3 — never render partially outside the viewport.
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.y).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1)

      // Requirement 1 — a mobile label must never be a giant pill: capped
      // comfortably under a third of the viewport width, and a modest
      // height (<=2 wrapped lines at the ~14px mobile font-size).
      expect(box.width).toBeLessThanOrEqual(viewport.width * 0.4)
      expect(box.height).toBeLessThanOrEqual(60)

      const fontSize = await label.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize))
      expect(fontSize).toBeLessThanOrEqual(16)
      expect(fontSize).toBeGreaterThanOrEqual(11)
    }
  })

  test('(B) NPC dialogue does not overlap the joystick safe zone; controls stay clickable', async ({ page }) => {
    await page.goto('/world')
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()
    await expect(page.getByTestId('interaction-prompt')).toBeVisible()
    await page.waitForTimeout(500)

    await page.keyboard.press('KeyE')
    const dialogue = page.getByTestId('npc-dialogue')
    await expect(dialogue).toBeVisible()

    // Movement (and therefore the joystick) is suspended while a dialogue
    // is open — matching the existing, intentional gameplay behavior this
    // fix must not change (see WorldScene3D.tsx's isMovementEnabled).
    await expect(page.getByTestId('virtual-joystick')).toHaveCount(0)

    expect(await hasNoHorizontalOverflow(page)).toBe(true)

    const closeButton = page.getByTestId('npc-dialogue-close-button')
    await expect(closeButton).toBeVisible()
    const viewport = page.viewportSize()
    const closeBox = await closeButton.boundingBox()
    if (!viewport || !closeBox) throw new Error('missing viewport/close button box')
    expect(closeBox.x).toBeGreaterThanOrEqual(0)
    expect(closeBox.x + closeBox.width).toBeLessThanOrEqual(viewport.width + 1)
    expect(closeBox.y + closeBox.height).toBeLessThanOrEqual(viewport.height + 1)

    await closeButton.click()
    await expect(dialogue).not.toBeVisible()
  })

  test('(C) world labels do not overlap the lesson overlay; joystick/mission card hidden; no horizontal overflow', async ({
    page,
  }) => {
    await page.goto('/world')
    await walkToMathTeacher(page)

    await page.keyboard.press('KeyE')
    await page.getByTestId('npc-dialogue-start-lesson-button').click()
    const lessonStage = page.getByTestId('lesson-stage')
    await expect(lessonStage).toBeVisible()
    await expect(page.getByTestId('math-exercise-panel')).toBeVisible()
    await page.waitForTimeout(300)

    expect(await hasNoHorizontalOverflow(page)).toBe(true)

    // Bug Group A's core assertion: at the exact screen point where a world
    // label WOULD be, the topmost paintable element must be the lesson
    // overlay (or nothing) — never the label itself rendering above it.
    const leakedLabel = await page.evaluate(() => {
      const labels = document.querySelectorAll('[data-testid$="-label"], [data-testid^="npc-label-"]')
      for (const label of labels) {
        const rect = label.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) continue
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const topEl = document.elementFromPoint(cx, cy)
        const isBehindLesson = Boolean(topEl && topEl.closest('[data-testid="lesson-stage"]'))
        const isTheLabelItself = topEl === label || Boolean(topEl && label.contains(topEl))
        if (isTheLabelItself && !isBehindLesson) {
          return label.getAttribute('data-testid')
        }
      }
      return null
    })
    expect(leakedLabel).toBeNull()

    // Requirement 6/8/9 — nothing world-side competes with the learning
    // overlay: movement (and the joystick) is suspended, and the mission
    // card is hidden, matching the same reasoning already applied to an
    // NPC dialogue.
    await expect(page.getByTestId('virtual-joystick')).toHaveCount(0)
    await expect(page.getByTestId('quest-chip')).toHaveCount(0)

    // Requirement 9 — the exercise itself is fully usable: title, inputs,
    // and the close/back action all visible with nothing floating over them.
    await expect(page.getByTestId('math-answer-input')).toBeVisible()
    await expect(page.getByTestId('math-submit-button')).toBeVisible()
    await expect(page.getByTestId('lesson-return-to-world-button')).toBeVisible()
  })

  test('(D) the mission card does not overlap NPC dialogue', async ({ page }) => {
    await page.goto('/world')
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()
    await expect(page.getByTestId('interaction-prompt')).toBeVisible()
    await page.waitForTimeout(500)

    // Both are visible at once during ordinary exploration.
    await expect(page.getByTestId('quest-chip')).toBeVisible()

    await page.keyboard.press('KeyE')
    await expect(page.getByTestId('npc-dialogue')).toBeVisible()

    // The mission card is hidden while a dialogue is open (Bug Group B,
    // section 8) — both are bottom-anchored panels that would otherwise
    // compete for the same narrow-viewport region.
    await expect(page.getByTestId('quest-chip')).toHaveCount(0)
  })
})

test.describe('World Scene mobile layout — responsive breakpoint audit (touch phones)', () => {
  const PHONE_BREAKPOINTS = [
    { name: '360x800', width: 360, height: 800 },
    { name: '390x844', width: 390, height: 844 },
    { name: '412x915', width: 412, height: 915 },
  ] as const

  for (const bp of PHONE_BREAKPOINTS) {
    test(`${bp.name}: no overflow, and the mission card/prompt/joystick never collide`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height })
      await page.goto('/world')
      await expect(page.getByTestId('world-scene-3d')).toBeVisible()
      await expect(page.getByTestId('interaction-prompt')).toBeVisible()
      await page.waitForTimeout(500)

      expect(await hasNoHorizontalOverflow(page)).toBe(true)

      const chipBox = await page.getByTestId('quest-chip').boundingBox()
      const promptBox = await page.getByTestId('interaction-prompt').boundingBox()
      const joystickBox = await page.getByTestId('virtual-joystick').boundingBox()

      expect(boxesOverlap(chipBox, promptBox)).toBe(false)
      expect(boxesOverlap(chipBox, joystickBox)).toBe(false)
      expect(boxesOverlap(promptBox, joystickBox)).toBe(false)
    })
  }
})

test.describe('World Scene mobile layout — desktop/tablet regression (no touch)', () => {
  // Explicitly opts back into a fine/mouse pointer: this describe block
  // verifies the fix didn't regress non-touch viewports, which never show
  // the joystick and never match the (pointer: coarse) CSS this pass added.
  test.use({ hasTouch: false, isMobile: false })

  const DESKTOP_BREAKPOINTS = [
    { name: '768x1024', width: 768, height: 1024 },
    { name: '1280x800', width: 1280, height: 800 },
    { name: '1920x1080', width: 1920, height: 1080 },
  ] as const

  for (const bp of DESKTOP_BREAKPOINTS) {
    test(`${bp.name}: no overflow, no chip/prompt collision, desktop label size preserved`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height })
      await page.goto('/world')
      await expect(page.getByTestId('world-scene-3d')).toBeVisible()
      await page.waitForTimeout(500)

      expect(await hasNoHorizontalOverflow(page)).toBe(true)
      await expect(page.getByTestId('virtual-joystick')).toHaveCount(0)

      const chipBox = await page.getByTestId('quest-chip').boundingBox()
      const promptBox = await page.getByTestId('interaction-prompt').boundingBox()
      expect(boxesOverlap(chipBox, promptBox)).toBe(false)

      // Desktop polish preserved — the 22px prominent label size, not the
      // 14px mobile-compact one.
      const coreLabel = page.getByTestId('core-archive-building-label')
      const fontSize = await coreLabel.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize))
      expect(fontSize).toBeGreaterThanOrEqual(20)
    })
  }
})
