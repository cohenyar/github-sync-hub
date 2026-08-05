/**
 * Small presentational primitives for PlayerCharacter, in Eyes's exact
 * style (npcFigures.tsx): headRadius-relative offsets, flat-shaded, no
 * per-frame logic of their own. Kept in their own file, separate from
 * PlayerCharacter's joint hierarchy, so a future pass swapping in a real
 * GLB/CC0 pack only has to touch this one seam for hair/eyebrows.
 */

export function Eyebrows({ headRadius, color }: { headRadius: number; color: string }) {
  const browWidth = headRadius * 0.34
  const browX = headRadius * 0.38
  const browY = headRadius * 0.32
  const browZ = -headRadius * 0.82
  return (
    <>
      <mesh position={[-browX, browY, browZ]} rotation={[0, 0, 0.12]}>
        <boxGeometry args={[browWidth, headRadius * 0.09, headRadius * 0.1]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh position={[browX, browY, browZ]} rotation={[0, 0, -0.12]}>
        <boxGeometry args={[browWidth, headRadius * 0.09, headRadius * 0.1]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
    </>
  )
}

/**
 * One default hairstyle — a cropped cap plus a small fringe — not a style
 * picker. "A developer/default appearance is sufficient" for this pass; a
 * real character creator would add a style switch here later without
 * touching PlayerCharacter's joint hierarchy at all.
 */
export function Hair({ headRadius, color }: { headRadius: number; color: string }) {
  return (
    <>
      <mesh position={[0, headRadius * 0.38, 0]} scale={[1.04, 0.62, 1.04]}>
        <sphereGeometry args={[headRadius, 14, 14]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh position={[0, headRadius * 0.18, -headRadius * 0.78]} scale={[1, 0.5, 0.5]}>
        <sphereGeometry args={[headRadius * 0.62, 10, 10]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
    </>
  )
}
