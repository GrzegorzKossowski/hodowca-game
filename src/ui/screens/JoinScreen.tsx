import { useTranslation } from 'react-i18next'
import { theme } from '../theme'
import { useGameStore } from '../store'

export function JoinScreen() {
  const { t } = useTranslation()
  const s = useGameStore()

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: s.isDesktop ? '48px' : '20px 16px',
        gap: 20,
        maxWidth: 420,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <button
        onClick={s.backToMode}
        style={{
          alignSelf: 'flex-start',
          background: 'none',
          border: 'none',
          color: theme.color.textMuted,
          fontSize: 14,
          cursor: 'pointer',
          padding: '8px 0',
        }}
      >
        {t('join.back')}
      </button>

      <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 24 }}>{t('join.title')}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 13, color: theme.color.textMuted, fontWeight: 600 }}>{t('join.codeLabel')}</div>
        <input
          value={s.joinCode}
          onChange={(e) => s.setJoinCode(e.target.value)}
          placeholder={t('join.codePlaceholder')}
          maxLength={8}
          disabled={s.connecting}
          style={{
            border: `1.5px solid ${theme.color.cardBorder}`,
            borderRadius: 12,
            padding: 14,
            fontSize: 22,
            letterSpacing: '0.15em',
            textAlign: 'center',
            fontFamily: theme.font.heading,
            fontWeight: 700,
            textTransform: 'uppercase',
            outline: 'none',
          }}
        />
      </div>

      {s.joinError && (
        <div
          style={{
            fontSize: 12.5,
            color: theme.color.danger,
            background: theme.color.dangerBg,
            borderRadius: 10,
            padding: '10px 12px',
          }}
        >
          {t(s.joinError)}
        </div>
      )}

      <button
        onClick={s.joinOnlineGame}
        disabled={s.connecting || s.joinCode.trim().length < 4}
        style={{
          padding: 16,
          borderRadius: 14,
          border: 'none',
          background: s.connecting || s.joinCode.trim().length < 4 ? theme.color.cardBorder : theme.color.accent,
          color: s.connecting || s.joinCode.trim().length < 4 ? theme.color.textMuted : theme.color.white,
          fontFamily: theme.font.heading,
          fontWeight: 700,
          fontSize: 17,
          cursor: s.connecting ? 'not-allowed' : 'pointer',
        }}
      >
        {s.connecting ? t('join.connecting') : t('join.connect')}
      </button>
    </div>
  )
}
