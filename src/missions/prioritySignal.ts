import type { MissionConfig } from './types'

/**
 * Priority Signal — Meridian's sixth mission. Linked Records taught JOIN;
 * this teaches ORDER BY, the one core SQL concept the campaign hadn't
 * covered yet. Deliberately a single-column sort with no ties in the
 * sample data, so the correct row order is unambiguous. Uses
 * verifyOptions.ordered, a Verifier capability that already existed and
 * was already unit-tested, but had never been exercised by real mission
 * content until now.
 *
 * Gated behind Linked Records (see unlocks/services/defaultUnlockRules.ts).
 * Because Campaign/Progression/Unlock Engine derive "campaign complete"
 * from every registered mission, adding this after Linked Records moves
 * the true campaign-completion moment here with no code change to those
 * systems — the same extension point proven in v0.1.1 Step 1.
 */
export const prioritySignalMission: MissionConfig = {
  id: 'priority-signal',
  title: 'Priority Signal',
  goal: "Order Meridian's open incident reports from most to least urgent.",
  prompt:
    "The Records Core hears every district now, but it still can't tell what needs\n" +
    'answering first. Sort the open reports so the most severe rises to the top.',
  setupSql: `
    CREATE TABLE signal_reports (id INTEGER, district TEXT, issue TEXT, severity INTEGER);
    INSERT INTO signal_reports (id, district, issue, severity) VALUES
      (1, 'south', 'Power outage', 5),
      (2, 'north', 'Bridge closure', 4),
      (3, 'east', 'Market delay', 3),
      (4, 'core', 'Archive backlog', 2),
      (5, 'south', 'Noise complaint', 1);
  `,
  referenceSql: 'SELECT * FROM signal_reports ORDER BY severity DESC;',
  verifyOptions: { ordered: true },
  successEffect: { kind: 'ADJUST_STAT', districtId: 'south', stat: 'stability', delta: 20 },
  titleHe: 'אות בעדיפות',
  goalHe: 'סדר את דוחות התקרית הפתוחים של מרידיאן מהדחוף ביותר לפחות דחוף.',
  promptHe:
    'מוקד הרשומות שומע כעת כל מחוז, אך עדיין לא יודע במה לטפל קודם.\n' +
    'מיין את הדוחות הפתוחים כך שהחמור ביותר יעלה לראש הרשימה.',
}
