import type { MissionConfig } from './types'

/**
 * First Contact — Meridian's opening interaction: a living-database city
 * whose Records Core cannot see its own citizens until the player queries
 * the registry. This is intentionally small (one table, one query), but it
 * is real mission content, not a disposable placeholder.
 *
 * On success this brings the "core" district's signal fully online — the
 * first visible proof that a correct query changes the world, not just a
 * pass/fail label. A richer visual (citizen dots appearing on the map) is
 * still future work; for now the world reacts through the existing
 * district-intensity rendering built in earlier steps.
 */
export const firstContactMission: MissionConfig = {
  id: 'first-contact',
  title: 'First Contact',
  goal: 'Bring the Records Core online by discovering the citizens registered in the city.',
  prompt:
    'The Records Core is blind. Meridian has citizens, but the city cannot see them yet.\n' +
    'Query the citizens registry and bring the first signal online.',
  setupSql: `
    CREATE TABLE citizens (id INTEGER, name TEXT);
    INSERT INTO citizens (id, name) VALUES
      (1, 'Iris Vell'),
      (2, 'Bram Osei'),
      (3, 'Talia Nkemdirim'),
      (4, 'Coen Adeyemi');
  `,
  referenceSql: 'SELECT * FROM citizens;',
  successEffect: { kind: 'SET_STAT', districtId: 'core', stat: 'signal', value: 100 },
  titleHe: 'מגע ראשון',
  goalHe: 'הפעל את מוקד הרשומות באמצעות איתור התושבים הרשומים בעיר.',
  promptHe:
    'מוקד הרשומות עיוור. במרידיאן יש תושבים, אך העיר עדיין לא רואה אותם.\n' +
    'שאל את מרשם התושבים והעלה את האות הראשון.',
}
