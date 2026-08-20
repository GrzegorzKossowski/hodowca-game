import { useTranslation } from 'react-i18next'
import { theme } from '../theme'
import { useGameStore, isLocalHumanTurn } from '../store'

/** A persistent strip across the top of the board whenever it's NOT the local player's turn to
 * act — a bot's turn (any mode), or another connected human's turn in online/LAN. Makes it obvious
 * at a glance that you're watching/waiting rather than stalled, which was hard to tell from the
 * small muted hint text alone. */
export function TurnStatusBanner() {
  const { t } = useTranslation()
  const screen = useGameStore((s) => s.screen)
  const currentPlayerIdx = useGameStore((s) => s.currentPlayerIdx)
  const players = useGameStore((s) => s.players)
  const diceRolling = useGameStore((s) => s.diceRolling)
  const hasRolledThisTurn = useGameStore((s) => s.hasRolledThisTurn)
  const overlay = useGameStore((s) => s.overlay)
  const isMyTurn = useGameStore(isLocalHumanTurn)

  const active = players[currentPlayerIdx]
  if (screen !== 'board' || !active || isMyTurn) return null

  const phase = overlay
    ? t('board.botTurn.reacting')
    : diceRolling
      ? t('board.botTurn.rolling')
      : hasRolledThisTurn
        ? t('board.botTurn.trading')
        : t('board.botTurn.thinking')

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        background: theme.color.accentDark,
        color: theme.color.white,
      }}
    >
      <span style={{ fontSize: 22 }}>{active.avatar}</span>
      <span style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 14 }}>{active.name}</span>
      <span style={{ fontSize: 13, opacity: 0.9 }}>{phase}</span>
      <span style={{ marginLeft: 'auto', fontSize: 12.5, opacity: 0.85, fontWeight: 600 }}>{t('board.notYourTurn')}</span>
      <span aria-hidden style={{ fontSize: 18 }}>
        {active.isBot ? '🤖' : '⏳'}
      </span>
    </div>
  )
}
