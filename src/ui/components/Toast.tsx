import { useTranslation } from 'react-i18next'
import { theme } from '../theme'
import { useGameStore } from '../store'

export function Toast() {
  const { t } = useTranslation()
  const toast = useGameStore((s) => s.toast)
  const screen = useGameStore((s) => s.screen)
  const isDesktop = useGameStore((s) => s.isDesktop)
  if (!toast) return null

  const bottom = screen === 'board' && !isDesktop ? 78 : 20

  return (
    <div
      style={{
        position: 'fixed',
        bottom,
        left: '50%',
        transform: 'translateX(-50%)',
        background: theme.color.text,
        color: theme.color.white,
        padding: '12px 18px',
        borderRadius: 12,
        fontSize: 13.5,
        zIndex: 40,
        maxWidth: '90vw',
        textAlign: 'center',
      }}
    >
      {t(toast)}
    </div>
  )
}
