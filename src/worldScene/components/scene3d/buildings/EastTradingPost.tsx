import { EAST_BUILDING_POSITION } from '../../../logic/scenePositions3D'
import { Door } from './parts/Door'
import { SignPost } from './parts/SignPost'

/**
 * Tomas Reyeth's trading post — a stall with a flat overhang and a couple
 * of crates, extending toward the plaza (the -X side, since East sits at
 * +X and faces back in toward the center). Game Feel pass adds: a shutter-
 * style counter on that same -X face (reusing Door as a wide, low panel —
 * this reads as a market counter, not a house door, which is exactly why
 * this file never got a house-style door: it's a stall, not a house), two
 * support posts under the existing overhang, a third crate, and a
 * freestanding market sign. No windows — the counter itself is the
 * "opening," matching the original design intent.
 */
export function EastTradingPost() {
  const { x, z } = EAST_BUILDING_POSITION

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[2.2, 1.4, 1.8]} />
        <meshStandardMaterial color="#8f7a52" flatShading />
      </mesh>
      <mesh position={[-1.5, 1.35, 0]}>
        <boxGeometry args={[1, 0.12, 2.4]} />
        <meshStandardMaterial color="#6e5c3a" flatShading />
      </mesh>
      {/* Two support posts under the overhang's outer edge. */}
      <mesh position={[-1.95, 0.645, -0.9]}>
        <cylinderGeometry args={[0.05, 0.06, 1.29, 6]} />
        <meshStandardMaterial color="#5c4d38" flatShading />
      </mesh>
      <mesh position={[-1.95, 0.645, 0.9]}>
        <cylinderGeometry args={[0.05, 0.06, 1.29, 6]} />
        <meshStandardMaterial color="#5c4d38" flatShading />
      </mesh>
      {/* The shutter-style counter — a wide, low panel on the same face the
          overhang covers, standing in for a "door" this stall doesn't have. */}
      <Door width={0.9} height={0.5} position={[-1.11, 0.55, 0]} rotationY={Math.PI / 2} color="#4a3b28" />
      <mesh position={[-1.3, 0.25, -0.5]}>
        <boxGeometry args={[0.45, 0.45, 0.45]} />
        <meshStandardMaterial color="#5c4d38" flatShading />
      </mesh>
      <mesh position={[-1.3, 0.22, 0.5]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#6b5a42" flatShading />
      </mesh>
      <mesh position={[-1.05, 0.19, 0]}>
        <boxGeometry args={[0.38, 0.38, 0.38]} />
        <meshStandardMaterial color="#7a6748" flatShading />
      </mesh>
      <SignPost position={[1.15, 1.15, 0.9]} postHeight={0.9} boardWidth={0.6} boardHeight={0.32} boardColor="#c9a25a" rotationY={-0.4} />
    </group>
  )
}
