import { expect, questionFeedbackIsPass, submitMultipleChoiceAnswer, test, waitForQuestionPanel } from './helpers.js'

/**
 * Manual playtest fix pass — real-browser coverage for issues 2 (Mera/
 * Records Hub), 3 (Priya), 4 (East district/Tomas Reyeth), 5 (mission
 * screen copy), and 6C (Ask Odin). The walks to Mera reuse the timings
 * world-scene-3d.spec.ts's canonical loop test already relies on
 * (movement speed 7, interaction radius 4.5); the walks to Priya and
 * Tomas/East (no existing e2e file had ever gone that far) were tuned via
 * a live interactive session, not guessed — see the comments at each.
 * That live session also caught a real bug this file's own initial
 * version couldn't have: Tomas Reyeth was first wired to his own
 * district's stability *stat* (matching every other district-flavor NPC),
 * but that stat never changes anywhere in the campaign (initialDistricts.ts
 * starts/keeps East at 75, always 'thriving'), so the new dialogue was
 * dead content no playthrough could ever reach — only visible by actually
 * walking to him in a real browser, not from unit tests exercising the
 * dialogue function directly with a hand-built state object. Fixed by
 * linking him to full-signal (the mission that actually gates the East
 * course) instead — see npcDialogueState.ts/dialogueContent.ts.
 */
test.describe('Records Hub identity and Mera\'s dialogue (issue 2)', () => {
  test('the Records Hub building shows its own name on approach, and Mera explains the Hub is open but her signal can\'t find residents', async ({
    page,
  }) => {
    await page.goto('/world')
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    const prompt = page.getByTestId('interaction-prompt')
    await expect(prompt).toHaveAttribute('data-interactable-id', 'north-warden')

    // The same walk world-scene-3d.spec.ts's canonical test uses to reach
    // the Core, then continue past it to Mera Solt specifically.
    await page.keyboard.down('KeyS')
    await page.waitForTimeout(900)
    await page.keyboard.up('KeyS')
    await expect(prompt).toHaveAttribute('data-interactable-id', 'core')

    // The Records Hub building's own floating name label — previously the
    // building carried no name at all (see CoreArchiveBuilding.tsx).
    await expect(page.getByTestId('core-archive-building-label')).toBeVisible()
    await expect(page.getByTestId('core-archive-building-label')).toContainText('מוקד הרשומות')

    await page.keyboard.down('KeyS')
    await page.waitForTimeout(650)
    await page.keyboard.up('KeyS')
    await page.keyboard.down('KeyA')
    await page.waitForTimeout(400)
    await page.keyboard.up('KeyA')
    await expect(prompt).toHaveAttribute('data-interactable-id', 'archivist-mera')

    await page.keyboard.press('KeyE')
    const dialogue = page.getByTestId('npc-dialogue')
    await expect(dialogue).toBeVisible()
    await expect(dialogue).toHaveAttribute('data-npc-id', 'archivist-mera')

    const missionContext = page.getByTestId('npc-dialogue-mission-context')
    await expect(missionContext).toBeVisible()
    await expect(missionContext).toContainText('פתוח')
    await expect(missionContext).not.toContainText('נעול')
    await expect(missionContext).toContainText('ליבת האיתור')
  })
})

test.describe('Priya Nandall welcomes the player into Math from the very start (Meridian 2.0 open-world pass)', () => {
  test('greets with an available, welcoming line and hands off her mission — no "not yet"/cross-subject prerequisite, on a brand new game', async ({ page }) => {
    await page.goto('/world')
    const prompt = page.getByTestId('interaction-prompt')
    await expect(prompt).toHaveAttribute('data-interactable-id', 'north-warden')

    // Tuned via a live interactive session (no prior e2e file walked this
    // far): west first to clear the Records Core building's own collider
    // (CORE_ARCHIVE_COLLIDER, centered near x=0), then south to Priya.
    await page.keyboard.down('KeyA')
    await page.waitForTimeout(500)
    await page.keyboard.up('KeyA')
    await page.keyboard.down('KeyS')
    await page.waitForTimeout(3000)
    await page.keyboard.up('KeyS')
    await expect(prompt).toHaveAttribute('data-interactable-id', 'south-organizer')

    await page.keyboard.press('KeyE')
    const dialogue = page.getByTestId('npc-dialogue')
    await expect(dialogue).toBeVisible()
    await expect(dialogue).toHaveAttribute('data-npc-id', 'south-organizer')
    // South Stability (Math) is always unlocked from the start — Priya
    // hands off her mission immediately, with no "not yet"/prerequisite
    // framing naming another subject.
    await expect(dialogue).toContainText('דוחות חמורים מהדרום')
    await expect(dialogue).not.toContainText('קשרי המחוזות')
    await expect(dialogue).not.toContainText('עדיין לא')
  })
})

test.describe('Tomas Reyeth and the East district open per-subject, not behind an unrelated subject (Meridian 2.0)', () => {
  test('completing History alone (no English/Math) already opens East and drops the old cross-subject blame', async ({
    page,
  }) => {
    await page.goto('/world')
    const prompt = page.getByTestId('interaction-prompt')
    await expect(prompt).toHaveAttribute('data-interactable-id', 'north-warden')

    // Complete First Contact (History) only — east-broker is hidden until then.
    await page.keyboard.down('KeyS')
    await page.waitForTimeout(900)
    await page.keyboard.up('KeyS')
    await expect(prompt).toHaveAttribute('data-interactable-id', 'core')
    await page.keyboard.press('KeyE')
    await expect(page.getByTestId('terminal-view')).toBeVisible()
    await expect(page.getByTestId('question-panel')).toBeVisible()
    // First Contact / "הקיסר הראשון" — אוגוסטוס (index 0) is correct.
    await submitMultipleChoiceAnswer(page, 0)
    await questionFeedbackIsPass(page)
    await page.getByTestId('return-to-world-button').click()
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()
    await expect(prompt).toHaveAttribute('data-interactable-id', 'core')

    // Tuned via a live interactive session: east from the Core in small
    // steps lands on Tomas Reyeth before reaching the East district marker.
    for (let step = 0; step < 3; step += 1) {
      await page.keyboard.down('KeyD')
      await page.waitForTimeout(300)
      await page.keyboard.up('KeyD')
    }
    await expect(prompt).toHaveAttribute('data-interactable-id', 'east-broker')

    await page.keyboard.press('KeyE')
    const dialogue = page.getByTestId('npc-dialogue')
    await expect(dialogue).toBeVisible()
    await expect(dialogue).toHaveAttribute('data-npc-id', 'east-broker')
    // Meridian 2.0 open-world pass — full-signal's own prerequisite is now
    // first-contact (History's own first mission), already satisfied, so
    // Tomas no longer blames an unrelated subject (the old "הדרום לא יציב"
    // line) for the delay.
    await expect(dialogue).not.toContainText('הדרום')
    await page.getByTestId('npc-dialogue-close-button').click()

    await page.keyboard.down('KeyD')
    await page.waitForTimeout(900)
    await page.keyboard.up('KeyD')
    await expect(prompt).toHaveAttribute('data-interactable-id', 'east')
    // East is open the moment ANY one subject's first mission is done — no
    // "נדרש: השלמת ..." lock text naming a different subject like the old
    // cross-subject chain used to require.
    await expect(prompt).not.toContainText('נדרש: השלמת')
    await expect(prompt).toContainText('היכנס/י אל רובע הסוחרים')
  })
})

test.describe('The Records Hub entrance uses a specific action, not the generic Enter (issue 2)', () => {
  test('the interaction prompt at the Core reads "activate the Records Hub", not a bare Enter/Talk label', async ({
    page,
  }) => {
    await page.goto('/world')
    const prompt = page.getByTestId('interaction-prompt')
    await expect(prompt).toHaveAttribute('data-interactable-id', 'north-warden')

    await page.keyboard.down('KeyS')
    await page.waitForTimeout(900)
    await page.keyboard.up('KeyS')
    await expect(prompt).toHaveAttribute('data-interactable-id', 'core')

    await expect(page.getByTestId('destination-enter-button')).toHaveText('הפעל/י את מוקד הרשומות')
  })
})

test.describe('Mission screen copy (issue 5)', () => {
  // SQL-removal pass — this test's whole premise was the SQL editor's own
  // narrative heading ("הפקודה שלך") plus a generic, non-spoiler SELECT
  // syntax example (sql-example-hint). Neither exists anymore: the question
  // panel's heading is he.questionCardTitle ("שאלה"), a deliberately plain
  // generic label rather than a narrative one, and there is no SQL syntax
  // concept left to show an example of. The genuine Easy-only scaffolding
  // affordance now is the question panel's own inline hint, already covered
  // by difficulty-levels.spec.ts. Removed rather than forced into a false
  // equivalence.

  test('the persistent objective chip shows the mission goal, not just its title', async ({ page }) => {
    await page.goto('/world')
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()

    // First Contact is now "הקיסר הראשון" (History, MC) — see missions/firstContact.ts.
    const chip = page.getByTestId('quest-chip')
    await expect(chip).toContainText('הקיסר הראשון')
    // goalHe ("לזהות מי נחשב לקיסר הראשון של האימפריה הרומית.") — a distinct
    // substring not present in the title, proving the chip shows the goal
    // itself and not just a repeat of the title.
    await expect(page.getByTestId('quest-chip-goal')).toContainText('האימפריה הרומית')
  })
})

test.describe('Ask Odin — general educational assistant pass', () => {
  test('the panel is reachable from the classic dashboard and answers all six deterministic questions', async ({
    page,
  }) => {
    await page.goto('/world')
    await waitForQuestionPanel(page)

    const panel = page.getByTestId('ask-odin-panel')
    await expect(panel).toBeVisible()

    // "what now"/"explain question" answer with the active mission's own
    // goalHe/promptHe verbatim (see resolveAskOdinAnswer.ts); First
    // Contact's goal/prompt text is History-trivia content, not the old
    // "מוקד הרשומות"/"עיוור" (Records Hub is offline/blind) narrative.
    await page.getByTestId('ask-odin-what-now').click()
    await expect(page.getByTestId('ask-odin-answer')).toContainText('קיסר הראשון')

    await page.getByTestId('ask-odin-explain-question').click()
    await expect(page.getByTestId('ask-odin-answer')).toContainText('אוגוסטוס')

    await page.getByTestId('ask-odin-subject').click()
    await expect(page.getByTestId('ask-odin-answer')).toContainText('היסטוריה')

    // A fresh profile defaults to Easy (level 1), where the hint prefers the
    // mission's own guidanceLevel1 over its plain hintHe (see
    // resolveAskOdinAnswer.ts's resolveHint) — First Contact's guidanceLevel1
    // is "שימו לב: התשובה מוזכרת במפורש בטקסט שלמעלה.", not the "רמז:" line.
    await page.getByTestId('ask-odin-hint').click()
    await expect(page.getByTestId('ask-odin-answer')).toContainText('התשובה מוזכרת')

    await page.getByTestId('ask-odin-where-to-go').click()
    await expect(page.getByTestId('ask-odin-answer')).toContainText('מוקד הרשומות')

    // No wrong answer has been submitted yet this session.
    await page.getByTestId('ask-odin-why-wrong').click()
    await expect(page.getByTestId('ask-odin-answer')).toContainText('עדיין לא נרשמה תשובה שגויה')
  })

  test('never shows any SQL-learning terms anywhere in an Ask Odin answer', async ({ page }) => {
    await page.goto('/world')
    await waitForQuestionPanel(page)

    for (const testId of [
      'ask-odin-what-now',
      'ask-odin-explain-question',
      'ask-odin-subject',
      'ask-odin-hint',
      'ask-odin-where-to-go',
      'ask-odin-why-wrong',
    ]) {
      await page.getByTestId(testId).click()
      await expect(page.getByTestId('ask-odin-answer')).not.toContainText(/SQL|SELECT|FROM|query|citizens/i)
    }
  })
})
