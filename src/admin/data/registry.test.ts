import { describe, expect, it } from 'vitest'
import { addMission, removeMission } from '../../missions'
import { getAdminRegistry } from './registry'

const EXPECTED_SECTION_IDS = ['missions', 'districts', 'npcs', 'rewards', 'progression', 'player-state']

const CRUD_ENABLED_SECTION_IDS = ['npcs']

describe('getAdminRegistry', () => {
  it('exists and is non-empty', () => {
    expect(getAdminRegistry().length).toBeGreaterThan(0)
  })

  it('registers exactly the six required sections', () => {
    expect(
      getAdminRegistry()
        .map((section) => section.id)
        .sort(),
    ).toEqual([...EXPECTED_SECTION_IDS].sort())
  })

  it.each(EXPECTED_SECTION_IDS)('section "%s" has a title, description, itemCount, and status', (id) => {
    const section = getAdminRegistry().find((s) => s.id === id)
    expect(section).toBeDefined()
    expect(typeof section?.title).toBe('string')
    expect(section?.title.length).toBeGreaterThan(0)
    expect(typeof section?.description).toBe('string')
    expect(section?.description.length).toBeGreaterThan(0)
    expect(typeof section?.itemCount).toBe('number')
    expect(section?.itemCount).toBeGreaterThanOrEqual(0)
    expect(section?.status.length).toBeGreaterThan(0)
  })

  it.each(CRUD_ENABLED_SECTION_IDS)('section "%s" reports CRUD enabled', (id) => {
    const section = getAdminRegistry().find((s) => s.id === id)
    expect(section?.status).toBe('CRUD enabled')
  })

  it.each(EXPECTED_SECTION_IDS.filter((id) => !CRUD_ENABLED_SECTION_IDS.includes(id)))(
    'section "%s" reports read-only foundation',
    (id) => {
      const section = getAdminRegistry().find((s) => s.id === id)
      expect(section?.status).toBe('Read-only foundation')
    },
  )

  it('reports a real, non-zero item count for the missions section', () => {
    const section = getAdminRegistry().find((s) => s.id === 'missions')
    expect(section?.itemCount).toBeGreaterThan(0)
  })

  it('reports a real, non-zero item count for the npcs section', () => {
    const section = getAdminRegistry().find((s) => s.id === 'npcs')
    expect(section?.itemCount).toBeGreaterThan(0)
  })

  it('reports a zero item count for systems that do not exist yet', () => {
    const playerState = getAdminRegistry().find((s) => s.id === 'player-state')
    expect(playerState?.itemCount).toBe(0)
  })

  it('recomputes itemCount fresh on every call (not frozen at module load)', () => {
    const before = getAdminRegistry().find((s) => s.id === 'missions')!.itemCount

    addMission({
      id: 'test-registry-fresh-count',
      title: 'Temp',
      goal: 'Temp',
      prompt: 'Temp',
      subjectHe: 'מתמטיקה',
      taskHe: 'כמה זה 1 + 1?',
      answerConfig: { type: 'exact_text', acceptedAnswers: ['2'] },
    })

    expect(getAdminRegistry().find((s) => s.id === 'missions')!.itemCount).toBe(before + 1)

    removeMission('test-registry-fresh-count')
  })
})
