import { getNpcContent } from '../../gameContent'
import type { AdminNpcItem } from '../types'

export function getNpcItems(): AdminNpcItem[] {
  return getNpcContent()
}
