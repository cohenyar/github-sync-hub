import type { MissionConfig } from './types'

/**
 * District Ties — Meridian's second mission. Builds on First Contact's
 * citizens registry by adding a district column and teaching WHERE
 * filtering. Gated behind completing First Contact (see
 * unlocks/services/defaultUnlockRules.ts) — the first real, live use of
 * the Unlock Engine's missionCompleted condition.
 */
export const districtTiesMission: MissionConfig = {
  id: 'district-ties',
  title: 'District Ties',
  goal: "Reveal which citizens call Meridian's North district home.",
  prompt:
    'The Records Core can see citizens now, but not where they live.\n' +
    "Filter the registry to bring North district's ties into focus.",
  setupSql: `
    CREATE TABLE citizens (id INTEGER, name TEXT, district TEXT);
    INSERT INTO citizens (id, name, district) VALUES
      (1, 'Iris Vell', 'north'),
      (2, 'Bram Osei', 'south'),
      (3, 'Talia Nkemdirim', 'north'),
      (4, 'Coen Adeyemi', 'east');
  `,
  referenceSql: "SELECT * FROM citizens WHERE district = 'north';",
  successEffect: { kind: 'ADJUST_STAT', districtId: 'north', stat: 'loyalty', delta: 15 },
  titleHe: 'קשרי מחוז',
  // Playtest fix pass (issue 5) — normalized from "חשוף/חשפי" to the
  // short-suffix style used consistently across this mission screen.
  goalHe: 'חשוף/י אילו תושבים גרים במחוז הצפון של מרידיאן.',
  promptHe:
    'מוקד הרשומות כבר רואה את התושבים, אך לא את מקום מגוריהם.\n' +
    'סנן/י את המרשם כדי להעלות את קשרי מחוז הצפון.',
  hintHe: 'רמז: סנן/י את טבלת citizens לפי עמודת district.',
}
