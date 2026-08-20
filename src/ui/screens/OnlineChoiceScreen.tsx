import { useTranslation } from 'react-i18next'
import { theme } from '../theme'
import { useGameStore } from '../store'
import { AvatarPicker } from '../components/AvatarPicker'

export function OnlineChoiceScreen() {
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
        maxWidth: 520,
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
        {t('lobby.backToMode')}
      </button>

      <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 24 }}>{t('onlineChoice.title')}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 13, color: theme.color.textMuted, fontWeight: 600 }}>{t('onlineChoice.yourName')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>{s.onlineAvatar}</span>
          <input
            value={s.onlineName}
            onChange={(e) => s.setOnlineName(e.target.value)}
            placeholder={t('common.namePlaceholder')}
            style={{
              flex: 1,
              border: `1.5px solid ${theme.color.cardBorder}`,
              borderRadius: 12,
              padding: 12,
              fontSize: 16,
              fontFamily: theme.font.body,
              outline: 'none',
            }}
          />
        </div>
        <div style={{ fontSize: 13, color: theme.color.textMuted, fontWeight: 600, marginTop: 4 }}>
          {t('onlineChoice.chooseAvatar')}
        </div>
        <AvatarPicker current={s.onlineAvatar} onSelect={s.setOnlineAvatar} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
        <button
          onClick={s.hostOnlineGame}
          style={{
            textAlign: 'left',
            cursor: 'pointer',
            background: theme.color.cardBg,
            border: `2px solid ${theme.color.cardBorder}`,
            borderRadius: 18,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 17 }}>{t('onlineChoice.hostButton')}</div>
          <div style={{ fontSize: 13, color: theme.color.textMuted }}>{t('onlineChoice.hostDesc')}</div>
        </button>
        <button
          onClick={s.goJoinScreen}
          style={{
            textAlign: 'left',
            cursor: 'pointer',
            background: theme.color.cardBg,
            border: `2px solid ${theme.color.cardBorder}`,
            borderRadius: 18,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 17 }}>{t('onlineChoice.joinButton')}</div>
          <div style={{ fontSize: 13, color: theme.color.textMuted }}>{t('onlineChoice.joinDesc')}</div>
        </button>
      </div>
    </div>
  )
}
