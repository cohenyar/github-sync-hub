import { PerspectiveCamera } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import { MathUtils, Vector3, type PerspectiveCamera as ThreePerspectiveCamera } from 'three'
import { usePrefersReducedMotion } from '../../../platform/hooks/usePrefersReducedMotion'
import type { Position2D } from '../../logic/movement'
import { CAMERA_FOV, CAMERA_LOOK_AT, CAMERA_POSITION, computeDialogueCameraFraming } from '../../logic/scenePositions3D'

export interface SceneCameraProps {
  /** The active NPC's position while a dialogue with them is open; undefined/null returns to the default exploration framing. */
  dialogueNpcPosition?: Position2D | null
  /** The player's own live position (Game Feel pass — written every frame by PlayerAvatar), read so the dialogue framing centers on both conversation partners, not just the NPC. */
  playerPositionRef?: RefObject<Position2D>
}

const EASE_LAMBDA = 4
const REDUCED_MOTION_LAMBDA = 1000

/**
 * A fixed camera during normal exploration — no follow logic, no Pointer
 * Lock, no mouse input of any kind. Positioned and angled once, per the
 * approved Meridian Plaza Layout design document, for a stylized
 * third-person view (Zelda / Animal Crossing) rather than a strict
 * top-down map.
 *
 * Dialogue presentation pass: while a conversation is open, this same
 * fixed angle scales down toward the midpoint between the player and the
 * active NPC (computeDialogueCameraFraming — a uniform scale of the same
 * offset, so the viewing *direction* never changes), eased in and back out
 * with a per-frame damp rather than a hard cut, and effectively instant
 * when prefers-reduced-motion is set. This parameterizes the existing
 * camera; it is not a second camera or a new library.
 */
export function SceneCamera({ dialogueNpcPosition, playerPositionRef }: SceneCameraProps) {
  const cameraRef = useRef<ThreePerspectiveCamera>(null)
  const currentLookAt = useRef(new Vector3(...CAMERA_LOOK_AT))
  const prefersReducedMotion = usePrefersReducedMotion()

  useFrame((_state, delta) => {
    const camera = cameraRef.current
    if (!camera) return

    let targetPosition: readonly [number, number, number] = CAMERA_POSITION
    let targetLookAt: readonly [number, number, number] = CAMERA_LOOK_AT

    if (dialogueNpcPosition) {
      const playerPosition = playerPositionRef?.current ?? dialogueNpcPosition
      const framing = computeDialogueCameraFraming({
        x: (dialogueNpcPosition.x + playerPosition.x) / 2,
        z: (dialogueNpcPosition.z + playerPosition.z) / 2,
      })
      targetPosition = framing.position
      targetLookAt = framing.lookAt
    }

    const lambda = prefersReducedMotion ? REDUCED_MOTION_LAMBDA : EASE_LAMBDA
    camera.position.x = MathUtils.damp(camera.position.x, targetPosition[0], lambda, delta)
    camera.position.y = MathUtils.damp(camera.position.y, targetPosition[1], lambda, delta)
    camera.position.z = MathUtils.damp(camera.position.z, targetPosition[2], lambda, delta)

    currentLookAt.current.x = MathUtils.damp(currentLookAt.current.x, targetLookAt[0], lambda, delta)
    currentLookAt.current.y = MathUtils.damp(currentLookAt.current.y, targetLookAt[1], lambda, delta)
    currentLookAt.current.z = MathUtils.damp(currentLookAt.current.z, targetLookAt[2], lambda, delta)
    camera.lookAt(currentLookAt.current)
  })

  return <PerspectiveCamera ref={cameraRef} makeDefault position={CAMERA_POSITION} fov={CAMERA_FOV} />
}
