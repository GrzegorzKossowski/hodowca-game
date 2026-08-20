import { useTranslation } from 'react-i18next'
import { theme } from '../theme'
import { useGameStore, type Mode } from '../store'

export function ModeScreen() {
  const { t } = useTranslation()
  const isDesktop = useGameStore((s) => s.isDesktop)
  const selectMode = useGameStore((s) => s.selectMode)
  const goOnlineChoice = useGameStore((s) => s.goOnlineChoice)
  const openRules = useGameStore((s) => s.openRules)

  const modes: { key: Exclude<Mode, null>; emoji: string; title: string; desc: string; warning?: string }[] = [
    { key: 'hotseat', emoji: '📱', title: t('mode.hotseat.title'), desc: t('mode.hotseat.desc') },
    { key: 'online', emoji: '📶', title: t('mode.online.title'), desc: t('mode.online.desc'), warning: t('mode.online.warning') },
    { key: 'bots', emoji: '🤖', title: t('mode.bots.title'), desc: t('mode.bots.desc') },
  ]

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: isDesktop ? '48px' : '20px 16px',
        gap: 28,
      }}
    >
      <div style={{ textAlign: 'center', marginTop: isDesktop ? 40 : 12 }}>
        <div
          style={{
            fontFamily: theme.font.heading,
            fontWeight: 800,
            fontSize: 40,
            color: theme.color.accent,
            letterSpacing: '-0.01em',
          }}
        >
          🐄 {t('app.title')}
        </div>
        <div style={{ fontSize: 16, color: theme.color.textMuted, marginTop: 6 }}>{t('mode.subtitle')}</div>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 720,
          display: 'flex',
          flexDirection: isDesktop ? 'row' : 'column',
          gap: 16,
        }}
      >
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => (m.key === 'online' ? goOnlineChoice() : selectMode(m.key))}
            style={{
              flex: 1,
              textAlign: 'left',
              cursor: 'pointer',
              background: theme.color.cardBg,
              border: `2px solid ${theme.color.cardBorder}`,
              borderRadius: 20,
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              minHeight: 168,
            }}
          >
            <div style={{ fontSize: 34 }}>{m.emoji}</div>
            <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 19 }}>{m.title}</div>
            <div style={{ fontSize: 14, color: theme.color.textMuted, lineHeight: 1.45 }}>{m.desc}</div>
            {m.warning && (
              <div
                style={{
                  marginTop: 'auto',
                  display: 'flex',
                  gap: 6,
                  alignItems: 'flex-start',
                  fontSize: 12.5,
                  color: theme.color.danger,
                  background: theme.color.dangerBg,
                  borderRadius: 10,
                  padding: '8px 10px',
                  lineHeight: 1.4,
                }}
              >
                <span>⚠️</span>
                <span>{m.warning}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={openRules}
        style={{
          marginTop: 'auto',
          marginBottom: 8,
          background: 'none',
          border: 'none',
          color: theme.color.textMuted,
          fontSize: 14,
          textDecoration: 'underline',
          cursor: 'pointer',
          padding: 10,
        }}
      >
        {t('mode.rulesLink')}
      </button>
    </div>
  )
}
