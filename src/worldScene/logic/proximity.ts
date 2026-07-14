import type { Position2D } from './movement'

export type InteractableKind = 'district' | 'npc'

export interface Interactable {
  id: string
  kind: InteractableKind
  position: Position2D
}

/** Matches the Visual World Upgrade Sprint's approved scale (up from 3, keeping reach proportional to the larger world). */
export const INTERACTION_RADIUS = 4.5

export function distance2D(a: Position2D, b: Position2D): number {
  const dx = a.x - b.x
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dz * dz)
}

/** The closest interactable within radius, or null if nothing is close enough. */
export function getNearestInteractable(
  playerPosition: Position2D,
  interactables: readonly Interactable[],
  radius: number = INTERACTION_RADIUS,
): Interactable | null {
  let nearest: Interactable | null = null
  let nearestDistance = Infinity

  for (const interactable of interactables) {
    const dist = distance2D(playerPosition, interactable.position)
    if (dist <= radius && dist < nearestDistance) {
      nearest = interactable
      nearestDistance = dist
    }
  }

  return nearest
}

/**
 * Every interactable within radius, not just the nearest one. Used so a
 * direct click on a specific mesh can win over the single "nearest"
 * interactable driving the keyboard prompt — clicking the Core still works
 * even when an NPC happens to be marginally closer to the player.
 */
export function getInteractablesInRadius(
  playerPosition: Position2D,
  interactables: readonly Interactable[],
  radius: number = INTERACTION_RADIUS,
): Interactable[] {
  return interactables.filter((interactable) => distance2D(playerPosition, interactable.position) <= radius)
}

export interface DistrictPoint {
  id: string
  position: Position2D
}

/**
 * Which district "zone" the player currently occupies — always the
 * geometrically closest one, no separate zone radius needed since the four
 * real districts are spread far enough apart (see the layout document).
 * Drives which NPCs are visible, the same rule District.tsx already used.
 */
export function getNearestDistrictId(playerPosition: Position2D, districts: readonly DistrictPoint[]): string {
  let nearestId = districts[0]?.id ?? ''
  let nearestDistance = Infinity

  for (const district of districts) {
    const dist = distance2D(playerPosition, district.position)
    if (dist < nearestDistance) {
      nearestDistance = dist
      nearestId = district.id
    }
  }

  return nearestId
}
