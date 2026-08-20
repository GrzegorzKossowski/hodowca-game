import { useTranslation } from 'react-i18next'
import { theme } from '../theme'
import { useGameStore } from '../store'

export function PassScreen() {
  const { t } = useTranslation()
  const s = useGameStore()
  const nextPlayer = s.players[s.currentPlayerIdx] ?? { name: '—', avatar: '🐻' }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
        padding: 32,
        background: theme.color.accentBg,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 60 }}>{nextPlayer.avatar}</div>
      <div style={{ fontSize: 15, color: theme.color.textMuted }}>{t('pass.hint')}</div>
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 30, color: theme.color.accentDark }}>{nextPlayer.name}</div>
      <button
        onClick={s.confirmPass}
        style={{ marginTop: 12, padding: '18px 36px', borderRadius: 16, border: 'none', background: theme.color.accent, color: theme.color.white, fontFamily: theme.font.heading, fontWeight: 700, fontSize: 17, cursor: 'pointer' }}
      >
        {t('pass.confirm')}
      </button>
      <button
        onClick={() => {
          if (window.confirm(t('board.leaveConfirm'))) s.backToMode()
        }}
        style={{ marginTop: 4, background: 'none', border: 'none', color: theme.color.textMuted, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
      >
        {t('board.leaveGame')}
      </button>
    </div>
  )
}
