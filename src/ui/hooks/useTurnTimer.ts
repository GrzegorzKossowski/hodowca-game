import { useEffect } from 'react'
import { useGameStore, isLocalHumanTurn } from '../store'
import i18n from '../../i18n'

const TURN_SECONDS = 60

/** Ticks the on-screen 60s turn badge down once a second, and — only for the locally-controlled
 * player — auto-ends the turn once time runs out, so the game never stalls waiting on someone who
 * stepped away. If they hadn't rolled yet, the turn is simply skipped with no roll at all rather
 * than rolling on their behalf: auto-rolling would hand them a real, possibly harmful outcome (e.g.
 * a wolf attack) with no chance to react, which reads as an arbitrary punishment for being away
 * rather than the timer just moving the game along. */
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
        if (!s.hasRolledThisTurn) {
          const player = s.players[s.currentPlayerIdx]
          const entry = { text: i18n.t('board.log.turnSkipped', { player: player?.name ?? '' }), danger: false }
          useGameStore.setState({ log: [entry, ...s.log] })
        }
        s.endTurn()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [screen, timerEnabled, currentPlayerIdx])
}
