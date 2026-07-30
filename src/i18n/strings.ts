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
  sqlEditorLabel: 'שאילתה',
  sqlEditorTitle: 'שאילתה',
  run: 'הרץ',
  sqlPlaceholder: '-- כתוב כאן את השאילתה שלך',
  databasePrepareErrorPrefix: 'שגיאה בהכנת מסד הנתונים: ',
  // Player-facing replacement for the raw technical exception: never shown
  // with the underlying error text appended — that's preserved internally
  // (MissionStatus.error, and logged via console.error) for debugging only.
  databasePrepareErrorMessage: 'אירעה שגיאה בהכנת מסד הנתונים למשימה. ניתן לנסות שוב.',
  retryDatabaseSetup: 'נסה שוב',
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
  worldSceneToggle: 'חזרה לעולם',
  dashboardToggle: 'תצוגה קלאסית',
  cityPlazaLabel: 'כיכר העיר מרידיאן',
  playerAvatarLabel: 'אתה',
  talkPrompt: 'לחץ לשיחה',
  enterPrompt: 'לחץ לכניסה',
  recordsCoreName: 'מוקד הרשומות',
  districtThriving: 'משגשג',
  districtStable: 'יציב',
  districtUnstable: 'לא יציב',
  dialogueCloseButton: 'סגור',
  terminalTitle: 'הארכיון',
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

  // Game dashboard redesign — new presentation chrome only (game-ui/).
  // None of this replaces the strings above; MissionPanel/SqlEditorPanel/
  // OdinPanel/etc. keep their own existing (tested) text untouched.
  journeySummaryTitle: 'סיכום המסע',
  currentDistrictLabel: 'מחוז נוכחי',
  companionFieldLabel: 'מלווה',
  nextActionLabel: 'הפעולה הבאה',
  continueMissionCta: 'המשך משימה',
  companionPanelTitle: 'המלווה שלך',
  companionNoContext: 'אין כרגע הודעה מהמלווה.',
  activeJourneyTitle: 'היעד הפעיל',
  worldMapSectionTitle: 'מפת האזורים',
  devToolsSectionTitle: 'כלי מפתחים',
  eventMissionCompleted: 'משימה הושלמה!',
  eventMissionUnlocked: 'משימה נפתחה',
  eventNpcUnlocked: 'דמות חדשה נפתחה',
  eventDistrictUnlocked: 'אזור נפתח',
  eventCampaignCompleted: 'הקמפיין הושלם!',
  eventQueryFailed: 'השאילתה לא עברה',
  eventSaveSuccess: 'המשחק נשמר בהצלחה',
  eventLoadSuccess: 'המשחק נטען בהצלחה',
  eventNextStepAvailable: 'השלב הבא זמין',
  dismissEventLabel: 'סגור התראה',

  // Command Deck recomposition — cinematic game-interface chrome.
  stageLabel: 'שלב',
  notificationsTitle: 'אירועים אחרונים',
  questTrackTitle: 'מסלול הקמפיין',
  missionStageTitle: 'המשימה הפעילה',
  worldMapTitle: 'מפת מרידיאן',
  mapActiveLabel: 'מחוז פעיל',
  advisorTitle: 'היועץ',

  // Phase 2b — new UI chrome strings. "Odin" itself stays untranslated (a
  // proper noun); only the chrome around it is Hebrew.
  campaignProgressLabel: 'התקדמות הקמפיין',
  odinStatusLabel: 'סטטוס: דטרמיניסטי / לא מקוון',
  odinIdleMessage: 'Odin מקשיב. אין עדיין מה לדווח.',
  odinHistoryAriaLabel: 'היסטוריית ההודעות של Odin',
  npcBioAriaSuffix: 'פרופיל',
  noRowsReturned: 'לא הוחזרו שורות.',
  // Distinct from eventCampaignCompleted (the notification-toast title for
  // the same event) — both can be visible on screen at once, so they need
  // different text to stay distinguishable.
  campaignCompleteTitle: 'כל המשימות הושלמו!',

  // Phase 3A.1 — subject-selection dashboard.
  dashboardHeading: 'בחר מסלול למידה',
  subjectMathLabel: 'מתמטיקה',
  subjectMathTagline: 'תרגול חשבון בסיסי וסדר פעולות.',
  subjectEnglishLabel: 'אנגלית מהעברית',
  subjectEnglishTagline: 'תרגול אוצר מילים מעברית לאנגלית.',
  startLearningCta: 'התחל למידה',
  comingLaterBadge: 'בקרוב',

  // Phase 3A.3 — NPC interaction repair + lesson-start handoff.
  talkButtonLabel: 'שיחה',
  startLessonAction: 'התחל שיעור',
  // Phase 3A.5 — shown instead of startLessonAction once the linked lesson is already completed.
  replayLessonAction: 'תרגל שוב',

  // Phase 3A.4A — subject-neutral lesson exercise foundation.
  submitAnswerCta: 'שלח תשובה',
  exerciseCorrectFeedback: 'נכון! כל הכבוד.',
  exerciseIncorrectFeedback: 'לא מדויק. נסה/י שוב.',
  hintCta: 'הצג רמז',
  mathAnswerLabel: 'התשובה שלך',
  englishAnswerLabel: 'התרגום שלך',

  // Phase 3A.4B — connecting the lesson foundation to the live player flow.
  // Phase 3A.5: reworded to a shorter confirmation plus a separate
  // what's-next line, so it doesn't duplicate Odin's own (more specific)
  // success reaction.
  lessonSuccessMessage: 'כל הכבוד! השיעור הושלם.',
  lessonSuccessNextStepsMessage: 'אפשר לחזור לעולם, לבחור מקצוע נוסף או לתרגל שוב.',

  // Meridian UI stability pass — a readable fallback if the browser can't
  // create a WebGL context, instead of a blank screen.
  worldSceneErrorMessage: 'לא ניתן לטעון את העולם התלת־ממדי בדפדפן זה. אפשר להמשיך להשתמש בשאר האפליקציה.',

  // Auth Phase 1 — Google sign-in, sign-out, and the protected /admin route.
  signInWithGoogle: 'התחברות עם Google',
  signOut: 'התנתקות',
  authLoadingMessage: 'בודק מצב התחברות…',
  authUnavailableMessage: 'לא ניתן להתחבר לשירות ההתחברות כרגע. אפשר להמשיך במצב אורח.',
  authProfileErrorMessage: 'לא ניתן היה לאמת הרשאות משתמש. מחוברים ללא הרשאות ניהול.',
  navAdminLabel: 'ניהול',

  // Onboarding — first-time boot sequence (see src/onboarding/BootSequence.tsx).
  bootLogInitializing: 'מאתחל את מרידיאן…',
  bootLogConnectingAi: 'מתחבר לבינה המרכזית…',
  bootLogLoadingCity: 'טוען את מערכות העיר…',
  bootLogDetectingRecruit: 'מזהה מגויס חדש…',
  bootLogConnectionEstablished: 'החיבור הושלם.',
  bootOdinIntro: 'שלום. אני אודין, ואלווה אותך במרידיאן. בוא נתחיל.',
  bootSkipAction: 'דלג',

  // Meridian 1.2 — corner HUD shell, profile menu, and the Archive's
  // narrative framing (see game-ui/SettingsMenu.tsx, auth/AuthButton.tsx,
  // worldScene/components/ArchiveIntro.tsx).
  settingsMenuLabel: 'הגדרות',
  accountMenuLabel: 'תפריט חשבון',
  archiveIntroEyebrow: 'לפני שמתחילים',

  // Meridian 1.3 — Explorer Rank (Core Loop §04), one shared tier across every subject.
  explorerRankNewcomer: 'מגיע/ה חדש/ה',
  explorerRankHelper: 'עוזר/ת',
  explorerRankTrusted: 'יד נאמנה',
  explorerRankGuardian: 'שומר/ת האות',

  // Meridian 1.3 — NPC familiarity tiers (Core Loop §06).
  npcFamiliarityStranger: 'זר/ה',
  npcFamiliarityAcquaintance: 'מכר/ה',
  npcFamiliarityTrusted: 'בת/בן סמך',
  npcFamiliarityFriend: 'חבר/ה',
  npcFamiliarityLabel: 'קרבה: ',

  // Meridian 1.3 — Archive Pages (Core Loop §04 collectibles).
  archivePagesTitle: 'עמודי הארכיון',
  archivePagesButtonLabel: 'ארכיון',
  archivePagesEmpty: 'עדיין לא נמצאו עמודים.',
  archivePageFoundToast: 'עמוד ארכיון נמצא: ',
} as const

export type HebrewStringKey = keyof typeof he
