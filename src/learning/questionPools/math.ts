import type { MathQuestionPool } from './types'

/**
 * Question-selection fix pass — the NPC-teacher Math lesson's own
 * difficulty pool (the real, player-visible flow reached via the Math
 * Academy teacher's "Start Lesson", distinct from the Terminal/mission
 * system's own math pool at src/missions/questionPools/math.ts). Level 1's
 * first entry is lesson:math-001's exact, unchanged content (see
 * lessonRegistry.ts) — a fresh Easy-difficulty game shows byte-identical
 * content to before this pass. Every other entry reuses the same
 * underlying arithmetic facts as the mission pool (consistent difficulty
 * calibration across both systems, per the "unify player experience"
 * requirement) but as a short, direct instruction rather than a mission
 * task string — no narrative wrapper beyond the original.
 */
export const mathLessonPool: MathQuestionPool = {
  1: [
    {
      id: 'lesson-math-l1-a',
      instructions:
        'שלוש תיבות כבר סגורות על העגלה. עוד ארבעה קרונות הגיעו זה עתה, ובכל קרון שתי תיבות. ' +
        'השער נסגר עם רדת החשיכה — כמה תיבות צריכות להיות רשומות במניפסט?',
      exercise: {
        correctAnswer: 11,
        hint: 'קודם ספור/ספרי כמה תיבות יש בקרונות שהגיעו (קרון כפול תיבות בקרון), ואז הוסף/הוסיפי את שלוש התיבות שכבר היו על העגלה.',
      },
    },
    { id: 'lesson-math-l1-b', instructions: 'כמה זה 4 + 5?', exercise: { correctAnswer: 9, hint: 'רמז: ספרו על האצבעות אם צריך.' } },
    { id: 'lesson-math-l1-c', instructions: 'כמה זה 10 - 3?', exercise: { correctAnswer: 7, hint: 'רמז: התחילו מ-10 וספרו אחורה 3 פעמים.' } },
    { id: 'lesson-math-l1-d', instructions: 'כמה זה 6 × 3?', exercise: { correctAnswer: 18, hint: 'רמז: 6 × 3 זה כמו לחבר 3 שש פעמים (3+3+3+3+3+3).' } },
    { id: 'lesson-math-l1-e', instructions: 'כמה זה 25 + 14?', exercise: { correctAnswer: 39, hint: 'רמז: חברו קודם את העשרות (20 + 10) ואז את היחידות (5 + 4).' } },
    { id: 'lesson-math-l1-f', instructions: 'כמה זה 8 × 7?', exercise: { correctAnswer: 56, hint: 'רמז: 8 × 7 = 8×5 + 8×2.' } },
  ],
  2: [
    { id: 'lesson-math-l2-a', instructions: 'כמה זה 15 × 4?', exercise: { correctAnswer: 60, hint: 'רמז: 15 × 4 = 15 × 2 × 2.' } },
    { id: 'lesson-math-l2-b', instructions: 'כמה זה 100 ÷ 4?', exercise: { correctAnswer: 25, hint: 'רמז: כמה פעמים 4 נכנס ב-100?' } },
    { id: 'lesson-math-l2-c', instructions: 'כמה זה 9 × 9?', exercise: { correctAnswer: 81, hint: 'רמז: 9 × 9 = 9 × 10 - 9.' } },
    { id: 'lesson-math-l2-d', instructions: 'כמה זה 6 בריבוע (6²)?', exercise: { correctAnswer: 36, hint: 'רמז: בריבוע פירושו להכפיל את המספר בעצמו.' } },
    { id: 'lesson-math-l2-e', instructions: 'כמה זה 2 + 3 × 4?', exercise: { correctAnswer: 14, hint: 'רמז: כשיש גם חיבור וגם כפל, יש לבצע קודם את הכפל ורק אחר כך את החיבור.' } },
    { id: 'lesson-math-l2-f', instructions: 'כמה זה 96 ÷ 8?', exercise: { correctAnswer: 12, hint: 'רמז: כמה פעמים 8 נכנס בתוך 96? נסו להתחיל מ-8 × 10 ולהמשיך משם.' } },
  ],
  3: [
    { id: 'lesson-math-l3-a', instructions: 'כמה זה 17 × 13?', exercise: { correctAnswer: 221, hint: 'נסו לפרק אחד המספרים לסכום של שני מספרים עגולים יותר.' } },
    { id: 'lesson-math-l3-b', instructions: 'כמה זה 25% מתוך 80?', exercise: { correctAnswer: 20, hint: 'חשבו על 25% כרבע מהמספר.' } },
    { id: 'lesson-math-l3-c', instructions: 'כמה זה 144 ÷ 12?', exercise: { correctAnswer: 12, hint: 'חשבו איזה מספר כפול עצמו קרוב ל-144.' } },
    { id: 'lesson-math-l3-d', instructions: 'כמה זה 7 בשלישית (7³)?', exercise: { correctAnswer: 343, hint: 'בשלישית פירושו להכפיל את המספר בעצמו פעמיים.' } },
    {
      id: 'lesson-math-l3-e',
      instructions: 'לחנות הגיעו 9 ארגזים ובכל ארגז 14 בקבוקי מים. אם נמכרו 68 בקבוקים, כמה בקבוקים נשארו?',
      exercise: { correctAnswer: 58, hint: 'חשבו כמה בקבוקים הגיעו בסך הכל, ולאחר מכן הפחיתו את הכמות שנמכרה.' },
    },
    {
      id: 'lesson-math-l3-f',
      instructions: '150 מטבעות מתחלקים בשווה בין 6 חברים. כמה מטבעות מקבל כל חבר?',
      exercise: { correctAnswer: 25, hint: 'נסו לפרק את 150 לחלקים עגולים שקל לחלק ב-6.' },
    },
  ],
}
