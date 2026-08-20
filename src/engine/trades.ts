import type { Herd, HerdKey } from './animals'

export interface TradeRecipe {
  id: string
  give: Partial<Record<HerdKey, number>>
  get: Partial<Record<HerdKey, number>>
}

/** Breeding-up ladder plus dog exchanges. Only forward trades (toward rarer animals) are allowed. */
export const TRADE_RECIPES: TradeRecipe[] = [
  { id: 'rabbit->sheep', give: { rabbit: 6 }, get: { sheep: 1 } },
  { id: 'sheep->pig', give: { sheep: 2 }, get: { pig: 1 } },
  { id: 'pig->cow', give: { pig: 3 }, get: { cow: 1 } },
  { id: 'cow->horse', give: { cow: 2 }, get: { horse: 1 } },
  { id: 'horse->dogSmall', give: { horse: 1 }, get: { dogSmall: 1 } },
  { id: 'horse->dogBig', give: { horse: 2 }, get: { dogBig: 1 } },
]

export function canAffordTrade(herd: Herd, recipe: TradeRecipe): boolean {
  return Object.entries(recipe.give).every(([key, amount]) => herd[key as HerdKey] >= (amount ?? 0))
}

export function poolHasStock(pool: Herd, recipe: TradeRecipe): boolean {
  return Object.entries(recipe.get).every(([key, amount]) => pool[key as HerdKey] >= (amount ?? 0))
}

export interface TradeResult {
  herd: Herd
  pool: Herd
}

/** Returns null if the trade can't be made (insufficient herd, or the pool is out of the target animal). */
export function applyTrade(herd: Herd, pool: Herd, recipe: TradeRecipe): TradeResult | null {
  if (!canAffordTrade(herd, recipe) || !poolHasStock(pool, recipe)) return null

  const nextHerd = { ...herd }
  const nextPool = { ...pool }

  for (const [key, amount] of Object.entries(recipe.give)) {
    const k = key as HerdKey
    nextHerd[k] -= amount ?? 0
    nextPool[k] += amount ?? 0
  }
  for (const [key, amount] of Object.entries(recipe.get)) {
    const k = key as HerdKey
    nextHerd[k] += amount ?? 0
    nextPool[k] -= amount ?? 0
  }

  return { herd: nextHerd, pool: nextPool }
}
