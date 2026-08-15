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

  it('leaves a purely decorative district-status NPC with no mission-context line', () => {
    for (const status of ['unstable', 'stable', 'thriving'] as const) {
      expect(getNpcDialogue('south-engineer', { kind: 'district', status }).missionContext).toBeUndefined()
    }
  })

  // Playtest fix pass (issue 2) — Mera carries an actionable next step only
  // in her 'unstable' phase, the one where the explanation is still needed.
  it('gives Mera an actionable next step only while unstable', () => {
    expect(getNpcDialogue('archivist-mera', { kind: 'district', status: 'unstable' }).missionContext).toBeDefined()
    for (const status of ['stable', 'thriving'] as const) {
      expect(getNpcDialogue('archivist-mera', { kind: 'district', status }).missionContext).toBeUndefined()
    }
  })
})

describe('getNpcDialogue — Tomas Reyeth (east-broker), playtest fix issue 4', () => {
  // Moved from a district-status NPC to a mission-linked one: the East
  // district's own stats (initialDistricts.ts) never change anywhere in
  // the campaign, so an 'unstable'-keyed line on him was dead content no
  // playthrough could ever reach — full-signal is the mission that
  // actually gates the East course.
  it('never blames an unrelated subject for the delay (Meridian 2.0 open-world pass)', () => {
    const dialogue = getNpcDialogue('east-broker', { kind: 'mission', phase: 'locked' })
    expect(dialogue.missionContext).toBeDefined()
    expect(dialogue.missionContext).not.toContain('הדרום')
  })

  it('drops the "blocked" explanation once full-signal unlocks, replacing it with a distinct line', () => {
    const locked = getNpcDialogue('east-broker', { kind: 'mission', phase: 'locked' })
    const available = getNpcDialogue('east-broker', { kind: 'mission', phase: 'available' })
    expect(available.missionContext).toBeDefined()
    expect(available.missionContext).not.toBe(locked.missionContext)
  })

  it('gives inProgress and completed their own distinct greetings, not a repeat of the locked/available one', () => {
    const shared = getNpcDialogue('east-broker', { kind: 'mission', phase: 'locked' }).greeting
    const inProgress = getNpcDialogue('east-broker', { kind: 'mission', phase: 'inProgress' })
    const completed = getNpcDialogue('east-broker', { kind: 'mission', phase: 'completed' })
    expect(inProgress.greeting).not.toBe(shared)
    expect(completed.greeting).not.toBe(shared)
    expect(completed.greeting).not.toBe(inProgress.greeting)
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
        { npcId: 'east-broker', state: { kind: 'mission', phase } as NpcDialogueState },
      ]),
      ...(['unstable', 'stable', 'thriving'] as const).flatMap((status) => [
        { npcId: 'archivist-mera', state: { kind: 'district', status } as NpcDialogueState },
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
