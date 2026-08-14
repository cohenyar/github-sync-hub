import type { MissionConfig } from './types'

/**
 * Priority Signal — Meridian's sixth mission. SQL-removal pass: this used
 * to be an ORDER BY SQL exercise; it's now a simple Math question, but
 * keeps its original id and successEffect so the unlock chain (gated
 * behind Linked Records) and existing saves keep working unchanged.
 */
export const prioritySignalMission: MissionConfig = {
  id: 'priority-signal',
  title: 'Multiplication: 12 × 5',
  goal: 'Calculate the result of 12 multiplied by 5.',
  prompt: '12 × 5 can be split into (10 × 5) + (2 × 5) = 50 + 10.',
  subjectHe: 'מתמטיקה',
  taskHe: 'מה התוצאה של 12 × 5?',
  answerConfig: {
    type: 'multiple_choice',
    options: ['60', '50', '55', '65'],
    correctIndex: 0,
  },
  successEffect: { kind: 'ADJUST_STAT', districtId: 'south', stat: 'stability', delta: 20 },
  titleHe: 'כפל: 12 × 5',
  goalHe: 'לחשב את תוצאת הכפל של 12 כפול 5.',
  promptHe: 'ניתן לפרק את 12 × 5 ל- (10 × 5) + (2 × 5) = 50 + 10.',
  hintHe: 'רמז: 12 × 5 = 10×5 + 2×5.',
  guidanceLevel1: 'שימו לב: התשובה היא סכום שני המכפלות שבטקסט.',
  guidanceLevel3: 'פרקו את 12 לסכום של שני מספרים קטנים יותר וכפלו כל אחד ב-5.',
}
