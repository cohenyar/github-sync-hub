import type { MissionAnswerConfig } from '../cms/types'
import type { WorldEffect } from '../worldState'

/**
 * SQL-removal pass, final cleanup — SQL is no longer a supported learning
 * subject and none is planned, so the earlier SqlMissionConfig |
 * QuestionMissionConfig union (a transitional shape kept during that
 * migration) has been collapsed to this one flat interface. Every real
 * mission is a general educational question (multiple choice or short
 * text) — see checkQuestionAnswer.ts and firstContact.ts/siblings.
 */
export interface MissionConfig {
  id: string
  title: string
  goal: string
  prompt: string
  /** Applied to the WorldState exactly once, only when the mission is completed. */
  successEffect?: WorldEffect
  /** Optional Hebrew display text. Falls back to the English field above when absent (see missionDisplayText.ts). */
  titleHe?: string
  goalHe?: string
  promptHe?: string
  /**
   * Playtest fix pass (issue 6C) — a short, non-spoiler nudge, surfaced only
   * via the Ask Odin panel's "תן לי רמז" button. Deliberately never the
   * correct answer itself.
   */
  hintHe?: string
  /**
   * First Mission UX pass — a short, always-visible, literally actionable
   * instruction, distinct from `promptHe` (scene-setting narrative) and
   * `hintHe` (an on-demand nudge). Optional: a mission without one simply
   * renders no instruction line, unchanged from before this field existed.
   */
  instructionHe?: string
  /**
   * General educational model — the History/English/Math label shown by
   * Ask Odin's "מה הנושא?" answer and available for any future subject-aware
   * UI. A short display string, not a coded enum: nothing else needs to
   * branch on subject today.
   */
  subjectHe: string
  /** The actual question shown to the player — distinct from `prompt`/`goal` above, which stay the narrative/objective framing. */
  taskHe: string
  /** Reuses the exact shape the Admin CMS already authors (src/cms/types.ts) — the same question data an admin creates in /admin/courses is playable here without any reshaping. */
  answerConfig: MissionAnswerConfig
  /** Difficulty-specific guidance for levels 1/2/3 — a genuine capability the old hardcoded missions never had. */
  guidanceLevel1?: string
  guidanceLevel2?: string
  guidanceLevel3?: string
}
