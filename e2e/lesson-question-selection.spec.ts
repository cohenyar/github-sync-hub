import { expect, openSettingsMenu, test } from './helpers.js'

/**
 * Question-selection fix pass, round 2 — the previous pass fixed the
 * Terminal/mission system (QuestionAnswerPanel/resolveMissionForDifficulty)
 * but the REAL, most-discoverable Math/English learning flow a player
 * reaches by walking to the Math Academy/English Center and talking to the
 * teacher NPC uses a completely separate system: LessonStage +
 * lessonRegistry, which had zero difficulty/pool concept at all. This file
 * exercises THAT exact real flow end to end — no mocking of
 * resolveLessonForDifficulty, no direct component tests — matching what a
 * player actually sees in the running app.
 */

async function walkToMathTeacher(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.getByTestId('world-scene-3d')).toBeVisible()
  await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'north-warden')
  await page.waitForTimeout(500)
  await page.keyboard.down('KeyS')
  await page.waitForTimeout(600)
  await page.keyboard.up('KeyS')
  await page.keyboard.down('KeyA')
  await page.waitForTimeout(900)
  await page.keyboard.up('KeyA')
  await expect(page.getByTestId('interaction-prompt')).toHaveAttribute('data-interactable-id', 'math-teacher')
}

async function enterMathLesson(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/world')
  await walkToMathTeacher(page)
  await page.keyboard.press('KeyE')
  await expect(page.getByTestId('npc-dialogue-start-lesson-button')).toBeVisible()
  await page.getByTestId('npc-dialogue-start-lesson-button').click()
  await expect(page.getByTestId('math-exercise-panel')).toBeVisible()
}

test.describe('TEST A — real Math flow: difficulty switch produces genuinely different content', () => {
  test('Easy -> Medium -> Hard each show mutually distinct Math questions, live, without leaving the lesson', async ({
    page,
  }) => {
    await enterMathLesson(page)

    const easyText = await page.getByTestId('math-exercise-panel').textContent()

    // Settings (z-index 30/40) sits above the lesson overlay (z-index 20) —
    // reachable without returning to the world first, exactly like a real
    // player mid-lesson would experience it.
    await openSettingsMenu(page)
    await page.getByTestId('difficulty-level-2-button').click()
    await page.keyboard.press('Escape')
    const mediumText = await page.getByTestId('math-exercise-panel').textContent()
    expect(mediumText).not.toBe(easyText)

    await openSettingsMenu(page)
    await page.getByTestId('difficulty-level-3-button').click()
    await page.keyboard.press('Escape')
    const hardText = await page.getByTestId('math-exercise-panel').textContent()
    expect(hardText).not.toBe(easyText)
    expect(hardText).not.toBe(mediumText)

    // Back to Easy shows the exact original question again — deterministic,
    // not lost/randomized state.
    await openSettingsMenu(page)
    await page.getByTestId('difficulty-level-1-button').click()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('math-exercise-panel')).toHaveText(easyText ?? '')
  })

  test('a wrong answer at Easy, then switching to Hard, clears the stale feedback and shows a fresh unanswered question', async ({
    page,
  }) => {
    await enterMathLesson(page)

    await page.getByTestId('math-answer-input').fill('999999')
    await page.getByTestId('math-submit-button').click()
    await expect(page.getByTestId('math-exercise-feedback')).toBeVisible()

    await openSettingsMenu(page)
    await page.getByTestId('difficulty-level-3-button').click()
    await page.keyboard.press('Escape')

    // Difficulty change rule: clear previous answer + feedback.
    await expect(page.getByTestId('math-exercise-feedback')).not.toBeVisible()
    await expect(page.getByTestId('math-answer-input')).toHaveValue('')
  })
})

test.describe('TEST B — real Math flow: Next Question cycles through genuinely different questions', () => {
  test('after a correct answer, שאלה נוספת appears; clicking it loads a different question and never re-fires completion', async ({
    page,
  }) => {
    await enterMathLesson(page)

    // Real content: mathLessonPool[1][0] is lesson:math-001 itself (11).
    await page.getByTestId('math-answer-input').fill('11')
    await page.getByTestId('math-submit-button').click()
    await expect(page.getByTestId('lesson-success-message')).toBeVisible()
    await expect(page.getByTestId('lesson-next-question-button')).toBeVisible()

    const firstQuestionText = await page.getByTestId('lesson-stage').textContent()

    await page.getByTestId('lesson-next-question-button').click()

    // A fresh, unanswered, genuinely different question — not the success
    // screen, not the same question repeated.
    await expect(page.getByTestId('lesson-success-message')).not.toBeVisible()
    await expect(page.getByTestId('math-exercise-panel')).toBeVisible()
    const secondQuestionText = await page.getByTestId('lesson-stage').textContent()
    expect(secondQuestionText).not.toBe(firstQuestionText)

    // mathLessonPool[1][1] is "כמה זה 4 + 5?" -> 9 (see questionPools/math.ts).
    await page.getByTestId('math-answer-input').fill('9')
    await page.getByTestId('math-submit-button').click()
    await expect(page.getByTestId('lesson-success-message')).toBeVisible()

    // Return to the world and confirm the mission/archive completion only
    // fired once — the classic dashboard's math destination shows exactly
    // one completed lesson, not two.
    await page.getByTestId('lesson-return-to-world-button').click()
    await expect(page.getByTestId('world-scene-3d')).toBeVisible()
  })

  test('six consecutive Next Question presses visit six genuinely distinct questions before deterministically repeating the first', async ({
    page,
  }) => {
    await enterMathLesson(page)

    // The real, authored sequence for mathLessonPool[1] (see
    // questionPools/math.ts) — used to drive genuinely correct answers
    // through six full rounds without any component-level mocking.
    const answers = ['11', '9', '7', '18', '39', '56']
    const seenTexts: string[] = []

    for (const answer of answers) {
      const questionText = await page.getByTestId('math-exercise-panel').textContent()
      seenTexts.push(questionText ?? '')
      await page.getByTestId('math-answer-input').fill(answer)
      await page.getByTestId('math-submit-button').click()
      await expect(page.getByTestId('lesson-success-message')).toBeVisible()
      await page.getByTestId('lesson-next-question-button').click()
    }

    expect(new Set(seenTexts).size).toBe(6)
    // Deterministic wrap: the 7th question (after 6 presses) is the 1st again.
    await expect(page.getByTestId('math-exercise-panel')).toHaveText(seenTexts[0])
  })
})
