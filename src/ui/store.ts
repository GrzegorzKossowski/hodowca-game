import { create } from 'zustand'
import { AVATARS, NAME_POOL, makeHerd, type Herd } from './animals'

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
  simulatePredator: () => void
  closeOverlay: () => void
  endTurn: () => void
  confirmPass: () => void
  simulateWin: () => void
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
  log: [
    { text: 'Ania rzuciła 2 świnie i otrzymała 1 świnię ze stada.', danger: false },
    { text: 'Uwaga! Marek wyrzucił lisa i stracił 3 króliki.', danger: true },
    { text: 'Zosia wymieniła 6 królików na 1 owcę.', danger: false },
  ],
  toast: null,
  overlay: null,
  rulesOpen: false,
  turnTimer: 60,
  pickingAvatarFor: null,

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

  startGame: () => set({ screen: 'board', currentPlayerIdx: 0 }),

  rollDice: () => {
    if (get().diceRolling) return
    set({ diceRolling: true, diceResult: null })
    setTimeout(() => {
      const faceSet = ['🐰', '🐑', '🐷', '🐄', '🐴', '🦊', '🐺']
      const a = faceSet[Math.floor(Math.random() * 5)]
      const b = faceSet[Math.floor(Math.random() * faceSet.length)]
      set({ diceRolling: false, diceResult: { a, b } })
    }, 900)
  },

  simulatePredator: () => {
    const isFox = Math.random() > 0.5
    const saved = Math.random() > 0.5
    set({
      overlay: saved
        ? {
            emoji: isFox ? '🦊' : '🐺',
            saved: true,
            title: isFox ? 'overlay.foxSaved' : 'overlay.wolfSaved',
            text: isFox ? 'overlay.foxSavedText' : 'overlay.wolfSavedText',
          }
        : {
            emoji: isFox ? '🦊' : '🐺',
            saved: false,
            title: isFox ? 'overlay.foxAttack' : 'overlay.wolfAttack',
            text: isFox ? 'overlay.foxAttackText' : 'overlay.wolfAttackText',
          },
    })
  },

  closeOverlay: () => {
    const wasSaved = get().overlay?.saved ?? false
    set({ overlay: null })
    get().showToast(wasSaved ? 'toast.herdSafe' : 'toast.herdLost')
  },

  endTurn: () => {
    const next = (get().currentPlayerIdx + 1) % get().players.length
    set({ screen: 'pass', currentPlayerIdx: next, turnTimer: 60 })
  },
  confirmPass: () => set({ screen: 'board' }),

  simulateWin: () => set({ screen: 'win' }),
  playAgain: () => set({ screen: 'board', currentPlayerIdx: 0 }),
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
