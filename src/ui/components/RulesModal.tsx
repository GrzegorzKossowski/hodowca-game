import { useTranslation } from 'react-i18next'
import { theme } from '../theme'
import { useGameStore } from '../store'

const RATES: [string, string][] = [
  ['🐰 × 6', '🐑 × 1'],
  ['🐑 × 2', '🐷 × 1'],
  ['🐷 × 3', '🐄 × 1'],
  ['🐄 × 2', '🐴 × 1'],
]

export function RulesModal() {
  const { t } = useTranslation()
  const rulesOpen = useGameStore((s) => s.rulesOpen)
  const closeRules = useGameStore((s) => s.closeRules)
  if (!rulesOpen) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: theme.color.overlayWarm, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: theme.color.white, borderRadius: '24px 24px 0 0', padding: '24px 20px 28px', maxWidth: 480, width: '100%', maxHeight: '80vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 19 }}>{t('rules.title')}</div>
          <button onClick={closeRules} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: theme.color.textMuted }}>
            ✕
          </button>
        </div>
        <div style={{ fontSize: 13, color: theme.color.textMuted, fontWeight: 600 }}>{t('rules.rates')}</div>
        {RATES.map(([from, to]) => (
          <div key={from} style={{ display: 'flex', alignItems: 'center', gap: 8, background: theme.color.bg, borderRadius: 12, padding: '10px 12px', fontSize: 14 }}>
            <span>{from}</span>
            <span style={{ color: theme.color.textMuted }}>=</span>
            <span>{to}</span>
          </div>
        ))}
        <div style={{ fontSize: 13, color: theme.color.textMuted, fontWeight: 600, marginTop: 4 }}>{t('rules.predators')}</div>
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>{t('rules.predatorsText')}</div>
      </div>
    </div>
  )
}
