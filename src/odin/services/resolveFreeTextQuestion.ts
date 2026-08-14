import { he } from '../../i18n'
import { resolveAskOdinAnswer, type AskOdinContext, type AskOdinQuestionId } from './resolveAskOdinAnswer'

export interface FreeTextAskOdinContext extends AskOdinContext {
  /** The question/task text itself — distinct from missionPrompt (the explanatory content) and missionGoal (the objective). */
  missionTask: string
}

const HINT_PHRASES = ['רמז', 'עזרה', 'תעזור', 'תעזרי']
const SUBJECT_PHRASES = ['נושא']
const WHERE_TO_GO_PHRASES = ['לאן ללכת', 'לאן', 'איזה יעד', 'איפה להמשיך']
const WHY_WRONG_PHRASES = ['למה טעיתי', 'טעות', 'למה זה לא נכון', 'למה לא נכון', 'למה טעית']
const WHAT_NOW_PHRASES = ['מה לעשות', 'מה עכשיו', 'איך ממשיכים']
const EXPLAIN_PHRASES = [
  'תסביר',
  'הסבר',
  'פירוש',
  'משמעות',
  'לא מבין',
  'לא מבינה',
  'איך מתחילים',
  'איך להתחיל',
  'מה השאלה',
  'מה זה',
]

function includesAny(text: string, phrases: readonly string[]): boolean {
  return phrases.some((phrase) => text.includes(phrase))
}

/**
 * Ordered, explicit rules rather than a single flat keyword table — a few
 * intents (why-wrong vs. explain, in particular) need more than "does one
 * word appear" to avoid misclassifying "למה התשובה נכונה?" (why IS it
 * correct — an explain request) as "למה טעיתי?" (why was I WRONG).
 */
function classifyIntent(normalized: string): AskOdinQuestionId | null {
  if (includesAny(normalized, HINT_PHRASES)) return 'hint'
  if (includesAny(normalized, SUBJECT_PHRASES)) return 'subject'
  if (includesAny(normalized, WHERE_TO_GO_PHRASES)) return 'where-to-go'
  if (includesAny(normalized, WHY_WRONG_PHRASES)) return 'why-wrong'
  if (includesAny(normalized, WHAT_NOW_PHRASES)) return 'what-now'
  if (includesAny(normalized, EXPLAIN_PHRASES)) return 'explain-question'
  if (normalized.includes('למה') && includesAny(normalized, ['נכון', 'נכונה'])) return 'explain-question'
  return null
}

// Common Hebrew function words excluded from the authored-content overlap
// check below, so a question like "מי היה X?" matches on X, not on "מי"/"היה".
const STOPWORDS = new Set([
  'מה',
  'מי',
  'מהי',
  'מיהו',
  'מיהי',
  'היה',
  'היא',
  'הוא',
  'של',
  'את',
  'על',
  'עם',
  'כל',
  'גם',
  'רק',
  'אבל',
  'כי',
  'אם',
  'לא',
  'זה',
  'זאת',
  'למה',
  'איך',
  'כמה',
  'אני',
  'אתה',
  'אתם',
  'אנחנו',
  'הזה',
  'הזאת',
  'יש',
  'אין',
  'תן',
  'לי',
])

function contentWords(text: string): string[] {
  return text
    .split(/[\s.,?!'"׳״־-]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && !STOPWORDS.has(word))
}

/**
 * The free-text resolver's safety net: a question that doesn't match a
 * known intent may still be safely answerable — but ONLY by reciting the
 * mission's own authored explanation, never inventing new facts. A real
 * word from the question appearing in the mission's own task/prompt/subject
 * text is treated as "the answer is directly available from the current
 * authored content" (e.g. "מי היה אוגוסטוס?" against a mission whose own
 * promptHe already explains who אוגוסטוס was) — this returns the exact
 * same text the "תסביר את השאלה" button gives, never something new.
 */
function mentionsAuthoredContent(normalized: string, context: FreeTextAskOdinContext): boolean {
  const haystack = new Set(contentWords(`${context.missionTask} ${context.missionPrompt} ${context.subjectHe}`))
  return contentWords(normalized).some((word) => haystack.has(word))
}

function normalizeQuestion(input: string): string {
  return input.trim().replace(/[?!.,;:"׳״]/g, '')
}

/**
 * The deterministic intent/context resolver behind Ask Odin's free-text
 * input. Not AI: a fixed classifier over known Hebrew phrases, delegating
 * to the exact same resolveAskOdinAnswer used by the panel's fixed buttons
 * whenever it recognizes one of their intents, plus one bounded fallback
 * (mentionsAuthoredContent) for a subject question the current mission's
 * own authored text already answers. Anything else gets the same honest
 * refusal every time — never an invented fact.
 */
export function resolveFreeTextQuestion(input: string, context: FreeTextAskOdinContext): string {
  const normalized = normalizeQuestion(input)
  if (normalized.length === 0) return he.askOdinUnknownQuestionFallback

  const intent = classifyIntent(normalized)
  if (intent) return resolveAskOdinAnswer(intent, context)

  if (mentionsAuthoredContent(normalized, context)) {
    return context.missionPrompt
  }

  return he.askOdinUnknownQuestionFallback
}
