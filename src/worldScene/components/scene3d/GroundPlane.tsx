import { Grid } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

/** Deterministic per-vertex hash, not Math.random — same ground every load. */
function groundHash(x: number, y: number): number {
  const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return v - Math.floor(v)
}

/**
 * The plaza floor — flat-shaded, no texture. A per-vertex color gradient
 * (warmer near the Core at the center, cooling toward the districts at the
 * edges) gives the floor its own sense of depth independent of camera
 * distance — the fixed gameplay camera sees every point of the plaza at
 * roughly the same distance, so distance-based fog alone can't
 * differentiate "center" from "edge" the way this can. A small per-vertex
 * value jitter on top of that gradient (worn-ground mottling, not a
 * texture) breaks up the otherwise perfectly smooth lerp so the floor
 * reads as uneven earth rather than a clean procedural plane. The grid
 * overlay is still here for movement-distance cues, but pulled way down in
 * contrast/thickness/fade so it recedes into the ground instead of reading
 * as ruled graph paper.
 */
function useGroundGeometry() {
  return useMemo(() => {
    const geo = new THREE.PlaneGeometry(32, 32, 16, 16)
    const pos = geo.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const warm = new THREE.Color('#3d4a70')
    const cool = new THREE.Color('#0e1428')
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const t = THREE.MathUtils.clamp(Math.sqrt(x * x + y * y) / 16, 0, 1)
      const c = warm.clone().lerp(cool, t)
      const mottle = (groundHash(x, y) - 0.5) * 0.05
      c.offsetHSL(0, 0, mottle)
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [])
}

export function GroundPlane() {
  const geometry = useGroundGeometry()
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} geometry={geometry}>
        <meshStandardMaterial vertexColors flatShading />
      </mesh>
      <Grid
        args={[32, 32]}
        position={[0, 0.01, 0]}
        cellSize={2}
        cellThickness={0.22}
        cellColor="#1c2740"
        sectionSize={8}
        sectionThickness={0.4}
        sectionColor="#28345a"
        fadeDistance={26}
        fadeStrength={1.6}
        infiniteGrid={false}
      />
    </>
  )
}
