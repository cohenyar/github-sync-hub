import { expect, runSql, test, verdictIsFail, verdictIsPass, waitForMissionReady } from './helpers.js'

test.describe('Odin narrates real gameplay events', () => {
  test('greets the player once ready and shows the deterministic/offline status', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.goto('/world')
    await waitForMissionReady(page)

    await expect(page.getByTestId('odin-panel')).toBeVisible()
    await expect(page.getByText('סטטוס: דטרמיניסטי / לא מקוון' /* he.odinStatusLabel */)).toBeVisible()
    // Playtest fix pass (issue 6B) — mission-started now names the actual
    // mission (First Contact, on a fresh game) instead of a static line.
    await expect(page.getByTestId('odin-latest-message')).toHaveText('משימה חדשה מתחילה: מגע ראשון. אני מקשיב.')

    expect(errors).toEqual([])
  })

  test('comments on the restored signal, then hints at District Ties unlocking, with no console errors', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.goto('/world')
    await waitForMissionReady(page)

    await runSql(page, 'SELECT * FROM citizens;')
    await verdictIsPass(page)

    await expect(page.getByText('האות יציב כעת. מרידיאן שוב רואה את תושביה.')).toBeVisible()

    // District Ties unlocking is a few React render cycles downstream of the
    // Pass verdict (Progression update -> unlock-check effect -> Odin
    // update), so give it more room than the default timeout, especially
    // under parallel test load sharing one dev server. It lands somewhere in
    // the Odin panel (latest message or history — First Contact's completion
    // also unlocks an NPC via a separate ContentUnlocked event, so which of
    // the two ends up "latest" isn't guaranteed, only that both appear).
    await expect(
      page.getByTestId('odin-panel').getByText('העיר מתחילה להשיב. אפשר כעת להתחקות אחר קשרי המחוז.'),
    ).toBeVisible({ timeout: 10_000 })

    const history = page.getByTestId('odin-history')
    await expect(history).toContainText('האות יציב כעת. מרידיאן שוב רואה את תושביה.')

    expect(errors).toEqual([])
  })

  test('reacts to a failing query, distinguishing a mismatch from a SQL error', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.goto('/world')
    await waitForMissionReady(page)

    await runSql(page, 'SELECT * FROM citizens WHERE id = 1;')
    await verdictIsFail(page)
    await expect(
      page.getByText('קרוב, אך הרשומות עדיין לא תואמות. הבט/הביטי שוב במה שהשאילתה מחזירה.'),
    ).toBeVisible()

    await runSql(page, 'NOT VALID SQL')
    await expect(page.getByTestId('sql-error-message')).toBeVisible()
    // Playtest fix pass (issue 6A) — sql.js's real message for this input is
    // `near "NOT": syntax error`, classified 'syntax', so Odin now picks the
    // specific syntax-error reaction instead of the old generic one.
    await expect(
      page.getByText('יש שגיאת תחביר בשאילתה — בדוק/י אם חסר פסיק, מרכאות או סוגריים.'),
    ).toBeVisible()

    expect(errors).toEqual([])
  })

  test('narrates a mission-specific hint for a mismatched query on District Ties', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.goto('/world')
    await waitForMissionReady(page)

    await runSql(page, 'SELECT * FROM citizens;')
    await verdictIsPass(page)

    await page.getByTestId('mission-option-district-ties').click()
    await waitForMissionReady(page)

    await runSql(page, "SELECT * FROM citizens WHERE district = 'south';")
    await verdictIsFail(page)
    await expect(
      page.getByText('בדוק/י את ערך המחוז בתנאי ה-WHERE שלך — הוא צריך להתאים בדיוק לצפון.'),
    ).toBeVisible()

    expect(errors).toEqual([])
  })
})
