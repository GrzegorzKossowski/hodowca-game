import { useEffect } from 'react'
import { useGameStore } from '../store'
import { pickAllBotTrades, MAX_TRADES_PER_TURN, type BotAggro } from '../../engine'

const ROLL_DELAY_MS = 700
const OVERLAY_DELAY_MS = 1400
const TRADE_DELAY_MS = 700

/** Drives a bot's turn automatically — solo 'bots' mode, a bot mixed into a hotseat lobby, or a bot
 * mixed into an online/LAN lobby (host-only, since a bot is never a network peer: the host runs its
 * turn locally through the same engine call path as a validated human action, then the existing
 * `sync` broadcast carries the result to guests like any other turn). Rolls, dismisses any predator
 * overlay, makes trades one at a time (re-firing as the herd changes), then ends the turn. Reads
 * fresh state from the store at each timeout instead of closing over React state, so it never acts
 * on stale data. */
export function useBotTurn() {
  const screen = useGameStore((s) => s.screen)
  const mode = useGameStore((s) => s.mode)
  const netRole = useGameStore((s) => s.netRole)
  const currentPlayerIdx = useGameStore((s) => s.currentPlayerIdx)
  const players = useGameStore((s) => s.players)
  const hasRolledThisTurn = useGameStore((s) => s.hasRolledThisTurn)
  const diceRolling = useGameStore((s) => s.diceRolling)
  const overlay = useGameStore((s) => s.overlay)

  const activePlayer = players[currentPlayerIdx]
  const canDriveBots = mode !== 'online' || netRole === 'host'
  const isBotTurn = screen === 'board' && canDriveBots && !!activePlayer?.isBot

  useEffect(() => {
    if (!isBotTurn) return

    if (overlay) {
      const t = setTimeout(() => useGameStore.getState().closeOverlay(), OVERLAY_DELAY_MS)
      return () => clearTimeout(t)
    }

    if (!hasRolledThisTurn) {
      if (diceRolling) return
      const t = setTimeout(() => useGameStore.getState().rollDice(), ROLL_DELAY_MS)
      return () => clearTimeout(t)
    }

    const t = setTimeout(() => {
      const s = useGameStore.getState()
      const me = s.players[s.currentPlayerIdx]
      if (!me) return
      const [nextTrade] = s.tradesThisTurn < MAX_TRADES_PER_TURN ? pickAllBotTrades(me.herd, s.mainPool, s.botAggro as BotAggro) : []
      if (nextTrade) s.makeTrade(nextTrade.id)
      else s.endTurn()
    }, TRADE_DELAY_MS)
    return () => clearTimeout(t)
  }, [isBotTurn, hasRolledThisTurn, diceRolling, overlay, players, netRole])
}
