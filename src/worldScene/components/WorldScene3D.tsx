import { Canvas } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { getLessonIdForBuilding, getLessonIdForNpc } from '../../learning'
import { getDistrictStatus, type WorldState } from '../../worldState'
import { getDistrictStatusLabel, getVisibleNpcs } from '../logic/sceneSelectors'
import {
  getAvatarRespawnPosition,
  getDistrictPosition3D,
  getNpcPosition3D,
  LEARNING_BUILDING_COLLIDERS,
} from '../logic/scenePositions3D'
import type { DistrictPoint, Interactable } from '../logic/proximity'
import type { SceneState } from '../logic/sceneState'
import { CoreArchiveBuilding } from './scene3d/buildings/CoreArchiveBuilding'
import { EastTradingPost } from './scene3d/buildings/EastTradingPost'
import { EnglishCenter } from './scene3d/buildings/EnglishCenter'
import { MathAcademy } from './scene3d/buildings/MathAcademy'
import { NorthWardensPost } from './scene3d/buildings/NorthWardensPost'
import { SouthCommunityHall } from './scene3d/buildings/SouthCommunityHall'
import { BackdropGround } from './scene3d/BackdropGround'
import { BackgroundSkyline } from './scene3d/BackgroundSkyline'
import { DistrictMarker } from './scene3d/DistrictMarker'
import { GroundPlane } from './scene3d/GroundPlane'
import { LearningPlazaProps } from './scene3d/LearningPlazaProps'
import { SkyDome } from './scene3d/SkyDome'
import { NpcMarker3D } from './scene3d/NpcMarker3D'
import { PathNetwork } from './scene3d/PathNetwork'
import { PlayerAvatar } from './scene3d/PlayerAvatar'
import { SceneCamera } from './scene3d/SceneCamera'
import { TeacherNpcAccents } from './scene3d/TeacherNpcAccents'
import { TownProps } from './scene3d/TownProps'
import { WebglErrorBoundary } from './scene3d/WebglErrorBoundary'
import { InteractionPrompt, type DestinationPromptInfo } from './InteractionPrompt'
import styles from './WorldScene3D.module.css'

const TEACHER_NPC_IDS = new Set(['math-teacher', 'english-teacher'])

export interface WorldScene3DProps {
  world: WorldState
  unlockedNpcIds: readonly string[]
  sceneState: SceneState
  destinationInfoById: Readonly<Record<string, DestinationPromptInfo>>
  onMoveToDistrict: (districtId: string) => void
  onEnterDestination: (destinationId: string) => void
  onSelectNpc: (npcId: string) => void
  /** Batch 3A.2 — the Dashboard's chosen subject's building id (e.g. 'math-academy'), if any. Brightens that building only; nothing else changes. */
  highlightedBuildingId?: string
  /** Batch 3A.3 — the Dashboard's chosen subject's linked NPC id (e.g. 'math-teacher'), if any. Marks that NPC only; the other stays fully available. */
  highlightedNpcId?: string
  /** Batch 3A.5 — namespaced lesson ids the player has completed. Drives the small completion badge on each teacher and their building; defaults to none completed when omitted. */
  completedLessonIds?: readonly string[]
}

const CORE_DISTRICT_ID = 'core'
const INTERACT_KEYS = new Set(['KeyE', 'Enter'])

/**
 * The Phase 2 primary 3D scene — flat-shaded primitives only, a fixed
 * camera (no Pointer Lock), WASD movement. Same props as Phase 1's
 * CityPlaza, so App.tsx's mode-switch wiring didn't need to change at all,
 * only which component it points at.
 */
export function WorldScene3D({
  world,
  unlockedNpcIds,
  sceneState,
  destinationInfoById,
  onMoveToDistrict,
  onEnterDestination,
  onSelectNpc,
  highlightedBuildingId,
  highlightedNpcId,
  completedLessonIds = [],
}: WorldScene3DProps) {
  const [nearestInteractable, setNearestInteractable] = useState<Interactable | null>(null)
  const [inRangeIds, setInRangeIds] = useState<ReadonlySet<string>>(new Set())

  // Batch 3A.5 — resolved once per render from the same namespaced lesson
  // ids GameApp already tracks; never touches missionRegistry/completedMissionIds.
  const mathAcademyLessonId = getLessonIdForBuilding('math-academy')
  const englishCenterLessonId = getLessonIdForBuilding('english-center')
  const isMathAcademyCompleted = Boolean(mathAcademyLessonId && completedLessonIds.includes(mathAcademyLessonId))
  const isEnglishCenterCompleted = Boolean(
    englishCenterLessonId && completedLessonIds.includes(englishCenterLessonId),
  )

  const districts = Object.values(world.districts)
  const districtPoints: DistrictPoint[] = districts.map((district) => ({
    id: district.id,
    position: getDistrictPosition3D(district.id),
  }))

  const visibleNpcs = getVisibleNpcs(sceneState.playerDistrictId, unlockedNpcIds)
  // Every district is now a destination entry point (the Hub included) —
  // not just the Core. Which mission opening a destination leads to, and
  // whether it's locked, is decided by App.tsx (via destinationContent.ts);
  // this component only knows "this is a district-kind interactable."
  const interactables: Interactable[] = [
    ...districts.map((district) => ({
      id: district.id,
      kind: 'district' as const,
      position: getDistrictPosition3D(district.id),
    })),
    ...visibleNpcs.map((npc) => ({
      id: npc.id,
      kind: 'npc' as const,
      position: getNpcPosition3D(npc.id, npc.districtId),
    })),
  ]

  // Batch 3A.3: lets InteractionPrompt name whichever NPC is nearest,
  // instead of only revealing who it is once dialogue is already open.
  const npcNameById: Readonly<Record<string, string>> = Object.fromEntries(
    visibleNpcs.map((npc) => [npc.id, npc.name]),
  )

  const isMovementEnabled = sceneState.mode.kind !== 'dialogue'

  // The whole scene (including the avatar's position ref) unmounts while
  // the Terminal is open — see App.tsx's mode switch — so the avatar
  // respawns wherever sceneState.playerDistrictId says the player last
  // was, not always back at the original spawn point.
  const avatarSpawnPosition = getAvatarRespawnPosition(sceneState.playerDistrictId)

  function triggerInteractable(interactable: Interactable) {
    if (interactable.kind === 'district') {
      onEnterDestination(interactable.id)
    } else if (interactable.kind === 'npc') {
      onSelectNpc(interactable.id)
    }
  }

  // Keyboard interaction always resolves via the single nearest
  // interactable — it's the only one the player can target without pointing
  // at anything specific, matching the Hebrew prompt shown on screen.
  // Whether a locked destination actually opens is decided by App.tsx's
  // onEnterDestination itself (it no-ops for a locked destination) — this
  // component never needs to know a destination's lock status to dispatch
  // the same way for every district.
  //
  // Batch 3A.3: guarded by isMovementEnabled (false exactly while a dialogue
  // is already open) so E/Enter/Talk/click can never re-trigger or re-open
  // a conversation that's already showing — the fix for the interaction
  // reliability bug the original diagnosis flagged.
  function handleInteract() {
    if (!isMovementEnabled) return
    if (nearestInteractable) triggerInteractable(nearestInteractable)
  }

  // A direct click on a specific mesh wins over "nearest interactable" as
  // long as the clicked object is still within interaction range — so
  // clicking a destination opens it even when an NPC (e.g. Mera Solt,
  // stationed close by) happens to be marginally nearer to the player.
  // Clicking something out of range is a legitimate no-op, not a silent
  // failure of an otherwise-valid interaction.
  function handleMeshClick(id: string) {
    if (!isMovementEnabled) return
    if (!inRangeIds.has(id)) return
    const target = interactables.find((interactable) => interactable.id === id)
    if (target) triggerInteractable(target)
  }

  // The listener is attached exactly once per mount, never torn down and
  // reattached as nearestInteractable/onEnterDestination/onSelectNpc change
  // (they change on nearly every App render — inline props, Odin/audio
  // effects, etc.) — reading the latest handleInteract via a ref instead of
  // a dependency array closes a real race where a keydown sent in the exact
  // instant between an old listener's teardown and its replacement's
  // attachment would otherwise be silently dropped.
  const handleInteractRef = useRef(handleInteract)
  handleInteractRef.current = handleInteract

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (INTERACT_KEYS.has(event.code) || event.key === 'Enter') {
        handleInteractRef.current()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const currentDistrict = world.districts[sceneState.playerDistrictId]
  const currentDistrictLabel = destinationInfoById[sceneState.playerDistrictId]?.name ?? sceneState.playerDistrictId
  const currentDistrictStatusLabel = currentDistrict ? getDistrictStatusLabel(getDistrictStatus(currentDistrict)) : ''

  return (
    <div className={styles.scene} data-testid="world-scene-3d">
      <WebglErrorBoundary>
      <Canvas dpr={[1, 2]}>
        <SceneCamera />
        {/*
         * A small lighting mood, not just illumination: a cool blue-toned
         * ambient fill (the night itself), a warm key light raking down
         * from above the Records Core (as if its own glow were lighting
         * the plaza), and a faint cool rim light from the opposite side so
         * shapes keep an edge instead of going flat and dark on one side.
         * Same warm-against-cool language as every character's glow accent
         * and the plaza's lamp posts.
         */}
        <ambientLight color="#3a4d75" intensity={0.55} />
        <directionalLight color="#ffdca8" position={[4, 14, 6]} intensity={1.05} />
        <directionalLight color="#7ea0c9" position={[-8, 6, -10]} intensity={0.25} />

        {/* Background color + fog give the scene actual air: the
            BackgroundSkyline ring now fades into the sky instead of
            stopping at a hard silhouette edge, and everything at the far
            corners of the plaza reads as slightly more distant than the
            Core at its center — all built-in Three.js fog, no post effects. */}
        <color attach="background" args={['#0e1524']} />
        <fogExp2 attach="fog" args={['#131b2c', 0.017]} />

        <SkyDome />
        <BackdropGround />
        <BackgroundSkyline />
        <GroundPlane />
        <PathNetwork />

        {/* Static scenery — no interaction, no unlock gating, always present regardless of NPC unlock state. */}
        <CoreArchiveBuilding />
        <NorthWardensPost />
        <SouthCommunityHall />
        <EastTradingPost />
        <TownProps />

        {/* Batch 3A.2 — the new Central Plaza's two learning buildings. Not
            gated by unlock/NPC state, same as every other building above. */}
        <MathAcademy isHighlighted={highlightedBuildingId === 'math-academy'} isCompleted={isMathAcademyCompleted} />
        <EnglishCenter
          isHighlighted={highlightedBuildingId === 'english-center'}
          isCompleted={isEnglishCenterCompleted}
        />
        <LearningPlazaProps />

        {districts.map((district) => {
          const isCore = district.id === CORE_DISTRICT_ID
          return (
            <DistrictMarker
              key={district.id}
              districtId={district.id}
              status={getDistrictStatus(district)}
              isCore={isCore}
              isHighlighted={nearestInteractable?.id === district.id}
              onClick={() => handleMeshClick(district.id)}
            />
          )
        })}

        {visibleNpcs.map((npc) => (
          <NpcMarker3D
            key={npc.id}
            npcId={npc.id}
            districtId={npc.districtId}
            isHighlighted={nearestInteractable?.id === npc.id}
            onClick={() => handleMeshClick(npc.id)}
          />
        ))}

        {/* Batch 3A.3 — the extra identification/feedback layer for the two
            teacher NPCs only (name label, in-range ring, selected-path
            accent). Purely additive alongside their NpcMarker3D above;
            every other NPC is untouched. */}
        {visibleNpcs
          .filter((npc) => TEACHER_NPC_IDS.has(npc.id))
          .map((npc) => {
            const linkedLessonId = getLessonIdForNpc(npc.id)
            return (
              <TeacherNpcAccents
                key={npc.id}
                npcId={npc.id}
                districtId={npc.districtId}
                name={npc.name}
                isHighlighted={nearestInteractable?.id === npc.id}
                isSelectedPath={highlightedNpcId === npc.id}
                isCompleted={Boolean(linkedLessonId && completedLessonIds.includes(linkedLessonId))}
              />
            )
          })}

        <PlayerAvatar
          initialPosition={avatarSpawnPosition}
          districts={districtPoints}
          interactables={interactables}
          isMovementEnabled={isMovementEnabled}
          currentDistrictId={sceneState.playerDistrictId}
          onDistrictChange={onMoveToDistrict}
          onNearestInteractableChange={setNearestInteractable}
          onInRangeIdsChange={(ids) => setInRangeIds(new Set(ids))}
          colliders={LEARNING_BUILDING_COLLIDERS}
        />
      </Canvas>
      </WebglErrorBoundary>

      <div className={styles.hud} data-testid="district-status-hud">
        {currentDistrictLabel} — {currentDistrictStatusLabel}
      </div>
      {/* Batch 3A.3: hidden entirely while a dialogue is already open —
          fixes the overlap the original diagnosis flagged, rather than
          just visually layering a second prompt under the open dialogue. */}
      {isMovementEnabled && (
        <InteractionPrompt
          interactable={nearestInteractable}
          destinationInfoById={destinationInfoById}
          npcNameById={npcNameById}
          onTalk={nearestInteractable?.kind === 'npc' ? handleInteract : undefined}
        />
      )}
    </div>
  )
}
