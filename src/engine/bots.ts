import type { Herd, HerdKey } from './animals'
import { TRADE_RECIPES, type TradeRecipe, canAffordTrade, poolHasStock, applyTrade } from './trades'

/** 0 = easy (hoards, trades rarely), 1 = medium, 2 = hard (trades aggressively toward the win condition). */
export type BotAggro = 0 | 1 | 2

/** Extra copies of the "give" animal a bot wants to keep in reserve beyond a recipe's cost, before it's
 * willing to trade it away — lower aggro keeps a bigger safety buffer against predator losses. */
function tradeBuffer(aggro: BotAggro): number {
  return aggro === 0 ? 2 : aggro === 1 ? 1 : 0
}

/** Picks the single best trade for a bot to make right now, or null if none is worth making.
 * Recipes the bot can't afford (herd or pool stock) are skipped. Among the rest, a recipe that would
 * give the bot an animal it currently holds none of is strongly preferred (it's needed for the win
 * condition); ties are broken by which trade leaves the largest reserve of the animal given away. */
export function pickBotTrade(herd: Herd, pool: Herd, aggro: BotAggro): TradeRecipe | null {
  const buffer = tradeBuffer(aggro)

  const candidates = TRADE_RECIPES.map((recipe, index) => {
    if (!canAffordTrade(herd, recipe) || !poolHasStock(pool, recipe)) return null

    const giveKey = Object.keys(recipe.give)[0] as HerdKey
    const giveAmount = recipe.give[giveKey] ?? 0
    const getKey = Object.keys(recipe.get)[0] as HerdKey
    const fillsGap = herd[getKey] === 0

    const spareAfterTrade = herd[giveKey] - giveAmount
    if (spareAfterTrade < buffer && !fillsGap) return null

    const score = (fillsGap ? 100 : 0) + spareAfterTrade - index * 0.01
    return { recipe, score }
  }).filter((c): c is { recipe: TradeRecipe; score: number } => c !== null)

  if (candidates.length === 0) return null
  return candidates.reduce((best, c) => (c.score > best.score ? c : best)).recipe
}

/** Applies pickBotTrade repeatedly against a local copy of herd/pool until no more trades are worth
 * making, returning the sequence of recipes to replay (each one still needs to go through the real
 * applyTrade/store flow so it gets logged and broadcast like any other trade). Capped defensively. */
export function pickAllBotTrades(herd: Herd, pool: Herd, aggro: BotAggro): TradeRecipe[] {
  const picks: TradeRecipe[] = []
  let curHerd = herd
  let curPool = pool
  for (let i = 0; i < TRADE_RECIPES.length * 4; i++) {
    const recipe = pickBotTrade(curHerd, curPool, aggro)
    if (!recipe) break
    const result = applyTrade(curHerd, curPool, recipe)
    if (!result) break
    picks.push(recipe)
    curHerd = result.herd
    curPool = result.pool
  }
  return picks
}
