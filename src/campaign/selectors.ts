import { getMissionById, type MissionConfig } from '../missions'
import type { CampaignMissionEntry, CampaignProgress, CampaignSummary, GameCampaign } from './types'

type MissionResolver = (missionId: string) => MissionConfig | undefined

function getCurrentEntry(campaign: GameCampaign, progress: CampaignProgress): CampaignMissionEntry | undefined {
  return [...campaign.missions]
    .sort((a, b) => a.order - b.order)
    .find((entry) => !progress.completedMissionIds.includes(entry.missionId))
}

export function getCurrentMission(
  campaign: GameCampaign,
  progress: CampaignProgress,
  resolveMission: MissionResolver = getMissionById,
): MissionConfig | undefined {
  const entry = getCurrentEntry(campaign, progress)
  return entry ? resolveMission(entry.missionId) : undefined
}

export function getNextMission(
  campaign: GameCampaign,
  progress: CampaignProgress,
  resolveMission: MissionResolver = getMissionById,
): MissionConfig | undefined {
  const current = getCurrentEntry(campaign, progress)
  if (!current) return undefined

  const next = campaign.missions.find((entry) => entry.order === current.order + 1)
  return next ? resolveMission(next.missionId) : undefined
}

export function isCampaignComplete(campaign: GameCampaign, progress: CampaignProgress): boolean {
  return campaign.missions.length > 0 && campaign.missions.every((entry) => progress.completedMissionIds.includes(entry.missionId))
}

export function getCampaignSummary(campaign: GameCampaign, progress: CampaignProgress): CampaignSummary {
  const currentEntry = getCurrentEntry(campaign, progress)
  const totalMissions = campaign.missions.length

  return {
    totalMissions,
    completedMissions: progress.completedMissionIds.length,
    currentMissionIndex: currentEntry ? currentEntry.order : totalMissions > 0 ? totalMissions : null,
    isComplete: isCampaignComplete(campaign, progress),
  }
}
