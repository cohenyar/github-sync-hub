import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import type { Group } from 'three'
import {
  advanceGreeting,
  computeGreetingBob,
  computeIdleLookYaw,
  computeIdlePose,
  computeVisualFacingAngle,
  computeYawTowards,
  createIdleGreetingState,
  hashIdToPhaseSeed,
  triggerGreeting,
} from '../../logic/animationMotion'
import type { Position2D } from '../../logic/movement'
import { getNpcAppearance } from '../../logic/npcAppearance'
import { distance2D } from '../../logic/proximity'
import { getNpcPosition3D } from '../../logic/scenePositions3D'
import { getNpcFigure } from './npcFigures'

/** Wider than the talk/interaction radius — an NPC turns to face the player well before they're close enough to talk. */
export const NPC_NOTICE_RADIUS = 7

export interface NpcMarker3DProps {
  npcId: string
  districtId: string
  isHighlighted?: boolean
  /** Game Feel pass — locks the NPC's gaze on the player and counts as "noticed" while a dialogue with this NPC is open. Defaults to false. */
  isTalking?: boolean
  /** Game Feel pass — the player's live position, read for notice-turn only; never written. Omitting it keeps this NPC exactly as static as before. */
  playerPositionRef?: RefObject<Position2D>
  onClick: () => void
}

/**
 * A small bespoke character per visible NPC — see npcFigures.tsx for the
 * actual body/silhouette designs. Position, click/highlight wiring, and
 * the figure itself are unchanged; new this pass is idle breathing
 * (phase-seeded per npc so a crowd doesn't move in lockstep), a smooth
 * "notice" turn toward the player within NPC_NOTICE_RADIUS, an idle
 * look-around otherwise, and a small greeting bob the moment the player
 * is noticed or a conversation opens. NPCs are not given a jointed rig —
 * their existing hand-tuned silhouettes (npcFigures.tsx) are left alone;
 * this only animates the outer group they already sit in.
 */
export function NpcMarker3D({
  npcId,
  districtId,
  isHighlighted = false,
  isTalking = false,
  playerPositionRef,
  onClick,
}: NpcMarker3DProps) {
  const position = getNpcPosition3D(npcId, districtId)
  const appearance = getNpcAppearance(npcId)
  const Figure = getNpcFigure(npcId)
  const phaseSeed = useMemo(() => hashIdToPhaseSeed(npcId), [npcId])

  const groupRef = useRef<Group>(null)
  const visualYawRef = useRef(0)
  const wasNoticedRef = useRef(false)
  const greetingStateRef = useRef(createIdleGreetingState())

  useFrame((state, delta) => {
    const idle = computeIdlePose(state.clock.elapsedTime, phaseSeed)
    const playerPosition = playerPositionRef?.current
    const distanceToPlayer = playerPosition ? distance2D(position, playerPosition) : Infinity
    const isNoticed = isTalking || distanceToPlayer <= NPC_NOTICE_RADIUS

    if (isNoticed && !wasNoticedRef.current) greetingStateRef.current = triggerGreeting()
    wasNoticedRef.current = isNoticed
    greetingStateRef.current = advanceGreeting(greetingStateRef.current, delta)

    const targetYaw =
      isNoticed && playerPosition ? computeYawTowards(position, playerPosition) : computeIdleLookYaw(state.clock.elapsedTime, phaseSeed)
    visualYawRef.current = computeVisualFacingAngle(visualYawRef.current, targetYaw, delta)

    if (groupRef.current) {
      groupRef.current.rotation.y = visualYawRef.current
      groupRef.current.position.y = idle.breatheOffsetY + computeGreetingBob(greetingStateRef.current)
      groupRef.current.scale.setScalar(1 + idle.breatheScaleY)
    }
  })

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation()
    onClick()
  }

  return (
    <group ref={groupRef} position={[position.x, 0, position.z]} onClick={handleClick}>
      <Figure appearance={appearance} isHighlighted={isHighlighted} />
    </group>
  )
}
