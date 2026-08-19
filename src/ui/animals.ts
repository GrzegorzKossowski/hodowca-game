export const ANIMAL_KEYS = ['rabbit', 'sheep', 'pig', 'cow', 'horse'] as const
export type AnimalKey = (typeof ANIMAL_KEYS)[number]

export const ANIMAL_EMOJI: Record<AnimalKey, string> = {
  rabbit: '🐰',
  sheep: '🐑',
  pig: '🐷',
  cow: '🐄',
  horse: '🐴',
}

export const AVATARS = [
  '🐻', '🐨', '🐧', '🐢', '🐸', '🐶', '🐱', '🐭', '🐹',
  '🐼', '🐯', '🦁', '🐵', '🐔', '🦆', '🦉',
] as const

export const NAME_POOL = ['Ania', 'Marek', 'Zosia', 'Tomek', 'Ola', 'Bartek']

export type Herd = Record<AnimalKey, number> & { dogSmall: number; dogBig: number }

export function makeHerd(vals: number[]): Herd {
  const h = {} as Herd
  ANIMAL_KEYS.forEach((k, i) => {
    h[k] = vals[i] ?? 0
  })
  h.dogSmall = vals[5] ?? 0
  h.dogBig = vals[6] ?? 0
  return h
}

export function herdTotal(herd: Herd): number {
  return Object.values(herd).reduce((a, b) => a + b, 0)
}
