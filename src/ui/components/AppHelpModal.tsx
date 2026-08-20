import { useTranslation } from 'react-i18next'
import { theme } from '../theme'
import { useGameStore } from '../store'

const TOPIC_KEYS = ['reload', 'hostLeaves', 'internetNeeded', 'leaveGame'] as const

export function AppHelpModal() {
  const { t } = useTranslation()
  const appHelpOpen = useGameStore((s) => s.appHelpOpen)
  const closeAppHelp = useGameStore((s) => s.closeAppHelp)
  if (!appHelpOpen) return null

  return (
    <div
      onClick={closeAppHelp}
      style={{ position: 'fixed', inset: 0, background: theme.color.overlayWarm, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: theme.color.white, borderRadius: '24px 24px 0 0', padding: '24px 20px 28px', maxWidth: 480, width: '100%', maxHeight: '80vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 19 }}>{t('appHelp.title')}</div>
          <button onClick={closeAppHelp} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: theme.color.textMuted }}>
            ✕
          </button>
        </div>
        <div style={{ fontSize: 13.5, color: theme.color.textMuted, lineHeight: 1.5 }}>{t('appHelp.intro')}</div>
        {TOPIC_KEYS.map((key) => (
          <div key={key} style={{ background: theme.color.bg, borderRadius: 14, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{t(`appHelp.${key}.title`)}</div>
            <div style={{ fontSize: 13.5, color: theme.color.textMuted, lineHeight: 1.5 }}>{t(`appHelp.${key}.text`)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
