import {
  expect,
  questionFeedbackIsFail,
  questionFeedbackIsPass,
  submitMultipleChoiceAnswer,
  test,
  waitForQuestionPanel,
} from './helpers.js'
import type { Page } from '@playwright/test'

/**
 * Mirrors questionPools/history.ts's pool[1] (Easy) exactly, in order —
 * hardcoded rather than imported, matching every other spec in this suite
 * (e2e specs never import from src/, since that file tree is written for
 * tsconfig.app.json's bundler-mode resolution, not tsconfig.node.json's
 * nodenext rules e2e runs under; see that file for the authoritative
 * content if these ever need to be kept in sync). first-contact's own
 * content is history-l1-a — the mission the world/dashboard always boots
 * into by default.
 */
const EASY_HISTORY_POOL: ReadonlyArray<{ taskHe: string; answer: string }> = [
  { taskHe: 'מי היה הקיסר הראשון של רומא?', answer: '0' }, // אוגוסטוס
  { taskHe: 'מי היה נשיאה הראשון של ארצות הברית?', answer: '0' }, // ג'ורג' וושינגטון
  { taskHe: 'איזו אימפריה עתיקה בנתה את הקולוסיאום?', answer: '0' }, // רומא
  { taskHe: 'מי היה המנהיג הבריטי שהוביל את בריטניה במלחמת העולם השנייה?', answer: '0' }, // וינסטון צ'רצ'יל
  { taskHe: 'באיזו מדינה נערכו לראשונה המשחקים האולימפיים בעת העתיקה?', answer: '0' }, // יוון
  { taskHe: 'איזו עיר-מדינה יוונית עתיקה נודעה בלוחמיה האמיצים ובאורח חיים צבאי מחמיר?', answer: '0' }, // ספרטה
]

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

async function answerCurrentQuestion(page: Page, entry: { taskHe: string; answer: string }): Promise<void> {
  await page.getByTestId(`question-option-${entry.answer}`).click()
  await page.getByTestId('question-submit-button').click()
}

// Question-selection fix pass — the reported bug: "after answering a
// question and continuing to another question, the system may repeat/reuse
// the current question." Drives the real running app through History's
// (the default boot mission's subject) own Easy pool.
test.describe('Next Question — question-selection fix pass', () => {
  test('after a correct answer, Next Question shows a genuinely different question; 6 presses visit all 6 pool entries before deterministically wrapping', async ({
    page,
  }) => {
    await page.goto('/world')
    await waitForQuestionPanel(page)

    const seenTasks: string[] = []

    for (const entry of EASY_HISTORY_POOL) {
      await expect(page.getByTestId('question-task')).toHaveText(entry.taskHe)
      seenTasks.push(entry.taskHe)

      await answerCurrentQuestion(page, entry)
      await questionFeedbackIsPass(page)
      await expect(page.getByTestId('question-next-button')).toBeVisible()

      await page.getByTestId('question-next-button').click()

      // Immediately after clicking, the stale "correct!" banner from the
      // question just finished must be gone — this is a fresh, unanswered
      // question, not a leftover pass state layered on top of it.
      await expect(page.getByTestId('question-feedback')).not.toBeVisible()
      await expect(page.getByTestId('question-next-button')).not.toBeVisible()
    }

    // 6 presses visited 6 genuinely distinct questions — no repetition
    // until the whole pool was exhausted.
    expect(new Set(seenTasks).size).toBe(EASY_HISTORY_POOL.length)

    // Deterministic wrap-around: the question shown after the 6th Next
    // Question press is exactly the 1st one again, not something random.
    await expect(page.getByTestId('question-task')).toHaveText(EASY_HISTORY_POOL[0].taskHe)
  })

  test('extra practice questions after completion never advance mission progress a second time', async ({ page }) => {
    await page.goto('/world')
    await waitForQuestionPanel(page)

    await answerCurrentQuestion(page, EASY_HISTORY_POOL[0])
    await questionFeedbackIsPass(page)
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '17')

    await page.getByTestId('question-next-button').click()
    await answerCurrentQuestion(page, EASY_HISTORY_POOL[1])
    await questionFeedbackIsPass(page)

    // Still 17% (1 of 6 missions) — the mission already completed on the
    // FIRST correct answer; every practice question after that is bonus,
    // never a second completion event.
    await expect(page.getByTestId('progress-badge')).toHaveAttribute('data-percentage', '17')
  })

  test('Next Question never appears before answering, and never appears after a wrong answer', async ({ page }) => {
    await page.goto('/world')
    await waitForQuestionPanel(page)

    await expect(page.getByTestId('question-next-button')).not.toBeVisible()

    // A distractor option (index 1) is never correct for any of these six.
    await page.getByTestId('question-option-1').click()
    await page.getByTestId('question-submit-button').click()

    await questionFeedbackIsFail(page)
    await expect(page.getByTestId('question-next-button')).not.toBeVisible()
  })
})
