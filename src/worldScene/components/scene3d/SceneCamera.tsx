import { PerspectiveCamera } from '@react-three/drei'
import { useEffect, useRef } from 'react'
import type { PerspectiveCamera as ThreePerspectiveCamera } from 'three'
import { CAMERA_FOV, CAMERA_LOOK_AT, CAMERA_POSITION } from '../../logic/scenePositions3D'

/**
 * A fixed camera — no follow logic, no Pointer Lock, no mouse input of any
 * kind. Positioned and angled once, per the approved Meridian Plaza Layout
 * design document, for a stylized third-person view (Zelda / Animal
 * Crossing) rather than a strict top-down map.
 */
export function SceneCamera() {
  const cameraRef = useRef<ThreePerspectiveCamera>(null)

  useEffect(() => {
    cameraRef.current?.lookAt(...CAMERA_LOOK_AT)
  }, [])

  return <PerspectiveCamera ref={cameraRef} makeDefault position={CAMERA_POSITION} fov={CAMERA_FOV} />
}
