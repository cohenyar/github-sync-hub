import {
  expect,
  questionFeedbackIsPass,
  submitMultipleChoiceAnswer,
  submitShortTextAnswer,
  test,
  waitForQuestionPanel,
} from './helpers.js'

test.describe('NPC world map integration', () => {
  test('always-unlocked NPCs are visible from the start; the gated one appears only after its mission completes', async ({
    page,
  }) => {
    await page.goto('/world')
    await waitForQuestionPanel(page)

    await expect(page.locator('[data-npc-id="archivist-mera"]')).toBeVisible()
    await expect(page.locator('[data-npc-id="north-warden"]')).toBeVisible()
    await expect(page.locator('[data-npc-id="south-organizer"]')).toBeVisible()

    // Tomas Reyeth (east-broker) is gated behind completing First Contact — hidden at start.
    await expect(page.locator('[data-npc-id="east-broker"]')).not.toBeVisible()

    // First Contact: "הקיסר הראשון" — option 0 (אוגוסטוס) is correct.
    await submitMultipleChoiceAnswer(page, 0)
    await questionFeedbackIsPass(page)

    await expect(page.locator('[data-npc-id="east-broker"]')).toBeVisible()

    // Completing a mission never hides content that was already unlocked.
    await expect(page.locator('[data-npc-id="archivist-mera"]')).toBeVisible()
    await expect(page.locator('[data-npc-id="north-warden"]')).toBeVisible()
    await expect(page.locator('[data-npc-id="south-organizer"]')).toBeVisible()
  })

  test('the progression-percentage-gated NPC appears only once overall progress reaches 40%', async ({ page }) => {
    await page.goto('/world')
    await waitForQuestionPanel(page)

    await expect(page.locator('[data-npc-id="north-analyst"]')).not.toBeVisible()

    // First Contact: "הקיסר הראשון" — option 0 (אוגוסטוס) is correct.
    await submitMultipleChoiceAnswer(page, 0)
    await questionFeedbackIsPass(page)
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '17')

    // Still hidden at 17% — this NPC is gated behind 40%, not First Contact specifically.
    await expect(page.locator('[data-npc-id="north-analyst"]')).not.toBeVisible()

    // With 6 real missions, District Ties only reaches 33% — still below
    // the 40% threshold (a percentage-relative condition, not tied to one
    // specific mission).
    await page.getByTestId('mission-option-district-ties').click()
    await waitForQuestionPanel(page)
    // District Ties: "תרגום: ספרייה" — option 0 (Library) is correct.
    await submitMultipleChoiceAnswer(page, 0)
    await questionFeedbackIsPass(page)
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '33')
    await expect(page.locator('[data-npc-id="north-analyst"]')).not.toBeVisible()

    // South Stability reaches 50%, the first point that crosses 40%.
    await page.getByTestId('mission-option-south-stability').click()
    await waitForQuestionPanel(page)
    // South Stability: "כפל: 8 × 7" — short-text answer "56" is correct.
    await submitShortTextAnswer(page, '56')
    await questionFeedbackIsPass(page)
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '50')

    await expect(page.locator('[data-npc-id="north-analyst"]')).toBeVisible()
  })

  test('clicking an NPC marker opens a read-only bio, and Close dismisses it without affecting gameplay', async ({
    page,
  }) => {
    await page.goto('/world')
    await waitForQuestionPanel(page)

    await page.locator('[data-npc-id="north-warden"]').click()

    const bio = page.getByTestId('npc-bio-panel')
    await expect(bio).toBeVisible()
    await expect(bio).toHaveAttribute('data-npc-id', 'north-warden')
    await expect(page.getByText(/שומר המחוז/)).toBeVisible()
    await expect(page.getByText('שומר על נאמנות מחוז הצפון למרידיאן.')).toBeVisible()

    await page.getByTestId('npc-bio-close-button').click()
    await expect(bio).not.toBeVisible()

    // The mission underneath is unaffected by opening/closing a bio.
    // First Contact: "הקיסר הראשון" — option 0 (אוגוסטוס) is correct.
    await submitMultipleChoiceAnswer(page, 0)
    await questionFeedbackIsPass(page)
  })
})
