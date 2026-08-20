import type { AnimalKey, DogKey, Herd } from './animals'
import type { PredatorKind } from './dice'

/** Which pen each predator threatens. */
export const PREDATOR_PEN: Record<PredatorKind, AnimalKey[]> = {
  fox: ['rabbit', 'sheep'],
  wolf: ['pig', 'cow', 'horse'],
}

/** Which guard dog blocks each predator. */
export const PREDATOR_GUARD: Record<PredatorKind, DogKey> = {
  fox: 'dogSmall',
  wolf: 'dogBig',
}

export interface PredatorResult {
  herd: Herd
  blocked: boolean
  lost: Partial<Record<AnimalKey, number>>
}

/** A guard dog blocks the attack and is never consumed. Otherwise the entire threatened pen is lost. */
export function resolvePredator(herd: Herd, kind: PredatorKind): PredatorResult {
  const guard = PREDATOR_GUARD[kind]
  if (herd[guard] > 0) {
    return { herd, blocked: true, lost: {} }
  }

  const nextHerd = { ...herd }
  const lost: Partial<Record<AnimalKey, number>> = {}
  for (const animal of PREDATOR_PEN[kind]) {
    if (nextHerd[animal] > 0) {
      lost[animal] = nextHerd[animal]
      nextHerd[animal] = 0
    }
  }
  return { herd: nextHerd, blocked: false, lost }
}
