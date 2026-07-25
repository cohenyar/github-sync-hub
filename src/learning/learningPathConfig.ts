import { he } from '../i18n'

export type LearningPathId = 'math' | 'english'

/**
 * The state a Dashboard subject choice needs to carry into the world: which
 * subject, which sample lesson, which building/NPC to walk toward, and
 * where to orient the player on arrival. Batch 3A.1 only defines and links
 * to this — nothing in the 3D world reads it yet (buildings/NPCs/lessons
 * don't exist until 3A.2–3A.4). Lesson ids are namespaced (`lesson:...`) so
 * they can never collide with or be mistaken for a SQL missionRegistry id.
 */
export interface LearningPathConfig {
  id: LearningPathId
  subjectLabel: string
  tagline: string
  lessonId: string
  buildingId: string
  npcId: string
  spawnTarget: string
}

export const LEARNING_PATHS: Readonly<Record<LearningPathId, LearningPathConfig>> = {
  math: {
    id: 'math',
    subjectLabel: he.subjectMathLabel,
    tagline: he.subjectMathTagline,
    lessonId: 'lesson:math-001',
    buildingId: 'math-academy',
    npcId: 'math-teacher',
    spawnTarget: 'core',
  },
  english: {
    id: 'english',
    subjectLabel: he.subjectEnglishLabel,
    tagline: he.subjectEnglishTagline,
    lessonId: 'lesson:english-001',
    buildingId: 'english-center',
    npcId: 'english-teacher',
    spawnTarget: 'core',
  },
}

export function isLearningPathId(value: string | null): value is LearningPathId {
  return value === 'math' || value === 'english'
}

/** Resolves a `?path=` query value to its full config, or undefined for anything else. */
export function getLearningPath(value: string | null): LearningPathConfig | undefined {
  return isLearningPathId(value) ? LEARNING_PATHS[value] : undefined
}

/** The single query param carrying the chosen path into `/world` — the smallest state this needs to be a URL, not a store. */
export function getLearningPathHref(id: LearningPathId): string {
  return `/world?path=${id}`
}

/**
 * Batch 3A.3 — the namespaced lesson id linked to a given NPC, or undefined
 * for any NPC with no linked lesson (every NPC except the two teachers).
 * The only place this id is read is NpcDialogue's "Start Lesson" button —
 * it is never passed to getMissionById/useMissionManager/runQuery.
 */
export function getLessonIdForNpc(npcId: string): string | undefined {
  return Object.values(LEARNING_PATHS).find((path) => path.npcId === npcId)?.lessonId
}

/**
 * Batch 3A.5 — the namespaced lesson id linked to a given learning building
 * (e.g. 'math-academy'), or undefined for any building with no linked
 * lesson. Mirrors getLessonIdForNpc exactly; used only to decide whether to
 * show a building's completion indicator.
 */
export function getLessonIdForBuilding(buildingId: string): string | undefined {
  return Object.values(LEARNING_PATHS).find((path) => path.buildingId === buildingId)?.lessonId
}
