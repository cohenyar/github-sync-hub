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
    messageHe: 'ברוך הבא למרידיאן. מוקד הרשומות ממתין לך — זו נקודת ההתחלה שלך.',
  },
  {
    id: 'mission-started',
    trigger: { event: 'MissionStarted' },
    message: 'A new query awaits. I am listening.',
    messageHe: 'שאילתה חדשה ממתינה. אני מקשיב.',
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
  {
    id: 'query-failed-sql-error',
    trigger: { event: 'QueryFailed', reason: 'sql-error' },
    message: "That query didn't run. Check the syntax and try again.",
    messageHe: 'לא ניתן היה להריץ את השאילתה. בדוק את התחביר ונסה שוב.',
  },
  {
    id: 'query-failed-mismatch',
    trigger: { event: 'QueryFailed', reason: 'mismatch' },
    message: "Close, but the records don't match yet. Look again at what the query returns.",
    messageHe: 'קרוב, אך הרשומות עדיין לא תואמות. הבט שוב במה שהשאילתה מחזירה.',
  },
  {
    id: 'district-ties-failed-mismatch',
    trigger: { event: 'QueryFailed', missionId: 'district-ties', reason: 'mismatch' },
    message: 'Check the district value in your WHERE clause — it should match North exactly.',
    messageHe: 'בדוק את ערך המחוז בתנאי ה-WHERE שלך — הוא צריך להתאים בדיוק לצפון.',
  },
  {
    id: 'south-stability-failed-mismatch',
    trigger: { event: 'QueryFailed', missionId: 'south-stability', reason: 'mismatch' },
    message:
      'A compound filter needs every condition to hold together — check both the district and the severity threshold.',
    messageHe: 'תנאי מורכב דורש שכל החלקים יתקיימו יחד — בדוק גם את המחוז וגם את סף החומרה.',
  },
  {
    id: 'full-signal-failed-mismatch',
    trigger: { event: 'QueryFailed', missionId: 'full-signal', reason: 'mismatch' },
    message:
      'Grouping and counting only works together — make sure every selected column is either grouped or aggregated.',
    messageHe: 'קיבוץ וספירה פועלים רק יחד — הקפד שכל עמודה שנבחרה תהיה מקובצת או מצורפת.',
  },
  {
    id: 'linked-records-failed-mismatch',
    trigger: { event: 'QueryFailed', missionId: 'linked-records', reason: 'mismatch' },
    message: "A join connects rows through a shared column — check that you're joining on the right one.",
    messageHe: 'פקודת JOIN מחברת שורות לפי עמודה משותפת — בדוק שאתה מתחבר לפי העמודה הנכונה.',
  },
  {
    id: 'priority-signal-failed-mismatch',
    trigger: { event: 'QueryFailed', missionId: 'priority-signal', reason: 'mismatch' },
    message: 'Same rows, wrong sequence — check your ORDER BY.',
    messageHe: 'אותן שורות, סדר לא נכון — בדוק את ה-ORDER BY שלך.',
  },
  // Batch 3A.4B — the two sample lessons' completion/failure feedback.
  // Separate event types (LessonCompleted/LessonFailed) from the SQL side's
  // MissionCompleted/QueryFailed, so these can never fire for — or be
  // confused with — a real mission.
  {
    id: 'lesson-math-completed',
    trigger: { event: 'LessonCompleted', lessonId: 'lesson:math-001' },
    message: 'Well done — the numbers line up.',
    messageHe: 'כל הכבוד — התשובה נכונה, וסדר הפעולות פתר את התרגיל.',
  },
  {
    id: 'lesson-english-completed',
    trigger: { event: 'LessonCompleted', lessonId: 'lesson:english-001' },
    message: 'Well done — every word translated correctly.',
    messageHe: 'כל הכבוד — כל המילים תורגמו נכון.',
  },
  {
    id: 'lesson-failed-generic',
    trigger: { event: 'LessonFailed' },
    message: 'Not quite — try again.',
    messageHe: 'לא בדיוק — נסה/י שוב.',
  },
]
