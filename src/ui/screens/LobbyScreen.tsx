import { useTranslation } from 'react-i18next'
import { theme } from '../theme'
import { useGameStore } from '../store'
import { AvatarPicker } from '../components/AvatarPicker'
import { BotAggroControl } from '../components/BotAggroControl'

export function LobbyScreen() {
  const { t } = useTranslation()
  const s = useGameStore()

  const title =
    s.mode === 'hotseat' ? t('lobby.title.hotseat') : s.mode === 'online' ? t('lobby.title.online') : t('lobby.title.bots')
  const isGuest = s.mode === 'online' && s.netRole === 'guest'
  const cannotStart = s.players.length < 2 || isGuest

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: s.isDesktop ? '48px' : '20px 16px',
        gap: 20,
        maxWidth: 640,
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
      <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 24 }}>{title}</div>

      {s.mode === 'hotseat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, color: theme.color.textMuted, fontWeight: 600 }}>
            {t('lobby.players_other', { count: s.players.length })}
          </div>
          {s.players.map((p) => (
            <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: theme.color.cardBg,
                  border: `1.5px solid ${theme.color.cardBorder}`,
                  borderRadius: 14,
                  padding: '10px 12px',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => s.toggleAvatarPicker(p.id)}
                    style={{
                      fontSize: 24,
                      background: theme.color.accentBg,
                      border: 'none',
                      borderRadius: 10,
                      width: 44,
                      height: 44,
                      cursor: 'pointer',
                    }}
                  >
                    {p.avatar}
                  </button>
                  {p.isBot && (
                    <span style={{ position: 'absolute', bottom: -4, right: -4, fontSize: 14, background: theme.color.cardBg, borderRadius: '50%', lineHeight: 1 }}>
                      🤖
                    </span>
                  )}
                </div>
                <input
                  value={p.name}
                  onChange={(e) => s.renamePlayer(p.id, e.target.value)}
                  placeholder={t('common.namePlaceholder')}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    fontSize: 16,
                    fontFamily: theme.font.body,
                    padding: '8px 0',
                    outline: 'none',
                  }}
                />
                {s.players.length > 2 && (
                  <button
                    onClick={() => s.removePlayer(p.id)}
                    style={{ background: 'none', border: 'none', color: theme.color.danger, fontSize: 18, cursor: 'pointer', padding: 6 }}
                  >
                    ✕
                  </button>
                )}
              </div>
              {s.pickingAvatarFor === p.id && (
                <AvatarPicker current={p.avatar} onSelect={(av) => s.selectAvatar(p.id, av)} />
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={s.addPlayer}
              disabled={s.players.length >= 6}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                border: `1.5px dashed ${theme.color.dashedBorder}`,
                background: 'transparent',
                color: theme.color.textMuted,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {t('lobby.addPlayer', { max: 6 })}
            </button>
            <button
              onClick={s.addBotPlayer}
              disabled={s.players.length >= 6}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                border: `1.5px dashed ${theme.color.dashedBorder}`,
                background: 'transparent',
                color: theme.color.textMuted,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {t('lobby.addBot', { max: 6 })}
            </button>
          </div>
          {s.players.some((p) => p.isBot) && <BotAggroControl />}
        </div>
      )}

      {s.mode === 'online' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ background: theme.color.accentBg, borderRadius: 16, padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: theme.color.textMuted, fontWeight: 600 }}>
              {s.netRole === 'host' ? t('lobby.roomCode') : t('lobby.connectedTo')}
            </div>
            <div
              style={{
                fontFamily: theme.font.heading,
                fontWeight: 800,
                fontSize: 40,
                letterSpacing: '0.12em',
                color: theme.color.accentDark,
                marginTop: 4,
              }}
            >
              {s.roomCode}
            </div>
            {s.netRole === 'host' && (
              <div style={{ fontSize: 12.5, color: theme.color.textMuted, marginTop: 4 }}>{t('lobby.roomCodeHint')}</div>
            )}
          </div>
          <div style={{ fontSize: 13, color: theme.color.textMuted, fontWeight: 600 }}>
            {t('lobby.joined', { count: s.players.length, max: 6 })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {s.players.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: theme.color.cardBg,
                  border: `1.5px solid ${theme.color.cardBorder}`,
                  borderRadius: 12,
                  padding: '10px 12px',
                }}
              >
                <span style={{ fontSize: 22 }}>{p.avatar}</span>
                <span style={{ flex: 1, fontWeight: 600 }}>{p.name}</span>
                {p.isBot ? (
                  <>
                    <span style={{ fontSize: 16 }}>🤖</span>
                    {s.netRole === 'host' && (
                      <button
                        onClick={() => s.removePlayer(p.id)}
                        style={{ background: 'none', border: 'none', color: theme.color.danger, fontSize: 18, cursor: 'pointer', padding: 6 }}
                      >
                        ✕
                      </button>
                    )}
                  </>
                ) : (
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.color.accent }} />
                )}
              </div>
            ))}
          </div>
          {s.netRole === 'host' && (
            <button
              onClick={s.addBotPlayer}
              disabled={s.players.length >= 6}
              style={{
                padding: 12,
                borderRadius: 12,
                border: `1.5px dashed ${theme.color.dashedBorder}`,
                background: 'transparent',
                color: theme.color.textMuted,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {t('lobby.addBot', { max: 6 })}
            </button>
          )}
          {s.players.some((p) => p.isBot) && <BotAggroControl />}
          <div
            style={{
              fontSize: 12.5,
              color: theme.color.textMuted,
              display: 'flex',
              gap: 6,
              alignItems: 'flex-start',
              background: theme.color.dangerBg,
              borderRadius: 10,
              padding: '10px 12px',
            }}
          >
            <span>⚠️</span>
            <span>{t('lobby.onlineWarning')}</span>
          </div>
        </div>
      )}

      {s.mode === 'bots' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div style={{ fontSize: 13, color: theme.color.textMuted, fontWeight: 600, marginBottom: 8 }}>
              {t('lobby.botCount', { count: s.numBots })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                onClick={s.decBots}
                style={{ width: 44, height: 44, borderRadius: 12, border: `1.5px solid ${theme.color.cardBorder}`, background: theme.color.cardBg, fontSize: 20, cursor: 'pointer' }}
              >
                −
              </button>
              <div style={{ flex: 1, display: 'flex', gap: 8, justifyContent: 'center' }}>
                {Array.from({ length: s.numBots }, (_, i) => (
                  <span key={i} style={{ fontSize: 24 }}>🤖</span>
                ))}
              </div>
              <button
                onClick={s.incBots}
                style={{ width: 44, height: 44, borderRadius: 12, border: `1.5px solid ${theme.color.cardBorder}`, background: theme.color.cardBg, fontSize: 20, cursor: 'pointer' }}
              >
                +
              </button>
            </div>
          </div>
          <BotAggroControl />
          <div style={{ fontSize: 13, color: theme.color.textMuted, fontWeight: 600 }}>{t('lobby.yourName')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => s.toggleAvatarPicker(-1)}
              style={{
                fontSize: 24,
                background: theme.color.accentBg,
                border: 'none',
                borderRadius: 10,
                width: 44,
                height: 44,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {s.soloPlayerAvatar}
            </button>
            <input
              value={s.soloPlayerName}
              onChange={(e) => s.setSoloPlayerName(e.target.value)}
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
          {s.pickingAvatarFor === -1 && (
            <AvatarPicker
              current={s.soloPlayerAvatar}
              onSelect={(av) => {
                s.setSoloPlayerAvatar(av)
                s.toggleAvatarPicker(-1)
              }}
            />
          )}
        </div>
      )}

      <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: theme.color.textMuted, opacity: isGuest ? 0.6 : 1 }}>
          <input
            type="checkbox"
            checked={s.timerEnabled}
            onChange={s.toggleTimer}
            disabled={isGuest}
            style={{ width: 18, height: 18 }}
          />
          {t('lobby.timerToggle')}
          {isGuest && <span style={{ fontSize: 12 }}>({t('lobby.timerHostOnly')})</span>}
        </div>
        {isGuest ? (
          <div style={{ textAlign: 'center', fontSize: 13.5, color: theme.color.textMuted, padding: 8 }}>
            {t('lobby.waitingForHost')}
          </div>
        ) : (
          <button
            onClick={s.startGame}
            disabled={cannotStart}
            style={{
              padding: 16,
              borderRadius: 14,
              border: 'none',
              background: cannotStart ? theme.color.cardBorder : theme.color.accent,
              color: cannotStart ? theme.color.textMuted : theme.color.white,
              fontFamily: theme.font.heading,
              fontWeight: 700,
              fontSize: 17,
              cursor: 'pointer',
            }}
          >
            {t('lobby.start')}
          </button>
        )}
      </div>
    </div>
  )
}
