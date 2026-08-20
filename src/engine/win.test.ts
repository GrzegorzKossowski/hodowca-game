import { describe, expect, it } from 'vitest'
import { makeHerd } from './animals'
import { checkWin } from './win'

describe('checkWin', () => {
  it('is false when any animal or dog is missing', () => {
    expect(checkWin(makeHerd([1, 1, 1, 1, 1, 1, 0]))).toBe(false)
    expect(checkWin(makeHerd([0, 1, 1, 1, 1, 1, 1]))).toBe(false)
  })

  it('is true once the player holds one of every animal and both dogs', () => {
    expect(checkWin(makeHerd([1, 1, 1, 1, 1, 1, 1]))).toBe(true)
  })

  it('is true with surplus animals too', () => {
    expect(checkWin(makeHerd([9, 4, 3, 2, 1, 1, 1]))).toBe(true)
  })
})
