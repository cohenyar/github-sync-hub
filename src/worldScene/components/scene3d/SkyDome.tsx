import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * A large inverted-facing sphere with a per-vertex color gradient — no
 * texture, no HDRI. Horizon color matches the fog/backdrop so the
 * BackgroundSkyline ring melts into the sky instead of meeting a hard
 * edge; the zenith is a deeper, cooler blue so the plaza still reads as
 * "night" looking straight up.
 */
export function SkyDome() {
  const geometry = useMemo(() => {
    const radius = 120
    const geo = new THREE.SphereGeometry(radius, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.9)
    const pos = geo.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const horizon = new THREE.Color('#2c3a5c')
    const zenith = new THREE.Color('#060810')
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i)
      const t = THREE.MathUtils.clamp(y / radius, 0, 1)
      const c = horizon.clone().lerp(zenith, Math.pow(t, 0.6))
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [])

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  )
}
