import { prioritySignalMission } from '../prioritySignal'
import { southStabilityMission } from '../southStability'
import type { QuestionPool } from './types'

/**
 * Real difficulty differentiation pass — Math's own question pool. See
 * history.ts's file header for the shared design: Level 1's first two
 * entries are the exact, unchanged southStability/prioritySignal content.
 */
export const mathPool: QuestionPool = {
  1: [
    { id: 'math-l1-a', taskHe: southStabilityMission.taskHe, answerConfig: southStabilityMission.answerConfig, hintHe: southStabilityMission.hintHe ?? '' },
    { id: 'math-l1-b', taskHe: prioritySignalMission.taskHe, answerConfig: prioritySignalMission.answerConfig, hintHe: prioritySignalMission.hintHe ?? '' },
    {
      id: 'math-l1-c',
      taskHe: 'מה התוצאה של 4 + 5?',
      answerConfig: { type: 'multiple_choice', options: ['9', '8', '10', '7'], correctIndex: 0 },
      hintHe: 'רמז: ספרו על האצבעות אם צריך.',
    },
    { id: 'math-l1-d', taskHe: 'מה התוצאה של 10 - 3?', answerConfig: { type: 'exact_text', acceptedAnswers: ['7'] }, hintHe: 'רמז: התחילו מ-10 וספרו אחורה 3 פעמים.' },
  ],
  2: [
    { id: 'math-l2-a', taskHe: 'מה התוצאה של 15 × 4?', answerConfig: { type: 'exact_text', acceptedAnswers: ['60'] }, hintHe: 'רמז: 15 × 4 = 15 × 2 × 2.' },
    {
      id: 'math-l2-b',
      taskHe: 'מה התוצאה של 100 ÷ 4?',
      answerConfig: { type: 'multiple_choice', options: ['25', '20', '30', '40'], correctIndex: 0 },
      hintHe: 'רמז: כמה פעמים 4 נכנס ב-100?',
    },
    { id: 'math-l2-c', taskHe: 'מה התוצאה של 9 × 9?', answerConfig: { type: 'exact_text', acceptedAnswers: ['81'] }, hintHe: 'רמז: 9 × 9 = 9 × 10 - 9.' },
    {
      id: 'math-l2-d',
      taskHe: 'מה התוצאה של 6 בריבוע (6²)?',
      answerConfig: { type: 'multiple_choice', options: ['36', '12', '24', '32'], correctIndex: 0 },
      hintHe: 'רמז: בריבוע פירושו להכפיל את המספר בעצמו.',
    },
  ],
  3: [
    { id: 'math-l3-a', taskHe: 'מה התוצאה של 17 × 13?', answerConfig: { type: 'exact_text', acceptedAnswers: ['221'] }, hintHe: 'נסו לפרק אחד המספרים לסכום של שני מספרים עגולים יותר.' },
    { id: 'math-l3-b', taskHe: 'מה התוצאה של 25% מתוך 80?', answerConfig: { type: 'exact_text', acceptedAnswers: ['20'] }, hintHe: 'חשבו על 25% כרבע מהמספר.' },
    { id: 'math-l3-c', taskHe: 'מה התוצאה של 144 ÷ 12?', answerConfig: { type: 'exact_text', acceptedAnswers: ['12'] }, hintHe: 'חשבו איזה מספר כפול עצמו קרוב ל-144.' },
    { id: 'math-l3-d', taskHe: 'מה התוצאה של 7 בשלישית (7³)?', answerConfig: { type: 'exact_text', acceptedAnswers: ['343'] }, hintHe: 'בשלישית פירושו להכפיל את המספר בעצמו פעמיים.' },
  ],
}
