import { Html } from '@react-three/drei'
import styles from './WorldLabel.module.css'

export interface WorldLabelProps {
  position: readonly [number, number, number]
  text: string
  testId?: string
  distanceFactor?: number
  /** Bug Group B, requirement 2 — mobile-only visual de-emphasis for a
      "secondary" label (e.g. an NPC that isn't the current nearest
      interactable), so a narrow screen doesn't show every label at equal
      weight. No effect above the 479.98px breakpoint. Defaults to false so
      every existing caller keeps today's exact appearance. */
  deprioritized?: boolean
}

/**
 * Design pass — shared, upgraded styling for every floating world-space
 * name label (previously duplicated ad hoc in CoreArchiveBuilding.tsx and
 * TeacherNpcAccents.tsx at a barely-readable 14px with no background at
 * all). A dark glass pill behind the text gives it contrast against any
 * background the camera's fixed angle happens to put behind it, matching
 * "game-world destination marker" rather than debug text. Plain <Html> (not
 * drei's <Text>/troika-three-text, which fetches a font over the network
 * and stalled the frame loop in earlier testing) — just CSS text, same
 * technique as before, just styled properly and de-duplicated.
 *
 * Layering pass — drei's <Html> defaults to zIndexRange={[16777271, 0]},
 * writing an inline z-index in the millions on every label's wrapper
 * element. That vastly exceeds every deliberate z-index used anywhere else
 * in the app (the real scheme tops out at 70 for WelcomeScreen), so a label
 * would render above literally any overlay — including a full-screen
 * question/lesson panel — regardless of that overlay's own z-index or DOM
 * order. Pinning a single constant value (range min === max, so drei's
 * distance-based interpolation collapses to one number) makes world labels
 * "world HUD"-tier: above the 3D canvas itself, but below every real page
 * overlay (lowest of which is LessonStage at 20). WorldScene3D.module.css's
 * .hud and InteractionPrompt.module.css's .prompt are given an explicit
 * z-index just above this value for the same reason — position:absolute
 * alone doesn't win against ANY positive z-index sibling regardless of DOM
 * order, so they need one of their own to reliably stack above the label.
 */
const WORLD_LABEL_Z_INDEX = 2

export function WorldLabel({ position, text, testId, distanceFactor = 8, deprioritized = false }: WorldLabelProps) {
  return (
    <Html
      position={position}
      center
      distanceFactor={distanceFactor}
      zIndexRange={[WORLD_LABEL_Z_INDEX, WORLD_LABEL_Z_INDEX]}
      style={{ pointerEvents: 'none' }}
    >
      <span
        data-testid={testId}
        className={deprioritized ? `${styles.label} ${styles.deprioritized}` : styles.label}
      >
        {text}
      </span>
    </Html>
  )
}
