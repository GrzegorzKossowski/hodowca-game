import { useTranslation } from 'react-i18next'
import { theme } from '../theme'
import { useGameStore } from '../store'
import { ANIMAL_KEYS, herdTotal } from '../animals'

export function WinScreen() {
  const { t } = useTranslation()
  const s = useGameStore()
  const winner = s.players[s.currentPlayerIdx] ?? { name: '—', avatar: '🏆', herd: undefined }
  const emoji: Record<string, string> = { rabbit: '🐰', sheep: '🐑', pig: '🐷', cow: '🐄', horse: '🐴' }

  const standings = s.players.map((p, i) => ({
    rank: i + 1,
    avatar: p.avatar,
    name: p.name,
    summary: i === 0 ? t('win.summaryWinner') : t('win.summaryAnimals', { count: herdTotal(p.herd) }),
  }))

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px', gap: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 64 }}>🏆</div>
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 15, letterSpacing: '0.08em', color: theme.color.accentDark, textTransform: 'uppercase' }}>
        {t('win.badge')}
      </div>
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 28 }}>
        {winner.avatar} {t('win.winnerLine', { name: winner.name })}
      </div>
      <div style={{ display: 'flex', gap: 10, background: theme.color.cardBg, border: `1.5px solid ${theme.color.cardBorder}`, borderRadius: 16, padding: '14px 18px' }}>
        {ANIMAL_KEYS.map((k) => (
          <div key={k} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22 }}>{emoji[k]}</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{winner.herd ? winner.herd[k] : 0}</div>
          </div>
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: 420, marginTop: 8 }}>
        <div style={{ fontSize: 13, color: theme.color.textMuted, fontWeight: 600, marginBottom: 8 }}>{t('win.standings')}</div>
        {standings.map((st) => (
          <div key={st.rank} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: theme.color.cardBg, borderRadius: 12, marginBottom: 6 }}>
            <span style={{ fontFamily: theme.font.heading, fontWeight: 700, color: theme.color.textMuted, width: 18 }}>{st.rank}</span>
            <span style={{ fontSize: 18 }}>{st.avatar}</span>
            <span style={{ flex: 1, textAlign: 'left', fontWeight: 600, fontSize: 14 }}>{st.name}</span>
            <span style={{ fontSize: 12.5, color: theme.color.textMuted }}>{st.summary}</span>
          </div>
        ))}
      </div>

      {s.mode === 'online' && s.netRole === 'guest' ? (
        <div style={{ fontSize: 13.5, color: theme.color.textMuted, marginTop: 12 }}>{t('lobby.waitingForHost')}</div>
      ) : (
        <div style={{ display: 'flex', gap: 12, marginTop: 12, width: '100%', maxWidth: 420 }}>
          <button
            onClick={s.playAgain}
            style={{ flex: 1, padding: 15, borderRadius: 14, border: 'none', background: theme.color.accent, color: theme.color.white, fontFamily: theme.font.heading, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            {t('win.playAgain')}
          </button>
          <button
            onClick={s.backToMode}
            style={{ flex: 1, padding: 15, borderRadius: 14, border: `1.5px solid ${theme.color.cardBorder}`, background: 'none', color: theme.color.text, fontFamily: theme.font.heading, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            {t('win.backToMenu')}
          </button>
        </div>
      )}
    </div>
  )
}
