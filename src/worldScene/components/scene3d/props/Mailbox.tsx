import type { Position2D } from '../../../logic/movement'

export interface MailboxProps {
  position: Position2D
  rotationY?: number
}

/** A small post-mounted mailbox — a civic/community landmark detail. */
export function Mailbox({ position, rotationY = 0 }: MailboxProps) {
  return (
    <group position={[position.x, 0, position.z]} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.04, 0.045, 0.7, 6]} />
        <meshStandardMaterial color="#3a4250" flatShading />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <boxGeometry args={[0.28, 0.22, 0.18]} />
        <meshStandardMaterial color="#5b7a63" flatShading />
      </mesh>
    </group>
  )
}
