import type { ThreeEvent } from '@react-three/fiber'
import { getNpcAppearance } from '../../logic/npcAppearance'
import { getNpcPosition3D } from '../../logic/scenePositions3D'
import { getNpcFigure } from './npcFigures'

export interface NpcMarker3DProps {
  npcId: string
  districtId: string
  isHighlighted?: boolean
  onClick: () => void
}

/**
 * A small bespoke character per visible NPC — see npcFigures.tsx for the
 * actual body/silhouette designs. This component only owns position and
 * click/highlight wiring, unchanged from before; the click handler on the
 * outer group catches clicks on any of the figure's meshes via R3F's event
 * bubbling.
 */
export function NpcMarker3D({ npcId, districtId, isHighlighted = false, onClick }: NpcMarker3DProps) {
  const position = getNpcPosition3D(npcId, districtId)
  const appearance = getNpcAppearance(npcId)
  const Figure = getNpcFigure(npcId)

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation()
    onClick()
  }

  return (
    <group position={[position.x, 0, position.z]} onClick={handleClick}>
      <Figure appearance={appearance} isHighlighted={isHighlighted} />
    </group>
  )
}
