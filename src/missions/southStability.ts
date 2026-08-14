import type { MissionConfig } from './types'

/**
 * South Stability — Meridian's third mission. SQL-removal pass: this used
 * to be a compound-WHERE SQL exercise; it's now a simple Math question
 * (short-text answer, unlike the multiple-choice missions around it), but
 * keeps its original id and successEffect so the unlock chain (gated
 * behind District Ties) and existing saves keep working unchanged.
 */
export const southStabilityMission: MissionConfig = {
  id: 'south-stability',
  title: 'Multiplication: 8 × 7',
  goal: 'Calculate the result of 8 multiplied by 7.',
  prompt: '8 × 7 can be split into (8 × 5) + (8 × 2) = 40 + 16.',
  subjectHe: 'מתמטיקה',
  taskHe: 'מה התוצאה של 8 × 7?',
  answerConfig: { type: 'exact_text', acceptedAnswers: ['56'] },
  successEffect: { kind: 'ADJUST_STAT', districtId: 'south', stat: 'stability', delta: 30 },
  titleHe: 'כפל: 8 × 7',
  goalHe: 'לחשב את תוצאת הכפל של 8 כפול 7.',
  promptHe: 'ניתן לפרק את 8 × 7 ל- (8 × 5) + (8 × 2) = 40 + 16.',
  hintHe: 'רמז: 8 × 7 = 8×5 + 8×2.',
  guidanceLevel1: 'שימו לב: התשובה היא סכום שני המכפלות שבטקסט.',
  guidanceLevel3: 'פרקו את 7 לסכום של שני מספרים קטנים יותר וכפלו כל אחד ב-8.',
}
