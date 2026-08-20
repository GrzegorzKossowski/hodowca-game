import { useTranslation } from 'react-i18next'
import { theme } from '../theme'
import { useGameStore } from '../store'

export function BotTurnBanner() {
  const { t } = useTranslation()
  const screen = useGameStore((s) => s.screen)
  const mode = useGameStore((s) => s.mode)
  const currentPlayerIdx = useGameStore((s) => s.currentPlayerIdx)
  const players = useGameStore((s) => s.players)
  const diceRolling = useGameStore((s) => s.diceRolling)
  const hasRolledThisTurn = useGameStore((s) => s.hasRolledThisTurn)
  const overlay = useGameStore((s) => s.overlay)

  const active = players[currentPlayerIdx]
  const isBotTurn = screen === 'board' && mode === 'bots' && !!active?.isBot
  if (!isBotTurn) return null

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
      <span aria-hidden style={{ marginLeft: 'auto', fontSize: 18 }}>
        🤖
      </span>
    </div>
  )
}
