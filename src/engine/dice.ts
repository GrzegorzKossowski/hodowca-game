import type { AnimalKey } from './animals'

export type PredatorKind = 'fox' | 'wolf'
export type DieFace = AnimalKey | PredatorKind

/** Small pen die: threatens rabbits & sheep. Weighted toward common animals for fast digital pacing. */
export const SMALL_DIE_FACES: DieFace[] = ['rabbit', 'rabbit', 'rabbit', 'sheep', 'sheep', 'fox']

/** Big pen die: threatens pigs, cows & horses. */
export const BIG_DIE_FACES: DieFace[] = ['pig', 'pig', 'cow', 'cow', 'horse', 'wolf']

export interface DiceRoll {
  small: DieFace
  big: DieFace
}

export type RandomFn = () => number

export function rollDie(faces: DieFace[], rng: RandomFn = Math.random): DieFace {
  return faces[Math.floor(rng() * faces.length)]
}

export function rollDice(rng: RandomFn = Math.random): DiceRoll {
  return { small: rollDie(SMALL_DIE_FACES, rng), big: rollDie(BIG_DIE_FACES, rng) }
}

export function isPredator(face: DieFace): face is PredatorKind {
  return face === 'fox' || face === 'wolf'
}
