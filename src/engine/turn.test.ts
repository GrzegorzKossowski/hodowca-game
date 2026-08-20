import { describe, expect, it } from 'vitest'
import { makeHerd } from './animals'
import { playTurn } from './turn'

// small die: rabbit, rabbit, rabbit, sheep, sheep, fox (6 faces)
// big die:   pig, pig, cow, cow, horse, wolf (6 faces)

describe('playTurn', () => {
  it('grants both animals when neither die lands on a predator', () => {
    const herd = makeHerd([0, 0, 0, 0, 0, 0, 0])
    const pool = makeHerd([10, 10, 10, 10, 10, 10, 10])
    // small index 0 -> rabbit, big index 0 -> pig
    const result = playTurn(herd, pool, () => 0)
    expect(result.roll).toEqual({ small: 'rabbit', big: 'pig' })
    expect(result.herd.rabbit).toBe(1)
    expect(result.herd.pig).toBe(1)
    expect(result.pool.rabbit).toBe(9)
    expect(result.pool.pig).toBe(9)
    expect(result.events).toEqual([
      { kind: 'gain', animal: 'rabbit' },
      { kind: 'gain', animal: 'pig' },
    ])
  })

  it('does not grant an animal the pool has run out of', () => {
    const herd = makeHerd([0, 0, 0, 0, 0, 0, 0])
    const pool = makeHerd([0, 10, 10, 10, 10, 10, 10])
    const result = playTurn(herd, pool, () => 0) // small -> rabbit (empty pool)
    expect(result.herd.rabbit).toBe(0)
    expect(result.events[0]).toEqual({ kind: 'poolEmpty', animal: 'rabbit' })
  })

  it('blocks a fox attack when the player has a small dog, without consuming it', () => {
    const herd = makeHerd([3, 2, 0, 0, 0, 1, 0])
    const pool = makeHerd([10, 10, 10, 10, 10, 10, 10])
    // rng near 1 -> small index 5 -> fox; big index 5 -> wolf
    const result = playTurn(herd, pool, () => 0.999999)
    expect(result.roll.small).toBe('fox')
    expect(result.herd.dogSmall).toBe(1)
    expect(result.herd.rabbit).toBe(3)
    expect(result.herd.sheep).toBe(2)
    expect(result.events[0]).toEqual({ kind: 'predatorBlocked', predator: 'fox' })
  })

  it('wipes the small pen on an unguarded fox attack and returns the animals to the pool', () => {
    const herd = makeHerd([3, 2, 0, 0, 0, 0, 1])
    const pool = makeHerd([10, 10, 10, 10, 10, 10, 10])
    const result = playTurn(herd, pool, () => 0.999999)
    expect(result.herd.rabbit).toBe(0)
    expect(result.herd.sheep).toBe(0)
    expect(result.pool.rabbit).toBe(13)
    expect(result.pool.sheep).toBe(12)
    expect(result.events[0]).toEqual({
      kind: 'predatorAttack',
      predator: 'fox',
      lost: { rabbit: 3, sheep: 2 },
    })
  })

  it('resolves both dice independently in a single turn', () => {
    const herd = makeHerd([0, 3, 0, 2, 0, 0, 0])
    const pool = makeHerd([10, 10, 10, 10, 10, 10, 10])
    // small index 3 -> sheep (rng 0.5), big index 5 -> wolf (rng 0.99...)
    let call = 0
    const rng = () => (call++ === 0 ? 0.5 : 0.999999)
    const result = playTurn(herd, pool, rng)
    expect(result.roll).toEqual({ small: 'sheep', big: 'wolf' })
    expect(result.herd.sheep).toBe(4)
    expect(result.herd.cow).toBe(0) // wolf wiped the big pen
    expect(result.events).toEqual([
      { kind: 'gain', animal: 'sheep' },
      { kind: 'predatorAttack', predator: 'wolf', lost: { cow: 2 } },
    ])
  })
})
