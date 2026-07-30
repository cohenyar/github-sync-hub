import type { LessonConfig } from './types'

/**
 * The separate, subject-neutral lesson registry (Batch 3A.4A). Kept
 * entirely apart from `src/missions/registry.ts` — nothing here is read by
 * `missionRegistry`, `defaultCampaign`, or the mission runtime. Ids are
 * namespaced so they can never be mistaken for a SQL mission id.
 */
const lessons: LessonConfig[] = [
  {
    id: 'lesson:math-001',
    subject: 'math',
    // Meridian 1.3 — Narrative Backbone §06 (the story-problem rule): a
    // citizen's real problem, never an academic objective. The arithmetic
    // itself is unchanged (3 + 4 × 2 = 11); only who's asking, and why it
    // matters to them, is new.
    title: 'ספירת המשלוח',
    instructions:
      'שלוש תיבות כבר סגורות על העגלה. עוד ארבעה קרונות הגיעו זה עתה, ובכל קרון שתי תיבות. ' +
      'השער נסגר עם רדת החשיכה — כמה תיבות צריכות להיות רשומות במניפסט?',
    exercise: {
      correctAnswer: 11,
      hint: 'קודם ספור כמה תיבות יש בקרונות שהגיעו (קרון כפול תיבות בקרון), ואז הוסף את שלוש התיבות שכבר היו על העגלה.',
    },
  },
  {
    id: 'lesson:english-001',
    subject: 'english',
    // Meridian 1.3 — Narrative Backbone §06: same five words as before
    // (dog is still dog), reframed as the reason someone needs them read.
    title: 'לוח האבדות',
    instructions:
      'מתנדבת שהגיעה מחוץ למרידיאן עוזרת לאתר חיות ודברים אבודים, אבל היא קוראת רק אנגלית. ' +
      'תרגם/י את הלוח לאנגלית כדי שהיא תוכל לעזור.',
    exercise: {
      items: [
        { hebrew: 'כלב', english: 'dog' },
        { hebrew: 'חתול', english: 'cat' },
        { hebrew: 'בית', english: 'house' },
        { hebrew: 'ספר', english: 'book' },
        { hebrew: 'מים', english: 'water' },
      ],
      hint: 'האות הראשונה של "כלב" באנגלית היא D.',
    },
  },
]

export const lessonRegistry: readonly LessonConfig[] = lessons

export function getLessonById(id: string): LessonConfig | undefined {
  return lessons.find((lesson) => lesson.id === id)
}
