import type { MissionConfig } from './types'

/**
 * Full Signal — Meridian's fourth mission. SQL-removal pass: this used to
 * be a GROUP BY/COUNT SQL exercise; it's now a simple History question, but
 * keeps its original id and successEffect (ADVANCE_TURN) so the unlock
 * chain (gated behind South Stability) and existing saves keep working
 * unchanged.
 */
export const fullSignalMission: MissionConfig = {
  id: 'full-signal',
  title: 'The First President',
  goal: 'Identify who served as the first President of the United States.',
  prompt: 'George Washington led the Continental Army and became the first U.S. President in 1789.',
  subjectHe: 'היסטוריה',
  taskHe: 'מי היה נשיאה הראשון של ארצות הברית?',
  answerConfig: {
    type: 'multiple_choice',
    options: ["ג'ורג' וושינגטון", 'אברהם לינקולן', "תומאס ג'פרסון", "בנג'מין פרנקלין"],
    correctIndex: 0,
  },
  successEffect: { kind: 'ADVANCE_TURN' },
  titleHe: 'הנשיא הראשון',
  goalHe: 'לזהות מי שימש כנשיא הראשון של ארצות הברית.',
  promptHe: "ג'ורג' וושינגטון פיקד על הארמייה הקונטיננטלית והפך לנשיא הראשון של ארה\"ב בשנת 1789.",
  hintHe: 'רמז: שמה של בירת ארצות הברית נקראת על שמו.',
  guidanceLevel1: 'שימו לב: התשובה מוזכרת במפורש בטקסט שלמעלה.',
  guidanceLevel3: 'חשבו על מי שהעיר הבירה של ארצות הברית נקראת על שמו.',
}
