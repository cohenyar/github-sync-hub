import { firstContactMission } from '../firstContact'
import { fullSignalMission } from '../fullSignal'
import type { QuestionPool } from './types'

/**
 * Real difficulty differentiation pass — History's own question pool.
 * Level 1's first two entries are the exact, unchanged firstContact/
 * fullSignal content (slots resolveMissionForDifficulty.ts always maps
 * first-contact/full-signal onto), so a fresh Easy-difficulty game shows
 * byte-identical questions to before this pass. Levels 2 and 3 are new,
 * genuinely different content — not a reworded version of the same fact.
 */
export const historyPool: QuestionPool = {
  1: [
    { id: 'history-l1-a', taskHe: firstContactMission.taskHe, answerConfig: firstContactMission.answerConfig, hintHe: firstContactMission.hintHe ?? '' },
    { id: 'history-l1-b', taskHe: fullSignalMission.taskHe, answerConfig: fullSignalMission.answerConfig, hintHe: fullSignalMission.hintHe ?? '' },
    {
      id: 'history-l1-c',
      taskHe: 'איזו אימפריה עתיקה בנתה את הקולוסיאום?',
      answerConfig: { type: 'multiple_choice', options: ['רומא', 'יוון', 'מצרים', 'פרס'], correctIndex: 0 },
      hintHe: 'רמז: זו אותה אימפריה שבה שלט הקיסר הראשון.',
    },
    {
      id: 'history-l1-d',
      taskHe: 'מי היה המנהיג הבריטי שהוביל את בריטניה במלחמת העולם השנייה?',
      answerConfig: { type: 'multiple_choice', options: ['וינסטון צ\'רצ\'יל', 'נפוליאון', 'נלסון מנדלה', 'אברהם לינקולן'], correctIndex: 0 },
      hintHe: 'רמז: שמו קשור לנאומים המפורסמים שנשא ברדיו בזמן המלחמה.',
    },
    {
      id: 'history-l1-e',
      taskHe: 'באיזו מדינה נערכו לראשונה המשחקים האולימפיים בעת העתיקה?',
      answerConfig: { type: 'multiple_choice', options: ['יוון', 'רומא', 'מצרים', 'פרס'], correctIndex: 0 },
      hintHe: 'רמז: זו אותה מדינה שבה נמצאת העיר אתונה, בירתה.',
    },
    {
      id: 'history-l1-f',
      taskHe: 'איזו עיר-מדינה יוונית עתיקה נודעה בלוחמיה האמיצים ובאורח חיים צבאי מחמיר?',
      answerConfig: { type: 'multiple_choice', options: ['ספרטה', 'אתונה', 'קורינתוס', 'תבאי'], correctIndex: 0 },
      hintHe: 'רמז: שם העיר הפך במרוצת הדורות למילה נרדפת לאורח חיים קשוח וצבאי.',
    },
  ],
  2: [
    {
      id: 'history-l2-a',
      taskHe: 'מי היה הקיסר הרומי שעל שמו נקרא חודש יולי?',
      answerConfig: { type: 'multiple_choice', options: ['יוליוס קיסר', 'נירון', 'אוגוסטוס', 'טראיאנוס'], correctIndex: 0 },
      hintHe: 'רמז: שם החודש דומה מאוד לשם הקיסר.',
    },
    { id: 'history-l2-b', taskHe: 'באיזו שנה נחתמה הכרזת העצמאות של ארצות הברית?', answerConfig: { type: 'exact_text', acceptedAnswers: ['1776'] }, hintHe: 'רמז: זו השנה שבה נוסדה ארצות הברית כמדינה עצמאית.' },
    {
      id: 'history-l2-c',
      taskHe: 'מי, לפי הנרטיב ההיסטורי המוכר, הפליג מספרד והגיע ליבשת אמריקה בשנת 1492?',
      answerConfig: { type: 'multiple_choice', options: ['כריסטופר קולומבוס', 'מרקו פולו', 'ג\'יימס קוק', 'פרדיננד מגלן'], correctIndex: 0 },
      hintHe: 'רמז: שלוש הספינות שלו נקראו נינה, פינטה וסנטה מריה.',
    },
    { id: 'history-l2-d', taskHe: 'מהי בירת האימפריה הרומית?', answerConfig: { type: 'exact_text', acceptedAnswers: ['רומא'] }, hintHe: 'רמז: האימפריה נקראת על שם עירה הראשית.' },
    {
      id: 'history-l2-e',
      taskHe: 'מי היה הפילוסוף היווני שהיה מורו האישי של אלכסנדר הגדול בצעירותו?',
      answerConfig: { type: 'exact_text', acceptedAnswers: ['אריסטו', 'אריסטוטלס'] },
      hintHe: 'רמז: הוא היה תלמידו של אפלטון, שהיה בעצמו תלמידו של סוקרטס.',
    },
    {
      id: 'history-l2-f',
      taskHe: 'איזו תרבות עתיקה בנתה את "החומה הגדולה" כדי להגן על שטחה מפני פולשים מהצפון?',
      answerConfig: { type: 'multiple_choice', options: ['סין', 'יוון', 'רומא', 'פרס'], correctIndex: 0 },
      hintHe: 'רמז: זו אותה תרבות שהמציאה את הנייר ואת אבק השריפה.',
    },
  ],
  3: [
    { id: 'history-l3-a', taskHe: 'מי היה נשיא ארצות הברית בזמן מלחמת האזרחים האמריקאית?', answerConfig: { type: 'exact_text', acceptedAnswers: ['אברהם לינקולן', 'לינקולן'] }, hintHe: 'חשבו על הנשיא שפעל לביטול העבדות.' },
    { id: 'history-l3-b', taskHe: 'באיזו יבשת שכנה האימפריה המצרית העתיקה?', answerConfig: { type: 'exact_text', acceptedAnswers: ['אפריקה'] }, hintHe: 'חשבו על מיקומו של נהר הנילוס.' },
    { id: 'history-l3-c', taskHe: 'איזו מעצמה עתיקה נלחמה ברומא במלחמות הפוניות?', answerConfig: { type: 'exact_text', acceptedAnswers: ['קרתגו'] }, hintHe: 'חשבו על העיר שממנה יצא חניבעל.' },
    { id: 'history-l3-d', taskHe: 'מהו שם התקופה הארוכה של יציבות ושלום יחסי באימפריה הרומית שהחלה עם אוגוסטוס?', answerConfig: { type: 'exact_text', acceptedAnswers: ['פקס רומאנה'] }, hintHe: 'חשבו על צירוף מילים לטיני שמשמעותו "שלום רומי".' },
    { id: 'history-l3-e', taskHe: 'מי היה הפילוסוף היווני שהואשם בהשחתת הנוער באתונה, נדון למוות בשתיית רעל, ושימש מורה לאפלטון?', answerConfig: { type: 'exact_text', acceptedAnswers: ['סוקרטס'] }, hintHe: 'חשבו על הפילוסוף שהתפרסם באמרה "אני יודע שאינני יודע דבר".' },
    { id: 'history-l3-f', taskHe: 'מהו שמה של החומה שבנו הרומאים בצפון בריטניה כדי לסמן ולהגן על גבול האימפריה מפני שבטים מהצפון?', answerConfig: { type: 'exact_text', acceptedAnswers: ['חומת הדריאנוס', 'חומת אדריאנוס'] }, hintHe: 'החומה נקראת על שמו של הקיסר הרומי שציווה לבנות אותה.' },
  ],
}
