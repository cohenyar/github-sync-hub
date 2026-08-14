import { describe, expect, it } from 'vitest'
import { DISTRICT_CONTENT_REQUIRED_FIELDS } from './districtContentSchema'
import { MISSION_CONTENT_REQUIRED_FIELDS } from './missionContentSchema'
import { NPC_CONTENT_REQUIRED_FIELDS } from './npcContentSchema'
import { PROGRESSION_CONTENT_REQUIRED_STRING_FIELDS } from './progressionContentSchema'
import { REWARD_CONTENT_REQUIRED_STRING_FIELDS } from './rewardContentSchema'
import { VALID_WORLD_EFFECT_KINDS } from './worldEffectContentSchema'

describe('content schemas', () => {
  // SQL-removal pass — referenceSql dropped: it only exists on a SQL
  // mission now that question missions exist too (see GameMissionContent).
  it('mission schema requires id, title, goal, and prompt', () => {
    expect(MISSION_CONTENT_REQUIRED_FIELDS).toEqual(['id', 'title', 'goal', 'prompt'])
  })

  it('district schema requires an id', () => {
    expect(DISTRICT_CONTENT_REQUIRED_FIELDS).toEqual(['id'])
  })

  it('npc schema requires id, name, districtId, role, and description', () => {
    expect(NPC_CONTENT_REQUIRED_FIELDS).toEqual(['id', 'name', 'districtId', 'role', 'description'])
  })

  it('reward schema requires missionId and missionTitle', () => {
    expect(REWARD_CONTENT_REQUIRED_STRING_FIELDS).toEqual(['missionId', 'missionTitle'])
  })

  it('progression schema requires missionId and title', () => {
    expect(PROGRESSION_CONTENT_REQUIRED_STRING_FIELDS).toEqual(['missionId', 'title'])
  })

  it('world effect schema lists the three known effect kinds', () => {
    expect(VALID_WORLD_EFFECT_KINDS).toEqual(['ADJUST_STAT', 'SET_STAT', 'ADVANCE_TURN'])
  })
})
