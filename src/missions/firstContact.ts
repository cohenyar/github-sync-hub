import type { MissionConfig } from './types'

/**
 * First Contact — Meridian's opening interaction. SQL-removal pass: this
 * used to be a "query the citizens registry" SQL exercise; it's now a
 * simple History question, but keeps its original id and successEffect so
 * campaign order, unlock rules, district/NPC pairing, and existing saves
 * (which store this id in completedMissionIds/currentMissionId) all keep
 * working unchanged — only the displayed content and kind changed.
 *
 * On success this still brings the "core" district's signal fully online.
 */
export const firstContactMission: MissionConfig = {
  id: 'first-contact',
  title: 'The First Emperor',
  goal: 'Identify who is considered the first emperor of the Roman Empire.',
  prompt:
    'Augustus is considered the first Roman emperor, ruling after the fall of the Republic and the ' +
    'civil war between Julius Caesar and his rivals.',
  subjectHe: 'היסטוריה',
  taskHe: 'מי היה הקיסר הראשון של רומא?',
  answerConfig: {
    type: 'multiple_choice',
    options: ['אוגוסטוס', 'נירון', 'יוליוס קיסר', 'טראיאנוס'],
    correctIndex: 0,
  },
  successEffect: { kind: 'SET_STAT', districtId: 'core', stat: 'signal', value: 100 },
  titleHe: 'הקיסר הראשון',
  goalHe: 'לזהות מי נחשב לקיסר הראשון של האימפריה הרומית.',
  promptHe:
    'אוגוסטוס נחשב לקיסר הרומי הראשון, ששלט אחרי נפילת הרפובליקה הרומית ומלחמת האזרחים ' +
    'שבין יוליוס קיסר למתחריו.',
  hintHe: 'רמז: הוא היה בן-אחיו המאומץ של יוליוס קיסר.',
  guidanceLevel1: 'שימו לב: התשובה מוזכרת במפורש בטקסט שלמעלה.',
  guidanceLevel3: 'חשבו מי המשיך את דרכו של יוליוס קיסר לאחר מלחמת האזרחים.',
}
