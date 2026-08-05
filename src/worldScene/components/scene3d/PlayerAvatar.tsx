import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import type { Group } from 'three'
import {
  advancePulse,
  advanceSpeedFactor,
  advanceWalkPhase,
  computeIdlePose,
  computePulseScale,
  computeTalkingHeadNod,
  computeVisualFacingAngle,
  computeWalkPose,
  getTargetSpeedFactor,
  triggerPulse,
  type PulseState,
} from '../../logic/animationMotion'
import { resolveBuildingCollision, type CircleCollider } from '../../logic/collision'
import { computeFacingAngle, computeNextPosition, mergeMovementInput, type MovementInput, type Position2D } from '../../logic/movement'
import {
  getInteractablesInRadius,
  getNearestDistrictId,
  getNearestInteractable,
  type DistrictPoint,
  type Interactable,
} from '../../logic/proximity'
import { getPlayerAvatarPreset } from '../../logic/playerAppearance'
import { PLAYER_PELVIS_HEIGHT, PlayerCharacter, usePlayerJointRefs } from './PlayerCharacter'
import { useWasdInput } from './useWasdInput'

export interface PlayerAvatarProps {
  initialPosition: Position2D
  districts: readonly DistrictPoint[]
  interactables: readonly Interactable[]
  isMovementEnabled: boolean
  currentDistrictId: string
  onDistrictChange: (districtId: string) => void
  onNearestInteractableChange: (interactable: Interactable | null) => void
  onInRangeIdsChange: (ids: readonly string[]) => void
  /** Batch 3A.2 — the only two colliders in the world (the new learning buildings). Optional so every other caller/test is unaffected. */
  colliders?: readonly CircleCollider[]
  /** Meridian 1.4 — Player Identity MVP; an id into PLAYER_AVATAR_PRESETS. Undefined resolves to the original 'ember' colors, so every existing caller/test is unaffected. */
  avatarId?: string
  /** Game Feel pass — lets WorldScene3D read the player's live position for NPC notice-turn, without owning movement itself. Optional; omitting it changes nothing. */
  externalPositionRef?: RefObject<Position2D>
  /** Game Feel pass — drives the talking-head-nod animation while a dialogue with this player is open. Defaults to false. */
  isTalking?: boolean
  /** Game Feel pass — bumping this number (e.g. on every interact key-press) triggers one interaction pulse. Undefined runs no pulse logic at all. */
  interactionPulseToken?: number
  /** Mobile UX pass — a virtual joystick's live input, OR-merged with the keyboard's every frame (mergeMovementInput) so either source alone is enough to move. Undefined behaves exactly as before (keyboard only). */
  touchInputRef?: RefObject<MovementInput>
}

/**
 * Renders the avatar (a real jointed PlayerCharacter, plus the identity
 * ring) and owns the per-frame game loop: read held WASD keys, advance
 * position and facing (movement.ts, pure), detect which district zone the
 * player now occupies and what's within interaction range (proximity.ts,
 * pure) — all exactly as before. New this pass: walk-cycle/idle/turn-ease/
 * talk/pulse animation, computed here (animationMotion.ts, pure) and
 * written directly onto the joint refs PlayerCharacter exposes. Position/
 * facing/animation state all live in refs, not React state — only
 * genuinely observable changes (a new district, a new nearest
 * interactable, a change in which interactables are in range) ever call
 * back up to WorldScene3D.
 */
export function PlayerAvatar({
  initialPosition,
  districts,
  interactables,
  isMovementEnabled,
  currentDistrictId,
  onDistrictChange,
  onNearestInteractableChange,
  onInRangeIdsChange,
  colliders,
  avatarId,
  externalPositionRef,
  isTalking = false,
  interactionPulseToken,
  touchInputRef,
}: PlayerAvatarProps) {
  const preset = getPlayerAvatarPreset(avatarId)
  const groupRef = useRef<Group>(null)
  const internalPositionRef = useRef<Position2D>(initialPosition)
  const positionRef = externalPositionRef ?? internalPositionRef
  const facingRef = useRef(0)
  const visualFacingRef = useRef(0)
  const inputRef = useWasdInput()
  const lastDistrictRef = useRef(currentDistrictId)
  const lastInteractableIdRef = useRef<string | null>(null)
  const lastInRangeKeyRef = useRef('')

  const jointRefs = usePlayerJointRefs()
  const walkPhaseRef = useRef(0)
  const speedFactorRef = useRef(0)
  const pulseStateRef = useRef<PulseState>({ isPlaying: false, elapsed: 0 })
  const lastPulseTokenRef = useRef(interactionPulseToken)

  useFrame((state, delta) => {
    const heldInput = mergeMovementInput(inputRef.current, touchInputRef?.current)

    if (isMovementEnabled) {
      const next = computeNextPosition(positionRef.current, heldInput, delta)
      positionRef.current = colliders ? resolveBuildingCollision(next, colliders) : next
      facingRef.current = computeFacingAngle(heldInput, facingRef.current)
    }

    visualFacingRef.current = computeVisualFacingAngle(visualFacingRef.current, facingRef.current, delta)

    if (groupRef.current) {
      groupRef.current.position.set(positionRef.current.x, 0, positionRef.current.z)
      groupRef.current.rotation.y = visualFacingRef.current
    }

    const targetSpeedFactor = isMovementEnabled ? getTargetSpeedFactor(heldInput) : 0
    speedFactorRef.current = advanceSpeedFactor(speedFactorRef.current, targetSpeedFactor, delta)
    walkPhaseRef.current = advanceWalkPhase(walkPhaseRef.current, delta, speedFactorRef.current)

    if (interactionPulseToken !== undefined && interactionPulseToken !== lastPulseTokenRef.current) {
      lastPulseTokenRef.current = interactionPulseToken
      pulseStateRef.current = triggerPulse()
    }
    pulseStateRef.current = advancePulse(pulseStateRef.current, delta)

    const walkPose = computeWalkPose(walkPhaseRef.current, speedFactorRef.current)
    const idlePose = computeIdlePose(state.clock.elapsedTime)
    const idleWeight = 1 - speedFactorRef.current
    const pulseScale = computePulseScale(pulseStateRef.current)

    if (jointRefs.pelvis.current) {
      jointRefs.pelvis.current.position.y =
        PLAYER_PELVIS_HEIGHT + walkPose.bodyBobY + idlePose.breatheOffsetY * idleWeight
      jointRefs.pelvis.current.scale.setScalar(pulseScale)
      jointRefs.pelvis.current.scale.y *= 1 + idlePose.breatheScaleY * idleWeight
    }
    if (jointRefs.hipL.current) jointRefs.hipL.current.rotation.x = walkPose.hipSwingL
    if (jointRefs.hipR.current) jointRefs.hipR.current.rotation.x = walkPose.hipSwingR
    if (jointRefs.kneeL.current) jointRefs.kneeL.current.rotation.x = -walkPose.kneeBendL
    if (jointRefs.kneeR.current) jointRefs.kneeR.current.rotation.x = -walkPose.kneeBendR
    if (jointRefs.shoulderL.current) jointRefs.shoulderL.current.rotation.x = walkPose.shoulderSwingL
    if (jointRefs.shoulderR.current) jointRefs.shoulderR.current.rotation.x = walkPose.shoulderSwingR
    if (jointRefs.elbowL.current) jointRefs.elbowL.current.rotation.x = -walkPose.elbowBendL
    if (jointRefs.elbowR.current) jointRefs.elbowR.current.rotation.x = -walkPose.elbowBendR

    if (jointRefs.neck.current) {
      jointRefs.neck.current.rotation.x = isTalking ? computeTalkingHeadNod(state.clock.elapsedTime) : idlePose.headSwayX * idleWeight
      jointRefs.neck.current.rotation.z = isTalking ? 0 : idlePose.headSwayZ * idleWeight
    }

    const nearestDistrict = getNearestDistrictId(positionRef.current, districts)
    if (nearestDistrict !== lastDistrictRef.current) {
      lastDistrictRef.current = nearestDistrict
      onDistrictChange(nearestDistrict)
    }

    const nearest = getNearestInteractable(positionRef.current, interactables)
    const nearestId = nearest?.id ?? null
    if (nearestId !== lastInteractableIdRef.current) {
      lastInteractableIdRef.current = nearestId
      onNearestInteractableChange(nearest)
    }

    const inRangeKey = getInteractablesInRadius(positionRef.current, interactables)
      .map((interactable) => interactable.id)
      .sort()
      .join(',')
    if (inRangeKey !== lastInRangeKeyRef.current) {
      lastInRangeKeyRef.current = inRangeKey
      onInRangeIdsChange(inRangeKey === '' ? [] : inRangeKey.split(','))
    }
  })

  return (
    <group ref={groupRef} position={[initialPosition.x, 0, initialPosition.z]}>
      {/*
       * The player's silhouette is exclusive by construction, not by a
       * single accessory: no NPC has this identity ring, and none is this
       * saturated a color. PlayerCharacter's proportions (a fairly large
       * head, flat-shaded primitives) are the same "family" language every
       * NPC shares (see npcFigures.tsx), so the player still reads as part
       * of Meridian's cast rather than a foreign shape dropped into it.
       * The ring is a flat, static ground marker — a direct sibling of the
       * rig, not nested inside it, so it never inherits bob/breathe/pulse.
       */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.75, 24]} />
        <meshStandardMaterial color={preset.accentColor} flatShading />
      </mesh>
      <PlayerCharacter appearance={preset} jointRefs={jointRefs} />
    </group>
  )
}
