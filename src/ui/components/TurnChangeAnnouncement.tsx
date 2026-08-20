import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { theme } from '../theme'
import { useGameStore, isLocalHumanTurn } from '../store'

const ANNOUNCE_MS = 3500

/** A brief, centered, semi-transparent announcement shown only at the moment a turn hands off to
 * someone else (bot or another connected player) — the persistent TurnStatusBanner stays up for the
 * whole turn, but this catches the eye right when it matters, then gets out of the way so the board
 * and log stay watchable for the rest of the wait. */
export function TurnChangeAnnouncement() {
  const { t } = useTranslation()
  const screen = useGameStore((s) => s.screen)
  const currentPlayerIdx = useGameStore((s) => s.currentPlayerIdx)
  const players = useGameStore((s) => s.players)
  const isMyTurn = useGameStore(isLocalHumanTurn)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (screen !== 'board' || isMyTurn) {
      setVisible(false)
      return
    }
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), ANNOUNCE_MS)
    return () => clearTimeout(timer)
    // Deliberately re-fires only when the turn or screen changes, not on every board state update.
  }, [currentPlayerIdx, screen, isMyTurn])

  const active = players[currentPlayerIdx]
  if (!visible || !active) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: theme.color.overlayWarm,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 40,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: theme.color.white,
          borderRadius: 20,
          padding: '28px 36px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ fontSize: 46 }}>{active.avatar}</div>
        <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 19 }}>{active.name}</div>
        <div style={{ fontSize: 13.5, color: theme.color.textMuted }}>
          {active.isBot ? t('board.botTurn.thinking') : t('board.turnChangeWait')}
        </div>
      </div>
    </div>
  )
}
