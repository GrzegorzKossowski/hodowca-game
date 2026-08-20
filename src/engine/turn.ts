import type { AnimalKey, Herd } from './animals'
import { isPredator, rollDice, type DiceRoll, type RandomFn } from './dice'
import { resolvePredator } from './predators'

export type DiceEvent =
  | { kind: 'gain'; animal: AnimalKey }
  | { kind: 'poolEmpty'; animal: AnimalKey }
  | { kind: 'predatorBlocked'; predator: 'fox' | 'wolf' }
  | { kind: 'predatorAttack'; predator: 'fox' | 'wolf'; lost: Partial<Record<AnimalKey, number>> }

export interface TurnResult {
  herd: Herd
  pool: Herd
  roll: DiceRoll
  events: DiceEvent[]
}

function applyFace(herd: Herd, pool: Herd, events: DiceEvent[], face: DiceRoll['small']) {
  if (isPredator(face)) {
    const result = resolvePredator(herd, face)
    herd = result.herd
    if (result.blocked) {
      events.push({ kind: 'predatorBlocked', predator: face })
    } else {
      events.push({ kind: 'predatorAttack', predator: face, lost: result.lost })
      // Eaten animals return to the main pool for other players to draw from.
      for (const [animal, amount] of Object.entries(result.lost)) {
        pool = { ...pool, [animal]: pool[animal as AnimalKey] + (amount ?? 0) }
      }
    }
    return { herd, pool }
  }

  const animal = face
  if (pool[animal] <= 0) {
    events.push({ kind: 'poolEmpty', animal })
    return { herd, pool }
  }
  herd = { ...herd, [animal]: herd[animal] + 1 }
  pool = { ...pool, [animal]: pool[animal] - 1 }
  events.push({ kind: 'gain', animal })
  return { herd, pool }
}

/** Rolls both dice for the current player and applies gains / predator attacks against the shared pool. */
export function playTurn(herd: Herd, pool: Herd, rng: RandomFn = Math.random): TurnResult {
  const roll = rollDice(rng)
  const events: DiceEvent[] = []

  ;({ herd, pool } = applyFace(herd, pool, events, roll.small))
  ;({ herd, pool } = applyFace(herd, pool, events, roll.big))

  return { herd, pool, roll, events }
}
