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
import { openRoom, generateRoomCode, myPeerId } from '../net/room'
import type { Room } from '../net/room'

export type Screen = 'mode' | 'online-choice' | 'join' | 'lobby' | 'board' | 'pass' | 'win'
export type Mode = 'hotseat' | 'online' | 'bots' | null
export type Tab = 'herd' | 'trade' | 'rivals' | 'log'
export type NetRole = 'none' | 'host' | 'guest'

export interface Player {
  id: number
  peerId?: string
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

interface JoinPayload {
  name: string
  avatar: string
}

interface LobbySnapshot {
  players: Player[]
  hostPeerId: string
}

interface GameActionPayload {
  type: 'roll' | 'trade' | 'endTurn'
  recipeId?: string
}

interface GameStateSnapshot {
  players: Player[]
  mainPool: Herd
  log: LogEntry[]
  currentPlayerIdx: number
  diceResult: { a: string; b: string } | null
  overlay: PredatorOverlay | null
  hasRolledThisTurn: boolean
  screen: Screen
}

interface NetAction<T> {
  send: (data: T) => Promise<void>
  onMessage: ((data: T, context: { peerId: string }) => void) | null
}

interface NetContext {
  room: Room
  joinAction: NetAction<JoinPayload>
  lobbyAction: NetAction<LobbySnapshot>
  actAction: NetAction<GameActionPayload>
  syncAction: NetAction<GameStateSnapshot>
}

let netCtx: NetContext | null = null

interface GameState {
  screen: Screen
  mode: Mode
  numBots: number
  botAggro: number
  timerEnabled: boolean
  roomCode: string
  players: Player[]
  soloPlayerName: string
  soloPlayerAvatar: string
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

  netRole: NetRole
  hostPeerId: string | null
  connecting: boolean
  joinError: string | null
  onlineName: string
  onlineAvatar: string
  joinCode: string

  setIsDesktop: (v: boolean) => void
  selectMode: (mode: 'hotseat' | 'bots') => void
  addPlayer: () => void
  removePlayer: (id: number) => void
  toggleAvatarPicker: (id: number) => void
  selectAvatar: (id: number, avatar: string) => void
  renamePlayer: (id: number, name: string) => void
  incBots: () => void
  decBots: () => void
  setBotAggro: (v: number) => void
  setSoloPlayerName: (v: string) => void
  setSoloPlayerAvatar: (v: string) => void
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

  goOnlineChoice: () => void
  setOnlineName: (v: string) => void
  setOnlineAvatar: (v: string) => void
  hostOnlineGame: () => void
  goJoinScreen: () => void
  setJoinCode: (v: string) => void
  joinOnlineGame: () => void
  leaveOnlineGame: () => void
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

function snapshotOf(s: GameState): GameStateSnapshot {
  return {
    players: s.players,
    mainPool: s.mainPool,
    log: s.log,
    currentPlayerIdx: s.currentPlayerIdx,
    diceResult: s.diceResult,
    overlay: s.overlay,
    hasRolledThisTurn: s.hasRolledThisTurn,
    screen: s.screen,
  }
}

function broadcastState(s: GameState) {
  netCtx?.syncAction.send(snapshotOf(s))
}

let toastTimer: ReturnType<typeof setTimeout> | undefined

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'mode',
  mode: null,
  numBots: 2,
  botAggro: 1,
  timerEnabled: true,
  roomCode: '',
  players: [],
  soloPlayerName: 'Ty',
  soloPlayerAvatar: AVATARS[0],
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

  netRole: 'none',
  hostPeerId: null,
  connecting: false,
  joinError: null,
  onlineName: '',
  onlineAvatar: AVATARS[0],
  joinCode: '',

  setIsDesktop: (v) => set({ isDesktop: v }),

  selectMode: (mode) => {
    const numBots = get().numBots
    const n = mode === 'hotseat' ? 3 : 1 + numBots
    const botCount = mode === 'bots' ? numBots : 0
    const players = buildPlayers(n, botCount)
    if (mode === 'bots' && players[0]) players[0] = { ...players[0], name: get().soloPlayerName, avatar: get().soloPlayerAvatar }
    set({ mode, screen: 'lobby', players })
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
    const players = buildPlayers(1 + numBots, numBots)
    if (players[0]) players[0] = { ...players[0], name: get().soloPlayerName, avatar: get().soloPlayerAvatar }
    set({ numBots, players })
  },
  decBots: () => {
    const numBots = Math.max(1, get().numBots - 1)
    const players = buildPlayers(1 + numBots, numBots)
    if (players[0]) players[0] = { ...players[0], name: get().soloPlayerName, avatar: get().soloPlayerAvatar }
    set({ numBots, players })
  },
  setBotAggro: (v) => set({ botAggro: v }),
  setSoloPlayerName: (v) => set({ soloPlayerName: v }),
  setSoloPlayerAvatar: (v) => set({ soloPlayerAvatar: v }),
  toggleTimer: () => set({ timerEnabled: !get().timerEnabled }),

  startGame: () => {
    const s = get()
    if (s.netRole === 'guest') return
    set({ screen: 'board', currentPlayerIdx: 0, hasRolledThisTurn: false, diceResult: null })
    if (s.netRole === 'host') broadcastState(get())
  },

  rollDice: () => {
    const s = get()
    if (s.diceRolling || s.hasRolledThisTurn) return
    if (s.netRole === 'guest') {
      const me = s.players[s.currentPlayerIdx]
      if (!me || me.peerId !== myPeerId) return
      set({ diceRolling: true })
      netCtx?.actAction.send({ type: 'roll' })
      return
    }
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
      if (get().netRole === 'host') broadcastState(get())
    }, 900)
  },

  makeTrade: (recipeId) => {
    const s = get()
    if (s.netRole === 'guest') {
      const me = s.players[s.currentPlayerIdx]
      if (!me || me.peerId !== myPeerId) return
      netCtx?.actAction.send({ type: 'trade', recipeId })
      return
    }
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
    if (get().netRole === 'host') broadcastState(get())
  },

  closeOverlay: () => {
    const wasSaved = get().overlay?.saved ?? false
    set({ overlay: null })
    get().showToast(wasSaved ? 'toast.herdSafe' : 'toast.herdLost')
  },

  endTurn: () => {
    const s = get()
    if (s.netRole === 'guest') {
      const me = s.players[s.currentPlayerIdx]
      if (!me || me.peerId !== myPeerId) return
      netCtx?.actAction.send({ type: 'endTurn' })
      return
    }
    const next = (s.currentPlayerIdx + 1) % s.players.length
    const nextScreen: Screen = s.mode === 'online' ? 'board' : 'pass'
    set({ screen: nextScreen, currentPlayerIdx: next, turnTimer: 60, hasRolledThisTurn: false, diceResult: null })
    if (get().netRole === 'host') broadcastState(get())
  },
  confirmPass: () => set({ screen: 'board' }),

  playAgain: () => {
    const s = get()
    if (s.netRole === 'guest') return
    set({ screen: 'board', currentPlayerIdx: 0, hasRolledThisTurn: false, diceResult: null })
    if (get().netRole === 'host') broadcastState(get())
  },

  backToMode: () => {
    if (get().netRole !== 'none') {
      get().leaveOnlineGame()
      return
    }
    set({ screen: 'mode', mode: null })
  },

  openRules: () => set({ rulesOpen: true }),
  closeRules: () => set({ rulesOpen: false }),
  setActiveTab: (t) => set({ activeTab: t }),

  showToast: (text) => {
    clearTimeout(toastTimer)
    set({ toast: text })
    toastTimer = setTimeout(() => set({ toast: null }), 2600)
  },

  goOnlineChoice: () => set({ screen: 'online-choice' }),
  setOnlineName: (v) => set({ onlineName: v }),
  setOnlineAvatar: (v) => set({ onlineAvatar: v }),

  hostOnlineGame: () => {
    const code = generateRoomCode()
    const room = openRoom(code)
    const name = get().onlineName.trim() || (NAME_POOL[0] ?? 'Gracz 1')
    const avatar = get().onlineAvatar
    const hostPlayer: Player = {
      id: 0,
      peerId: myPeerId,
      name,
      avatar,
      isBot: false,
      herd: makeHerd([4, 2, 1, 0, 0, 1, 0]),
    }

    const joinAction = room.makeAction('join') as unknown as NetAction<JoinPayload>
    const lobbyAction = room.makeAction('lobby') as unknown as NetAction<LobbySnapshot>
    const actAction = room.makeAction('act') as unknown as NetAction<GameActionPayload>
    const syncAction = room.makeAction('sync') as unknown as NetAction<GameStateSnapshot>
    netCtx = { room, joinAction, lobbyAction, actAction, syncAction }

    const broadcastLobby = () => {
      const s = get()
      lobbyAction.send({ players: s.players, hostPeerId: myPeerId })
    }

    joinAction.onMessage = (data, ctx) => {
      const s = get()
      const existing = s.players.find((p) => p.peerId === ctx.peerId)
      if (existing) {
        set({ players: s.players.map((p) => (p.peerId === ctx.peerId ? { ...p, name: data.name, avatar: data.avatar } : p)) })
      } else {
        if (s.players.length >= 6) return
        set({
          players: [
            ...s.players,
            {
              id: s.players.length,
              peerId: ctx.peerId,
              name: data.name,
              avatar: data.avatar,
              isBot: false,
              herd: makeHerd([6, 3, 1, 1, 0, 0, 0]),
            },
          ],
        })
      }
      broadcastLobby()
    }

    actAction.onMessage = (data, ctx) => {
      const s = get()
      const activePlayer = s.players[s.currentPlayerIdx]
      if (!activePlayer || activePlayer.peerId !== ctx.peerId) return
      if (data.type === 'roll') get().rollDice()
      else if (data.type === 'trade' && data.recipeId) get().makeTrade(data.recipeId)
      else if (data.type === 'endTurn') get().endTurn()
    }

    room.onPeerLeave = (peerId) => {
      const s = get()
      if (s.screen !== 'lobby') return
      if (!s.players.some((p) => p.peerId === peerId)) return
      set({ players: s.players.filter((p) => p.peerId !== peerId) })
      broadcastLobby()
    }

    set({
      mode: 'online',
      netRole: 'host',
      hostPeerId: myPeerId,
      roomCode: code,
      players: [hostPlayer],
      screen: 'lobby',
    })
  },

  goJoinScreen: () => set({ screen: 'join', joinError: null }),
  setJoinCode: (v) => set({ joinCode: v.toUpperCase() }),

  joinOnlineGame: () => {
    const code = get().joinCode.trim().toUpperCase()
    if (code.length < 4) {
      set({ joinError: 'join.errorCode' })
      return
    }
    const name = get().onlineName.trim() || 'Gracz'
    const avatar = get().onlineAvatar
    set({ connecting: true, joinError: null })

    const room = openRoom(code)
    const joinAction = room.makeAction('join') as unknown as NetAction<JoinPayload>
    const lobbyAction = room.makeAction('lobby') as unknown as NetAction<LobbySnapshot>
    const actAction = room.makeAction('act') as unknown as NetAction<GameActionPayload>
    const syncAction = room.makeAction('sync') as unknown as NetAction<GameStateSnapshot>
    netCtx = { room, joinAction, lobbyAction, actAction, syncAction }

    let gotLobby = false
    const timeout = setTimeout(() => {
      if (!gotLobby) {
        set({ connecting: false, joinError: 'join.errorTimeout' })
        netCtx?.room.leave()
        netCtx = null
      }
    }, 12000)

    lobbyAction.onMessage = (data) => {
      gotLobby = true
      clearTimeout(timeout)
      const s = get()
      set({
        players: data.players,
        hostPeerId: data.hostPeerId,
        connecting: false,
        joinError: null,
        screen: s.screen === 'join' || s.screen === 'online-choice' ? 'lobby' : s.screen,
      })
    }

    syncAction.onMessage = (data) => {
      set({
        players: data.players,
        mainPool: data.mainPool,
        log: data.log,
        currentPlayerIdx: data.currentPlayerIdx,
        diceResult: data.diceResult,
        overlay: data.overlay,
        hasRolledThisTurn: data.hasRolledThisTurn,
        screen: data.screen,
        diceRolling: false,
      })
    }

    room.onPeerJoin = () => {
      joinAction.send({ name, avatar })
    }

    set({ mode: 'online', netRole: 'guest', roomCode: code })
    joinAction.send({ name, avatar })
  },

  leaveOnlineGame: () => {
    netCtx?.room.leave()
    netCtx = null
    set({
      netRole: 'none',
      hostPeerId: null,
      connecting: false,
      joinError: null,
      joinCode: '',
      mode: null,
      screen: 'mode',
      players: [],
      roomCode: '',
    })
  },
}))
