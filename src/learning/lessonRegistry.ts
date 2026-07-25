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
    title: 'חשבון בסיסי',
    instructions: 'כמה זה 3 + 4 × 2?',
    exercise: {
      correctAnswer: 11,
      hint: 'בצע קודם את הכפל, ורק אז את החיבור (סדר פעולות חשבון).',
    },
  },
  {
    id: 'lesson:english-001',
    subject: 'english',
    title: 'אוצר מילים באנגלית',
    instructions: 'תרגם/י את המילים הבאות מעברית לאנגלית.',
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
