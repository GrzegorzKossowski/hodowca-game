import { ANIMAL_KEYS, DOG_KEYS, type Herd } from './animals'

/** A player wins by holding at least one of every animal and both guard dogs at once. */
export function checkWin(herd: Herd): boolean {
  return [...ANIMAL_KEYS, ...DOG_KEYS].every((key) => herd[key] >= 1)
}
