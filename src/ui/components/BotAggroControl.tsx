import { useTranslation } from 'react-i18next'
import { theme } from '../theme'
import { useGameStore } from '../store'

export function BotAggroControl() {
  const { t } = useTranslation()
  const botAggro = useGameStore((s) => s.botAggro)
  const setBotAggro = useGameStore((s) => s.setBotAggro)

  return (
    <div>
      <div style={{ fontSize: 13, color: theme.color.textMuted, fontWeight: 600, marginBottom: 8 }}>{t('lobby.botAggro')}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[t('lobby.aggro.easy'), t('lobby.aggro.medium'), t('lobby.aggro.hard')].map((label, i) => (
          <button
            key={label}
            onClick={() => setBotAggro(i)}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 12,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              border: `1.5px solid ${botAggro === i ? theme.color.accent : theme.color.cardBorder}`,
              background: botAggro === i ? theme.color.accentBg : theme.color.cardBg,
              color: botAggro === i ? theme.color.accentDark : theme.color.text,
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
