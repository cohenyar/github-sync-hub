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
 * Character visual upgrade pass — was one fixed hairstyle (a cropped cap
 * plus a small fringe) with no style picker at all. 'short' is that exact
 * original look, kept as the default so every existing caller (and all 6
 * PLAYER_AVATAR_PRESETS, which carry no hairStyle of their own) renders
 * byte-for-byte the same as before this pass. The three added variants
 * layer on top of, rather than replace, the same cap+fringe base — 'bald'
 * is the one exception, rendering nothing at all.
 */
export type HairStyle = 'short' | 'long' | 'bald' | 'bun'

export function Hair({ headRadius, color, style = 'short' }: { headRadius: number; color: string; style?: HairStyle }) {
  if (style === 'bald') return <group />

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
      {style === 'long' && (
        <mesh position={[0, -headRadius * 0.35, headRadius * 0.55]}>
          <boxGeometry args={[headRadius * 1.0, headRadius * 1.3, headRadius * 0.45]} />
          <meshStandardMaterial color={color} flatShading />
        </mesh>
      )}
      {style === 'bun' && (
        <mesh position={[0, headRadius * 0.78, headRadius * 0.3]}>
          <sphereGeometry args={[headRadius * 0.32, 10, 10]} />
          <meshStandardMaterial color={color} flatShading />
        </mesh>
      )}
    </>
  )
}

/**
 * Character visual upgrade pass — a small collar/chest overlay on the
 * torso, giving the player a visible shirtColor distinct from the torso's
 * own bodyColor (previously the torso was one flat-shaded cylinder with no
 * separate top layer at all). Sized and positioned specifically against
 * PlayerCharacter's torso cylinder (args [0.26, 0.3, 0.52, 10], centered at
 * local y=0.26 — so it spans y=[0, 0.52] tapering from radius 0.3 at the
 * bottom to 0.26 at the top): both of this mesh's own radii are ~0.01–0.015
 * larger than the torso's radius at the same height, so it sits flush as a
 * layer over the torso without ever poking through it or z-fighting at a
 * shared surface, and its height stops short of the torso's own top/bottom
 * edges so no cap face lands exactly on another cap face.
 */
export function Shirt({ color }: { color: string }) {
  return (
    <mesh position={[0, 0.42, 0]}>
      <cylinderGeometry args={[0.27, 0.285, 0.16, 10]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  )
}
