import { getMissionById } from '../../missions'
import type { OdinReaction } from '../types'

/**
 * Odin's scripted voice — fully deterministic, no AI/LLM involved. Specific
 * triggers (tied to a real mission/target id) take priority over generic
 * fallbacks for the same event type, so every mission gets a flavorful
 * line without requiring one for every future mission up front.
 *
 * No WorldStateChanged reaction is scripted: it fires alongside
 * MissionCompleted for every successful mission today, and narrating both
 * would just repeat the same beat twice. Odin still subscribes to it
 * (see services/useOdin.ts) so a future, more specific WorldStateChanged
 * trigger can be added here without any wiring changes.
 */
export const defaultOdinReactions: OdinReaction[] = [
  {
    id: 'world-entered-greeting',
    trigger: { event: 'WorldEntered' },
    message: 'Welcome to Meridian. The Records Core is waiting — that’s your starting point.',
    messageHe: 'ברוך/ה הבא/ה למרידיאן. מוקד הרשומות ממתין לך — זו נקודת ההתחלה שלך.',
  },
  // Playtest fix pass (issue 6B) — this used to be one static line, shown
  // verbatim every single time any mission starts (the very first thing a
  // player who audited the game noticed as "generic and repeated"). Now
  // interpolates the actual mission's own title, so it always carries real
  // context and never reads as a copy-pasted repeat of itself. Falls back
  // to the old static line only if the mission id somehow doesn't resolve
  // (should not happen via the real UI).
  {
    id: 'mission-started',
    trigger: { event: 'MissionStarted' },
    message: (event) => {
      const title = event.type === 'MissionStarted' ? getMissionById(event.missionId)?.title : undefined
      return title ? `New mission: ${title}. I am listening.` : 'A new query awaits. I am listening.'
    },
    messageHe: (event) => {
      const title = event.type === 'MissionStarted' ? getMissionById(event.missionId)?.titleHe : undefined
      return title ? `משימה חדשה מתחילה: ${title}. אני מקשיב.` : 'שאילתה חדשה ממתינה. אני מקשיב.'
    },
  },
  {
    id: 'first-contact-completed',
    trigger: { event: 'MissionCompleted', missionId: 'first-contact' },
    message: 'The signal is steady now. Meridian can see its people again.',
    messageHe: 'האות יציב כעת. מרידיאן שוב רואה את תושביה.',
  },
  {
    id: 'mission-completed-generic',
    trigger: { event: 'MissionCompleted' },
    message: 'Another piece of Meridian comes into focus.',
    messageHe: 'עוד חלק ממרידיאן מתבהר.',
  },
  {
    id: 'district-ties-unlocked',
    trigger: { event: 'ContentUnlocked', targetType: 'mission', targetId: 'district-ties' },
    message: 'The city is beginning to respond. District Ties is ready to be traced.',
    messageHe: 'העיר מתחילה להשיב. אפשר כעת להתחקות אחר קשרי המחוז.',
  },
  {
    id: 'south-stability-unlocked',
    trigger: { event: 'ContentUnlocked', targetType: 'mission', targetId: 'south-stability' },
    message: "South's reports are reaching the Core at last. South Stability is ready to be read.",
    messageHe: 'דוחות הדרום מגיעים סוף־סוף למוקד. יציבות הדרום מוכנה להיקרא.',
  },
  {
    id: 'south-stability-completed',
    trigger: { event: 'MissionCompleted', missionId: 'south-stability' },
    message: 'The reports are answered. South steadies beneath the city.',
    messageHe: 'הדוחות נענו. הדרום מתייצב מתחת לעיר.',
  },
  {
    id: 'full-signal-unlocked',
    trigger: { event: 'ContentUnlocked', targetType: 'mission', targetId: 'full-signal' },
    message: 'Full Signal is ready — the whole city, seen at once for the first time.',
    messageHe: 'אות מלא מוכן — כל העיר, נראית כאחת בפעם הראשונה.',
  },
  {
    id: 'full-signal-completed',
    trigger: { event: 'MissionCompleted', missionId: 'full-signal' },
    message: 'The count is in. Meridian sees itself, district by district.',
    messageHe: 'הספירה הושלמה. מרידיאן רואה את עצמה, מחוז אחר מחוז.',
  },
  {
    id: 'linked-records-unlocked',
    trigger: { event: 'ContentUnlocked', targetType: 'mission', targetId: 'linked-records' },
    message: 'Another connection is ready to be drawn. Linked Records is ready to be traced.',
    messageHe: 'עוד חיבור מוכן להיווצר. רשומות מקושרות עומדות להתגלות.',
  },
  {
    id: 'linked-records-completed',
    trigger: { event: 'MissionCompleted', missionId: 'linked-records' },
    message: 'Every citizen finds a name to answer to. One more thread runs through the Core.',
    messageHe: 'כל תושב מוצא שם לפנות אליו. עוד חיבור נרקם במוקד.',
  },
  {
    id: 'priority-signal-unlocked',
    trigger: { event: 'ContentUnlocked', targetType: 'mission', targetId: 'priority-signal' },
    message: 'Every report reaches the Core now, but not in the order that matters. Priority Signal is ready to be sorted.',
    messageHe: 'כל דוח מגיע כעת למוקד, אך לא בסדר הנכון. אות בעדיפות מוכן למיון.',
  },
  {
    id: 'priority-signal-completed',
    trigger: { event: 'MissionCompleted', missionId: 'priority-signal' },
    message: 'The most urgent voice rises to the top. Meridian finally knows what to answer first.',
    messageHe: 'הקול הדחוף ביותר עולה לראש. מרידיאן יודעת סוף־סוף במה לטפל קודם.',
  },
  {
    id: 'south-engineer-unlocked',
    trigger: { event: 'ContentUnlocked', targetType: 'npc', targetId: 'south-engineer' },
    message: 'A new voice steps forward from the South.',
    messageHe: 'קול חדש יוצא מן הדרום.',
  },
  {
    id: 'north-analyst-unlocked',
    trigger: { event: 'ContentUnlocked', targetType: 'npc', targetId: 'north-analyst' },
    message: "Enough of the city agrees now for someone to notice the pattern. North's own analyst steps forward.",
    messageHe: 'מספיק מהעיר מסכימה כעת כדי שמישהו ישים לב לדפוס. אנליסט הצפון יוצא קדימה.',
  },
  {
    id: 'city-voice-unlocked',
    trigger: { event: 'ContentUnlocked', targetType: 'npc', targetId: 'city-voice' },
    message: 'The city finds one voice to speak for all of it.',
    messageHe: 'העיר מוצאת קול אחד שמדבר בשמה.',
  },
  {
    id: 'content-unlocked-generic',
    trigger: { event: 'ContentUnlocked' },
    message: 'Something new has opened within the city.',
    messageHe: 'משהו חדש נפתח בתוך העיר.',
  },
  {
    id: 'campaign-completed',
    trigger: { event: 'CampaignCompleted' },
    message: 'Every thread accounted for. Meridian answers as one city now.',
    messageHe: 'כל החוטים התחברו. מרידיאן עונה כעת כעיר אחת.',
  },
  // Playtest fix pass (issue 6A) — previously a single generic line for
  // every possible SQL error, regardless of what actually went wrong. Now
  // classified (see missions/runQuery.classifySqlError, threaded through
  // QueryFailedEvent.sqlErrorKind by GameApp's onFailure handler) into the
  // three most common, actionable cases; matchReaction's existing
  // specificity rule (more matcher fields wins) already makes each of
  // these win over the plain reason-only fallback below for a classified
  // error, and falls back to it automatically for an unclassified
  // ('generic') one — no new matching logic needed.
  {
    id: 'query-failed-sql-error-unknown-table',
    trigger: { event: 'QueryFailed', reason: 'sql-error', sqlErrorKind: 'unknown-table' },
    message: "That table name doesn't exist. Check its spelling against this mission's data.",
    messageHe: 'שם הטבלה שכתבת לא קיים בארכיון. בדוק/י את האיות שלו מול הנתונים של המשימה.',
  },
  {
    id: 'query-failed-sql-error-unknown-column',
    trigger: { event: 'QueryFailed', reason: 'sql-error', sqlErrorKind: 'unknown-column' },
    message: "That column name doesn't exist on this table. Check its spelling.",
    messageHe: 'שם העמודה שכתבת לא קיים בטבלה הזו. בדוק/י את האיות שלו.',
  },
  {
    id: 'query-failed-sql-error-syntax',
    trigger: { event: 'QueryFailed', reason: 'sql-error', sqlErrorKind: 'syntax' },
    message: "There's a syntax error — check for a missing comma, quote, or parenthesis.",
    messageHe: 'יש שגיאת תחביר בשאילתה — בדוק/י אם חסר פסיק, מרכאות או סוגריים.',
  },
  {
    id: 'query-failed-sql-error',
    trigger: { event: 'QueryFailed', reason: 'sql-error' },
    message: "That query didn't run. Check the syntax and try again.",
    messageHe: 'לא ניתן היה להריץ את השאילתה. בדוק/י את התחביר ונסה/י שוב.',
  },
  {
    id: 'query-failed-mismatch',
    trigger: { event: 'QueryFailed', reason: 'mismatch' },
    message: "Close, but the records don't match yet. Look again at what the query returns.",
    messageHe: 'קרוב, אך הרשומות עדיין לא תואמות. הבט/הביטי שוב במה שהשאילתה מחזירה.',
  },
  {
    id: 'district-ties-failed-mismatch',
    trigger: { event: 'QueryFailed', missionId: 'district-ties', reason: 'mismatch' },
    message: 'Check the district value in your WHERE clause — it should match North exactly.',
    messageHe: 'בדוק/י את ערך המחוז בתנאי ה-WHERE שלך — הוא צריך להתאים בדיוק לצפון.',
  },
  {
    id: 'south-stability-failed-mismatch',
    trigger: { event: 'QueryFailed', missionId: 'south-stability', reason: 'mismatch' },
    message:
      'A compound filter needs every condition to hold together — check both the district and the severity threshold.',
    messageHe: 'תנאי מורכב דורש שכל החלקים יתקיימו יחד — בדוק/י גם את המחוז וגם את סף החומרה.',
  },
  {
    id: 'full-signal-failed-mismatch',
    trigger: { event: 'QueryFailed', missionId: 'full-signal', reason: 'mismatch' },
    message:
      'Grouping and counting only works together — make sure every selected column is either grouped or aggregated.',
    messageHe: 'קיבוץ וספירה פועלים רק יחד — הקפד/הקפידי שכל עמודה שנבחרה תהיה מקובצת או מצורפת.',
  },
  {
    id: 'linked-records-failed-mismatch',
    trigger: { event: 'QueryFailed', missionId: 'linked-records', reason: 'mismatch' },
    message: "A join connects rows through a shared column — check that you're joining on the right one.",
    messageHe: 'פקודת JOIN מחברת שורות לפי עמודה משותפת — בדוק/י שאת/ה מתחבר/ת לפי העמודה הנכונה.',
  },
  {
    id: 'priority-signal-failed-mismatch',
    trigger: { event: 'QueryFailed', missionId: 'priority-signal', reason: 'mismatch' },
    message: 'Same rows, wrong sequence — check your ORDER BY.',
    messageHe: 'אותן שורות, סדר לא נכון — בדוק/י את ה-ORDER BY שלך.',
  },
  // Batch 3A.4B — the two sample lessons' completion/failure feedback.
  // Separate event types (LessonCompleted/LessonFailed) from the SQL side's
  // MissionCompleted/QueryFailed, so these can never fire for — or be
  // confused with — a real mission.
  {
    id: 'lesson-math-completed',
    trigger: { event: 'LessonCompleted', lessonId: 'lesson:math-001' },
    // Meridian 1.3 — Narrative Backbone §07: specific to what changed, not a generic "well done."
    message: 'The manifest is counted. The gate closes on time tonight.',
    messageHe: 'המניפסט נספר. השער יינעל בזמן הערב.',
  },
  {
    id: 'lesson-english-completed',
    trigger: { event: 'LessonCompleted', lessonId: 'lesson:english-001' },
    // Meridian 1.3 — Narrative Backbone §07: specific to what changed, not a generic "well done."
    message: 'The board reads in both languages now. Someone will find their way home because of it.',
    messageHe: 'הלוח נקרא כעת בשתי השפות. מישהו ימצא את דרכו הביתה בזכות זה.',
  },
  {
    id: 'lesson-failed-generic',
    trigger: { event: 'LessonFailed' },
    message: 'Not quite — try again.',
    messageHe: 'לא בדיוק — נסה/י שוב.',
  },
  // Meridian 1.3 — Core Loop §04 collectibles. Fires once, only the first
  // time each page is actually found (see GameApp.tsx's handleLessonResult).
  {
    id: 'archive-page-trade-count-found',
    trigger: { event: 'ArchivePageFound', pageId: 'archive-page:trade-count' },
    message: 'An old ledger, tucked behind the manifest. Worth keeping.',
    messageHe: 'פנקס ישן, מוחבא מאחורי המניפסט. שווה לשמור אותו.',
  },
  {
    id: 'archive-page-lost-and-found-found',
    trigger: { event: 'ArchivePageFound', pageId: 'archive-page:lost-and-found' },
    message: "A note about the board's own history. Worth keeping.",
    messageHe: 'פתק על ההיסטוריה של הלוח עצמו. שווה לשמור אותו.',
  },
  {
    id: 'archive-page-found-generic',
    trigger: { event: 'ArchivePageFound' },
    message: 'Something worth keeping.',
    messageHe: 'משהו ששווה לשמור.',
  },
  // Meridian 1.3 — Core Loop §01: the counterpart to world-entered-greeting
  // for a player who already onboarded — one welcome-back line per app
  // mount. Deliberately a single authored line, not a randomized pool: Odin
  // is documented as fully deterministic (see this file's own header
  // comment), and true variety "keyed to how long since the last session"
  // would need session-timestamp tracking this phase doesn't add yet —
  // scoped down rather than breaking that contract for a minor flourish.
  {
    id: 'session-resumed',
    trigger: { event: 'SessionResumed' },
    message: 'Welcome back to Meridian. The city kept waiting.',
    messageHe: 'ברוך שובך למרידיאן. העיר המשיכה לחכות.',
  },
]
