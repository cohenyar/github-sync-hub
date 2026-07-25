import { describe, expect, it } from 'vitest'
import { getNpcDialogue } from './dialogueContent'
import type { NpcDialogueState } from './npcDialogueState'

const hebrewPattern = /[֐-׿]/

describe('getNpcDialogue — mission-linked NPCs', () => {
  it('gives the North Warden a mission-context line only in the "available" phase', () => {
    const available = getNpcDialogue('north-warden', { kind: 'mission', phase: 'available' })
    expect(available.missionContext).toBeDefined()
    expect(available.missionContext!.length).toBeGreaterThan(0)

    for (const phase of ['locked', 'inProgress', 'completed'] as const) {
      expect(getNpcDialogue('north-warden', { kind: 'mission', phase }).missionContext).toBeUndefined()
    }
  })

  it('gives a distinct line for every mission phase, not a repeated one', () => {
    const phases: NpcDialogueState[] = (['locked', 'available', 'inProgress', 'completed'] as const).map((phase) => ({
      kind: 'mission',
      phase,
    }))
    const greetings = phases.map((state) => getNpcDialogue('south-organizer', state).greeting)
    expect(new Set(greetings).size).toBe(greetings.length)
  })
})

describe('getNpcDialogue — district-status NPCs', () => {
  it('gives a distinct line for every district status, not a repeated one', () => {
    const statuses: NpcDialogueState[] = (['unstable', 'stable', 'thriving'] as const).map((status) => ({
      kind: 'district',
      status,
    }))
    const greetings = statuses.map((state) => getNpcDialogue('archivist-mera', state).greeting)
    expect(new Set(greetings).size).toBe(greetings.length)
  })

  it('never attaches a mission-context line to a district-status NPC', () => {
    for (const status of ['unstable', 'stable', 'thriving'] as const) {
      expect(getNpcDialogue('east-broker', { kind: 'district', status }).missionContext).toBeUndefined()
    }
  })
})

describe('getNpcDialogue — static NPCs', () => {
  it('gives City Voice a single authored line', () => {
    const dialogue = getNpcDialogue('city-voice', { kind: 'static' })
    expect(dialogue.greeting.length).toBeGreaterThan(0)
  })
})

describe('getNpcDialogue — lesson-linked NPCs (Batch 3A.4B)', () => {
  it('gives the math teacher a mission-context line introducing the lesson only in the "available" phase', () => {
    const available = getNpcDialogue('math-teacher', { kind: 'lesson', phase: 'available' })
    expect(available.missionContext).toBeDefined()
    expect(available.missionContext!.length).toBeGreaterThan(0)

    const completed = getNpcDialogue('math-teacher', { kind: 'lesson', phase: 'completed' })
    expect(completed.missionContext).toBeDefined()
  })

  it('gives a distinct line for "available" vs "completed" for both teachers', () => {
    for (const npcId of ['math-teacher', 'english-teacher']) {
      const available = getNpcDialogue(npcId, { kind: 'lesson', phase: 'available' })
      const completed = getNpcDialogue(npcId, { kind: 'lesson', phase: 'completed' })
      expect(available.greeting).not.toBe(completed.greeting)
      expect(available.missionContext).not.toBe(completed.missionContext)
    }
  })
})

describe('getNpcDialogue — fallback', () => {
  it('falls back to a generic greeting for an NPC with no authored dialogue for that state', () => {
    const dialogue = getNpcDialogue('does-not-exist', { kind: 'static' })
    expect(dialogue.greeting.length).toBeGreaterThan(0)
    expect(dialogue.missionContext).toBeUndefined()
  })
})

describe('getNpcDialogue — content quality', () => {
  it('every authored line for every NPC and every one of its reachable states is real Hebrew text', () => {
    const cases: Array<{ npcId: string; state: NpcDialogueState }> = [
      ...(['locked', 'available', 'inProgress', 'completed'] as const).flatMap((phase) => [
        { npcId: 'north-warden', state: { kind: 'mission', phase } as NpcDialogueState },
        { npcId: 'south-organizer', state: { kind: 'mission', phase } as NpcDialogueState },
        { npcId: 'north-analyst', state: { kind: 'mission', phase } as NpcDialogueState },
      ]),
      ...(['unstable', 'stable', 'thriving'] as const).flatMap((status) => [
        { npcId: 'archivist-mera', state: { kind: 'district', status } as NpcDialogueState },
        { npcId: 'east-broker', state: { kind: 'district', status } as NpcDialogueState },
        { npcId: 'south-engineer', state: { kind: 'district', status } as NpcDialogueState },
      ]),
      ...(['available', 'completed'] as const).flatMap((phase) => [
        { npcId: 'math-teacher', state: { kind: 'lesson', phase } as NpcDialogueState },
        { npcId: 'english-teacher', state: { kind: 'lesson', phase } as NpcDialogueState },
      ]),
      { npcId: 'city-voice', state: { kind: 'static' } },
    ]

    for (const { npcId, state } of cases) {
      const dialogue = getNpcDialogue(npcId, state)
      expect(hebrewPattern.test(dialogue.greeting)).toBe(true)
      if (dialogue.missionContext) {
        expect(hebrewPattern.test(dialogue.missionContext)).toBe(true)
      }
    }
  })
})
