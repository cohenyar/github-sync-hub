import { describe, expect, it } from 'vitest'
import { getPlayerStateItems } from './playerState'

describe('getPlayerStateItems', () => {
  it('is an empty read model since no save/load system exists yet', () => {
    expect(getPlayerStateItems()).toEqual([])
  })
})
