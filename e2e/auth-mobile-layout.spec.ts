import { expect, test } from './helpers.js'

/**
 * Mobile UX pass — H2: the signed-out AuthButton row (guest badge + Google
 * button + /auth link + email toggle) overflowed the corner HUD on narrow
 * viewports, since AuthButton.module.css's .wrap was an unwrapped inline-flex
 * row with no width-based media query. Fixed by collapsing those three
 * actions behind one compact 44px trigger below 480px (see
 * .mobileMenuTrigger/.signedOutActions in AuthButton.module.css) — the guest
 * badge and trigger stay directly visible; the rest reveal in a popover on
 * tap, capped to the viewport width the same way the account menu already
 * is (.menu's max-width: calc(100vw - 24px)).
 *
 * These specs run under the default (desktop) Chromium project like every
 * other file in this suite — every check here sets its own explicit
 * viewport, so which project runs it doesn't change what's being verified:
 * page.click() dispatches the same pointer events a real tap does, and this
 * fix's CSS only branches on width, never on touch capability.
 */

const NARROW_WIDTHS = [320, 375, 390, 412] as const
// devices['Pixel 7'].viewport, per @playwright/test — matched by literal
// dimensions rather than importing the device descriptor, since every test
// here already drives its own viewport instead of relying on a project's.
const PIXEL_7_VIEWPORT = { width: 412, height: 915 }

async function hasNoHorizontalOverflow(page: import('@playwright/test').Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
}

function boxesOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

test.describe('AuthButton mobile layout (H2 fix) — signed-out state', () => {
  for (const width of NARROW_WIDTHS) {
    test(`document width never exceeds the ${width}px viewport, collapsed and opened`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/world')

      expect(await hasNoHorizontalOverflow(page)).toBe(true)

      await page.getByTestId('auth-mobile-menu-trigger').click()
      expect(await hasNoHorizontalOverflow(page)).toBe(true)
    })
  }

  test('collapses behind one compact trigger below the breakpoint, hiding the individual actions until tapped', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/world')

    const trigger = page.getByTestId('auth-mobile-menu-trigger')
    await expect(trigger).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    // Collapsed by default — the three actions exist but are not shown.
    await expect(page.getByTestId('google-sign-in-button')).not.toBeVisible()
    await expect(page.getByTestId('auth-page-link')).not.toBeVisible()
    await expect(page.getByTestId('email-auth-toggle-button')).not.toBeVisible()
    // The guest badge is never collapsed — it's a status, not an action.
    await expect(page.getByTestId('guest-mode-badge')).toBeVisible()

    const triggerBox = (await trigger.boundingBox())!
    expect(triggerBox.width).toBeGreaterThanOrEqual(44)
    expect(triggerBox.height).toBeGreaterThanOrEqual(44)
  })

  test('every auth action becomes visible and reachable once the trigger is opened', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto('/world')

    await page.getByTestId('auth-mobile-menu-trigger').click()
    await expect(page.getByTestId('auth-mobile-menu-trigger')).toHaveAttribute('aria-expanded', 'true')

    const google = page.getByTestId('google-sign-in-button')
    const authLink = page.getByTestId('auth-page-link')
    const emailToggle = page.getByTestId('email-auth-toggle-button')
    await expect(google).toBeVisible()
    await expect(authLink).toBeVisible()
    await expect(emailToggle).toBeVisible()

    // Touch targets: the two buttons meet 44px; the plain text link is an
    // inline affordance next to them (same as desktop), not a primary CTA.
    expect((await google.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    expect((await emailToggle.boundingBox())!.height).toBeGreaterThanOrEqual(44)

    // Nothing revealed sits off-screen at the narrowest required width.
    for (const control of [google, authLink, emailToggle]) {
      const box = (await control.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(320)
    }

    // The email toggle still opens the real sign-in/sign-up form, nested
    // inside the same popover — auth logic itself is untouched by this fix.
    await emailToggle.click()
    await expect(page.getByTestId('email-password-form')).toBeVisible()
    const formBox = (await page.getByTestId('email-password-form').boundingBox())!
    expect(formBox.x).toBeGreaterThanOrEqual(0)
    expect(formBox.x + formBox.width).toBeLessThanOrEqual(320)
  })

  test('does not overlap the settings, archive, or HUD controls sharing the same corner', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto('/world')

    const settingsBox = (await page.getByTestId('settings-menu-button').boundingBox())!
    const archiveBox = (await page.getByTestId('archive-pages-toggle-button').boundingBox())!
    const triggerBox = (await page.getByTestId('auth-mobile-menu-trigger').boundingBox())!

    expect(boxesOverlap(triggerBox, settingsBox)).toBe(false)
    expect(boxesOverlap(triggerBox, archiveBox)).toBe(false)

    await page.getByTestId('auth-mobile-menu-trigger').click()
    const googleBox = (await page.getByTestId('google-sign-in-button').boundingBox())!
    expect(boxesOverlap(googleBox, settingsBox)).toBe(false)
    expect(boxesOverlap(googleBox, archiveBox)).toBe(false)
  })

  test('RTL is preserved', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto('/world')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await page.getByTestId('auth-mobile-menu-trigger').click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  })

  test('Pixel 7 viewport: collapsed by default, fully reachable and non-overlapping once opened', async ({ page }) => {
    await page.setViewportSize(PIXEL_7_VIEWPORT)
    await page.goto('/world')

    expect(await hasNoHorizontalOverflow(page)).toBe(true)
    await expect(page.getByTestId('auth-mobile-menu-trigger')).toBeVisible()
    await expect(page.getByTestId('google-sign-in-button')).not.toBeVisible()

    await page.getByTestId('auth-mobile-menu-trigger').click()
    expect(await hasNoHorizontalOverflow(page)).toBe(true)

    const google = page.getByTestId('google-sign-in-button')
    await expect(google).toBeVisible()
    const googleBox = (await google.boundingBox())!
    const settingsBox = (await page.getByTestId('settings-menu-button').boundingBox())!
    expect(boxesOverlap(googleBox, settingsBox)).toBe(false)
    expect(googleBox.x + googleBox.width).toBeLessThanOrEqual(PIXEL_7_VIEWPORT.width)
  })

  test('desktop layout is unchanged: the full row shows inline, with no mobile trigger', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/world')

    await expect(page.getByTestId('guest-mode-badge')).toBeVisible()
    await expect(page.getByTestId('google-sign-in-button')).toBeVisible()
    await expect(page.getByTestId('auth-page-link')).toBeVisible()
    await expect(page.getByTestId('email-auth-toggle-button')).toBeVisible()
    await expect(page.getByTestId('auth-mobile-menu-trigger')).not.toBeVisible()
    expect(await hasNoHorizontalOverflow(page)).toBe(true)
  })
})

test.describe('AuthButton mobile layout (H2 fix) — mobile controls stay usable alongside it', () => {
  test('the virtual joystick and interaction prompt are unaffected by the collapsed auth trigger', async ({ page }) => {
    await page.setViewportSize(PIXEL_7_VIEWPORT)
    await page.goto('/world')

    // Both share the same screen; neither should overlap the other's
    // touch target (the joystick lives at the opposite, bottom corner).
    const triggerBox = (await page.getByTestId('auth-mobile-menu-trigger').boundingBox())!
    const joystick = page.getByTestId('virtual-joystick')
    if (await joystick.isVisible().catch(() => false)) {
      const joystickBox = (await joystick.boundingBox())!
      expect(boxesOverlap(triggerBox, joystickBox)).toBe(false)
    }
  })
})
