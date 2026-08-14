import {
  expect,
  questionFeedbackIsFail,
  questionFeedbackIsPass,
  submitMultipleChoiceAnswer,
  test,
  waitForQuestionPanel,
} from './helpers.js'

/**
 * SQL-removal pass — replaces the old sql-console.spec.ts: every real
 * mission is now a question mission (multiple choice or short text), not a
 * SQL-writing exercise. This covers the same thing that spec did (the
 * mission console's pass/fail mechanism itself), against the new UI.
 */
test.describe('Question panel', () => {
  test('a correct multiple-choice answer shows Pass feedback', async ({ page }) => {
    await page.goto('/world')
    await waitForQuestionPanel(page)

    // First Contact / "הקיסר הראשון" — אוגוסטוס (index 0) is correct.
    await submitMultipleChoiceAnswer(page, 0)

    await questionFeedbackIsPass(page)
  })

  test('a wrong multiple-choice answer shows Fail feedback, without completing the mission', async ({ page }) => {
    await page.goto('/world')
    await waitForQuestionPanel(page)

    // נירון (index 1) is a distractor, not the correct answer.
    await submitMultipleChoiceAnswer(page, 1)

    await questionFeedbackIsFail(page)
  })

  test('no SQL-specific UI is present anywhere in the question panel', async ({ page }) => {
    await page.goto('/world')
    await waitForQuestionPanel(page)

    await expect(page.getByTestId('sql-input')).not.toBeVisible()
    await expect(page.getByTestId('run-button')).not.toBeVisible()
    await expect(page.getByTestId('verdict-banner')).not.toBeVisible()
  })
})
