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
  ],
  3: [
    { id: 'english-l3-a', taskHe: "מהי צורת העבר (past tense) של הפועל 'go'?", answerConfig: { type: 'exact_text', acceptedAnswers: ['went'] }, hintHe: 'זהו פועל יוצא דופן (irregular) — הצורה לא נגמרת ב-ed.' },
    { id: 'english-l3-b', taskHe: "השלימו את המשפט בצורה הנכונה: 'She ___ to school every day.'", answerConfig: { type: 'exact_text', acceptedAnswers: ['goes'] }, hintHe: 'חשבו על הטיית הפועל בגוף שלישי יחיד בהווה.' },
    { id: 'english-l3-c', taskHe: "מהו שם התואר (adjective) במשפט: 'The tall man walked in.'?", answerConfig: { type: 'exact_text', acceptedAnswers: ['tall'] }, hintHe: 'חשבו על המילה שמתארת את האיש.' },
    { id: 'english-l3-d', taskHe: "מהי צורת הרבים (plural) של המילה 'mouse'?", answerConfig: { type: 'exact_text', acceptedAnswers: ['mice'] }, hintHe: 'זו אחת מצורות הרבים היוצאות מן הכלל באנגלית.' },
  ],
}
