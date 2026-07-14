import { EAST_BUILDING_POSITION } from '../../../logic/scenePositions3D'

/**
 * Tomas Reyeth's trading post — a stall with a flat overhang and a couple
 * of crates, extending toward the plaza (the -X side, since East sits at
 * +X and faces back in toward the center).
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
      <mesh position={[-1.3, 0.25, -0.5]}>
        <boxGeometry args={[0.45, 0.45, 0.45]} />
        <meshStandardMaterial color="#5c4d38" flatShading />
      </mesh>
      <mesh position={[-1.3, 0.22, 0.5]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#6b5a42" flatShading />
      </mesh>
    </group>
  )
}
