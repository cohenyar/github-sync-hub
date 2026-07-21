import type { MissionConfig } from './types'

/**
 * South Stability — Meridian's third mission. Builds on District Ties'
 * single-column WHERE filter by introducing a compound condition (AND plus
 * a numeric comparison), a natural next step before Full Signal's
 * aggregate query. Gated behind completing District Ties (see
 * unlocks/services/defaultUnlockRules.ts).
 */
export const southStabilityMission: MissionConfig = {
  id: 'south-stability',
  title: 'South Stability',
  goal: 'Surface the serious incident reports destabilizing the South district.',
  prompt:
    "South is the city's most unstable district. Meridian keeps a log of civic reports, but not\n" +
    'every report demands action. Find every South district report rated severity 3 or higher.',
  setupSql: `
    CREATE TABLE district_reports (id INTEGER, district TEXT, issue TEXT, severity INTEGER);
    INSERT INTO district_reports (id, district, issue, severity) VALUES
      (1, 'south', 'Water shortage', 4),
      (2, 'south', 'Late transit', 2),
      (3, 'north', 'Noise complaint', 3),
      (4, 'south', 'Power outage', 5),
      (5, 'east', 'Market delay', 1);
  `,
  referenceSql: "SELECT * FROM district_reports WHERE district = 'south' AND severity >= 3;",
  successEffect: { kind: 'ADJUST_STAT', districtId: 'south', stat: 'stability', delta: 30 },
  titleHe: 'יציבות הדרום',
  goalHe: 'העלה את דוחות התקרית החמורים שמערערים את יציבות מחוז הדרום.',
  promptHe:
    'הדרום הוא המחוז הכי לא יציב בעיר. במרידיאן מתועדים דוחות אזרחיים, אך לא כולם דורשים טיפול מיידי.\n' +
    'אתר כל דוח במחוז הדרום שדורג בחומרה 3 ומעלה.',
}
