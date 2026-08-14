import type { MissionConfig } from './types'

/**
 * District Ties — Meridian's second mission. SQL-removal pass: this used to
 * be a "filter citizens by district" SQL exercise; it's now a simple
 * English vocabulary question, but keeps its original id and successEffect
 * so the unlock chain (gated behind First Contact) and existing saves keep
 * working unchanged.
 */
export const districtTiesMission: MissionConfig = {
  id: 'district-ties',
  title: 'Library',
  goal: 'Choose the correct English translation for the Hebrew word "ספרייה".',
  prompt: '"ספרייה" is the place where books are borrowed and read.',
  subjectHe: 'אנגלית',
  taskHe: "בחר/י את התרגום הנכון למילה 'ספרייה'",
  answerConfig: {
    type: 'multiple_choice',
    options: ['Library', 'School', 'Market', 'Hospital'],
    correctIndex: 0,
  },
  successEffect: { kind: 'ADJUST_STAT', districtId: 'north', stat: 'loyalty', delta: 15 },
  titleHe: 'תרגום: ספרייה',
  goalHe: 'לבחור את התרגום הנכון באנגלית למילה "ספרייה".',
  promptHe: '"ספרייה" הוא המקום שבו שואלים וקוראים ספרים.',
  hintHe: 'רמז: זהו המקום שבו שואלים ספרים.',
  guidanceLevel1: 'שימו לב: המילה מתחילה באות L באנגלית.',
  guidanceLevel3: 'חשבו על המקום שבו נמצאים המון ספרים להשאלה.',
}
