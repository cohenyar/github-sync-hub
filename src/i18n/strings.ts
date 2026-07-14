/**
 * Player-facing UI chrome, in Hebrew. Internal keys stay English (they're
 * identifiers, not content); values are the Hebrew strings shown to players.
 *
 * Most keys below are prepared ahead of a later phase and not yet wired
 * into every component: many of these exact strings (button names, status
 * labels, Pass/Fail) are still Vitest/Playwright query targets today. They
 * only get wired in once the test suite migrates to stable selectors
 * (data-testid / role-based, decoupled from literal display text) — see
 * the localization roadmap. Wiring a key in ahead of that would silently
 * regress the very tests this phase is required to keep green.
 *
 * SQL keywords and identifiers are never translated — they stay out of
 * this dictionary entirely.
 */
export const he = {
  // Header actions
  save: 'שמור',
  saved: 'נשמר.',
  load: 'טען',
  newGame: 'משחק חדש',
  admin: 'ניהול',
  hideAdmin: 'הסתר ניהול',
  resetConfirmTitle: 'לאפס את כל ההתקדמות?',
  resetConfirmYes: 'כן, אפס',
  cancel: 'ביטול',

  // Mission Select
  missionSelectLabel: 'בחירת משימה',
  missionsTitle: 'משימות',

  // Content / mission status
  locked: 'נעולה',
  available: 'זמינה',
  completed: 'הושלמה',

  // SQL terminal
  sqlEditorLabel: 'מסוף SQL',
  sqlEditorTitle: 'מסוף SQL',
  run: 'הרץ',
  sqlPlaceholder: '-- כתוב כאן את השאילתה שלך',
  databasePrepareErrorPrefix: 'שגיאה בהכנת מסד הנתונים: ',
  sqlErrorPrefix: 'שגיאת SQL: ',

  // Mission panel
  missionPanelTitle: 'משימה',
  phaseLoading: 'מתכונן…',
  phaseActive: 'בתהליך',
  phaseError: 'שגיאה',
  contentLabelPrefix: 'תוכן: ',
  progressLabelPrefix: 'התקדמות: ',
  statusLabelPrefix: 'סטטוס: ',
  nextLabelPrefix: 'הבא: ',
  continueToPrefix: 'המשך אל ',
  missionLabel: 'משימה',
  ofLabel: 'מתוך',

  // Verdict
  pass: 'עבר',
  fail: 'נכשל',

  // NPC bio
  npcPanelTitle: 'דמות',
  close: 'סגור',

  // Debug
  showRawWorldState: 'הצג מצב עולם גולמי',
  hideRawWorldState: 'הסתר מצב עולם גולמי',

  // World Scene prototype (Phase 1) — brand-new UI, safe to author directly
  // in Hebrew since nothing depended on English text for it before.
  worldSceneToggle: 'תצוגת עולם',
  dashboardToggle: 'לוח בקרה',
  cityPlazaLabel: 'כיכר העיר מרידיאן',
  playerAvatarLabel: 'אתה',
  talkPrompt: 'לחץ לשיחה',
  enterPrompt: 'לחץ לכניסה',
  recordsCoreName: 'מוקד הרשומות',
  districtThriving: 'משגשג',
  districtStable: 'יציב',
  districtUnstable: 'לא יציב',
  dialogueCloseButton: 'סגור',
  terminalTitle: 'מסוף הרשומות',
  returnToWorldButton: 'חזרה לעולם',

  // Living World Sprint, Batch 5 — minimum audio layer.
  soundToggleOn: 'צליל: פועל',
  soundToggleOff: 'צליל: מושתק',

  // Hub World, A1 — course/world destination names and prompts. North/South/
  // East are framed as course worlds the player chooses to enter, not as
  // map directions — the internal ids ('north'/'south'/'east') never
  // appear in player-facing text.
  northCourseName: 'מסלול הצפון',
  southCourseName: 'רובע היציבות',
  eastCourseName: 'רובע הסוחרים',
  enterDestinationPrefix: 'היכנס אל ',
  destinationLockedLabel: 'נעול',
  courseProgressPrefix: 'התקדמות מסלול: ',

  // Routing foundation — placeholder pages only. Real copy/design for each
  // of these lands in its own later phase; this is just enough Hebrew text
  // for the route to not be a blank screen.
  navLandingLabel: 'ראשי',
  navDashboardLabel: 'לוח בקרה',
  navWorldLabel: 'העולם התלת־ממדי',
  navCoursesLabel: 'מסלולים',
  navTutorLabel: 'מדריך AI',
  navProgressLabel: 'התקדמות',
  navProfileLabel: 'פרופיל',
  placeholderComingSoon: 'העמוד הזה בבנייה — יגיע בהמשך.',
  landingTagline: 'פלטפורמת למידה חכמה עם עולם תלת־ממדי סוחף',
  landingEnterCta: 'כניסה לעולם',
  courseDetailPrefix: 'מסלול: ',
  notFoundTitle: 'העמוד לא נמצא',
  notFoundBackLink: 'חזרה לעמוד הראשי',
} as const

export type HebrewStringKey = keyof typeof he
