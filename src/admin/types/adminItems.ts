import type { WorldEffect } from '../../worldState'

export interface AdminMissionItem {
  id: string
  title: string
  goal: string
}

export interface AdminNpcItem {
  id: string
  name: string
  districtId: string
  role: string
  description: string
}

export interface AdminRewardItem {
  missionId: string
  missionTitle: string
  effect: WorldEffect
}

export interface AdminProgressionItem {
  order: number
  missionId: string
  title: string
}

/** No save/load system exists yet — this shape is a placeholder for when one does. */
export interface AdminPlayerStateItem {
  playerId: string
}
