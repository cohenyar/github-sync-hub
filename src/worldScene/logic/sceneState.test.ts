import { describe, expect, it } from 'vitest'
import {
  closeDialogue,
  createInitialSceneState,
  enterDestination,
  exitTerminal,
  moveToDistrict,
  openNpcDialogue,
} from './sceneState'

describe('createInitialSceneState', () => {
  it('starts in the plaza at the given district', () => {
    expect(createInitialSceneState('north')).toEqual({
      playerDistrictId: 'north',
      mode: { kind: 'plaza' },
    })
  })
})

describe('moveToDistrict', () => {
  it('updates the player district and returns to the plaza', () => {
    const state = createInitialSceneState('north')
    expect(moveToDistrict(state, 'south')).toEqual({
      playerDistrictId: 'south',
      mode: { kind: 'plaza' },
    })
  })

  it('closes an open dialogue when the player walks away', () => {
    const state = openNpcDialogue(createInitialSceneState('north'), 'north-warden')
    expect(moveToDistrict(state, 'south').mode).toEqual({ kind: 'plaza' })
  })

  it('closes an open terminal when the player walks away', () => {
    const state = enterDestination(createInitialSceneState('north'), 'core')
    expect(moveToDistrict(state, 'north').mode).toEqual({ kind: 'plaza' })
  })
})

describe('openNpcDialogue / closeDialogue', () => {
  it('opens a dialogue with the given NPC id, preserving the player district', () => {
    const state = createInitialSceneState('north')
    const next = openNpcDialogue(state, 'north-warden')
    expect(next).toEqual({ playerDistrictId: 'north', mode: { kind: 'dialogue', npcId: 'north-warden' } })
  })

  it('closes back to the plaza, preserving the player district', () => {
    const state = openNpcDialogue(createInitialSceneState('south'), 'south-organizer')
    expect(closeDialogue(state)).toEqual({ playerDistrictId: 'south', mode: { kind: 'plaza' } })
  })
})

describe('enterDestination / exitTerminal', () => {
  it('moves the player to the core district and opens the terminal in one step', () => {
    const state = createInitialSceneState('north')
    expect(enterDestination(state, 'core')).toEqual({ playerDistrictId: 'core', mode: { kind: 'terminal' } })
  })

  it('works identically for any other destination, not just the core', () => {
    const state = createInitialSceneState('core')
    expect(enterDestination(state, 'north')).toEqual({ playerDistrictId: 'north', mode: { kind: 'terminal' } })
  })

  it('exiting the terminal returns to the plaza, staying at the entered destination', () => {
    const state = enterDestination(createInitialSceneState('north'), 'core')
    expect(exitTerminal(state)).toEqual({ playerDistrictId: 'core', mode: { kind: 'plaza' } })
  })
})
