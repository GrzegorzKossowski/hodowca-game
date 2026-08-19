import { useTranslation } from 'react-i18next'
import { theme } from '../theme'
import { useGameStore, type Tab } from '../store'
import { ANIMAL_KEYS, type AnimalKey } from '../animals'

const TAB_ICONS: Record<Tab, string> = { herd: '🐄', trade: '🔄', rivals: '👥', log: '📜' }
const TRADE_NOTE_KEY: Record<number, string> = {
  0: 'board.trade.rabbitToSheep',
  1: 'board.trade.sheepToPig',
  2: 'board.trade.pigToCow',
  3: 'board.trade.cowToHorse',
}

export function BoardScreen() {
  const { t } = useTranslation()
  const s = useGameStore()
  const isDesktop = s.isDesktop
  const isMobile = !isDesktop

  const activePlayer = s.players[s.currentPlayerIdx] ?? { name: '—', avatar: '🐻', herd: undefined }
  const rivals = s.players.filter((_, i) => i !== s.currentPlayerIdx)
  const rivalLimit = isDesktop ? 5 : 3
  const visibleRivals = rivals.slice(0, rivalLimit)

  const myHerd = ANIMAL_KEYS.map((k) => ({ key: k, count: activePlayer.herd ? activePlayer.herd[k] : 0 }))
  const myDogs: { key: 'dogSmall' | 'dogBig'; emoji: string; count: number }[] = [
    { key: 'dogSmall', emoji: '🐕', count: activePlayer.herd ? activePlayer.herd.dogSmall : 0 },
    { key: 'dogBig', emoji: '🐕‍🦺', count: activePlayer.herd ? activePlayer.herd.dogBig : 0 },
  ]
  const mainPoolList = ANIMAL_KEYS.map((k) => ({ key: k, count: s.mainPool[k] }))

  const tradeOptions = [
    { fromKey: 'rabbit' as AnimalKey, fromCount: 6, toKey: 'sheep' as AnimalKey, affordable: myHerd[0].count >= 6, noteKey: TRADE_NOTE_KEY[0] },
    { fromKey: 'sheep' as AnimalKey, fromCount: 2, toKey: 'pig' as AnimalKey, affordable: myHerd[1].count >= 2, noteKey: TRADE_NOTE_KEY[1] },
    { fromKey: 'pig' as AnimalKey, fromCount: 3, toKey: 'cow' as AnimalKey, affordable: myHerd[2].count >= 3, noteKey: TRADE_NOTE_KEY[2] },
    { fromKey: 'cow' as AnimalKey, fromCount: 2, toKey: 'horse' as AnimalKey, affordable: myHerd[3].count >= 2, noteKey: TRADE_NOTE_KEY[3] },
  ]

  const tabs: Tab[] = ['herd', 'trade', 'rivals', 'log']
  const showHerd = isDesktop || s.activeTab === 'herd'
  const showTrade = isDesktop || s.activeTab === 'trade'
  const showRivals = isDesktop || s.activeTab === 'rivals'
  const showLog = isDesktop || s.activeTab === 'log'

  const emoji: Record<AnimalKey, string> = { rabbit: '🐰', sheep: '🐑', pig: '🐷', cow: '🐄', horse: '🐴' }

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
          <span style={{ fontSize: 20 }}>{activePlayer.avatar}</span>
          <span style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 14, color: theme.color.accentDark }}>{activePlayer.name}</span>
        </div>
        <div style={{ fontSize: 12.5, color: theme.color.textMuted }}>{t('board.turnLabel')}</div>
        {s.timerEnabled && (
          <div style={{ marginLeft: 'auto', fontFamily: theme.font.heading, fontWeight: 700, fontSize: 14, color: theme.color.danger, background: theme.color.dangerBg, padding: '5px 10px', borderRadius: 999 }}>
            ⏱ {s.turnTimer}s
          </div>
        )}
        <button
          onClick={s.openRules}
          style={{ marginLeft: s.timerEnabled ? 0 : 'auto', width: 34, height: 34, borderRadius: '50%', border: `1.5px solid ${theme.color.cardBorder}`, background: 'none', cursor: 'pointer', fontSize: 14 }}
        >
          ?
        </button>
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
          disabled={s.diceRolling}
          style={{ alignSelf: 'center', padding: '14px 22px', borderRadius: 14, border: 'none', background: theme.color.accent, color: theme.color.white, fontFamily: theme.font.heading, fontWeight: 700, fontSize: 15, cursor: 'pointer', minHeight: 48 }}
        >
          {s.diceRolling ? t('board.rolling') : t('board.rollDice')}
        </button>
      </div>

      {diceResultText && (
        <div style={{ textAlign: 'center', fontSize: 13.5, color: theme.color.textMuted, padding: '8px 16px 0' }}>{diceResultText}</div>
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
            <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 15 }}>{t('board.yourHerd')}</div>
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
          <div style={{ background: theme.color.cardBg, borderRadius: isDesktop ? 18 : 0, border: isDesktop ? `1.5px solid ${theme.color.cardBorder}` : 'none', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 15 }}>{t('board.trade.title')}</div>
            {tradeOptions.map((tr) => (
              <button
                key={tr.noteKey}
                disabled={!tr.affordable}
                onClick={() => s.showToast(tr.noteKey)}
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
                <span style={{ fontSize: 20 }}>{emoji[tr.fromKey]}</span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>×{tr.fromCount}</span>
                <span style={{ color: theme.color.textMuted }}>→</span>
                <span style={{ fontSize: 20 }}>{emoji[tr.toKey]}</span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>×1</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: theme.color.textMuted }}>{t(tr.noteKey)}</span>
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
                <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 15 }}>{t('board.log')}</div>
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

      <div style={{ padding: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={s.simulatePredator}
          style={{ flex: 1, minWidth: 160, padding: 12, borderRadius: 12, border: `1.5px solid ${theme.color.dangerBg}`, background: theme.color.dangerBgLight, color: theme.color.danger, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
        >
          {t('board.simulatePredator')}
        </button>
        {s.mode === 'hotseat' && (
          <button
            onClick={s.endTurn}
            style={{ flex: 1, minWidth: 160, padding: 12, borderRadius: 12, border: 'none', background: theme.color.accent, color: theme.color.white, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            {t('board.endTurn')}
          </button>
        )}
        <button
          onClick={s.simulateWin}
          style={{ flex: 1, minWidth: 160, padding: 12, borderRadius: 12, border: `1.5px dashed ${theme.color.dashedBorder}`, background: 'none', color: theme.color.textMuted, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
        >
          {t('board.simulateWin')}
        </button>
      </div>
    </div>
  )
}
