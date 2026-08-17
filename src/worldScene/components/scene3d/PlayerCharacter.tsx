import { useRef, type RefObject } from 'react'
import type { Group } from 'three'
import type { PlayerAvatarPreset } from '../../logic/playerAppearance'
import { Eyebrows, Hair, Shirt, type HairStyle } from './characterParts'
import { Eyes } from './npcFigures'

/** Where the pelvis (the rig's root joint) sits above the ground — PlayerAvatar writes the live y (bob + breathe) here every frame; this is only the first-paint default. */
export const PLAYER_PELVIS_HEIGHT = 0.85

export interface PlayerJointRefs {
  pelvis: RefObject<Group | null>
  hipL: RefObject<Group | null>
  hipR: RefObject<Group | null>
  kneeL: RefObject<Group | null>
  kneeR: RefObject<Group | null>
  shoulderL: RefObject<Group | null>
  shoulderR: RefObject<Group | null>
  elbowL: RefObject<Group | null>
  elbowR: RefObject<Group | null>
  neck: RefObject<Group | null>
}

/** One useRef per joint — a stable identity across re-renders, written into by PlayerAvatar's useFrame. */
export function usePlayerJointRefs(): PlayerJointRefs {
  return {
    pelvis: useRef<Group>(null),
    hipL: useRef<Group>(null),
    hipR: useRef<Group>(null),
    kneeL: useRef<Group>(null),
    kneeR: useRef<Group>(null),
    shoulderL: useRef<Group>(null),
    shoulderR: useRef<Group>(null),
    elbowL: useRef<Group>(null),
    elbowR: useRef<Group>(null),
    neck: useRef<Group>(null),
  }
}

/**
 * Visibility pass — every preset's shoeColor is derived (playerAppearance.ts)
 * by darkening its own bodyColor by 0.7, which lands close to (in the
 * default 'ember' preset's case, almost exactly on) the ground plane's own
 * dark end (GroundPlane.tsx runs from #0e1428 at the district edges to
 * #3d4a70 near the plaza center) — the feet are exactly where the
 * character visually meets the ground, so losing contrast there undercuts
 * the whole silhouette reading clearly against it. This lightens shoeColor
 * only for rendering here (not a change to playerAppearance.ts's shared
 * preset data, which nothing else reads shoeColor from), applied evenly
 * across every preset so shoes stay each preset's own darkest tone —
 * just no longer dark enough to disappear into the ground.
 */
function lightenForGroundContrast(hex: string): string {
  const value = Number.parseInt(hex.slice(1), 16)
  const channel = (shift: number) => {
    const component = (value >> shift) & 0xff
    return Math.round(component + (255 - component) * 0.25)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(16)}${channel(8)}${channel(0)}`
}

export interface PlayerCharacterProps {
  appearance: PlayerAvatarPreset
  jointRefs: PlayerJointRefs
  /** Character visual upgrade pass — forwarded to Hair as-is. Optional and defaults to undefined (Hair's own 'short' default), so none of the 6 PLAYER_AVATAR_PRESETS (which carry no hairStyle field) change how they look just because this prop exists. */
  hairStyle?: HairStyle
}

/**
 * A real jointed figure — head, torso, two arms (upper+lower), two legs
 * (upper+lower), hands, feet, hair, eyes, eyebrows, shirt/pants/shoes as
 * distinct primitives — replacing the old single capsule+collar+sphere.
 * Stateless and holds no useFrame of its own: PlayerAvatar owns the one
 * game-loop tick and writes every joint's rotation/position directly onto
 * the refs below, so game-loop ownership stays singular. A future pass
 * swapping in a real CC0 rig would only need to replace this file's
 * internals — the joint-ref contract (and PlayerAvatar's usage of it) can
 * stay the same.
 */
export function PlayerCharacter({ appearance, jointRefs, hairStyle }: PlayerCharacterProps) {
  const { bodyColor, skinTone, hairColor, eyebrowColor, pantsColor, shoeColor, shirtColor } = appearance
  const headRadius = 0.3
  const groundedShoeColor = lightenForGroundContrast(shoeColor)

  return (
    <group ref={jointRefs.pelvis} position={[0, PLAYER_PELVIS_HEIGHT, 0]}>
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.26, 0.3, 0.52, 10]} />
        <meshStandardMaterial color={bodyColor} flatShading />
      </mesh>
      <Shirt color={shirtColor} />

      <group ref={jointRefs.hipL} position={[-0.16, -0.02, 0]}>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.4, 8]} />
          <meshStandardMaterial color={pantsColor} flatShading />
        </mesh>
        <group ref={jointRefs.kneeL} position={[0, -0.4, 0]}>
          <mesh position={[0, -0.18, 0]}>
            <cylinderGeometry args={[0.085, 0.1, 0.36, 8]} />
            <meshStandardMaterial color={pantsColor} flatShading />
          </mesh>
          <mesh position={[0, -0.4, -0.04]}>
            <boxGeometry args={[0.15, 0.08, 0.24]} />
            <meshStandardMaterial color={groundedShoeColor} flatShading />
          </mesh>
        </group>
      </group>

      <group ref={jointRefs.hipR} position={[0.16, -0.02, 0]}>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.4, 8]} />
          <meshStandardMaterial color={pantsColor} flatShading />
        </mesh>
        <group ref={jointRefs.kneeR} position={[0, -0.4, 0]}>
          <mesh position={[0, -0.18, 0]}>
            <cylinderGeometry args={[0.085, 0.1, 0.36, 8]} />
            <meshStandardMaterial color={pantsColor} flatShading />
          </mesh>
          <mesh position={[0, -0.4, -0.04]}>
            <boxGeometry args={[0.15, 0.08, 0.24]} />
            <meshStandardMaterial color={groundedShoeColor} flatShading />
          </mesh>
        </group>
      </group>

      <group ref={jointRefs.shoulderL} position={[-0.34, 0.48, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.08, 0.09, 0.3, 8]} />
          <meshStandardMaterial color={skinTone} flatShading />
        </mesh>
        <group ref={jointRefs.elbowL} position={[0, -0.3, 0]}>
          <mesh position={[0, -0.14, 0]}>
            <cylinderGeometry args={[0.065, 0.08, 0.28, 8]} />
            <meshStandardMaterial color={skinTone} flatShading />
          </mesh>
          <mesh position={[0, -0.3, 0]}>
            <sphereGeometry args={[0.085, 8, 8]} />
            <meshStandardMaterial color={skinTone} flatShading />
          </mesh>
        </group>
      </group>

      <group ref={jointRefs.shoulderR} position={[0.34, 0.48, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.08, 0.09, 0.3, 8]} />
          <meshStandardMaterial color={skinTone} flatShading />
        </mesh>
        <group ref={jointRefs.elbowR} position={[0, -0.3, 0]}>
          <mesh position={[0, -0.14, 0]}>
            <cylinderGeometry args={[0.065, 0.08, 0.28, 8]} />
            <meshStandardMaterial color={skinTone} flatShading />
          </mesh>
          <mesh position={[0, -0.3, 0]}>
            <sphereGeometry args={[0.085, 8, 8]} />
            <meshStandardMaterial color={skinTone} flatShading />
          </mesh>
        </group>
      </group>

      <group ref={jointRefs.neck} position={[0, 0.56, 0]}>
        {/*
         * Head, eyes, eyebrows, and hair all live in one group centered on
         * the head itself (not the neck) — Eyes/Eyebrows/Hair's own offsets
         * are all relative to a head at local [0,0,0], so nesting them here
         * (rather than as siblings positioned only by the neck's origin) is
         * what keeps them landing on the face instead of floating below it.
         */}
        <group position={[0, 0.22, 0]}>
          <mesh>
            <sphereGeometry args={[headRadius, 16, 16]} />
            <meshStandardMaterial color={skinTone} flatShading />
          </mesh>
          <Eyes headRadius={headRadius} />
          <Eyebrows headRadius={headRadius} color={eyebrowColor} />
          <Hair headRadius={headRadius} color={hairColor} style={hairStyle} />
        </group>
      </group>
    </group>
  )
}
