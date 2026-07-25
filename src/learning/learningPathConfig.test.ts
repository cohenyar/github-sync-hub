import { describe, expect, it } from 'vitest'
import {
  getLearningPath,
  getLearningPathHref,
  getLessonIdForBuilding,
  getLessonIdForNpc,
  isLearningPathId,
  LEARNING_PATHS,
} from './learningPathConfig'

describe('LEARNING_PATHS', () => {
  it('namespaces every lesson id so it can never collide with a SQL missionRegistry id', () => {
    for (const path of Object.values(LEARNING_PATHS)) {
      expect(path.lessonId.startsWith('lesson:')).toBe(true)
    }
  })

  it('carries a building, an NPC, and a spawn target for every path', () => {
    for (const path of Object.values(LEARNING_PATHS)) {
      expect(path.buildingId.length).toBeGreaterThan(0)
      expect(path.npcId.length).toBeGreaterThan(0)
      expect(path.spawnTarget.length).toBeGreaterThan(0)
    }
  })
})

describe('isLearningPathId', () => {
  it('accepts math and english', () => {
    expect(isLearningPathId('math')).toBe(true)
    expect(isLearningPathId('english')).toBe(true)
  })

  it('rejects anything else, including null', () => {
    expect(isLearningPathId('sql')).toBe(false)
    expect(isLearningPathId('')).toBe(false)
    expect(isLearningPathId(null)).toBe(false)
  })
})

describe('getLearningPath', () => {
  it('resolves a valid query value to its full config', () => {
    expect(getLearningPath('math')).toBe(LEARNING_PATHS.math)
  })

  it('returns undefined for an invalid or missing query value', () => {
    expect(getLearningPath('history')).toBeUndefined()
    expect(getLearningPath(null)).toBeUndefined()
  })
})

describe('getLearningPathHref', () => {
  it('builds a /world link carrying the path id as a query param', () => {
    expect(getLearningPathHref('math')).toBe('/world?path=math')
    expect(getLearningPathHref('english')).toBe('/world?path=english')
  })
})

describe('getLessonIdForNpc (Batch 3A.3)', () => {
  it('resolves the Mathematics teacher to the namespaced math lesson id', () => {
    expect(getLessonIdForNpc('math-teacher')).toBe('lesson:math-001')
  })

  it('resolves the English teacher to the namespaced English lesson id', () => {
    expect(getLessonIdForNpc('english-teacher')).toBe('lesson:english-001')
  })

  it('returns undefined for any NPC with no linked lesson', () => {
    expect(getLessonIdForNpc('north-warden')).toBeUndefined()
    expect(getLessonIdForNpc('archivist-mera')).toBeUndefined()
    expect(getLessonIdForNpc('does-not-exist')).toBeUndefined()
  })
})

describe('getLessonIdForBuilding (Batch 3A.5)', () => {
  it('resolves the Mathematics Academy to the namespaced math lesson id', () => {
    expect(getLessonIdForBuilding('math-academy')).toBe('lesson:math-001')
  })

  it('resolves the English Center to the namespaced English lesson id', () => {
    expect(getLessonIdForBuilding('english-center')).toBe('lesson:english-001')
  })

  it('returns undefined for any building with no linked lesson', () => {
    expect(getLessonIdForBuilding('core-archive')).toBeUndefined()
    expect(getLessonIdForBuilding('does-not-exist')).toBeUndefined()
  })
})
