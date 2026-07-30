import type { DistrictStatus } from '../../worldState'
import type { LessonDialoguePhase, MissionDialoguePhase, NpcDialogueState } from './npcDialogueState'

/**
 * Authored Hebrew dialogue — static lines only, no branching, no generated
 * text, no LLM. Which bucket applies to a given NPC right now is decided
 * entirely by npcDialogueState.ts; this module only holds the words.
 */
export interface NpcDialogueContent {
  greeting: string
  missionContext?: string
}

const MISSION_DIALOGUE: Readonly<Record<string, Readonly<Record<MissionDialoguePhase, NpcDialogueContent>>>> = {
  'north-warden': {
    locked: { greeting: 'שלום לך. אני דורין קאס, שומר מחוז הצפון.' },
    available: {
      greeting: 'שלום לך. אני דורין קאס, שומר מחוז הצפון.',
      missionContext: 'יש עבודה שממתינה במוקד הרשומות. גשי למסוף ובררי מה נדרש כעת.',
    },
    inProgress: { greeting: 'עוד לא סיימת עם המוקד? הצפון עדיין ממתין לתשובה משם.' },
    completed: { greeting: 'הצפון נושם קצת יותר בקלות מאז שהמוקד ראה אותנו. תודה לך.' },
  },
  'south-organizer': {
    locked: { greeting: 'שלום, אני פריה ננדל. הדרום עדיין לא יציב, אבל עוד לא הגיע הזמן לפתור את זה מהמוקד.' },
    available: {
      greeting: 'שלום, אני פריה ננדל. אני פועלת לייצב את מחוז הדרום.',
      missionContext: 'יש דוחות חמורים מהדרום שמחכים במוקד הרשומות. כדאי לבדוק מה קרה שם.',
    },
    inProgress: { greeting: 'בדקת כבר את הדוחות מהדרום? אני עדיין מחכה לשמוע.' },
    completed: { greeting: 'הדרום יציב יותר עכשיו. תודה שהקשבת לדוחות שלנו.' },
  },
  'north-analyst': {
    locked: { greeting: 'שלום, אני יורן פטריק. אני עדיין אוסף מספיק דיווחים כדי לראות את התמונה המלאה.' },
    available: {
      greeting: 'שלום, אני יורן פטריק, אנליסט האותות.',
      missionContext: 'עכשיו אפשר לראות את כל המחוזות בבת אחת. ספרי כמה תושבים יש בכל מחוז דרך המוקד.',
    },
    inProgress: { greeting: 'איך מתקדמת הספירה? המוקד עדיין מחכה לתמונה המלאה.' },
    completed: { greeting: 'עכשיו אני רואה את כל מרידיאן בבת אחת, מחוז אחר מחוז. תודה לך.' },
  },
}

const DISTRICT_DIALOGUE: Readonly<Record<string, Readonly<Record<DistrictStatus, NpcDialogueContent>>>> = {
  'archivist-mera': {
    unstable: { greeting: 'ברוכה הבאה למוקד הרשומות. אני מרה, שומרת הארכיון. האות עדיין לא יציב.' },
    // Meridian 1.4 — the Core's single stat (signal) jumps unstable→thriving
    // in one atomic step (see firstContact.ts's successEffect), so this
    // phase is not currently reachable in any playthrough. Written to state
    // the current condition plainly rather than implying a remembered
    // "better than it was" trajectory the world can't actually show yet.
    stable: { greeting: 'ברוכה הבאה. אני מרה, שומרת הארכיון. האות במוקד יציב.' },
    thriving: { greeting: 'ברוכה הבאה, שוב. אני מרה. המוקד לא נראה כה בהיר מזמן.' },
  },
  'east-broker': {
    unstable: { greeting: 'שלום, אני תומאס רייט. עכשיו כשהמוקד רואה את העיר, המסחר במזרח סוף סוף יכול לזוז — אבל עוד יש עבודה.' },
    stable: { greeting: 'שלום, אני תומאס רייט, מתווך הסחר. מסלולי הסחר במזרח יציבים בינתיים.' },
    thriving: { greeting: 'שלום, אני תומאס רייט. המזרח משגשג — הסחר עובר דרכי בלי הפרעה.' },
  },
  'south-engineer': {
    unstable: { greeting: 'שלום, אני אלין פוס, מהנדסת המים. עוד יש מה לתקן בדרום.' },
    stable: { greeting: 'שלום, אני אלין פוס. התיקונים בדרום מחזיקים מעמד.' },
    thriving: { greeting: 'שלום, אני אלין פוס. הדרום במצב הכי טוב שראיתי אותו.' },
  },
}

const STATIC_DIALOGUE: Readonly<Record<string, NpcDialogueContent>> = {
  'city-voice': { greeting: 'אני קסטרל ויין. מרידיאן מדברת עכשיו בקול אחד, ואני כאן כדי לשאת אותו.' },
  // Meridian 1.3 — the consequence rule in action: she's only ever visible
  // after lesson:english-001 completes, already reunited by the time the
  // player meets her.
  'reunited-owner': { greeting: 'שלום, אני מיכל. הכלב שלי חזר הביתה בזכות מי שתרגם את הלוח. תודה.' },
}

/**
 * Batch 3A.4B — math-teacher/english-teacher, now driven by
 * npcDialogueState.ts's { kind: 'lesson' } phase instead of a single static
 * line, so talking to a teacher again after finishing their lesson visibly
 * acknowledges it rather than repeating the introduction verbatim. Start
 * Lesson stays offered in both phases (NpcDialogue.tsx renders it whenever
 * a linked lesson id exists) — completing a lesson again is an explicit,
 * supported, idempotent replay, not a locked-off state.
 */
/**
 * Meridian 1.3 — Narrative Backbone §06/§07: neither phase names the subject
 * or calls this a lesson. "available" hands off a citizen's real problem;
 * "completed" is the specific, persistent proof it was actually solved —
 * not a generic "well done," so revisiting the teacher afterward still
 * means something (the consequence rule).
 */
const LESSON_DIALOGUE: Readonly<Record<string, Readonly<Record<LessonDialoguePhase, NpcDialogueContent>>>> = {
  'math-teacher': {
    available: {
      greeting: 'שלום, אני נדב שטרן. אני מלמד מתמטיקה כאן באקדמיה.',
      missionContext: 'סוחר במזרח מתקשה לסגור את המניפסט לפני רדת החשיכה — אולי תוכל/י לעזור לו לספור.',
    },
    completed: {
      greeting: 'שלום, אני נדב שטרן.',
      missionContext: 'המניפסט נסגר בזמן בזכותך. הסוחר עדיין מודה לך על זה.',
    },
  },
  'english-teacher': {
    available: {
      greeting: 'שלום, אני טליה ריבס. אני מלמדת אנגלית כאן במרכז השפה.',
      missionContext: 'מתנדבת שהגיעה לעזור באיתור חיות ודברים אבודים לא מצליחה לקרוא את הלוח שלנו. אולי תוכל/י לעזור לה.',
    },
    completed: {
      greeting: 'שלום, אני טליה ריבס.',
      missionContext: 'הלוח מתורגם, והיא כבר עוזרת לתושבים בזכות זה. תודה לך.',
    },
  },
}

const FALLBACK_DIALOGUE: NpcDialogueContent = {
  greeting: 'שלום.',
}

/**
 * Meridian 1.3 — Core Loop §06: an extra, personal line shown only once an
 * NPC reaches the "friend" familiarity tier — layered on top of whatever
 * getNpcDialogue already returns, not a replacement for it. Authoring one
 * per NPC is content work; the mechanism itself (npcFamiliarity) already
 * applies to all of them.
 */
const FRIEND_BONUS_LINE: Readonly<Record<string, string>> = {
  'archivist-mera': 'אחרי כל הפעמים האלה, את/ה כבר מרגיש/ה כמו חלק מהמוקד הזה.',
}

export function getFriendBonusLine(npcId: string): string | undefined {
  return FRIEND_BONUS_LINE[npcId]
}

export function getNpcDialogue(npcId: string, state: NpcDialogueState): NpcDialogueContent {
  if (state.kind === 'mission') return MISSION_DIALOGUE[npcId]?.[state.phase] ?? FALLBACK_DIALOGUE
  if (state.kind === 'lesson') return LESSON_DIALOGUE[npcId]?.[state.phase] ?? FALLBACK_DIALOGUE
  if (state.kind === 'district') return DISTRICT_DIALOGUE[npcId]?.[state.status] ?? FALLBACK_DIALOGUE
  return STATIC_DIALOGUE[npcId] ?? FALLBACK_DIALOGUE
}
