import { getProgressionContent } from '../../gameContent'
import type { AdminProgressionItem } from '../types'

/** The content-defined mission order players are expected to progress through. */
export function getProgressionItems(): AdminProgressionItem[] {
  return getProgressionContent()
}
