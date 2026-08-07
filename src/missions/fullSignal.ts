import type { MissionConfig } from './types'

/**
 * Full Signal — Meridian's capstone mission. The citizens registry now
 * spans every district; this teaches GROUP BY + COUNT, a deliberately
 * moderate step up from the single-table WHERE filters of the earlier
 * missions (no JOIN, no subqueries — beginner/intermediate aggregate SQL).
 * Gated behind completing South Stability, and completing it finishes the
 * campaign (see defaultCampaign, which derives from missionRegistry order).
 */
export const fullSignalMission: MissionConfig = {
  id: 'full-signal',
  title: 'Full Signal',
  goal: "See Meridian whole: how many citizens the registry now holds, district by district.",
  prompt:
    'Every district now answers the registry. Count how many citizens live in each district —\n' +
    'the first time the Records Core has ever seen the whole city at once.',
  setupSql: `
    CREATE TABLE citizens (id INTEGER, name TEXT, district TEXT);
    INSERT INTO citizens (id, name, district) VALUES
      (1, 'Iris Vell', 'north'),
      (2, 'Bram Osei', 'south'),
      (3, 'Talia Nkemdirim', 'north'),
      (4, 'Coen Adeyemi', 'east'),
      (5, 'Nora Kessel', 'south'),
      (6, 'Petra Voss', 'core');
  `,
  referenceSql: 'SELECT district, COUNT(*) AS total FROM citizens GROUP BY district;',
  successEffect: { kind: 'ADVANCE_TURN' },
  titleHe: 'אות מלא',
  goalHe: 'ראה/י את מרידיאן כולה: כמה תושבים רשומים במרשם, לפי מחוז.',
  // Playtest fix pass (issue 5) — normalized from "ספור/ספרי" to the
  // short-suffix style used consistently across this mission screen.
  promptHe:
    'כל מחוז עונה כעת למרשם. ספור/י כמה תושבים חיים בכל מחוז — ' +
    'הפעם הראשונה שמוקד הרשומות רואה את העיר כולה בבת אחת.',
  hintHe: 'רמז: קבץ/י לפי district (GROUP BY) וספר/י שורות בכל קבוצה (COUNT).',
}
