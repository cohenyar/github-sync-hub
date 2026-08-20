import { districtTiesMission } from '../districtTies'
import { linkedRecordsMission } from '../linkedRecords'
import type { QuestionPool } from './types'

/**
 * Real difficulty differentiation pass — English's own question pool. See
 * history.ts's file header for the shared design: Level 1's first two
 * entries are the exact, unchanged districtTies/linkedRecords content.
 */
export const englishPool: QuestionPool = {
  1: [
    { id: 'english-l1-a', taskHe: districtTiesMission.taskHe, answerConfig: districtTiesMission.answerConfig, hintHe: districtTiesMission.hintHe ?? '' },
    { id: 'english-l1-b', taskHe: linkedRecordsMission.taskHe, answerConfig: linkedRecordsMission.answerConfig, hintHe: linkedRecordsMission.hintHe ?? '' },
    {
      id: 'english-l1-c',
      taskHe: "בחר/י את התרגום הנכון למילה 'כלב'",
      answerConfig: { type: 'multiple_choice', options: ['Dog', 'Cat', 'Bird', 'Fish'], correctIndex: 0 },
      hintHe: 'רמז: זהו חיית המחמד הנאמנה ביותר, לפי הפתגם.',
    },
    {
      id: 'english-l1-d',
      taskHe: "בחר/י את התרגום הנכון למילה 'בית'",
      answerConfig: { type: 'multiple_choice', options: ['House', 'Car', 'Tree', 'Sun'], correctIndex: 0 },
      hintHe: 'רמז: זה המקום שבו גרים.',
    },
    {
      id: 'english-l1-e',
      taskHe: "בחר/י את התרגום הנכון למילה 'חלון'",
      answerConfig: { type: 'multiple_choice', options: ['Window', 'Door', 'Wall', 'Roof'], correctIndex: 0 },
      hintHe: 'רמז: דרכו אפשר לראות החוצה מהבית.',
    },
    {
      id: 'english-l1-f',
      taskHe: "השלימו: 'She ___ a student.'",
      answerConfig: { type: 'multiple_choice', options: ['is', 'are', 'am', 'be'], correctIndex: 0 },
      hintHe: 'רמז: מדובר בגוף שלישי יחיד (she) בזמן הווה.',
    },
  ],
  2: [
    {
      id: 'english-l2-a',
      taskHe: "מהי צורת הרבים הנכונה של המילה 'child'?",
      answerConfig: { type: 'multiple_choice', options: ['children', 'childs', 'childes', 'childrens'], correctIndex: 0 },
      hintHe: 'רמז: זו אחת מצורות הרבים היוצאות מן הכלל באנגלית.',
    },
    { id: 'english-l2-b', taskHe: "תרגם/י את המילה 'מהיר' לאנגלית.", answerConfig: { type: 'exact_text', acceptedAnswers: ['fast', 'quick'] }, hintHe: 'רמז: המילה מתארת מישהו שרץ הרבה.' },
    {
      id: 'english-l2-c',
      taskHe: 'איזו מהמילים הבאות היא פועל (verb)?',
      answerConfig: { type: 'multiple_choice', options: ['run', 'table', 'happy', 'blue'], correctIndex: 0 },
      hintHe: 'רמז: פועל הוא מילה שמתארת פעולה.',
    },
    { id: 'english-l2-d', taskHe: "מהו הניגוד (antonym) של המילה 'hot'?", answerConfig: { type: 'exact_text', acceptedAnswers: ['cold'] }, hintHe: 'רמז: חשבו על מזג האוויר בחורף.' },
    { id: 'english-l2-e', taskHe: "תרגם/י את המילה 'water' לעברית.", answerConfig: { type: 'exact_text', acceptedAnswers: ['מים'] }, hintHe: 'רמז: אפשר לשתות את זה, וזה יורד כשיש גשם.' },
    {
      id: 'english-l2-f',
      taskHe: "בחר/י את מילת היחס הנכונה: 'I live ___ Tel Aviv.'",
      answerConfig: { type: 'multiple_choice', options: ['in', 'at', 'on', 'to'], correctIndex: 0 },
      hintHe: 'רמז: משתמשים במילה הזו כשמדברים על להיות בתוך עיר או מדינה.',
    },
  ],
  3: [
    { id: 'english-l3-a', taskHe: "מהי צורת העבר (past tense) של הפועל 'go'?", answerConfig: { type: 'exact_text', acceptedAnswers: ['went'] }, hintHe: 'זהו פועל יוצא דופן (irregular) — הצורה לא נגמרת ב-ed.' },
    { id: 'english-l3-b', taskHe: "השלימו את המשפט בצורה הנכונה: 'She ___ to school every day.'", answerConfig: { type: 'exact_text', acceptedAnswers: ['goes'] }, hintHe: 'חשבו על הטיית הפועל בגוף שלישי יחיד בהווה.' },
    { id: 'english-l3-c', taskHe: "מהו שם התואר (adjective) במשפט: 'The tall man walked in.'?", answerConfig: { type: 'exact_text', acceptedAnswers: ['tall'] }, hintHe: 'חשבו על המילה שמתארת את האיש.' },
    {
      id: 'english-l3-d',
      // Question-selection fix pass — replaces the original "plural of
      // 'mouse'? -> mice", a near-duplicate of l2-a ("plural of 'child'?
      // -> children"): same irregular-plural rule, same exercise shape,
      // even near-identical hint text. Tests a grammar point not covered
      // anywhere else in the pool instead.
      taskHe: "השלימו את המשפט בצורת השייכות (possessive) הנכונה: 'This is ___ (Sarah) book.'",
      answerConfig: { type: 'exact_text', acceptedAnswers: ["Sarah's"] },
      hintHe: "רמז: כדי לבטא שייכות לשם פרטי באנגלית (כמו 'של שרה'), בדרך כלל לא משתמשים במילה 'of' אלא בצורה קצרה שמתווספת ישירות לסוף השם.",
    },
    { id: 'english-l3-e', taskHe: "השלימו את המשפט בצורה הנכונה: 'How ___ money do you have?'", answerConfig: { type: 'exact_text', acceptedAnswers: ['much'] }, hintHe: 'רמז: חשבו אם אפשר לספור את הדבר הזה במספרים (אחד, שניים) או לא — זה משפיע על מילת הכמות המתאימה.' },
    { id: 'english-l3-f', taskHe: "מהי צורת ההשוואה (comparative) של שם התואר 'good'?", answerConfig: { type: 'exact_text', acceptedAnswers: ['better'] }, hintHe: 'רמז: זו אחת מצורות ההשוואה החריגות באנגלית — היא לא נוצרת רק בהוספת סיומת בסוף המילה המקורית.' },
  ],
}
