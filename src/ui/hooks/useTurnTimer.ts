import { useEffect } from 'react'
import { useGameStore, isLocalHumanTurn } from '../store'

const TURN_SECONDS = 60

/** Ticks the on-screen 60s turn badge down once a second, and — only for the locally-controlled
 * player — auto-rolls (if not yet rolled) and then auto-ends the turn once time runs out, so the
 * game never stalls waiting on someone who let the clock run out. */
export function useTurnTimer() {
  const screen = useGameStore((s) => s.screen)
  const timerEnabled = useGameStore((s) => s.timerEnabled)
  const currentPlayerIdx = useGameStore((s) => s.currentPlayerIdx)

  useEffect(() => {
    if (screen === 'board') useGameStore.setState({ turnTimer: TURN_SECONDS })
  }, [currentPlayerIdx, screen])

  useEffect(() => {
    if (screen !== 'board' || !timerEnabled) return
    const id = setInterval(() => {
      const s = useGameStore.getState()
      if (s.screen !== 'board' || !s.timerEnabled) return
      const next = Math.max(0, s.turnTimer - 1)
      useGameStore.setState({ turnTimer: next })
      if (next === 0 && isLocalHumanTurn(s)) {
        if (!s.hasRolledThisTurn) s.rollDice()
        else s.endTurn()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [screen, timerEnabled, currentPlayerIdx])
}
