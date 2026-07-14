import type { MissionConfig } from './types'

/**
 * Linked Records — Meridian's fifth mission and its true finale. Full
 * Signal taught GROUP BY/COUNT; this is the natural next step, introducing
 * a single INNER JOIN across two related tables. Deliberately simple: one
 * shared column (district), no aggregate combined with the join, no
 * subquery — beginner/intermediate SQL, same as every mission before it.
 *
 * The officials table intentionally mirrors four NPCs already on the
 * World Map (Devrin Kass, Priya Nandall, Tomas Reyeth, Mera Solt), so the
 * join's result set connects data the player has already seen in the
 * world back to the citizens they've been counting since First Contact.
 *
 * Gated behind Full Signal (see unlocks/services/defaultUnlockRules.ts).
 * Because the Unlock/Campaign/Progression systems derive "campaign
 * complete" from every registered mission, adding this after Full Signal
 * moves the true campaign-completion moment here without any code change
 * to those systems — exactly the extension point the v0.1 baseline
 * documented.
 */
export const linkedRecordsMission: MissionConfig = {
  id: 'linked-records',
  title: 'Linked Records',
  goal: 'Connect every citizen in the registry to the official representing their district.',
  prompt:
    "The Records Core knows its citizens. It knows its officials. It has never connected the two.\n" +
    'Join both tables on district to bring every citizen face to face with who represents them.',
  setupSql: `
    CREATE TABLE citizens (id INTEGER, name TEXT, district TEXT);
    INSERT INTO citizens (id, name, district) VALUES
      (1, 'Iris Vell', 'north'),
      (2, 'Bram Osei', 'south'),
      (3, 'Talia Nkemdirim', 'north'),
      (4, 'Coen Adeyemi', 'east'),
      (5, 'Nora Kessel', 'south'),
      (6, 'Petra Voss', 'core');

    CREATE TABLE district_officials (district TEXT, official TEXT, role TEXT);
    INSERT INTO district_officials (district, official, role) VALUES
      ('north', 'Devrin Kass', 'District Warden'),
      ('south', 'Priya Nandall', 'Community Organizer'),
      ('east', 'Tomas Reyeth', 'Trade Broker'),
      ('core', 'Mera Solt', 'Archivist');
  `,
  referenceSql:
    'SELECT citizens.name, district_officials.official ' +
    'FROM citizens JOIN district_officials ON citizens.district = district_officials.district;',
  successEffect: { kind: 'ADJUST_STAT', districtId: 'north', stat: 'stability', delta: 15 },
}
