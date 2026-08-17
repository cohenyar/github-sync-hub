import { useFrame } from '@react-three/fiber'
import { useRef, type ReactElement } from 'react'
import type { Mesh } from 'three'
import { advanceBlink, computeBlinkAmount, createInitialBlinkState } from '../../logic/animationMotion'
import type { NpcAppearance } from '../../logic/npcAppearance'

export interface NpcFigureProps {
  appearance: NpcAppearance
  isHighlighted: boolean
}

const EYE_COLOR = '#1a1a22'
/** However close to fully closed a blink gets, never let the eye mesh flatten to nothing. */
const MIN_EYE_OPEN_SCALE = 0.05

/**
 * Two small flattened dots on the front (-Z) of a head sphere — the single
 * highest-leverage move for turning a plain sphere into "a face." Scales
 * with the head's own radius so every figure's eyes stay proportional.
 *
 * Game Feel pass — each pair blinks on its own self-contained, randomized
 * schedule (a tiny internal useFrame), so every NPC figure and
 * PlayerCharacter blink for free with no signature or call-site change:
 * blinking lives entirely inside this one shared component.
 */
export function Eyes({ headRadius, color = EYE_COLOR }: { headRadius: number; color?: string }) {
  const eyeRadius = headRadius * 0.16
  const eyeX = headRadius * 0.38
  const eyeZ = -headRadius * 0.85
  const leftRef = useRef<Mesh>(null)
  const rightRef = useRef<Mesh>(null)
  const blinkStateRef = useRef(createInitialBlinkState())

  useFrame((_state, delta) => {
    blinkStateRef.current = advanceBlink(blinkStateRef.current, delta)
    const scaleY = Math.max(MIN_EYE_OPEN_SCALE, 1 - computeBlinkAmount(blinkStateRef.current))
    leftRef.current?.scale.setY(scaleY)
    rightRef.current?.scale.setY(scaleY)
  })

  return (
    <>
      <mesh ref={leftRef} position={[-eyeX, headRadius * 0.05, eyeZ]} scale={[1, 1, 0.4]}>
        <sphereGeometry args={[eyeRadius, 8, 8]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh ref={rightRef} position={[eyeX, headRadius * 0.05, eyeZ]} scale={[1, 1, 0.4]}>
        <sphereGeometry args={[eyeRadius, 8, 8]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
    </>
  )
}

function bodyMaterialProps(color: string, isHighlighted: boolean) {
  return {
    color,
    emissive: isHighlighted ? color : undefined,
    emissiveIntensity: isHighlighted ? 0.5 : 0,
    flatShading: true as const,
  }
}

/**
 * Visibility pass — a small, always-on emissive accent (reusing each
 * figure's own existing accentColor), applied to whichever small trim
 * piece a figure already has (a brim, a hat, a prop) rather than adding
 * new geometry. Deliberately subtle — 0.2 sits in the low ~0.15-0.25 range
 * asked for, well short of the isHighlighted glow (0.5-1) used elsewhere,
 * so it reads as "this silhouette has a lit edge," not "this NPC is
 * glowing." Not applied to CityVoiceFigure, which already has a permanent
 * whole-body emissive glow by design (see that figure below) — adding
 * this on top would only make an already-glowing character glow more.
 */
function accentMaterialProps(color: string) {
  return {
    color,
    emissive: color,
    emissiveIntensity: 0.2,
    flatShading: true as const,
  }
}

/** Devrin Kass — sturdy and steady: a wide-based, tapering body and a broad protective brim. */
function WardenFigure({ appearance, isHighlighted }: NpcFigureProps) {
  const { bodyColor, accentColor, glowColor } = appearance
  return (
    <group>
      <mesh position={[0, 0.425, 0]}>
        <cylinderGeometry args={[0.34, 0.4, 0.85, 12]} />
        <meshStandardMaterial {...bodyMaterialProps(bodyColor, isHighlighted)} />
      </mesh>
      <mesh position={[0, 1.21, 0]}>
        <sphereGeometry args={[0.36, 14, 14]} />
        <meshStandardMaterial {...bodyMaterialProps(bodyColor, isHighlighted)} />
      </mesh>
      <Eyes headRadius={0.36} />
      <mesh position={[0, 1.28, 0]}>
        <cylinderGeometry args={[0.46, 0.46, 0.08, 14]} />
        <meshStandardMaterial {...accentMaterialProps(accentColor)} />
      </mesh>
      <mesh position={[0, 0.55, -0.32]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.9} flatShading />
      </mesh>
    </group>
  )
}

/** Joran Petrik — small, alert, always listening: a lean body and a glowing antenna. */
function AnalystFigure({ appearance, isHighlighted }: NpcFigureProps) {
  const { bodyColor, accentColor, glowColor } = appearance
  return (
    <group>
      <mesh position={[0, 0.325, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.65, 10]} />
        <meshStandardMaterial {...bodyMaterialProps(bodyColor, isHighlighted)} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.3, 14, 14]} />
        <meshStandardMaterial {...bodyMaterialProps(bodyColor, isHighlighted)} />
      </mesh>
      <Eyes headRadius={0.3} />
      {/* Visibility pass — the antenna rod, previously plain bodyColor,
          reused as this figure's small rim accent (its own accentColor
          instead, with a subtle glow) since Analyst had no other
          accent-colored part to attach one to. */}
      <mesh position={[0, 1.425, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.35, 6]} />
        <meshStandardMaterial {...accentMaterialProps(accentColor)} />
      </mesh>
      <mesh position={[0, 1.63, 0]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1} flatShading />
      </mesh>
    </group>
  )
}

/** Priya Nandall — warm and round, the friendliest silhouette in the cast. */
function OrganizerFigure({ appearance, isHighlighted }: NpcFigureProps) {
  const { bodyColor, accentColor, glowColor } = appearance
  return (
    <group>
      <mesh position={[0, 0.35, 0]} scale={[1, 0.7, 1]}>
        <sphereGeometry args={[0.5, 14, 14]} />
        <meshStandardMaterial {...bodyMaterialProps(bodyColor, isHighlighted)} />
      </mesh>
      <mesh position={[0, 1.04, 0]}>
        <sphereGeometry args={[0.34, 14, 14]} />
        <meshStandardMaterial {...bodyMaterialProps(bodyColor, isHighlighted)} />
      </mesh>
      <Eyes headRadius={0.34} />
      <mesh position={[0, 1.14, 0]}>
        <coneGeometry args={[0.5, 0.22, 16]} />
        <meshStandardMaterial {...accentMaterialProps(accentColor)} />
      </mesh>
      <mesh position={[0, 0.5, -0.42]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.9} flatShading />
      </mesh>
    </group>
  )
}

/** Elin Voss — stout and practical: a stocky body and a simple hard-hat dome. */
function EngineerFigure({ appearance, isHighlighted }: NpcFigureProps) {
  const { bodyColor, accentColor, glowColor } = appearance
  return (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.4, 0.42, 0.6, 12]} />
        <meshStandardMaterial {...bodyMaterialProps(bodyColor, isHighlighted)} />
      </mesh>
      <mesh position={[0, 0.94, 0]}>
        <sphereGeometry args={[0.34, 14, 14]} />
        <meshStandardMaterial {...bodyMaterialProps(bodyColor, isHighlighted)} />
      </mesh>
      <Eyes headRadius={0.34} />
      <mesh position={[0, 1.14, 0]} scale={[1, 0.55, 1]}>
        <sphereGeometry args={[0.36, 14, 14]} />
        <meshStandardMaterial {...accentMaterialProps(accentColor)} />
      </mesh>
      <mesh position={[0, 0.45, -0.36]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.9} flatShading />
      </mesh>
    </group>
  )
}

/** Tomas Reyeth — sleek and charismatic: the tallest, narrowest silhouette, with a rakish tilted hat and a glinting eye. */
function BrokerFigure({ appearance, isHighlighted }: NpcFigureProps) {
  const { bodyColor, accentColor, glowColor } = appearance
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.22, 0.32, 1, 12]} />
        <meshStandardMaterial {...bodyMaterialProps(bodyColor, isHighlighted)} />
      </mesh>
      <mesh position={[0, 1.32, 0]}>
        <sphereGeometry args={[0.32, 14, 14]} />
        <meshStandardMaterial {...bodyMaterialProps(bodyColor, isHighlighted)} />
      </mesh>
      <Eyes headRadius={0.32} color={glowColor} />
      <mesh position={[0.06, 1.58, 0]} rotation={[0, 0, 0.4]}>
        <coneGeometry args={[0.26, 0.35, 10]} />
        <meshStandardMaterial {...accentMaterialProps(accentColor)} />
      </mesh>
    </group>
  )
}

/** Mera Solt — mysterious and wise: one continuous robed-and-hooded silhouette, unlike anyone else in the cast. */
function ArchivistFigure({ appearance, isHighlighted }: NpcFigureProps) {
  const { bodyColor, accentColor, glowColor } = appearance
  return (
    <group>
      <mesh position={[0, 0.475, 0]}>
        <cylinderGeometry args={[0.15, 0.55, 0.95, 14]} />
        <meshStandardMaterial {...bodyMaterialProps(bodyColor, isHighlighted)} />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <sphereGeometry args={[0.3, 14, 14]} />
        <meshStandardMaterial {...bodyMaterialProps(bodyColor, isHighlighted)} />
      </mesh>
      <Eyes headRadius={0.3} color={glowColor} />
      {/* Visibility pass — the hood tip, previously plain bodyColor, is
          now this figure's small rim accent (its own accentColor, subtly
          lit) — the one continuous robed silhouette itself is unchanged. */}
      <mesh position={[0, 1.5, 0]}>
        <coneGeometry args={[0.18, 0.25, 12]} />
        <meshStandardMaterial {...accentMaterialProps(accentColor)} />
      </mesh>
    </group>
  )
}

/** Kestrel Vane — radiant and unifying: the same robed family as the Archivist, taller and slenderer, gently glowing all over. */
function CityVoiceFigure({ appearance, isHighlighted }: NpcFigureProps) {
  const { bodyColor, glowColor } = appearance
  const bodyGlow = isHighlighted ? 0.7 : 0.35
  return (
    <group>
      <mesh position={[0, 0.575, 0]}>
        <cylinderGeometry args={[0.12, 0.42, 1.15, 14]} />
        <meshStandardMaterial color={bodyColor} emissive={bodyColor} emissiveIntensity={bodyGlow} flatShading />
      </mesh>
      <mesh position={[0, 1.45, 0]}>
        <sphereGeometry args={[0.3, 14, 14]} />
        <meshStandardMaterial color={bodyColor} emissive={bodyColor} emissiveIntensity={bodyGlow} flatShading />
      </mesh>
      <Eyes headRadius={0.3} color={glowColor} />
    </group>
  )
}

/** The math teacher — precise and orderly: a straight, upright body and a small ruler held flat at the hip, always close at hand. */
function MathTeacherFigure({ appearance, isHighlighted }: NpcFigureProps) {
  const { bodyColor, accentColor, glowColor } = appearance
  return (
    <group>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.28, 0.3, 0.8, 12]} />
        <meshStandardMaterial {...bodyMaterialProps(bodyColor, isHighlighted)} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.32, 14, 14]} />
        <meshStandardMaterial {...bodyMaterialProps(bodyColor, isHighlighted)} />
      </mesh>
      <Eyes headRadius={0.32} />
      <mesh position={[0.3, 0.55, 0.08]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.5, 0.05, 0.1]} />
        <meshStandardMaterial {...accentMaterialProps(accentColor)} />
      </mesh>
      <mesh position={[0, 0.42, -0.3]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.9} flatShading />
      </mesh>
    </group>
  )
}

/** The english teacher — warm and well-read: a softly rounded body and a small book held at the chest. */
function EnglishTeacherFigure({ appearance, isHighlighted }: NpcFigureProps) {
  const { bodyColor, accentColor, glowColor } = appearance
  return (
    <group>
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.3, 0.34, 0.76, 12]} />
        <meshStandardMaterial {...bodyMaterialProps(bodyColor, isHighlighted)} />
      </mesh>
      <mesh position={[0, 1.06, 0]}>
        <sphereGeometry args={[0.32, 14, 14]} />
        <meshStandardMaterial {...bodyMaterialProps(bodyColor, isHighlighted)} />
      </mesh>
      <Eyes headRadius={0.32} />
      <mesh position={[0, 0.58, -0.3]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.26, 0.32, 0.06]} />
        <meshStandardMaterial {...accentMaterialProps(accentColor)} />
      </mesh>
      <mesh position={[0, 0.4, -0.36]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.9} flatShading />
      </mesh>
    </group>
  )
}

/** Used only for an NPC id with no bespoke figure yet — a plain, readable placeholder, not a dropped character. */
function DefaultFigure({ appearance, isHighlighted }: NpcFigureProps) {
  const { bodyColor, accentColor } = appearance
  return (
    <group>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.3, 0.32, 0.8, 12]} />
        <meshStandardMaterial {...bodyMaterialProps(bodyColor, isHighlighted)} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.34, 14, 14]} />
        <meshStandardMaterial {...bodyMaterialProps(bodyColor, isHighlighted)} />
      </mesh>
      <Eyes headRadius={0.34} />
      <mesh position={[0, 1.24, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 12]} />
        <meshStandardMaterial {...accentMaterialProps(accentColor)} />
      </mesh>
    </group>
  )
}

const NPC_FIGURES: Record<string, (props: NpcFigureProps) => ReactElement> = {
  'north-warden': WardenFigure,
  'north-analyst': AnalystFigure,
  'south-organizer': OrganizerFigure,
  'south-engineer': EngineerFigure,
  'east-broker': BrokerFigure,
  'archivist-mera': ArchivistFigure,
  'city-voice': CityVoiceFigure,
  'math-teacher': MathTeacherFigure,
  'english-teacher': EnglishTeacherFigure,
}

export function getNpcFigure(npcId: string): (props: NpcFigureProps) => ReactElement {
  return NPC_FIGURES[npcId] ?? DefaultFigure
}
