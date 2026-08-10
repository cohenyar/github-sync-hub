import { expect, test } from './helpers.js'

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
  await expect(page.getByTestId('run-button')).toBeEnabled()
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
  test('the SQL input and Run button have no clipping scrollable ancestor', async ({ page }) => {
    await enterFirstContactTerminal(page)
    expect(await hasClippingScrollableAncestor(page, 'sql-input')).toBe(false)
    expect(await hasClippingScrollableAncestor(page, 'run-button')).toBe(false)
  })

  test('the mission goal and instruction have no clipping scrollable ancestor either', async ({ page }) => {
    await enterFirstContactTerminal(page)
    expect(await hasClippingScrollableAncestor(page, 'mission-goal')).toBe(false)
    expect(await hasClippingScrollableAncestor(page, 'mission-instruction')).toBe(false)
  })
})

test.describe('First Mission UX pass — the first viewport shows the actionable task', () => {
  test('title, objective, instruction, input, and Run are all visible without scrolling, on desktop', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await enterFirstContactTerminal(page)

    const viewportHeight = 800
    for (const testId of ['active-mission-title', 'mission-goal', 'mission-instruction', 'sql-input', 'run-button']) {
      const locator = page.getByTestId(testId)
      await expect(locator).toBeVisible()
      const box = await locator.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.y).toBeGreaterThanOrEqual(0)
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewportHeight)
    }
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

    for (const testId of ['mission-goal', 'mission-instruction', 'sql-input', 'run-button']) {
      const locator = page.getByTestId(testId)
      await expect(locator).toBeVisible()
      const box = await locator.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(390)
      expect(box!.y + box!.height).toBeLessThanOrEqual(844)
    }

    const runButtonBox = await page.getByTestId('run-button').boundingBox()
    expect(runButtonBox!.height).toBeGreaterThanOrEqual(44)
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
  test('the objective and instruction use the exact required wording for מגע ראשון', async ({ page }) => {
    await enterFirstContactTerminal(page)
    await expect(page.getByTestId('mission-goal')).toContainText('מטרה')
    await expect(page.getByTestId('mission-goal')).toContainText('הפעל')
    await expect(page.getByTestId('mission-instruction')).toContainText('מה עושים')
    await expect(page.getByTestId('mission-instruction')).toContainText('כתבו פקודת SQL')
  })

  test('the verification/progression engine is unchanged: a correct query still passes and unlocks progress normally', async ({
    page,
  }) => {
    await enterFirstContactTerminal(page)
    await expect(page.getByTestId('run-button')).toBeEnabled()
    await page.getByTestId('sql-input').fill('SELECT * FROM citizens;')
    await page.getByTestId('run-button').click()
    await expect(page.getByTestId('verdict-banner')).toHaveAttribute('data-verdict', 'pass')
  })
})
