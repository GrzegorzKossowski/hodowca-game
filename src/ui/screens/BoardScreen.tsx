import { useTranslation } from 'react-i18next'
import { theme } from '../theme'
import { useGameStore, isLocalHumanTurn, type Tab } from '../store'
import { ANIMAL_KEYS, HERD_EMOJI } from '../animals'
import { TRADE_RECIPES, MAX_TRADES_PER_TURN, canAffordTrade, poolHasStock } from '../../engine'
import { TurnStatusBanner } from '../components/TurnStatusBanner'
import { myPeerId } from '../../net/room'

const TAB_ICONS: Record<Tab, string> = { herd: '🐄', trade: '🔄', rivals: '👥', log: '📜' }

export function BoardScreen() {
  const { t } = useTranslation()
  const s = useGameStore()
  const isDesktop = s.isDesktop
  const isMobile = !isDesktop

  const activePlayer = s.players[s.currentPlayerIdx] ?? { name: '—', avatar: '🐻', herd: undefined, peerId: undefined, isBot: false }
  const isMyTurn = isLocalHumanTurn(s)
  // Whose screen this actually is — in hotseat mode the device rotates between players, so whoever's
  // turn it is IS the screen holder; in online/bots mode it's always the same one fixed local player,
  // shown regardless of whose turn it currently is (three phones/tabs side by side must be tellable
  // apart even when none of them is the active player).
  const myIdentity =
    s.mode === 'online'
      ? (s.players.find((p) => p.peerId === myPeerId) ?? activePlayer)
      : s.mode === 'bots'
        ? (s.players.find((p) => !p.isBot) ?? activePlayer)
        : activePlayer
  const rivals = s.players.filter((_, i) => i !== s.currentPlayerIdx)
  const rivalLimit = isDesktop ? 5 : 3
  const visibleRivals = rivals.slice(0, rivalLimit)

  const myHerd = ANIMAL_KEYS.map((k) => ({ key: k, count: activePlayer.herd ? activePlayer.herd[k] : 0 }))
  const myDogs: { key: 'dogSmall' | 'dogBig'; emoji: string; count: number }[] = [
    { key: 'dogSmall', emoji: '🐕', count: activePlayer.herd ? activePlayer.herd.dogSmall : 0 },
    { key: 'dogBig', emoji: '🐕‍🦺', count: activePlayer.herd ? activePlayer.herd.dogBig : 0 },
  ]
  const mainPoolList = ANIMAL_KEYS.map((k) => ({ key: k, count: s.mainPool[k] }))

  const tradesLeft = Math.max(0, MAX_TRADES_PER_TURN - s.tradesThisTurn)
  const tradeOptions = TRADE_RECIPES.map((recipe) => {
    const [giveKey, giveCount] = Object.entries(recipe.give)[0]
    const [getKey, getCount] = Object.entries(recipe.get)[0]
    return {
      id: recipe.id,
      giveKey,
      giveCount: giveCount ?? 0,
      getKey,
      getCount: getCount ?? 0,
      affordable: activePlayer.herd
        ? isMyTurn && tradesLeft > 0 && canAffordTrade(activePlayer.herd, recipe) && poolHasStock(s.mainPool, recipe)
        : false,
    }
  })

  const tabs: Tab[] = ['herd', 'trade', 'rivals', 'log']
  const showHerd = isDesktop || s.activeTab === 'herd'
  const showTrade = isDesktop || s.activeTab === 'trade'
  const showRivals = isDesktop || s.activeTab === 'rivals'
  const showLog = isDesktop || s.activeTab === 'log'

  const emoji = HERD_EMOJI

  const diceFaces = s.diceResult
    ? [s.diceResult.a, s.diceResult.b]
    : ['❔', '❔']
  const diceResultText = s.diceResult
    ? t('board.diceResult', { a: s.diceResult.a, b: s.diceResult.b })
    : s.diceRolling
      ? null
      : t('board.diceHint')

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TurnStatusBanner />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          background: theme.color.cardBg,
          borderBottom: `1.5px solid ${theme.color.cardBorder}`,
          position: 'sticky',
          top: 0,
          zIndex: 5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: theme.color.accentBg, borderRadius: 999, padding: '6px 12px 6px 6px' }}>
          <span style={{ fontSize: 20 }}>{myIdentity.avatar}</span>
          <span style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 14, color: theme.color.accentDark }}>{myIdentity.name}</span>
          {!isMyTurn && (
            <span style={{ fontSize: 10.5, fontWeight: 700, color: theme.color.textMuted, letterSpacing: '0.04em' }}>{t('board.youLabel')}</span>
          )}
        </div>
        {isMyTurn ? (
          <div style={{ fontSize: 12.5, fontWeight: 800, color: theme.color.accent }}>{t('board.yourTurnLabel')}</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: theme.color.textMuted }}>
            <span>{t('board.turnLabel')}:</span>
            <span style={{ fontSize: 15 }}>{activePlayer.avatar}</span>
            <span style={{ fontWeight: 600 }}>{activePlayer.name}</span>
          </div>
        )}
        {s.timerEnabled && (
            <div
            style={{
              marginLeft: 'auto',
              fontFamily: theme.font.heading,
              fontWeight: 700,
              fontSize: 14,
              fontVariantNumeric: 'tabular-nums',
              color: theme.color.danger,
              background: theme.color.dangerBg,
              padding: '5px 10px',
              borderRadius: 999,
              minWidth: 58,
              textAlign: 'center',
            }}
          >
            ⏱ {s.turnTimer}s
          </div>
        )}
        <div style={{ marginLeft: s.timerEnabled ? 0 : 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={s.openRules}
            style={{ width: 34, height: 34, borderRadius: '50%', border: `1.5px solid ${theme.color.cardBorder}`, background: 'none', cursor: 'pointer', fontSize: 14 }}
          >
            ?
          </button>
          <button
            onClick={() => {
              if (window.confirm(t('board.leaveConfirm'))) s.backToMode()
            }}
            title={t('board.leaveGame')}
            aria-label={t('board.leaveGame')}
            style={{ width: 34, height: 34, borderRadius: '50%', border: `1.5px solid ${theme.color.cardBorder}`, background: 'none', cursor: 'pointer', fontSize: 15, color: theme.color.danger }}
          >
            🚪
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 18, padding: '18px 16px', background: theme.color.accentBg }}>
        {diceFaces.map((face, i) => (
          <div
            key={i}
            style={{
              width: 68,
              height: 68,
              borderRadius: 16,
              background: theme.color.white,
              border: `2px solid ${theme.color.dashedBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              boxShadow: `0 3px 0 ${theme.color.dashedBorder}`,
            }}
          >
            {face}
          </div>
        ))}
        <button
          onClick={s.rollDice}
          disabled={s.diceRolling || s.hasRolledThisTurn || !isMyTurn}
          style={{
            alignSelf: 'center',
            minWidth: 176,
            padding: '14px 22px',
            borderRadius: 14,
            border: 'none',
            background: theme.color.accent,
            color: theme.color.white,
            fontFamily: theme.font.heading,
            fontWeight: 700,
            fontSize: 15,
            cursor: s.diceRolling || s.hasRolledThisTurn || !isMyTurn ? 'not-allowed' : 'pointer',
            opacity: (s.hasRolledThisTurn && !s.diceRolling) || !isMyTurn ? 0.5 : 1,
            minHeight: 48,
          }}
        >
          {s.diceRolling ? t('board.rolling') : t('board.rollDice')}
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          margin: '10px 16px',
          padding: '12px 16px',
          minHeight: 44,
          borderRadius: 14,
          textAlign: 'center',
          fontWeight: 700,
          fontSize: 15,
          background: !isMyTurn ? theme.color.bg : s.hasRolledThisTurn ? theme.color.accentBg : theme.color.dangerBg,
          color: !isMyTurn ? theme.color.textMuted : s.hasRolledThisTurn ? theme.color.accentDark : theme.color.danger,
        }}
      >
        {!isMyTurn ? (
          <>⏳ {t('board.waitingFor', { player: activePlayer.name })}</>
        ) : s.diceRolling ? (
          <>🎲 {t('board.rolling')}</>
        ) : s.hasRolledThisTurn ? (
          <>✅ {diceResultText}</>
        ) : (
          <>👉 {t('board.diceHint')}</>
        )}
      </div>
      {isMyTurn && s.hasRolledThisTurn && !s.overlay && (
        <div style={{ textAlign: 'center', fontSize: 12.5, color: theme.color.textMuted, margin: '-4px 16px 6px' }}>
          {t('board.nextStepHint')}
        </div>
      )}

      {isMobile && (
        <div style={{ display: 'flex', borderBottom: `1.5px solid ${theme.color.cardBorder}`, background: theme.color.cardBg }}>
          {tabs.map((tab) => {
            const active = s.activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => s.setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '12px 4px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: active ? theme.color.accentDark : theme.color.textMuted,
                  borderBottom: `3px solid ${active ? theme.color.accent : 'transparent'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <span style={{ fontSize: 18 }}>{TAB_ICONS[tab]}</span>
                {t(`board.tabs.${tab}`)}
              </button>
            )
          })}
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: isDesktop ? 'grid' : 'block',
          gridTemplateColumns: isDesktop ? '1fr 1.2fr 1fr' : undefined,
          gap: isDesktop ? 16 : 0,
          padding: isDesktop ? 16 : 0,
          alignItems: 'start',
        }}
      >
        {showHerd && (
          <div style={{ background: theme.color.cardBg, borderRadius: isDesktop ? 18 : 0, border: isDesktop ? `1.5px solid ${theme.color.cardBorder}` : 'none', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 15 }}>
              {isMyTurn ? t('board.yourHerd') : t('board.theirHerd', { player: activePlayer.name })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {myHerd.map((a) => (
                <div key={a.key} style={{ background: theme.color.bg, borderRadius: 14, padding: '12px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 30 }}>{emoji[a.key]}</div>
                  <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 18 }}>{a.count}</div>
                  <div style={{ fontSize: 11, color: theme.color.textMuted }}>{t(`common.animal.${a.key}`)}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {myDogs.map((d) => (
                <div key={d.key} style={{ flex: 1, background: d.count > 0 ? theme.color.accentBg : theme.color.bg, border: `1.5px dashed ${theme.color.dashedBorder}`, borderRadius: 14, padding: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, opacity: d.count > 0 ? 1 : 0.35 }}>{d.emoji}</div>
                  <div style={{ fontSize: 11, color: theme.color.textMuted, marginTop: 2 }}>{t(`common.animal.${d.key}`)}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 6, fontFamily: theme.font.heading, fontWeight: 700, fontSize: 15 }}>{t('board.mainPool')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {mainPoolList.map((a) => (
                <div key={a.key} style={{ textAlign: 'center', background: theme.color.bg, borderRadius: 10, padding: '6px 2px' }}>
                  <div style={{ fontSize: 18 }}>{emoji[a.key]}</div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{a.count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showTrade && (
          <div
            style={{
              background: theme.color.cardBg,
              borderRadius: isDesktop ? 18 : 0,
              border: isDesktop ? `1.5px solid ${theme.color.cardBorder}` : 'none',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              opacity: isMyTurn ? 1 : 0.55,
              pointerEvents: isMyTurn ? 'auto' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 15 }}>{t('board.trade.title')}</div>
              <div
                style={{
                  marginLeft: 'auto',
                  fontSize: 12,
                  fontWeight: 700,
                  color: tradesLeft > 0 ? theme.color.textMuted : theme.color.danger,
                  background: theme.color.bg,
                  borderRadius: 999,
                  padding: '4px 10px',
                }}
              >
                {t('board.trade.left', { count: tradesLeft, max: MAX_TRADES_PER_TURN })}
              </div>
            </div>
            {tradeOptions.map((tr) => (
              <button
                key={tr.id}
                disabled={!tr.affordable}
                onClick={() => s.makeTrade(tr.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: 12,
                  borderRadius: 14,
                  border: `1.5px solid ${tr.affordable ? theme.color.cardBorder : theme.color.divider}`,
                  background: tr.affordable ? theme.color.bg : theme.color.divider,
                  cursor: tr.affordable ? 'pointer' : 'not-allowed',
                  opacity: tr.affordable ? 1 : 0.5,
                  minHeight: 52,
                }}
              >
                <span style={{ fontSize: 20 }}>{emoji[tr.giveKey as keyof typeof emoji]}</span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>×{tr.giveCount}</span>
                <span style={{ color: theme.color.textMuted }}>→</span>
                <span style={{ fontSize: 20 }}>{emoji[tr.getKey as keyof typeof emoji]}</span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>×{tr.getCount}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: theme.color.textMuted }}>
                  {t(`common.animal.${tr.giveKey}`)} → {t(`common.animal.${tr.getKey}`)}
                </span>
              </button>
            ))}
          </div>
        )}

        {(showRivals || showLog) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: isDesktop ? 0 : 16 }}>
            {showRivals && (
              <div style={{ background: theme.color.cardBg, borderRadius: 18, border: `1.5px solid ${theme.color.cardBorder}`, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 15 }}>{t('board.rivals')}</div>
                {visibleRivals.map((r) => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: theme.color.bg, borderRadius: 12, padding: '8px 10px' }}>
                    <span style={{ fontSize: 18 }}>{r.avatar}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{r.name}</span>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {ANIMAL_KEYS.slice(0, 4).map((k) => (
                        <span key={k} style={{ fontSize: 12, color: theme.color.textMuted }}>
                          {emoji[k]}{r.herd[k]}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {rivals.length > rivalLimit && (
                  <div style={{ fontSize: 12, color: theme.color.textMuted, textAlign: 'center' }}>
                    {t('board.moreRivals', { count: rivals.length - rivalLimit })}
                  </div>
                )}
              </div>
            )}

            {showLog && (
              <div style={{ background: theme.color.cardBg, borderRadius: 18, border: `1.5px solid ${theme.color.cardBorder}`, padding: 14, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 15 }}>{t('board.logTitle')}</div>
                {s.log.map((e, i) => (
                  <div key={i} style={{ fontSize: 13, lineHeight: 1.4, color: e.danger ? theme.color.danger : theme.color.text, paddingBottom: 8, borderBottom: `1px solid ${theme.color.divider}` }}>
                    {e.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {(s.mode === 'hotseat' || s.mode === 'online' || s.mode === 'bots') && (
        <div style={{ padding: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={s.endTurn}
            disabled={!s.hasRolledThisTurn || !isMyTurn}
            style={{
              flex: 1,
              minWidth: 220,
              minHeight: 56,
              padding: '16px 24px',
              borderRadius: 14,
              border: 'none',
              background: theme.color.accent,
              color: theme.color.white,
              fontFamily: theme.font.heading,
              fontWeight: 700,
              fontSize: 17,
              cursor: s.hasRolledThisTurn && isMyTurn ? 'pointer' : 'not-allowed',
              opacity: s.hasRolledThisTurn && isMyTurn ? 1 : 0.5,
            }}
          >
            {t('board.endTurn')}
          </button>
        </div>
      )}
    </div>
  )
}
