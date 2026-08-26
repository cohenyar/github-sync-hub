import type { EnglishQuestionPool } from './types'

/**
 * Question-selection fix pass — the NPC-teacher English lesson's own
 * difficulty pool (the real, player-visible flow reached via the English
 * Center teacher's "Start Lesson", distinct from the Terminal/mission
 * system's own English pool at src/missions/questionPools/english.ts).
 * Level 1's first entry is lesson:english-001's exact, unchanged 5-word
 * batch (see lessonRegistry.ts) — a fresh Easy-difficulty game shows
 * byte-identical content to before this pass. Every other entry is a
 * single-word vocabulary translation (matching EnglishExerciseConfig's
 * existing items-array shape with exactly one item) rather than a 5-word
 * batch, so "Next Question" cycles through one genuinely new word at a
 * time — the same granularity Math's pool already has. Difficulty is
 * calibrated by word frequency/complexity for a learner (common concrete
 * nouns -> everyday adjectives -> more advanced adjectives), since
 * EnglishExerciseConfig only supports word-for-word translation, not a
 * grammar-rule transformation.
 */
export const englishLessonPool: EnglishQuestionPool = {
  1: [
    {
      id: 'lesson-english-l1-a',
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
    { id: 'lesson-english-l1-b', instructions: 'תרגם/י את המילה \'חלון\' לאנגלית.', exercise: { items: [{ hebrew: 'חלון', english: 'window' }], hint: 'רמז: דרכו אפשר לראות החוצה מהבית.' } },
    { id: 'lesson-english-l1-c', instructions: 'תרגם/י את המילה \'עץ\' לאנגלית.', exercise: { items: [{ hebrew: 'עץ', english: 'tree' }], hint: 'רמז: זה גדל בגן וממנו מגיע העץ (חומר הבנייה).' } },
    { id: 'lesson-english-l1-d', instructions: 'תרגם/י את המילה \'שמש\' לאנגלית.', exercise: { items: [{ hebrew: 'שמש', english: 'sun' }], hint: 'רמז: הכוכב שמאיר עלינו ביום.' } },
    { id: 'lesson-english-l1-e', instructions: 'תרגם/י את המילה \'כיסא\' לאנגלית.', exercise: { items: [{ hebrew: 'כיסא', english: 'chair' }], hint: 'רמז: יושבים עליו סביב השולחן.' } },
    { id: 'lesson-english-l1-f', instructions: 'תרגם/י את המילה \'דלת\' לאנגלית.', exercise: { items: [{ hebrew: 'דלת', english: 'door' }], hint: 'רמז: נכנסים ויוצאים דרכה.' } },
  ],
  2: [
    { id: 'lesson-english-l2-a', instructions: 'תרגם/י את המילה \'מהיר\' לאנגלית.', exercise: { items: [{ hebrew: 'מהיר', english: 'fast' }], hint: 'רמז: המילה מתארת מישהו שרץ הרבה.' } },
    { id: 'lesson-english-l2-b', instructions: 'תרגם/י את המילה \'קר\' לאנגלית.', exercise: { items: [{ hebrew: 'קר', english: 'cold' }], hint: 'רמז: חשבו על מזג האוויר בחורף.' } },
    { id: 'lesson-english-l2-c', instructions: 'תרגם/י את המילה \'שמח\' לאנגלית.', exercise: { items: [{ hebrew: 'שמח', english: 'happy' }], hint: 'רמז: זה איך שמרגישים כשקורה משהו טוב.' } },
    { id: 'lesson-english-l2-d', instructions: 'תרגם/י את המילה \'גדול\' לאנגלית.', exercise: { items: [{ hebrew: 'גדול', english: 'big' }], hint: 'רמז: הניגוד של \'קטן\'.' } },
    { id: 'lesson-english-l2-e', instructions: 'תרגם/י את המילה \'קטן\' לאנגלית.', exercise: { items: [{ hebrew: 'קטן', english: 'small' }], hint: 'רמז: הניגוד של \'גדול\'.' } },
    { id: 'lesson-english-l2-f', instructions: 'תרגם/י את המילה \'גבוה\' לאנגלית.', exercise: { items: [{ hebrew: 'גבוה', english: 'tall' }], hint: 'רמז: מתארים כך בניין רב-קומות או אדם שגובהו ניכר.' } },
  ],
  3: [
    { id: 'lesson-english-l3-a', instructions: 'תרגם/י את המילה \'אמיץ\' לאנגלית.', exercise: { items: [{ hebrew: 'אמיץ', english: 'brave' }], hint: 'רמז: מי שלא מפחד להתמודד עם דבר מסוכן או קשה.' } },
    { id: 'lesson-english-l3-b', instructions: 'תרגם/י את המילה \'עתיק\' לאנגלית.', exercise: { items: [{ hebrew: 'עתיק', english: 'ancient' }], hint: 'רמז: מתאר דבר שקיים מלפני שנים רבות מאוד, כמו מבנים מהעולם העתיק.' } },
    { id: 'lesson-english-l3-c', instructions: 'תרגם/י את המילה \'סקרן\' לאנגלית.', exercise: { items: [{ hebrew: 'סקרן', english: 'curious' }], hint: 'רמז: מי שרוצה מאוד לגלות ולדעת דברים חדשים.' } },
    { id: 'lesson-english-l3-d', instructions: 'תרגם/י את המילה \'נדיב\' לאנגלית.', exercise: { items: [{ hebrew: 'נדיב', english: 'generous' }], hint: 'רמז: מי שנותן ומשתף ברצון, בלי לחשוב רק על עצמו.' } },
    { id: 'lesson-english-l3-e', instructions: 'תרגם/י את המילה \'סבלני\' לאנגלית.', exercise: { items: [{ hebrew: 'סבלני', english: 'patient' }], hint: 'רמז: מי שיכול לחכות בלי להתעצבן, גם כשלוקח זמן.' } },
    { id: 'lesson-english-l3-f', instructions: 'תרגם/י את המילה \'ישר\' לאנגלית.', exercise: { items: [{ hebrew: 'ישר', english: 'honest' }], hint: 'רמז: מי שאומר את האמת ולא משקר.' } },
  ],
}
