import type { DistrictStatus } from '../../worldState'
import type { MissionDialoguePhase, NpcDialogueState } from './npcDialogueState'

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
    stable: { greeting: 'ברוכה הבאה שוב. אני מרה. האות במוקד יציב יותר משהיה.' },
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
}

const FALLBACK_DIALOGUE: NpcDialogueContent = {
  greeting: 'שלום.',
}

export function getNpcDialogue(npcId: string, state: NpcDialogueState): NpcDialogueContent {
  if (state.kind === 'mission') return MISSION_DIALOGUE[npcId]?.[state.phase] ?? FALLBACK_DIALOGUE
  if (state.kind === 'district') return DISTRICT_DIALOGUE[npcId]?.[state.status] ?? FALLBACK_DIALOGUE
  return STATIC_DIALOGUE[npcId] ?? FALLBACK_DIALOGUE
}
