export { ANIMAL_KEYS, DOG_KEYS, makeHerd, herdTotal } from '../engine/animals'
export type { AnimalKey, DogKey, HerdKey, Herd } from '../engine/animals'
import type { AnimalKey, HerdKey } from '../engine/animals'

export const ANIMAL_EMOJI: Record<AnimalKey, string> = {
  rabbit: '🐰',
  sheep: '🐑',
  pig: '🐷',
  cow: '🐄',
  horse: '🐴',
}

export const HERD_EMOJI: Record<HerdKey, string> = {
  ...ANIMAL_EMOJI,
  dogSmall: '🐕',
  dogBig: '🐕‍🦺',
}

export const PREDATOR_EMOJI = { fox: '🦊', wolf: '🐺' } as const

export const AVATARS = [
  '🐻', '🐱', '🐭', '🐨', '🐧', '🐢', '🐸', '🐶', '🐹',
  '🐼', '🐯', '🦁', '🐵', '🐔', '🦆', '🦉',
] as const

export const NAME_POOL = ['Grzegorz', 'Wioletta', 'Oliwia', 'Tomek', 'Ola', 'Bartek']
