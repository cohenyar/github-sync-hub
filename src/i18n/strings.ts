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
  resetConfirmYes: 'כן, אפס/י',
  cancel: 'ביטול',

  // Mission Select
  missionSelectLabel: 'בחירת משימה',
  missionsTitle: 'משימות',

  // Content / mission status
  locked: 'נעולה',
  available: 'זמינה',
  completed: 'הושלמה',

  // SQL terminal
  // Playtest fix pass (issue 5) — "שאילתה" (Query) duplicated as both the
  // aria-label and the visible header read as a generic technical form
  // label with no narrative framing. Renamed to name what the player is
  // actually doing (issuing a command to the Records Hub's core), and
  // "run" was normalized from the malformed "הרץ/הריצי" full-word slash
  // form to the short-suffix style used consistently across this screen.
  sqlEditorLabel: 'הפקודה שלך',
  sqlEditorTitle: 'הפקודה שלך',
  run: 'הרץ/י',
  sqlPlaceholder: '-- כתוב כאן את השאילתה שלך',
  // A single, generic, non-spoiler syntax reminder — never the mission's
  // own referenceSql, which would just hand over the answer.
  sqlExampleHint: 'לדוגמה: SELECT * FROM שם_טבלה;',
  databasePrepareErrorPrefix: 'שגיאה בהכנת מסד הנתונים: ',
  // Player-facing replacement for the raw technical exception: never shown
  // with the underlying error text appended — that's preserved internally
  // (MissionStatus.error, and logged via console.error) for debugging only.
  databasePrepareErrorMessage: 'אירעה שגיאה בהכנת מסד הנתונים למשימה. ניתן לנסות שוב.',
  retryDatabaseSetup: 'נסה/י שוב',
  sqlErrorPrefix: 'שגיאת SQL: ',

  // First Mission UX pass — the objective/instruction pair every mission
  // screen leads with, ahead of any secondary metadata (see MissionPanel.tsx).
  missionGoalLabel: 'מטרה: ',
  missionInstructionLabel: 'מה עושים: ',
  missionMoreDetailsLabel: 'פרטים נוספים',

  // Mission panel
  missionPanelTitle: 'משימה',
  phaseLoading: 'מתכונן…',
  phaseActive: 'בתהליך',
  phaseError: 'שגיאה',
  contentLabelPrefix: 'תוכן: ',
  progressLabelPrefix: 'התקדמות: ',
  statusLabelPrefix: 'סטטוס: ',
  nextLabelPrefix: 'הבא: ',
  continueToPrefix: 'המשך/י אל ',
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
  playerAvatarLabel: 'את/ה',
  talkPrompt: 'לחץ/י לשיחה',
  enterPrompt: 'לחץ/י לכניסה',
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
  enterDestinationPrefix: 'היכנס/י אל ',
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
  continueMissionCta: 'המשך/י משימה',
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
  dismissEventLabel: 'סגור/סגרי התראה',

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
  // Playtest fix pass (issue 6C) — a small, deterministic help panel (no
  // AI/LLM): no such entry point existed anywhere before this. Mounted
  // right alongside the existing Odin panel (see AskOdinPanel.tsx).
  askOdinPanelTitle: 'שאל/י את אודין',
  askOdinWhatNowLabel: 'מה לעשות עכשיו?',
  askOdinHintLabel: 'תן לי רמז.',
  askOdinExplainLabel: 'הסבר את המשימה.',
  askOdinWhyFailedLabel: 'למה הפקודה לא עבדה?',
  askOdinWhereToGoLabel: 'לאן ללכת?',
  askOdinNoHintFallback: 'אין רמז נוסף למשימה הזו כרגע — אפשר לנסות "הסבר את המשימה".',
  askOdinNoErrorYetFallback: 'לא נרשמה שגיאה עדיין. הרץ/י שאילתה כדי לבדוק.',
  askOdinWhereToGoPrefix: 'המטרה הנוכחית שלך היא להגיע אל ',
  askOdinNoDestinationFallback: 'אין יעד ספציפי כרגע — אפשר להמשיך לחקור את העיר.',
  npcBioAriaSuffix: 'פרופיל',
  noRowsReturned: 'לא הוחזרו שורות.',
  // Distinct from eventCampaignCompleted (the notification-toast title for
  // the same event) — both can be visible on screen at once, so they need
  // different text to stay distinguishable.
  campaignCompleteTitle: 'כל המשימות הושלמו!',

  // Phase 3A.1 — subject-selection dashboard.
  dashboardHeading: 'בחר/י מסלול למידה',
  subjectMathLabel: 'מתמטיקה',
  subjectMathTagline: 'תרגול חשבון בסיסי וסדר פעולות.',
  subjectEnglishLabel: 'אנגלית מהעברית',
  subjectEnglishTagline: 'תרגול אוצר מילים מעברית לאנגלית.',
  startLearningCta: 'התחל/התחילי למידה',
  comingLaterBadge: 'בקרוב',

  // Phase 3A.3 — NPC interaction repair + lesson-start handoff.
  talkButtonLabel: 'שיחה',
  // Game Feel pass — the district-kind counterpart of talkButtonLabel, for
  // InteractionPrompt's new destination-enter-button (touch's equivalent
  // of pressing E/Enter on an available district).
  enterButtonLabel: 'כניסה',
  startLessonAction: 'התחל/התחילי שיעור',
  // Phase 3A.5 — shown instead of startLessonAction once the linked lesson is already completed.
  replayLessonAction: 'תרגל/י שוב',

  // Phase 3A.4A — subject-neutral lesson exercise foundation.
  submitAnswerCta: 'שלח/י תשובה',
  exerciseCorrectFeedback: 'נכון! כל הכבוד.',
  exerciseIncorrectFeedback: 'לא מדויק. נסה/י שוב.',
  hintCta: 'הצג/הציגי רמז',
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

  // Game Feel pass — whole-app crash fallback (see errorReporting/AppErrorFallback.tsx).
  appErrorFallbackMessage: 'משהו השתבש. אפשר לרענן את הדף ולנסות שוב.',
  reloadPageCta: 'רענון הדף',

  // Auth Phase 1 — Google sign-in, sign-out, and the protected /admin route.
  signInWithGoogle: 'התחברות עם Google',
  signOut: 'התנתקות',
  authLoadingMessage: 'בודק מצב התחברות…',
  /** Branded fallback while a lazily-loaded route chunk downloads. */
  appLoadingMessage: 'טוען את מרידיאן…',
  /** Non-blocking warning when Cloud auth takes too long and we fall back to guest. */
  authTimeoutMessage: 'החיבור לחשבון איטי — אפשר להמשיך כאורח.',
  authUnavailableMessage: 'לא ניתן להתחבר לשירות ההתחברות כרגע. אפשר להמשיך במצב אורח.',
  authProfileErrorMessage: 'לא ניתן היה לאמת הרשאות משתמש. מחוברים ללא הרשאות ניהול.',
  navAdminLabel: 'ניהול',
  // Mobile UX pass — H2: on a narrow viewport the signed-out sign-in row
  // (Google button + /auth link + email toggle) collapses behind one
  // compact trigger instead of overflowing the corner HUD; this is its
  // accessible name (see AuthButton.tsx/.module.css).
  authMobileMenuLabel: 'אפשרויות התחברות',

  // Playtest fix pass — Google's managed OAuth redirect (/~oauth/initiate)
  // only resolves on Lovable's hosted infrastructure; on a bare Vite dev
  // server it 404s. AuthProvider.signInWithGoogle detects this (see
  // runtimeEnvironment.ts) and sets this message instead of navigating.
  authGoogleLocalDevMessage:
    'התחברות Google זמינה בגרסת Lovable המפורסמת. בפיתוח מקומי ניתן להמשיך כאורח או להתחבר במייל.',
  returnToWelcomeChoicesLabel: 'חזרה למסך הפתיחה',
  // Playtest fix pass — "returning local player" is now shown as its own
  // distinct state from "guest," since having a local profile already
  // means something more specific than "no account yet" (see
  // WelcomeScreen.tsx).
  welcomeReturningLocalLabel: 'משתמש/ת מקומי/ת — ממשיכ/ה מסע קיים שנשמר במכשיר הזה.',

  // Playtest fix pass (issue 2) — InteractionPrompt.tsx previously labeled
  // the Records Hub's own enter button with he.talkButtonLabel ("שיחה"),
  // a copy bug (it's not an NPC). The Hub also gets a specific action verb
  // instead of the generic Enter, per the playtest's explicit request.
  activateRecordsHubButtonLabel: 'הפעל/י את מוקד הרשומות',
  // Playtest fix pass (issue 4) — a locked destination used to show only
  // "Locked" with zero explanation. Combined with the blocking mission's
  // own titleHe (see destinationContent.getDestinationLockRequirementMissionId),
  // e.g. "רובע הסוחרים — נדרש: השלמת יציבות הדרום".
  destinationLockRequirementPrefix: 'נדרש: השלמת ',

  // Game Feel pass — email/password sign-in alongside the existing Google
  // option (see auth/EmailPasswordForm.tsx).
  emailAuthToggleLabel: 'התחברות עם אימייל',
  emailLabel: 'אימייל',
  passwordLabel: 'סיסמה',
  emailSignInSubmitCta: 'התחברות',
  emailSignUpSubmitCta: 'יצירת חשבון',
  switchToSignUpPrompt: 'אין לך חשבון? יצירת חשבון',
  switchToSignInPrompt: 'יש לך כבר חשבון? התחברות',
  checkYourEmailTitle: 'בדיקת אימייל',
  checkYourEmailBody: 'שלחנו קישור אישור לכתובת האימייל שלך. יש לאשר אותו כדי להשלים את ההתחברות.',
  authErrorInvalidCredentials: 'אימייל או סיסמה שגויים.',
  authErrorUserExists: 'כבר קיים חשבון עם כתובת האימייל הזו.',
  authErrorEmailNotConfirmed: 'יש לאשר את כתובת האימייל לפני ההתחברות.',
  authErrorRateLimited: 'יותר מדי ניסיונות. אפשר לנסות שוב בעוד כמה דקות.',
  authErrorWeakPassword: 'הסיסמה חלשה מדי. יש לבחור סיסמה ארוכה יותר.',
  authErrorGeneric: 'משהו השתבש. אפשר לנסות שוב.',

  // Google OAuth failures are almost always browser-side and fixable by the
  // player (blocked popup, third-party cookies off) — each gets a specific,
  // actionable message instead of one generic failure line.
  authGoogleErrorPopupBlocked:
    'חלון ההתחברות של Google נחסם על ידי הדפדפן. יש לאשר חלונות קופצים (popups) לאתר הזה ולנסות שוב, או להתחבר עם אימייל וסיסמה.',
  authGoogleErrorPopupClosed: 'חלון ההתחברות של Google נסגר לפני סיום. אפשר לנסות שוב.',
  authGoogleErrorCookiesBlocked:
    'הדפדפן חוסם קובצי Cookie של צד שלישי, ולכן התחברות Google לא הושלמה. יש לאפשר קובצי Cookie של צד שלישי לאתר הזה (או לצאת ממצב גלישה פרטית) ולנסות שוב.',
  authGoogleErrorNetwork: 'החיבור לשירות ההתחברות נכשל. כדאי לבדוק את חיבור האינטרנט ולנסות שוב.',
  authGoogleErrorUnknown:
    'ההתחברות עם Google נכשלה. אפשר לנסות שוב, לוודא שחלונות קופצים וקובצי Cookie מאופשרים, או להתחבר עם אימייל וסיסמה.',
  authRetryCta: 'ניסיון נוסף',

  // Guest → Account migration messaging — reassurance only, no new
  // persistence: the local save was never touched by auth to begin with
  // (see AuthProvider.tsx), this just says so out loud.
  guestProgressCarriesOverMessage: 'ההתקדמות השמורה במכשיר הזה תישאר זמינה גם אחרי ההתחברות.',

  // Auth UX bug-fix pass — a missing Supabase configuration used to hide
  // every sign-in control with no explanation at all (see AuthButton.tsx/
  // WelcomeScreen.tsx). These replace that silence with an honest message,
  // and give the signed-out/no-account state its own persistent label
  // instead of only ever showing as an absence of UI.
  guestModeLabel: 'מצב אורח',
  authNotConfiguredShortLabel: 'התחברות לא הוגדרה',
  authNotConfiguredMessage:
    'התחברות עדיין לא הוגדרה בסביבה הזו — חסרים משתני הסביבה VITE_SUPABASE_URL ו-VITE_SUPABASE_PUBLISHABLE_KEY. אפשר להמשיך לשחק במצב אורח בינתיים.',
  // Playtest fix pass — a distinct, accurate message for when the Cloud env
  // vars ARE present but the generated client still failed to load (see
  // AuthContextValue.cloudClientLoadFailed) — this used to incorrectly
  // reuse authNotConfiguredMessage, which claims the env vars are missing
  // even when they aren't.
  authCloudLoadFailedShortLabel: 'טעינת ההתחברות נכשלה',
  authCloudLoadFailedMessage:
    'שירות ההתחברות לענן נכשל בטעינה בסביבה הזו — זו אינה בעיית הגדרה. אפשר לנסות לרענן את הדף, ובינתיים אפשר להמשיך לשחק במצב אורח.',
  signOutErrorMessage: 'ההתנתקות נכשלה. אפשר לנסות שוב.',

  // Auth Phase 2 — the dedicated /auth and /reset-password pages (Lovable
  // Cloud auth pass): email/password, confirmation, reset, and guest mode.
  authPageTitle: 'כניסה למרידיאן',
  authSignInTab: 'התחברות',
  authSignUpTab: 'הרשמה',
  authEmailLabel: 'אימייל',
  authPasswordLabel: 'סיסמה',
  authNameLabel: 'שם לתצוגה',
  authSignInAction: 'התחברות',
  authSignUpAction: 'יצירת חשבון',
  authOrDivider: 'או',
  authForgotPassword: 'שכחתי סיסמה',
  authForgotTitle: 'איפוס סיסמה',
  authForgotAction: 'שליחת קישור לאיפוס',
  authBackToSignIn: 'חזרה להתחברות',
  authResetTitle: 'בחירת סיסמה חדשה',
  authNewPasswordLabel: 'סיסמה חדשה',
  authResetAction: 'עדכון סיסמה',
  authResetSuccess: 'הסיסמה עודכנה. אפשר להמשיך.',
  authCheckEmailMessage: 'שלחנו לך אימייל. יש ללחוץ על הקישור שבו כדי להמשיך.',
  authContinueAsGuest: 'המשך/י כאורח/ת',
  authGuestNote: 'אפשר לשחק ללא חשבון. ההתקדמות נשמרת במכשיר הזה בלבד.',
  authAccountSectionLabel: 'חשבון ענן',
  authGuestBadge: 'מצב אורח',
  authSignedInAs: 'מחובר/ת כ־',
  authPasswordTooShort: 'הסיסמה חייבת להכיל לפחות 6 תווים.',
  authMissingFields: 'יש למלא אימייל וסיסמה.',
  authGoToSignIn: 'התחברות / הרשמה באימייל',

  // Complete auth pass — explicit availability state model (A–D), a clearly
  // separate Sign In vs Sign Up experience, and a dedicated confirmation screen.
  authConnectingMessage: 'מתחבר/ת לשירות החשבון…',
  authEnvMissingInline: 'התחברות לא הוגדרה בסביבה הזו',
  authCloudFailedInline: 'שירות ההתחברות נכשל בטעינה',
  authRetryShortCta: 'נסו שוב',
  authSignInTitle: 'התחברות',
  authSignUpTitle: 'יצירת חשבון',
  authSignInSubtitle: 'התחברות לחשבון הענן של מרידיאן.',
  authSignUpSubtitle: 'חשבון חדש שומר את הזהות שלך במרידיאן.',
  authConfirmPasswordLabel: 'אימות סיסמה',
  authPasswordRequirements: 'לפחות 6 תווים, כולל אות ומספר.',
  authShowPassword: 'הצגת סיסמה',
  authHidePassword: 'הסתרת סיסמה',
  authErrorPasswordsMismatch: 'הסיסמאות אינן תואמות.',
  authErrorInvalidEmail: 'כתובת האימייל אינה תקינה.',
  authErrorNetwork: 'לא הצלחנו להתחבר כרגע. נסו שוב.',
  authNoAccountPrompt: 'אין לך חשבון? הרשמה',
  authHaveAccountPrompt: 'כבר יש לך חשבון? התחברות',
  authConfirmSentTitle: 'החשבון נוצר בהצלחה',
  authConfirmSentBody: 'שלחנו קישור אימות אל:',
  authConfirmSentHint: 'יש לאשר את כתובת האימייל לפני ההתחברות.',
  authResendConfirmation: 'שליחה מחדש של מייל אימות',
  authResendSent: 'מייל האימות נשלח שוב.',
  authChangeEmailCta: 'שינוי כתובת אימייל',
  authGoToSignInCta: 'מעבר להתחברות',
  authForgotSentTitle: 'נשלח קישור לאיפוס',
  authForgotSentBody: 'אם קיים חשבון עם הכתובת הזו, ישלח אליה קישור לאיפוס הסיסמה.',
  authResetConfirmLabel: 'אימות סיסמה חדשה',


  // Onboarding — first-time boot sequence (see src/onboarding/BootSequence.tsx).
  bootLogInitializing: 'מאתחל את מרידיאן…',
  bootLogConnectingAi: 'מתחבר לבינה המרכזית…',
  bootLogLoadingCity: 'טוען את מערכות העיר…',
  bootLogDetectingRecruit: 'מזהה מגויס חדש…',
  bootLogConnectionEstablished: 'החיבור הושלם.',
  bootOdinIntro: 'שלום. אני אודין, ואלווה אותך במרידיאן. בוא/י נתחיל.',
  bootSkipAction: 'דלג/י',

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

  // Meridian 1.4 — Player Identity MVP (src/onboarding/ProfileCreation.tsx).
  profileCreationEyebrow: 'לפני שממשיכים',
  profileCreationTitle: 'איך נקרא לך?',
  profileCreationSubtitle: 'מרידיאן זקוקה לשם ולזהות לפני שממשיכים.',
  profileEditTitle: 'ערוך/ערכי פרופיל',
  profileNameLabel: 'השם שלך',
  profileNamePlaceholder: 'הקלד/י שם…',
  profileNameRequiredError: 'יש להזין שם כדי להמשיך.',
  profileAvatarLabel: 'בחר/י מראה',
  profileCreationSubmitCta: 'המשך/י למרידיאן',
  profileEditSubmitCta: 'שמור/שמרי שינויים',
  profileEditButtonLabel: 'ערוך/ערכי פרופיל',
  currentPlayerLabel: 'המשתמש/ת שלך',

  // First Mission UX pass — learning difficulty. A scaffolding/help level,
  // never a different campaign: same missions, same story, same world (see
  // src/progression/services/setDifficultyLevel.ts).
  difficultySelectorTitle: 'בחר/י רמת קושי',
  difficultyLevel1Label: '1 — קל',
  difficultyLevel1Description: 'הוראות מפורטות, דוגמה גלויה, ורמז זמין תמיד.',
  difficultyLevel2Label: '2 — בינוני',
  difficultyLevel2Description: 'הוראות רגילות, בלי דוגמה קבועה, ורמז לפי בקשה.',
  difficultyLevel3Label: '3 — קשה',
  difficultyLevel3Description: 'הוראות תמציתיות, בלי דוגמה, ורמזים מצומצמים.',
  difficultySettingsLabel: 'רמת קושי',

  // Meridian 1.4 — Welcome Screen (src/onboarding/WelcomeScreen.tsx), the
  // game's title screen. "Meridian" itself stays untranslated (a proper
  // noun/wordmark), matching Odin's own convention elsewhere.
  welcomeTagline: 'מרידיאן מחכה לאות שלך.',
  welcomeContinueCta: 'המשך/י במסע',
  welcomeGuestCta: 'המשך/י כאורח/ת',
  welcomeNoAccountYet: 'עדיין לא מחוברים לחשבון.',
  // Meridian 1.4 — Auth UX clarity pass: the account (Google sign-in) and
  // the local profile/save are two separate things (see the Meridian 1.4
  // UX diagnostic, §A/§C) — this line says so at the one place a player
  // might fear losing progress by signing out.
  signOutProgressNote: 'ההתנתקות משפיעה רק על חיבור החשבון. ההתקדמות שלך נשארת במכשיר הזה.',

  // Admin CMS pass — secure admin area (src/pages/admin/**). Backend
  // enforcement (RLS) is what actually protects the data; these strings are
  // presentation only. Deliberately its own visual language (cleaner/more
  // operational than the game UI), still Hebrew RTL throughout.
  adminAreaTitle: 'אזור ניהול',
  adminNavDashboard: 'לוח בקרה',
  adminNavCourses: 'קורסים',
  adminNavLessons: 'שיעורים',
  adminNavMissions: 'משימות',
  adminNavUsers: 'משתמשים',
  adminNavLegacyTools: 'כלים ישנים (SQL)',
  adminBackToGame: 'חזרה למשחק',
  adminOpenMenuLabel: 'תפריט ניהול',

  adminDashboardTitle: 'לוח בקרה',
  adminDashboardSubtitle: 'תמונת מצב של התוכן והמשתמשים במרידיאן, מבוססת על נתונים אמיתיים בלבד.',
  adminMetricTotalUsers: 'משתמשים רשומים',
  adminMetricTotalCourses: 'קורסים',
  adminMetricTotalLessons: 'שיעורים',
  adminMetricTotalMissions: 'משימות',
  adminMetricActiveCourses: 'קורסים פעילים',
  adminMetricActiveLessons: 'שיעורים פעילים',
  adminMetricActiveMissions: 'משימות פעילות',

  adminLoadingMessage: 'טוען…',
  adminRetryAction: 'ניסיון נוסף',
  adminEmptyCourses: 'אין עדיין קורסים. אפשר להוסיף קורס ראשון.',
  adminEmptyLessons: 'אין עדיין שיעורים בקורס הזה.',
  adminEmptyMissions: 'אין עדיין משימות בשיעור הזה.',
  adminEmptyUsers: 'אין משתמשים להצגה.',
  adminSelectCoursePrompt: 'בחר/י קורס כדי לראות את השיעורים שלו.',
  adminSelectLessonPrompt: 'בחר/י שיעור כדי לראות את המשימות שלו.',

  adminAddCourse: 'קורס חדש',
  adminAddLesson: 'שיעור חדש',
  adminAddMission: 'משימה חדשה',
  adminEditAction: 'עריכה',
  adminDeleteAction: 'מחיקה',
  adminSaveAction: 'שמירה',
  adminCancelAction: 'ביטול',
  adminSaveSuccessMessage: 'נשמר בהצלחה.',
  adminSaveErrorMessage: 'השמירה נכשלה. אפשר לנסות שוב.',
  adminDeleteConfirmTitle: 'למחוק לצמיתות?',
  adminDeleteConfirmBody: 'הפעולה לא ניתנת לביטול.',
  adminDeleteConfirmYes: 'כן, מחק/י',
  adminUnsavedChangesWarning: 'יש שינויים שלא נשמרו. לצאת בכל זאת?',
  adminUnsavedChangesBody: 'השינויים שביצעת לא יישמרו.',
  adminUnsavedChangesStay: 'להמשיך לערוך',
  adminUnsavedChangesLeave: 'לצאת בלי לשמור',

  adminFieldTitle: 'כותרת',
  adminFieldDescription: 'תיאור קצר',
  adminFieldSubject: 'נושא',
  adminFieldStatus: 'סטטוס',
  adminStatusDraft: 'טיוטה',
  adminStatusActive: 'פעיל',
  adminFieldDisplayOrder: 'סדר תצוגה',
  adminFieldContent: 'תוכן / הסבר',
  adminFieldCourse: 'קורס',
  adminFieldLesson: 'שיעור',
  adminFieldObjective: 'מטרה',
  adminFieldInstructions: 'הוראות',
  adminFieldTask: 'שאלה / משימה',
  adminFieldHint: 'רמז',
  adminFieldGuidanceLevel1: 'הכוונה לרמת קושי 1 (קל)',
  adminFieldGuidanceLevel2: 'הכוונה לרמת קושי 2 (בינוני)',
  adminFieldGuidanceLevel3: 'הכוונה לרמת קושי 3 (קשה)',
  adminFieldAnswerType: 'סוג בדיקה',
  adminAnswerTypeExactText: 'תשובה טקסטואלית',
  adminAnswerTypeMultipleChoice: 'רב-בחירה',
  adminFieldAcceptedAnswers: 'תשובות מתקבלות (אחת בכל שורה)',
  adminFieldChoices: 'אפשרויות (אחת בכל שורה)',
  adminFieldCorrectChoice: 'האפשרות הנכונה',

  adminValidationRequired: 'שדה זה הוא שדה חובה.',
  adminValidationSelectCourse: 'יש לבחור קורס.',
  adminValidationSelectLesson: 'יש לבחור שיעור.',
  adminValidationNeedAnswer: 'יש להזין לפחות תשובה נכונה אחת.',
  adminValidationNeedChoices: 'יש להזין לפחות שתי אפשרויות.',

  adminUsersColumnName: 'שם',
  adminUsersColumnEmail: 'אימייל',
  adminUsersColumnRole: 'תפקיד',
  adminUsersColumnJoined: 'תאריך הרשמה',
  adminRoleStudent: 'תלמיד/ה',
  adminRoleAdmin: 'מנהל/ת',
  adminUsersProgressNote: 'התקדמות משחק נשמרת רק במכשיר של השחקן/ית ואינה זמינה לצפייה כאן.',

  adminAccessDeniedMessage: 'הגישה מוגבלת למנהלי המערכת.',

  // CMS API layer (src/cms/api/**) — never the raw Postgres/PostgREST message.
  cmsGenericError: 'הפעולה נכשלה. אפשר לנסות שוב.',
  cmsUnavailableMessage: 'לא ניתן להתחבר לשירות התוכן כרגע.',
} as const

export type HebrewStringKey = keyof typeof he
