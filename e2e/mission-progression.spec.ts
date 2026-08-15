import {
  expect,
  questionFeedbackIsFail,
  questionFeedbackIsPass,
  submitMultipleChoiceAnswer,
  test,
  waitForQuestionPanel,
} from './helpers.js'

test.describe('Mission progression and unlock gating', () => {
  test('starts at Mission 1 of 6, 0% progress, with District Ties already open (Meridian 2.0 open-world pass)', async ({ page }) => {
    await page.goto('/world')
    await waitForQuestionPanel(page)

    await expect(page.getByTestId('mission-index-badge')).toHaveAttribute('data-current', '1')
    await expect(page.getByTestId('mission-index-badge')).toHaveAttribute('data-total', '6')
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '0')
    await expect(page.getByTestId('content-status-badge')).toHaveAttribute('data-status', 'available')
    // History/English/Math no longer gate each other — District Ties
    // (English's own first mission) is unlocked from the very start, same
    // as First Contact (History) and South Stability (Math).
    await expect(page.getByTestId('next-mission-label')).toHaveAttribute('data-mission-id', 'district-ties')
    await expect(page.getByTestId('next-mission-label')).toHaveAttribute('data-status', 'available')
  })

  test('unlocks District Ties once First Contact passes, while First Contact (still the active mission) stays at index 1 (Meridian 1.4)', async ({
    page,
  }) => {
    await page.goto('/world')
    await waitForQuestionPanel(page)

    // First Contact / "הקיסר הראשון" (History, MC) — option 0 (אוגוסטוס) is correct.
    await submitMultipleChoiceAnswer(page, 0)
    await questionFeedbackIsPass(page)

    // Passing First Contact doesn't switch the active mission away from it —
    // the ordinal badge tracks the mission actually on screen (still index
    // 1), not the campaign's own furthest-incomplete pointer (which has
    // moved to District Ties) — see the Meridian 1.4 ordinal fix.
    await expect(page.getByTestId('mission-index-badge')).toHaveAttribute('data-current', '1')
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '17')
    await expect(page.getByTestId('content-status-badge')).toHaveAttribute('data-status', 'completed')
    await expect(page.getByTestId('next-mission-label')).toHaveAttribute('data-mission-id', 'district-ties')
    await expect(page.getByTestId('next-mission-label')).toHaveAttribute('data-status', 'available')

    // Switching to District Ties is what actually advances the badge to 2.
    await page.getByTestId('mission-option-district-ties').click()
    await waitForQuestionPanel(page)
    await expect(page.getByTestId('mission-index-badge')).toHaveAttribute('data-current', '2')
  })

  test('a failing query leaves progression and unlocks unchanged', async ({ page }) => {
    await page.goto('/world')
    await waitForQuestionPanel(page)

    // Option 1 (נירון) is a distractor, not the correct answer.
    await submitMultipleChoiceAnswer(page, 1)
    await questionFeedbackIsFail(page)

    await expect(page.getByTestId('mission-index-badge')).toHaveAttribute('data-current', '1')
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '0')
    // District Ties (English) was never gated behind First Contact (History)
    // in the first place, so a failed attempt leaves it exactly as open as
    // it always was — "unchanged" now means still available, not still locked.
    await expect(page.getByTestId('next-mission-label')).toHaveAttribute('data-status', 'available')
  })

  test('revisiting an already-completed mission shows a completed phase, never an active one', async ({ page }) => {
    await page.goto('/world')
    await waitForQuestionPanel(page)

    await submitMultipleChoiceAnswer(page, 0)
    await questionFeedbackIsPass(page)

    await page.getByTestId('mission-option-district-ties').click()
    await waitForQuestionPanel(page)

    await page.getByTestId('mission-option-first-contact').click()

    await expect(page.getByTestId('phase-badge')).toHaveAttribute('data-phase', 'completed')
    await expect(page.getByTestId('phase-badge')).not.toHaveAttribute('data-phase', 'active')
  })
})
