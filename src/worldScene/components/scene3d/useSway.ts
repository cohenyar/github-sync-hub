import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import type { Object3D } from 'three'
import { computeSwayAngle, hashIdToPhaseSeed } from '../../logic/animationMotion'

/**
 * World Polish pass — a gentle, desynced rotation sway for a mesh/group ref
 * (tree canopies, bushes, a flag, an occasional sign). phaseSeedKey (any
 * stable string, e.g. the instance's own position) keeps multiple instances
 * from swaying in lockstep, reusing the exact hashIdToPhaseSeed convention
 * NpcMarker3D already uses for idle motion — one shared hook, not a bespoke
 * useFrame per prop.
 */
export function useSway<T extends Object3D = Object3D>(
  phaseSeedKey: string,
  amplitude?: number,
  baseAngleZ = 0,
): RefObject<T | null> {
  const ref = useRef<T>(null)
  const phaseSeed = hashIdToPhaseSeed(phaseSeedKey)

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.z = baseAngleZ + computeSwayAngle(state.clock.elapsedTime, phaseSeed, amplitude)
  })

  return ref
}
