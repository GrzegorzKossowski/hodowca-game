import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { theme } from '../theme'
import { useGameStore, isLocalHumanTurn } from '../store'

const BYSTANDER_DISMISS_MS = 2200

export function EventOverlay() {
  const { t } = useTranslation()
  const overlay = useGameStore((s) => s.overlay)
  const closeOverlay = useGameStore((s) => s.closeOverlay)
  const isMyTurn = useGameStore(isLocalHumanTurn)

  // Only the player whose turn it actually is has to click through the modal. Everyone else (an
  // online bystander watching another player's or a bot's turn) just sees it briefly and it clears
  // itself, since there's nothing for them to acknowledge.
  useEffect(() => {
    if (!overlay || isMyTurn) return
    const t = setTimeout(() => useGameStore.getState().closeOverlay(), BYSTANDER_DISMISS_MS)
    return () => clearTimeout(t)
  }, [overlay, isMyTurn])

  if (!overlay) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: theme.color.overlayDanger, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
      <div style={{ background: theme.color.white, borderRadius: 24, padding: '32px 28px', maxWidth: 360, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ fontSize: 56 }}>{overlay.emoji}</div>
        <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 19, color: overlay.saved ? theme.color.accent : theme.color.danger }}>
          {t(overlay.title)}
        </div>
        <div style={{ fontSize: 14, color: theme.color.textMuted, lineHeight: 1.5 }}>{t(overlay.text)}</div>
        {isMyTurn && (
          <button
            onClick={closeOverlay}
            style={{ marginTop: 8, padding: '12px 28px', borderRadius: 12, border: 'none', background: theme.color.text, color: theme.color.white, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            {t('overlay.ok')}
          </button>
        )}
      </div>
    </div>
  )
}
