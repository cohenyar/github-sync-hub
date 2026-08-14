import type { MissionConfig } from './types'

/**
 * Linked Records — Meridian's fifth mission. SQL-removal pass: this used to
 * be a JOIN SQL exercise; it's now a simple English vocabulary question
 * (short-text answer), but keeps its original id and successEffect so the
 * unlock chain (gated behind Full Signal) and existing saves keep working
 * unchanged.
 */
export const linkedRecordsMission: MissionConfig = {
  id: 'linked-records',
  title: 'Book',
  goal: 'Translate the Hebrew word "ספר" into English.',
  prompt: '"ספר" is a bound set of printed or written pages meant to be read.',
  subjectHe: 'אנגלית',
  taskHe: "תרגם/י את המילה 'ספר' לאנגלית.",
  answerConfig: { type: 'exact_text', acceptedAnswers: ['book'] },
  successEffect: { kind: 'ADJUST_STAT', districtId: 'north', stat: 'stability', delta: 15 },
  titleHe: 'תרגום: ספר',
  goalHe: 'לתרגם לאנגלית את המילה העברית "ספר".',
  promptHe: '"ספר" הוא אוסף כרוך של דפים מודפסים או כתובים המיועד לקריאה.',
  hintHe: 'רמז: המילה באנגלית מתחילה באות B.',
  guidanceLevel1: 'שימו לב: המילה באנגלית קצרה ומוכרת מאוד.',
  guidanceLevel3: 'חשבו על מה שנמצא בספרייה, בגוף יחיד.',
}
