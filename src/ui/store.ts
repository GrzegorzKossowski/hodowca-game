import { create } from 'zustand'
import { AVATARS, NAME_POOL, makeHerd, HERD_EMOJI, PREDATOR_EMOJI, type Herd } from './animals'
import i18n from '../i18n'
import {
  playTurn,
  applyTrade,
  checkWin,
  isPredator,
  TRADE_RECIPES,
  type DiceEvent,
  type TradeRecipe,
} from '../engine'

export type Screen = 'mode' | 'lobby' | 'board' | 'pass' | 'win'
export type Mode = 'hotseat' | 'online' | 'bots' | null
export type Tab = 'herd' | 'trade' | 'rivals' | 'log'

export interface Player {
  id: number
  name: string
  avatar: string
  isBot: boolean
  herd: Herd
}

export interface LogEntry {
  text: string
  danger: boolean
}

export interface PredatorOverlay {
  emoji: string
  saved: boolean
  title: string
  text: string
}

interface GameState {
  screen: Screen
  mode: Mode
  numBots: number
  botAggro: number
  timerEnabled: boolean
  roomCode: string
  players: Player[]
  soloPlayerName: string
  isDesktop: boolean
  activeTab: Tab
  currentPlayerIdx: number
  diceRolling: boolean
  diceResult: { a: string; b: string } | null
  mainPool: Herd
  log: LogEntry[]
  toast: string | null
  overlay: PredatorOverlay | null
  rulesOpen: boolean
  turnTimer: number
  pickingAvatarFor: number | null
  hasRolledThisTurn: boolean

  setIsDesktop: (v: boolean) => void
  selectMode: (mode: Exclude<Mode, null>) => void
  addPlayer: () => void
  removePlayer: (id: number) => void
  toggleAvatarPicker: (id: number) => void
  selectAvatar: (id: number, avatar: string) => void
  renamePlayer: (id: number, name: string) => void
  incBots: () => void
  decBots: () => void
  setBotAggro: (v: number) => void
  setSoloPlayerName: (v: string) => void
  toggleTimer: () => void
  startGame: () => void
  rollDice: () => void
  makeTrade: (recipeId: string) => void
  closeOverlay: () => void
  endTurn: () => void
  confirmPass: () => void
  playAgain: () => void
  backToMode: () => void
  openRules: () => void
  closeRules: () => void
  setActiveTab: (t: Tab) => void
  showToast: (text: string) => void
}

function buildPlayers(n: number, botCount: number): Player[] {
  const players: Player[] = []
  for (let i = 0; i < n; i++) {
    const isBot = botCount ? i >= n - botCount : false
    players.push({
      id: i,
      name: isBot ? `Bot ${i - (n - botCount) + 1}` : NAME_POOL[i] ?? `Gracz ${i + 1}`,
      avatar: AVATARS[i % AVATARS.length],
      isBot,
      herd: makeHerd(i === 0 ? [4, 2, 1, 0, 0, 1, 0] : [6, 3, 1, 1, 0, 0, 0]),
    })
  }
  return players
}

function animalLabel(key: string, count: number): string {
  return `${count}× ${i18n.t(`common.animal.${key}`)}`
}

function eventToLogEntry(event: DiceEvent, playerName: string): LogEntry {
  switch (event.kind) {
    case 'gain':
      return {
        text: i18n.t('board.log.gain', { player: playerName, animal: i18n.t(`common.animal.${event.animal}`) }),
        danger: false,
      }
    case 'poolEmpty':
      return {
        text: i18n.t('board.log.poolEmpty', { player: playerName, animal: i18n.t(`common.animal.${event.animal}`) }),
        danger: false,
      }
    case 'predatorBlocked':
      return {
        text: i18n.t('board.log.predatorBlocked', { player: playerName, predator: i18n.t(`common.predator.${event.predator}`) }),
        danger: false,
      }
    case 'predatorAttack': {
      const lost = Object.entries(event.lost)
        .map(([k, v]) => animalLabel(k, v ?? 0))
        .join(', ')
      return {
        text: i18n.t('board.log.predatorAttack', { player: playerName, predator: i18n.t(`common.predator.${event.predator}`), lost }),
        danger: true,
      }
    }
  }
}

function buildOverlay(event: Extract<DiceEvent, { kind: 'predatorAttack' | 'predatorBlocked' }>): PredatorOverlay {
  const isFox = event.predator === 'fox'
  if (event.kind === 'predatorBlocked') {
    return {
      emoji: PREDATOR_EMOJI[event.predator],
      saved: true,
      title: isFox ? 'overlay.foxSaved' : 'overlay.wolfSaved',
      text: isFox ? 'overlay.foxSavedText' : 'overlay.wolfSavedText',
    }
  }
  return {
    emoji: PREDATOR_EMOJI[event.predator],
    saved: false,
    title: isFox ? 'overlay.foxAttack' : 'overlay.wolfAttack',
    text: isFox ? 'overlay.foxAttackText' : 'overlay.wolfAttackText',
  }
}

function tradeLogEntry(recipe: TradeRecipe, playerName: string): LogEntry {
  const give = Object.entries(recipe.give)
    .map(([k, v]) => animalLabel(k, v ?? 0))
    .join(', ')
  const get = Object.entries(recipe.get)
    .map(([k, v]) => animalLabel(k, v ?? 0))
    .join(', ')
  return { text: i18n.t('board.log.trade', { player: playerName, give, get }), danger: false }
}

let toastTimer: ReturnType<typeof setTimeout> | undefined

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'mode',
  mode: null,
  numBots: 2,
  botAggro: 1,
  timerEnabled: true,
  roomCode: 'F7K2QX',
  players: [],
  soloPlayerName: 'Ty',
  isDesktop: typeof window !== 'undefined' && window.innerWidth >= 980,
  activeTab: 'herd',
  currentPlayerIdx: 0,
  diceRolling: false,
  diceResult: null,
  mainPool: makeHerd([54, 22, 18, 14, 9, 3, 1]),
  log: [],
  toast: null,
  overlay: null,
  rulesOpen: false,
  turnTimer: 60,
  pickingAvatarFor: null,
  hasRolledThisTurn: false,

  setIsDesktop: (v) => set({ isDesktop: v }),

  selectMode: (mode) => {
    const numBots = get().numBots
    const n = mode === 'hotseat' ? 3 : mode === 'bots' ? 1 + numBots : 2
    const botCount = mode === 'bots' ? numBots : 0
    set({ mode, screen: 'lobby', players: buildPlayers(n, botCount) })
  },

  addPlayer: () => {
    const players = get().players
    if (players.length >= 6) return
    const i = players.length
    set({
      players: [
        ...players,
        {
          id: i,
          name: NAME_POOL[i] ?? `Gracz ${i + 1}`,
          avatar: AVATARS[i % AVATARS.length],
          isBot: false,
          herd: makeHerd([6, 3, 1, 1, 0, 0, 0]),
        },
      ],
    })
  },

  removePlayer: (id) => set({ players: get().players.filter((p) => p.id !== id) }),

  toggleAvatarPicker: (id) =>
    set({ pickingAvatarFor: get().pickingAvatarFor === id ? null : id }),

  selectAvatar: (id, avatar) =>
    set({
      players: get().players.map((p) => (p.id === id ? { ...p, avatar } : p)),
      pickingAvatarFor: null,
    }),

  renamePlayer: (id, name) =>
    set({ players: get().players.map((p) => (p.id === id ? { ...p, name } : p)) }),

  incBots: () => {
    const numBots = Math.min(5, get().numBots + 1)
    set({ numBots, players: buildPlayers(1 + numBots, numBots) })
  },
  decBots: () => {
    const numBots = Math.max(1, get().numBots - 1)
    set({ numBots, players: buildPlayers(1 + numBots, numBots) })
  },
  setBotAggro: (v) => set({ botAggro: v }),
  setSoloPlayerName: (v) => set({ soloPlayerName: v }),
  toggleTimer: () => set({ timerEnabled: !get().timerEnabled }),

  startGame: () => set({ screen: 'board', currentPlayerIdx: 0, hasRolledThisTurn: false, diceResult: null }),

  rollDice: () => {
    if (get().diceRolling || get().hasRolledThisTurn) return
    set({ diceRolling: true, diceResult: null })
    setTimeout(() => {
      const { players, currentPlayerIdx, mainPool, log } = get()
      const activePlayer = players[currentPlayerIdx]
      const result = playTurn(activePlayer.herd, mainPool)

      const diceResult = {
        a: isPredator(result.roll.small) ? PREDATOR_EMOJI[result.roll.small] : HERD_EMOJI[result.roll.small],
        b: isPredator(result.roll.big) ? PREDATOR_EMOJI[result.roll.big] : HERD_EMOJI[result.roll.big],
      }

      const newPlayers = players.map((p, i) => (i === currentPlayerIdx ? { ...p, herd: result.herd } : p))
      const newLogEntries = result.events.map((e) => eventToLogEntry(e, activePlayer.name))
      const predatorEvent = result.events.find(
        (e): e is Extract<DiceEvent, { kind: 'predatorAttack' | 'predatorBlocked' }> =>
          e.kind === 'predatorAttack' || e.kind === 'predatorBlocked',
      )
      const overlay = predatorEvent ? buildOverlay(predatorEvent) : null
      const won = checkWin(result.herd)

      set({
        diceRolling: false,
        diceResult,
        players: newPlayers,
        mainPool: result.pool,
        log: [...newLogEntries, ...log],
        hasRolledThisTurn: true,
        overlay,
        screen: won ? 'win' : get().screen,
      })
    }, 900)
  },

  makeTrade: (recipeId) => {
    const recipe = TRADE_RECIPES.find((r) => r.id === recipeId)
    if (!recipe) return
    const { players, currentPlayerIdx, mainPool, log } = get()
    const activePlayer = players[currentPlayerIdx]
    const result = applyTrade(activePlayer.herd, mainPool, recipe)
    if (!result) return

    const newPlayers = players.map((p, i) => (i === currentPlayerIdx ? { ...p, herd: result.herd } : p))
    const won = checkWin(result.herd)

    set({
      players: newPlayers,
      mainPool: result.pool,
      log: [tradeLogEntry(recipe, activePlayer.name), ...log],
      screen: won ? 'win' : get().screen,
    })
  },

  closeOverlay: () => {
    const wasSaved = get().overlay?.saved ?? false
    set({ overlay: null })
    get().showToast(wasSaved ? 'toast.herdSafe' : 'toast.herdLost')
  },

  endTurn: () => {
    const next = (get().currentPlayerIdx + 1) % get().players.length
    set({ screen: 'pass', currentPlayerIdx: next, turnTimer: 60, hasRolledThisTurn: false, diceResult: null })
  },
  confirmPass: () => set({ screen: 'board' }),

  playAgain: () => set({ screen: 'board', currentPlayerIdx: 0, hasRolledThisTurn: false, diceResult: null }),
  backToMode: () => set({ screen: 'mode' }),

  openRules: () => set({ rulesOpen: true }),
  closeRules: () => set({ rulesOpen: false }),
  setActiveTab: (t) => set({ activeTab: t }),

  showToast: (text) => {
    clearTimeout(toastTimer)
    set({ toast: text })
    toastTimer = setTimeout(() => set({ toast: null }), 2600)
  },
}))
