import { describe, it, expect } from 'vitest'
import { removePlayerAndFixTurn, electNewHost } from './store'
import { makeHerd } from './animals'
import type { Player } from './store'

function player(id: number, peerId: string | undefined, isBot = false): Player {
  return { id, peerId, name: `P${id}`, avatar: '🐻', isBot, herd: makeHerd([1, 0, 0, 0, 0, 0, 0]) }
}

describe('electNewHost', () => {
  it('picks the lowest-id remaining human player, deterministically', () => {
    const players = [player(2, 'b'), player(1, 'a'), player(3, 'c')]
    expect(electNewHost(players)?.id).toBe(1)
  })

  it('ignores players without a peerId (e.g. bots)', () => {
    const players = [player(0, undefined, true), player(2, 'c'), player(1, undefined, true)]
    expect(electNewHost(players)?.id).toBe(2)
  })

  it('returns null when no candidates remain', () => {
    expect(electNewHost([])).toBeNull()
    expect(electNewHost([player(0, undefined, true)])).toBeNull()
  })
})

describe('removePlayerAndFixTurn', () => {
  const players = [player(0, 'host'), player(1, 'a'), player(2, 'b'), player(3, 'c')]

  it('shifts currentPlayerIdx down when someone before the current turn leaves', () => {
    const r = removePlayerAndFixTurn(players, 2, 'a') // player idx 1 leaves, turn was idx 2
    expect(r.players.map((p) => p.id)).toEqual([0, 2, 3])
    expect(r.currentPlayerIdx).toBe(1) // player id 2 is now at index 1
    expect(r.wasCurrentTurn).toBe(false)
  })

  it('leaves currentPlayerIdx untouched when someone after the current turn leaves', () => {
    const r = removePlayerAndFixTurn(players, 1, 'c') // player idx 3 leaves, turn was idx 1
    expect(r.players.map((p) => p.id)).toEqual([0, 1, 2])
    expect(r.currentPlayerIdx).toBe(1)
    expect(r.wasCurrentTurn).toBe(false)
  })

  it('advances to the next player when the departing player held the current turn', () => {
    const r = removePlayerAndFixTurn(players, 1, 'a') // player idx 1 (the current turn) leaves
    expect(r.players.map((p) => p.id)).toEqual([0, 2, 3])
    expect(r.currentPlayerIdx).toBe(1) // index 1 now holds player id 2, next in line
    expect(r.wasCurrentTurn).toBe(true)
  })

  it('wraps around when the last player in turn order leaves', () => {
    const r = removePlayerAndFixTurn(players, 3, 'c') // last player (idx 3) held the turn and leaves
    expect(r.players.map((p) => p.id)).toEqual([0, 1, 2])
    expect(r.currentPlayerIdx).toBe(0) // wraps back to the first remaining player
    expect(r.wasCurrentTurn).toBe(true)
  })

  it('is a no-op when the peerId is not found', () => {
    const r = removePlayerAndFixTurn(players, 2, 'nonexistent')
    expect(r.players).toEqual(players)
    expect(r.currentPlayerIdx).toBe(2)
    expect(r.wasCurrentTurn).toBe(false)
  })
})
