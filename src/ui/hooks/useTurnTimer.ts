import { useEffect } from 'react'
import { useGameStore, isLocalHumanTurn } from '../store'
import i18n from '../../i18n'

const TURN_SECONDS = 60
const GHOST_TURN_GRACE_SECONDS = 5

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
      const next = Math.max(-GHOST_TURN_GRACE_SECONDS, s.turnTimer - 1)
      useGameStore.setState({ turnTimer: next })
      if (next === 0 && isLocalHumanTurn(s)) {
        if (!s.hasRolledThisTurn) {
          const player = s.players[s.currentPlayerIdx]
          const entry = { text: i18n.t('board.log.turnSkipped', { player: player?.name ?? '' }), danger: false, avatar: player?.avatar }
          useGameStore.setState({ log: [entry, ...s.log] })
        }
        s.endTurn()
        return
      }
      // Host-authority fallback: if a turn belongs to a peer who never actually ends it (they
      // disconnected but a desync left them still listed, or their "endTurn" message got lost),
      // isLocalHumanTurn is false for everyone and the branch above never fires — leaving the game
      // stuck forever. The host waits a bit longer than the normal timeout, then force-advances.
      if (next === -GHOST_TURN_GRACE_SECONDS) {
        const isHostAuthority = s.mode !== 'online' || s.netRole === 'host'
        if (isHostAuthority && !isLocalHumanTurn(s)) {
          const player = s.players[s.currentPlayerIdx]
          if (player && !player.isBot) {
            const entry = { text: i18n.t('board.log.turnSkipped', { player: player.name }), danger: false, avatar: player.avatar }
            useGameStore.setState({ log: [entry, ...s.log] })
          }
          s.endTurn()
        }
      }
    }, 1000)
    return () => clearInterval(id)
  }, [screen, timerEnabled, currentPlayerIdx])
}
