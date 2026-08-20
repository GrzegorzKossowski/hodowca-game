import { describe, expect, it } from 'vitest'
import { makeHerd } from './animals'
import { applyTrade, canAffordTrade, poolHasStock, TRADE_RECIPES } from './trades'

const rabbitToSheep = TRADE_RECIPES.find((r) => r.id === 'rabbit->sheep')!
const horseToDogBig = TRADE_RECIPES.find((r) => r.id === 'horse->dogBig')!

describe('canAffordTrade', () => {
  it('is true when the herd has enough of the given animals', () => {
    expect(canAffordTrade(makeHerd([6, 0, 0, 0, 0, 0, 0]), rabbitToSheep)).toBe(true)
  })

  it('is false when the herd is short', () => {
    expect(canAffordTrade(makeHerd([5, 0, 0, 0, 0, 0, 0]), rabbitToSheep)).toBe(false)
  })
})

describe('poolHasStock', () => {
  it('is false when the pool is out of the target animal', () => {
    const emptyPool = makeHerd([0, 0, 0, 0, 0, 0, 0])
    expect(poolHasStock(emptyPool, rabbitToSheep)).toBe(false)
  })
})

describe('applyTrade', () => {
  it('moves the given animals to the pool and the received animal to the herd', () => {
    const herd = makeHerd([6, 0, 0, 0, 0, 0, 0])
    const pool = makeHerd([0, 5, 0, 0, 0, 0, 0])
    const result = applyTrade(herd, pool, rabbitToSheep)
    expect(result).not.toBeNull()
    expect(result!.herd.rabbit).toBe(0)
    expect(result!.herd.sheep).toBe(1)
    expect(result!.pool.rabbit).toBe(6)
    expect(result!.pool.sheep).toBe(4)
  })

  it('returns null when the herd cannot afford the trade', () => {
    const herd = makeHerd([1, 0, 0, 0, 0, 0, 0])
    const pool = makeHerd([0, 5, 0, 0, 0, 0, 0])
    expect(applyTrade(herd, pool, rabbitToSheep)).toBeNull()
  })

  it('returns null when the pool is out of stock, leaving herd/pool untouched', () => {
    const herd = makeHerd([6, 0, 0, 0, 0, 0, 0])
    const pool = makeHerd([0, 0, 0, 0, 0, 0, 0])
    const result = applyTrade(herd, pool, rabbitToSheep)
    expect(result).toBeNull()
  })

  it('supports the horse-for-big-dog exchange', () => {
    const herd = makeHerd([0, 0, 0, 0, 2, 0, 0])
    const pool = makeHerd([0, 0, 0, 0, 0, 0, 3])
    const result = applyTrade(herd, pool, horseToDogBig)
    expect(result!.herd.horse).toBe(0)
    expect(result!.herd.dogBig).toBe(1)
    expect(result!.pool.horse).toBe(2)
    expect(result!.pool.dogBig).toBe(2)
  })
})
