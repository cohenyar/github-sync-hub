import type { ArchivePageConfig } from './types'

/**
 * Meridian 1.3 — one page per rewritten lesson (Narrative Backbone §07's
 * "an object changes" / "a find" consequence), tying a piece of Meridian's
 * own history to the citizen problem that just got solved.
 */
const archivePages: ArchivePageConfig[] = [
  {
    id: 'archive-page:trade-count',
    lessonId: 'lesson:math-001',
    title: 'רישום סוחרים ישן',
    body:
      'עוד לפני שמוקד הרשומות ראה את מרידיאן, סוחרי המזרח ניהלו את המניפסטים שלהם ביד — ' +
      'כל תיבה נספרה פעמיים, כי טעות אחת יכולה לעלות בלילה שלם ליד השער הנעול.',
  },
  {
    id: 'archive-page:lost-and-found',
    lessonId: 'lesson:english-001',
    title: 'לוח שעומד ליד השער כבר שנים',
    body:
      'רוב הזמן לוח האבדות כתוב רק בשפה אחת — עד שמישהו שם לב שכל שפה נוספת עליו ' +
      'היא עוד דרך אחת שמישהו יכול למצוא בה את הדרך הביתה.',
  },
]

export const archivePageRegistry: readonly ArchivePageConfig[] = archivePages

export function getArchivePageById(id: string): ArchivePageConfig | undefined {
  return archivePages.find((page) => page.id === id)
}

export function getArchivePageByLessonId(lessonId: string): ArchivePageConfig | undefined {
  return archivePages.find((page) => page.lessonId === lessonId)
}
