import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import { DoubleSide, type Group } from 'three'
import {
  advanceGreeting,
  computeGreetingBob,
  computeIdleLookYaw,
  computeIdlePose,
  computeNpcTalkBob,
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

/**
 * Visibility pass — a thin ring flat on the ground under every NPC (not
 * just the two teachers, who already get their own proximity ring via
 * TeacherNpcAccents). Two purposes: it's a ground anchor that stays
 * visible even when the figure above it is partly occluded by scenery
 * (e.g. a building), and its own brightening on approach reads as "this
 * is interactive" well before a player is close enough to see the
 * highlight glow on the figure itself. y=0.02 sits just proud of the
 * ground plane (GroundPlane.tsx is flat at y=0) — enough to avoid
 * z-fighting without visibly floating.
 */
const GROUND_RING_Y = 0.02
const GROUND_RING_INNER_RADIUS = 0.42
const GROUND_RING_OUTER_RADIUS = 0.5
const GROUND_RING_IDLE_INTENSITY = 0.35
const GROUND_RING_HIGHLIGHT_INTENSITY = 1.1

// Perf pass — a contact-shadow disc was added here during the art-direction
// pass and then removed again during the follow-up performance pass: it was
// confirmed (via live A/B screenshots) to be barely perceptible against this
// scene's already-dark ground, while costing one extra draw call and geometry
// buffer per NPC. Per the "spend geometry where the player can see it" rule,
// that's not a good trade — cut rather than kept as invisible ornament.

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

    const talkBob = isTalking ? computeNpcTalkBob(state.clock.elapsedTime) : 0

    if (groupRef.current) {
      groupRef.current.rotation.y = visualYawRef.current
      groupRef.current.position.y = idle.breatheOffsetY + computeGreetingBob(greetingStateRef.current) + talkBob
      groupRef.current.scale.setScalar(1 + idle.breatheScaleY)
    }
  })

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation()
    onClick()
  }

  return (
    <group position={[position.x, 0, position.z]}>
      {/* Ground anchor ring — a sibling of the animated group below, not a
          child of it, so it stays flat on the ground at a fixed y rather
          than bobbing/scaling with the figure's own idle breathing and
          greeting animation. */}
      <mesh position={[0, GROUND_RING_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[GROUND_RING_INNER_RADIUS, GROUND_RING_OUTER_RADIUS, 24]} />
        <meshStandardMaterial
          color={appearance.glowColor}
          emissive={appearance.glowColor}
          emissiveIntensity={isHighlighted ? GROUND_RING_HIGHLIGHT_INTENSITY : GROUND_RING_IDLE_INTENSITY}
          flatShading
          side={DoubleSide}
        />
      </mesh>
      <group ref={groupRef} onClick={handleClick}>
        <Figure appearance={appearance} isHighlighted={isHighlighted} />
      </group>
    </group>
  )
}
