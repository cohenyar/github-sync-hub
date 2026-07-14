/**
 * A large, grid-less backdrop plane beneath the background skyline. Sits
 * slightly below the main GroundPlane (unmodified) so it's completely
 * hidden within the playable 32×32 area and only visible in the ring
 * beyond it, where the skyline silhouettes sit.
 */
export function BackdropGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
      <planeGeometry args={[64, 64]} />
      <meshStandardMaterial color="#0e1524" flatShading />
    </mesh>
  )
}
