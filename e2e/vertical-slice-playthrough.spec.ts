import {
  expect,
  questionFeedbackIsPass,
  submitMultipleChoiceAnswer,
  submitShortTextAnswer,
  test,
  waitForQuestionPanel,
} from './helpers.js'

test.describe('Vertical slice: the full six-mission campaign is playable end to end', () => {
  test('switches missions, unlocks the full chain, and completes the campaign', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(String(err)))

    await page.goto('/world')
    await waitForQuestionPanel(page)

    // 1. First Contact / "הקיסר הראשון" (History, MC) — option 0 (אוגוסטוס)
    await submitMultipleChoiceAnswer(page, 0)
    await questionFeedbackIsPass(page)
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '17')

    // 2. Switch to District Ties / "תרגום: ספרייה" (English, MC) and complete it — option 0 (Library)
    await page.getByTestId('mission-option-district-ties').click()
    await waitForQuestionPanel(page)
    await submitMultipleChoiceAnswer(page, 0)
    await questionFeedbackIsPass(page)
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '33')

    // 3. Switch to South Stability / "כפל: 8 × 7" (Math, short text) and complete it — "56"
    await page.getByTestId('mission-option-south-stability').click()
    await waitForQuestionPanel(page)
    await submitShortTextAnswer(page, '56')
    await questionFeedbackIsPass(page)
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '50')
    await expect(page.locator('[data-npc-id="south-engineer"]')).toBeVisible()

    // 4. Switch to Full Signal / "הנשיא הראשון" (History, MC) and complete it (not the finale) — option 0 (ג'ורג' וושינגטון)
    await page.getByTestId('mission-option-full-signal').click()
    await waitForQuestionPanel(page)
    await submitMultipleChoiceAnswer(page, 0)
    await questionFeedbackIsPass(page)
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '67')
    await expect(page.getByTestId('campaign-complete-banner')).not.toBeVisible()

    // 5. Switch to Linked Records / "תרגום: ספר" (English, short text) and complete it (not the finale either) — "book"
    await page.getByTestId('mission-option-linked-records').click()
    await waitForQuestionPanel(page)
    await submitShortTextAnswer(page, 'book')
    await questionFeedbackIsPass(page)
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '83')
    await expect(page.getByTestId('campaign-complete-banner')).not.toBeVisible()

    // 6. Switch to Priority Signal / "כפל: 12 × 5" — the true finale (Math, MC) — option 0 ("60")
    await page.getByTestId('mission-option-priority-signal').click()
    await waitForQuestionPanel(page)
    await submitMultipleChoiceAnswer(page, 0)
    await questionFeedbackIsPass(page)
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '100')

    // The campaign-completion-gated NPC appears, and Odin narrates the close.
    await expect(page.locator('[data-npc-id="city-voice"]')).toBeVisible()
    await expect(page.getByText('כל החוטים התחברו. מרידיאן עונה כעת כעיר אחת.')).toBeVisible()

    // The distinct campaign-completion visual moment (Sprint 1 polish).
    await expect(page.getByTestId('campaign-complete-banner')).toBeVisible()

    expect(errors).toEqual([])
  })
})
