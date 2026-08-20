export interface AwningProps {
  width: number
  depth: number
  position: [number, number, number]
  tiltX?: number
  color?: string
  withPosts?: boolean
  postColor?: string
  postHeight?: number
}

/**
 * World art-direction pass — the second part the original kit plan called
 * for and never got. A single tilted slab reads as a fabric/wood awning
 * over an entrance; optional support posts for a freestanding porch look
 * (EastTradingPost already hand-rolls an equivalent overhang+posts
 * combination inline — this is the same idea, reusable).
 */
export function Awning({
  width,
  depth,
  position,
  tiltX = 0.25,
  color = '#6e5c3a',
  withPosts = false,
  postColor = '#4a3f36',
  postHeight = 1.6,
}: AwningProps) {
  return (
    <group position={position}>
      <mesh rotation={[tiltX, 0, 0]}>
        <boxGeometry args={[width, 0.08, depth]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      {withPosts && (
        <>
          <mesh position={[-width / 2 + 0.12, -postHeight / 2, depth / 2 - 0.08]}>
            <cylinderGeometry args={[0.04, 0.04, postHeight, 6]} />
            <meshStandardMaterial color={postColor} flatShading />
          </mesh>
          <mesh position={[width / 2 - 0.12, -postHeight / 2, depth / 2 - 0.08]}>
            <cylinderGeometry args={[0.04, 0.04, postHeight, 6]} />
            <meshStandardMaterial color={postColor} flatShading />
          </mesh>
        </>
      )}
    </group>
  )
}
