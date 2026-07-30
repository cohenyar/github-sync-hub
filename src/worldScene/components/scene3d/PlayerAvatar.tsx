import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { resolveBuildingCollision, type CircleCollider } from '../../logic/collision'
import { computeFacingAngle, computeNextPosition, type Position2D } from '../../logic/movement'
import {
  getInteractablesInRadius,
  getNearestDistrictId,
  getNearestInteractable,
  type DistrictPoint,
  type Interactable,
} from '../../logic/proximity'
import { getPlayerAvatarPreset } from '../../logic/playerAppearance'
import { Eyes } from './npcFigures'
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
}

/**
 * Renders the avatar (body + identity ring + forward-facing marker, grouped)
 * and owns the per-frame game loop: read held WASD keys, advance position
 * and facing (movement.ts, pure), detect which district zone the player now
 * occupies and what's within interaction range (proximity.ts, pure).
 * Position/facing live in refs, not React state — only genuinely observable
 * changes (a new district, a new nearest interactable, a change in which
 * interactables are in range) ever call back up to WorldScene3D.
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
}: PlayerAvatarProps) {
  const { bodyColor, accentColor } = getPlayerAvatarPreset(avatarId)
  const groupRef = useRef<Group>(null)
  const positionRef = useRef<Position2D>(initialPosition)
  const facingRef = useRef(0)
  const inputRef = useWasdInput()
  const lastDistrictRef = useRef(currentDistrictId)
  const lastInteractableIdRef = useRef<string | null>(null)
  const lastInRangeKeyRef = useRef('')

  useFrame((_state, delta) => {
    if (isMovementEnabled) {
      const next = computeNextPosition(positionRef.current, inputRef.current, delta)
      positionRef.current = colliders ? resolveBuildingCollision(next, colliders) : next
      facingRef.current = computeFacingAngle(inputRef.current, facingRef.current)
    }

    if (groupRef.current) {
      groupRef.current.position.set(positionRef.current.x, 0, positionRef.current.z)
      groupRef.current.rotation.y = facingRef.current
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
       * single accessory: no NPC uses a capsule body, none has this
       * identity ring, and none is this saturated a color. The big-head
       * proportion and Eyes are the same "family" language every NPC
       * shares (see npcFigures.tsx), so the player still reads as part of
       * Meridian's cast rather than a foreign shape dropped into it.
       */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.75, 24]} />
        <meshStandardMaterial color={accentColor} flatShading />
      </mesh>
      <mesh position={[0, 0.61, 0]}>
        <capsuleGeometry args={[0.36, 0.5, 4, 8]} />
        <meshStandardMaterial color={bodyColor} flatShading />
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.12, 12]} />
        <meshStandardMaterial color="#f5ead8" flatShading />
      </mesh>
      <mesh position={[0, 1.37, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color={bodyColor} flatShading />
      </mesh>
      <Eyes headRadius={0.4} />
    </group>
  )
}
