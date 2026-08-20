export const ANIMAL_KEYS = ['rabbit', 'sheep', 'pig', 'cow', 'horse'] as const
export type AnimalKey = (typeof ANIMAL_KEYS)[number]

export const DOG_KEYS = ['dogSmall', 'dogBig'] as const
export type DogKey = (typeof DOG_KEYS)[number]

export type HerdKey = AnimalKey | DogKey

export type Herd = Record<AnimalKey, number> & Record<DogKey, number>

export function makeHerd(vals: number[] = []): Herd {
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

export function cloneHerd(herd: Herd): Herd {
  return { ...herd }
}
