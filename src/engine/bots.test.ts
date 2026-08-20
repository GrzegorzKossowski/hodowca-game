import { describe, it, expect } from 'vitest'
import { pickBotTrade, pickAllBotTrades } from './bots'
import { makeHerd } from './animals'

describe('pickBotTrade', () => {
  it('returns null when the bot has no affordable trades', () => {
    const herd = makeHerd([1, 0, 0, 0, 0, 0, 0])
    const pool = makeHerd([50, 20, 15, 10, 5, 2, 1])
    expect(pickBotTrade(herd, pool, 2)).toBeNull()
  })

  it('easy bots keep a bigger safety buffer than hard bots before trading a non-gap animal', () => {
    // 7 rabbits, already has 1 sheep (not a gap) -> trading 6 rabbits away leaves only 1 spare
    const herd = makeHerd([7, 1, 0, 0, 0, 0, 0])
    const pool = makeHerd([50, 20, 15, 10, 5, 2, 1])
    expect(pickBotTrade(herd, pool, 0)).toBeNull() // easy wants a buffer of 2, only has 1 spare
    expect(pickBotTrade(herd, pool, 1)?.id).toBe('rabbit->sheep') // medium wants a buffer of 1
    expect(pickBotTrade(herd, pool, 2)?.id).toBe('rabbit->sheep') // hard has no buffer requirement
  })

  it('prioritizes a trade that fills an animal the bot has zero of, even over a bigger-surplus trade', () => {
    // 12 rabbits (surplus trade available) and 4 sheep -> 1 pig (herd has zero pigs)
    const herd = makeHerd([12, 4, 0, 0, 0, 0, 0])
    const pool = makeHerd([50, 20, 15, 10, 5, 2, 1])
    const pick = pickBotTrade(herd, pool, 1)
    expect(pick?.id).toBe('sheep->pig')
  })

  it('respects pool stock limits even when the herd can afford the trade', () => {
    const herd = makeHerd([0, 0, 0, 0, 3, 0, 0]) // 3 horses, wants a dogBig (needs 2 horses + 1 dogBig in pool)
    const pool = makeHerd([0, 0, 0, 0, 0, 0, 0]) // pool has no dogBig left
    expect(pickBotTrade(herd, pool, 2)).toBeNull()
  })
})

describe('pickAllBotTrades', () => {
  it('chains trades up the ladder until nothing more is affordable', () => {
    const herd = makeHerd([12, 0, 0, 0, 0, 0, 0]) // 12 rabbits -> 2 sheep -> 1 pig
    const pool = makeHerd([50, 20, 15, 10, 5, 2, 1])
    const trades = pickAllBotTrades(herd, pool, 2)
    expect(trades.map((t) => t.id)).toEqual(['rabbit->sheep', 'rabbit->sheep', 'sheep->pig'])
  })

  it('terminates instead of looping forever when nothing is affordable', () => {
    const herd = makeHerd([0, 0, 0, 0, 0, 0, 0])
    const pool = makeHerd([50, 20, 15, 10, 5, 2, 1])
    expect(pickAllBotTrades(herd, pool, 2)).toEqual([])
  })
})
