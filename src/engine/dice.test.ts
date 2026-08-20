import { describe, expect, it } from 'vitest'
import { BIG_DIE_FACES, isPredator, rollDice, rollDie, SMALL_DIE_FACES } from './dice'

describe('rollDie', () => {
  it('picks the face at the rng-scaled index', () => {
    expect(rollDie(SMALL_DIE_FACES, () => 0)).toBe(SMALL_DIE_FACES[0])
    expect(rollDie(SMALL_DIE_FACES, () => 0.999)).toBe(SMALL_DIE_FACES[SMALL_DIE_FACES.length - 1])
  })

  it('only returns faces present on the die', () => {
    for (let i = 0; i < SMALL_DIE_FACES.length; i++) {
      const face = rollDie(SMALL_DIE_FACES, () => i / SMALL_DIE_FACES.length)
      expect(SMALL_DIE_FACES).toContain(face)
    }
  })
})

describe('rollDice', () => {
  it('rolls both the small and big die', () => {
    const roll = rollDice(() => 0)
    expect(roll.small).toBe(SMALL_DIE_FACES[0])
    expect(roll.big).toBe(BIG_DIE_FACES[0])
  })
})

describe('isPredator', () => {
  it('identifies fox and wolf as predators', () => {
    expect(isPredator('fox')).toBe(true)
    expect(isPredator('wolf')).toBe(true)
  })

  it('does not treat animals as predators', () => {
    expect(isPredator('rabbit')).toBe(false)
    expect(isPredator('horse')).toBe(false)
  })
})
