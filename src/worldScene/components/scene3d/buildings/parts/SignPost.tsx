export interface SignPostProps {
  position: [number, number, number]
  boardWidth?: number
  boardHeight?: number
  /** 0 renders a wall-mounted plaque (no post mesh at all) — the convention MathAcademy/EnglishCenter's existing inline signs already used. */
  postHeight?: number
  rotationY?: number
  tiltX?: number
  boardColor: string
  postColor?: string
}

/** Generalizes both the freestanding props/SignBoard.tsx pattern and a flush wall-mounted plaque into one component. */
export function SignPost({
  position,
  boardWidth = 0.6,
  boardHeight = 0.32,
  postHeight = 0,
  rotationY = 0,
  tiltX = 0,
  boardColor,
  postColor = '#4a3f36',
}: SignPostProps) {
  return (
    <group position={position} rotation={[tiltX, rotationY, 0]}>
      {postHeight > 0 && (
        <mesh position={[0, -postHeight / 2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, postHeight, 6]} />
          <meshStandardMaterial color={postColor} flatShading />
        </mesh>
      )}
      <mesh>
        <boxGeometry args={[boardWidth, boardHeight, 0.05]} />
        <meshStandardMaterial color={boardColor} flatShading />
      </mesh>
    </group>
  )
}
