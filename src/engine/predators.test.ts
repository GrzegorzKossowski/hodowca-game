import { describe, expect, it } from 'vitest'
import { makeHerd } from './animals'
import { resolvePredator } from './predators'

describe('resolvePredator', () => {
  it('blocks a fox attack when the herd has a small dog, but the dog is used up', () => {
    const herd = makeHerd([3, 2, 0, 0, 0, 1, 0])
    const result = resolvePredator(herd, 'fox')
    expect(result.blocked).toBe(true)
    expect(result.lost).toEqual({ dogSmall: 1 })
    expect(result.herd.dogSmall).toBe(0)
    expect(result.herd.rabbit).toBe(3)
    expect(result.herd.sheep).toBe(2)
  })

  it('wipes out the small pen on an unguarded fox attack', () => {
    const herd = makeHerd([3, 2, 4, 1, 1, 0, 1])
    const result = resolvePredator(herd, 'fox')
    expect(result.blocked).toBe(false)
    expect(result.lost).toEqual({ rabbit: 3, sheep: 2 })
    expect(result.herd.rabbit).toBe(0)
    expect(result.herd.sheep).toBe(0)
    // Big pen and dogs are untouched.
    expect(result.herd.pig).toBe(4)
    expect(result.herd.cow).toBe(1)
    expect(result.herd.horse).toBe(1)
    expect(result.herd.dogBig).toBe(1)
  })

  it('blocks a wolf attack when the herd has a big dog, but the dog is used up', () => {
    const herd = makeHerd([0, 0, 2, 2, 1, 0, 1])
    const result = resolvePredator(herd, 'wolf')
    expect(result.blocked).toBe(true)
    expect(result.lost).toEqual({ dogBig: 1 })
    expect(result.herd.dogBig).toBe(0)
    expect(result.herd.pig).toBe(2)
    expect(result.herd.cow).toBe(2)
    expect(result.herd.horse).toBe(1)
  })

  it('wipes out the big pen on an unguarded wolf attack', () => {
    const herd = makeHerd([5, 1, 2, 2, 1, 1, 0])
    const result = resolvePredator(herd, 'wolf')
    expect(result.blocked).toBe(false)
    expect(result.lost).toEqual({ pig: 2, cow: 2, horse: 1 })
    expect(result.herd.pig).toBe(0)
    expect(result.herd.cow).toBe(0)
    expect(result.herd.horse).toBe(0)
    // Small pen and dogs are untouched.
    expect(result.herd.rabbit).toBe(5)
    expect(result.herd.sheep).toBe(1)
    expect(result.herd.dogSmall).toBe(1)
  })

  it('only removes animal types the player actually has', () => {
    const herd = makeHerd([0, 3, 0, 0, 0, 0, 0])
    const result = resolvePredator(herd, 'fox')
    expect(result.lost).toEqual({ sheep: 3 })
    expect(result.herd.rabbit).toBe(0)
  })
})
