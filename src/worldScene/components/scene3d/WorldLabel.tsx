import { Html } from '@react-three/drei'

export interface WorldLabelProps {
  position: readonly [number, number, number]
  text: string
  testId?: string
  distanceFactor?: number
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
 */
export function WorldLabel({ position, text, testId, distanceFactor = 8 }: WorldLabelProps) {
  return (
    <Html position={position} center distanceFactor={distanceFactor} style={{ pointerEvents: 'none' }}>
      <span
        data-testid={testId}
        style={{
          display: 'inline-block',
          padding: '5px 14px',
          borderRadius: '10px',
          background: 'rgba(10, 15, 26, 0.55)',
          border: '1px solid rgba(245, 234, 216, 0.2)',
          color: '#f5ead8',
          fontSize: '22px',
          fontWeight: 700,
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
          textShadow: '0 0 6px #0e1524, 0 0 6px #0e1524',
        }}
      >
        {text}
      </span>
    </Html>
  )
}
