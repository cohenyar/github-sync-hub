import type { Mesh } from 'three'
import { useSway } from '../useSway'
import type { Position2D } from '../../../logic/movement'

export interface SignBoardProps {
  position: Position2D
  rotationY?: number
  /** World Polish pass — "minimal sign movement where appropriate," so this defaults to false (every existing call site is unaffected) rather than swaying every board in the world. */
  sway?: boolean
}

const SIGN_SWAY_AMPLITUDE = 0.025

/**
 * A separate component (not a conditional hook call) so a non-swaying
 * SignBoard never pays for a useFrame subscription at all — only the rare
 * instance that opts into sway mounts this, and with it, useSway.
 */
function SwayingBoard({ swayKey }: { swayKey: string }) {
  const swayRef = useSway<Mesh>(swayKey, SIGN_SWAY_AMPLITUDE)
  return (
    <mesh ref={swayRef} position={[0, 1.05, 0]}>
      <boxGeometry args={[0.7, 0.45, 0.06]} />
      <meshStandardMaterial color="#8f7a52" flatShading />
    </mesh>
  )
}

export function SignBoard({ position, rotationY = 0, sway = false }: SignBoardProps) {
  return (
    <group position={[position.x, 0, position.z]} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 6]} />
        <meshStandardMaterial color="#4a4038" flatShading />
      </mesh>
      {sway ? (
        <SwayingBoard swayKey={`sign-${position.x}-${position.z}`} />
      ) : (
        <mesh position={[0, 1.05, 0]}>
          <boxGeometry args={[0.7, 0.45, 0.06]} />
          <meshStandardMaterial color="#8f7a52" flatShading />
        </mesh>
      )}
    </group>
  )
}
