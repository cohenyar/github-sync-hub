import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import type { MeshStandardMaterial } from 'three'
import { computePulseIntensity, hashIdToPhaseSeed } from '../../logic/animationMotion'

/**
 * World Polish pass — gently oscillates a material's emissiveIntensity
 * around its own resting value (lamp heads). Same shared-hook shape as
 * useSway: one useFrame, a stable phaseSeedKey so multiple instances never
 * pulse in lockstep.
 */
export function useEmissivePulse(
  phaseSeedKey: string,
  baseIntensity: number,
  amplitude?: number,
): RefObject<MeshStandardMaterial | null> {
  const ref = useRef<MeshStandardMaterial>(null)
  const phaseSeed = hashIdToPhaseSeed(phaseSeedKey)

  useFrame((state) => {
    if (!ref.current) return
    ref.current.emissiveIntensity = computePulseIntensity(state.clock.elapsedTime, phaseSeed, baseIntensity, amplitude)
  })

  return ref
}
