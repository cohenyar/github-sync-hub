import {
  expect,
  questionFeedbackIsFail,
  questionFeedbackIsPass,
  submitMultipleChoiceAnswer,
  test,
  waitForQuestionPanel,
} from './helpers.js'

test.describe('World reacts to verified queries', () => {
  test('districts show their starting statuses', async ({ page }) => {
    await page.goto('/world')
    await waitForQuestionPanel(page)

    // District status labels are Hebrew (he.districtStable/Unstable/Thriving):
    // 'יציב' / 'לא יציב' / 'משגשג'. Selected by the stable data-district-id.
    await expect(page.locator('[data-district-id="north"]')).toContainText('יציב')
    await expect(page.locator('[data-district-id="south"]')).toContainText('לא יציב')
    await expect(page.locator('[data-district-id="east"]')).toContainText('משגשג')
    await expect(page.locator('[data-district-id="core"]')).toContainText('לא יציב')
  })

  test('the Core district goes from Unstable to Thriving once First Contact passes', async ({ page }) => {
    await page.goto('/world')
    await waitForQuestionPanel(page)

    const core = page.locator('[data-district-id="core"]')
    await expect(core).toContainText('לא יציב')

    // First Contact / "הקיסר הראשון" (History, MC) — option 0 (אוגוסטוס) is correct.
    await submitMultipleChoiceAnswer(page, 0)
    await questionFeedbackIsPass(page)

    await expect(core).toContainText('משגשג')
    await expect(core).toHaveCSS('opacity', '1')
  })

  test('the world state dump reflects the signal change', async ({ page }) => {
    await page.goto('/world')
    await waitForQuestionPanel(page)

    // The raw world-state JSON is a collapsed debug view (Sprint 1 polish).
    await page.getByRole('button', { name: 'הצג מצב עולם גולמי' /* he.showRawWorldState */ }).click()
    await expect(page.getByText(/"signal": 0/)).toBeVisible()

    await submitMultipleChoiceAnswer(page, 0)
    await questionFeedbackIsPass(page)

    await expect(page.getByText(/"signal": 100/)).toBeVisible()
  })

  test('a failing query leaves the world state unchanged', async ({ page }) => {
    await page.goto('/world')
    await waitForQuestionPanel(page)
    await page.getByRole('button', { name: 'הצג מצב עולם גולמי' /* he.showRawWorldState */ }).click()

    // Option 1 (נירון) is a distractor, not the correct answer.
    await submitMultipleChoiceAnswer(page, 1)
    await questionFeedbackIsFail(page)

    await expect(page.getByText(/"signal": 0/)).toBeVisible()
    await expect(page.locator('[data-district-id="core"]')).toContainText('לא יציב')
  })
})
