import {
  expect,
  questionFeedbackIsFail,
  questionFeedbackIsPass,
  submitMultipleChoiceAnswer,
  test,
  waitForQuestionPanel,
} from './helpers.js'

test.describe('Odin narrates real gameplay events', () => {
  test('greets the player once ready and shows the deterministic/offline status', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.goto('/world')
    await waitForQuestionPanel(page)

    await expect(page.getByTestId('odin-panel')).toBeVisible()
    await expect(page.getByText('סטטוס: דטרמיניסטי / לא מקוון' /* he.odinStatusLabel */)).toBeVisible()
    // SQL-removal pass — a question mission has no async "mission database"
    // step, so GameApp deliberately excludes the very first render from
    // MissionStarted detection (see isFirstMissionStartRenderRef in
    // GameApp.tsx): without that exclusion, MissionStarted would fire in the
    // same tick as, and overwrite, WorldEntered/SessionResumed's own boot
    // greeting before a player could ever see it. So unlike the old SQL-era
    // behavior, no mission-started narration is expected here at boot — see
    // the mid-session mission-switch test below for where it does fire.
    await expect(page.getByTestId('odin-latest-message')).not.toContainText('משימה חדשה מתחילה')

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
    await waitForQuestionPanel(page)

    // First Contact / "הקיסר הראשון" — אוגוסטוס (index 0) is correct.
    await submitMultipleChoiceAnswer(page, 0)
    await questionFeedbackIsPass(page)

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

  test('does not narrate a mission completion or a QueryFailed-style reaction for a wrong answer', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.goto('/world')
    await waitForQuestionPanel(page)

    // SQL-removal pass — a question mission has no equivalent to the old
    // QueryFailed row-mismatch/SQL-error distinction: a wrong answer plays
    // the failure feedback in-panel, but Odin narrates nothing extra for it.
    // נירון (index 1) is a distractor, not the correct answer.
    await submitMultipleChoiceAnswer(page, 1)
    await questionFeedbackIsFail(page)

    await expect(page.getByText('האות יציב כעת. מרידיאן שוב רואה את תושביה.')).not.toBeVisible()
    await expect(
      page.getByText('קרוב, אך הרשומות עדיין לא תואמות. הבט/הביטי שוב במה שהשאילתה מחזירה.'),
    ).not.toBeVisible()

    expect(errors).toEqual([])
  })

  test('narrates a new mission starting once switching to District Ties mid-session', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.goto('/world')
    await waitForQuestionPanel(page)

    await submitMultipleChoiceAnswer(page, 0)
    await questionFeedbackIsPass(page)

    await page.getByTestId('mission-option-district-ties').click()
    await waitForQuestionPanel(page)

    // Unlike the boot case above, MissionStarted fires correctly for a
    // genuine mid-session mission switch, interpolating District Ties' own
    // new title (see GameApp.tsx's isFirstMissionStartRenderRef comment).
    await expect(page.getByTestId('odin-latest-message')).toHaveText('משימה חדשה מתחילה: תרגום: ספרייה. אני מקשיב.')

    expect(errors).toEqual([])
  })
})
