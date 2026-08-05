import { SOUTH_BUILDING_POSITION } from '../../../logic/scenePositions3D'
import { Chimney } from './parts/Chimney'
import { Door } from './parts/Door'
import { PitchedRoof } from './parts/PitchedRoof'
import { SignPost } from './parts/SignPost'
import { WindowFrame } from './parts/WindowFrame'

/**
 * Priya Nandall's hall — Game Feel pass: a real façade instead of a flat
 * box with a flat roof-slab. The body itself is untouched (same box,
 * same position) so nothing about the building's footprint/collider
 * math below has to guess at new dimensions; every addition composes
 * the new parts/ kit around that unchanged box. Entrance faces -Z
 * (toward the plaza/Core), the same convention MathAcademy/EnglishCenter
 * already use, and the door/windows sit flush against the body's own
 * 1.1 half-depth — identical to MathAcademy's box, which shares that
 * exact dimension.
 */
export function SouthCommunityHall() {
  const { x, z } = SOUTH_BUILDING_POSITION

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[3.2, 1.4, 2.2]} />
        <meshStandardMaterial color="#7d6a55" flatShading />
      </mesh>

      <PitchedRoof width={3.4} depth={2.4} height={0.7} position={[0, 1.4, 0]} color="#5c4c3c" />

      <Door width={0.7} height={1.0} position={[0, 0.5, -1.11]} />
      <WindowFrame width={0.4} height={0.5} position={[-1.0, 0.75, -1.11]} />
      <WindowFrame width={0.4} height={0.5} position={[1.0, 0.75, -1.11]} />
      <Chimney position={[1.2, 2.0, 0.3]} />
      <SignPost position={[0, 1.85, -1.2]} tiltX={-0.3} boardWidth={0.7} boardHeight={0.35} boardColor="#9c8563" />
    </group>
  )
}
