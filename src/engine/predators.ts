import type { AnimalKey, DogKey, Herd, HerdKey } from './animals'
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
  /** Animals (on an unguarded attack) or the guard dog (on a block) that leave the herd and return to the main pool. */
  lost: Partial<Record<HerdKey, number>>
}

/** A guard dog blocks the attack but is used up in the process — it returns to the main pool, same as
 * eaten animals, and has to be traded for again. Otherwise the entire threatened pen is lost. */
export function resolvePredator(herd: Herd, kind: PredatorKind): PredatorResult {
  const guard = PREDATOR_GUARD[kind]
  if (herd[guard] > 0) {
    const nextHerd = { ...herd, [guard]: herd[guard] - 1 }
    return { herd: nextHerd, blocked: true, lost: { [guard]: 1 } }
  }

  const nextHerd = { ...herd }
  const lost: Partial<Record<HerdKey, number>> = {}
  for (const animal of PREDATOR_PEN[kind]) {
    if (nextHerd[animal] > 0) {
      lost[animal] = nextHerd[animal]
      nextHerd[animal] = 0
    }
  }
  return { herd: nextHerd, blocked: false, lost }
}
