import { create } from 'zustand'
import { AVATARS, NAME_POOL, makeHerd, HERD_EMOJI, PREDATOR_EMOJI, type Herd } from './animals'
import i18n from '../i18n'
import {
  playTurn,
  applyTrade,
  checkWin,
  isPredator,
  TRADE_RECIPES,
  MAX_TRADES_PER_TURN,
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
  timerEnabled: boolean
}

interface GameActionPayload {
  type: 'roll' | 'trade' | 'endTurn'
  recipeId?: string
}

interface GameStateSnapshot {
  players: Player[]
  hostPeerId: string
  mainPool: Herd
  log: LogEntry[]
  currentPlayerIdx: number
  diceResult: { a: string; b: string } | null
  overlay: PredatorOverlay | null
  hasRolledThisTurn: boolean
  tradesThisTurn: number
  timerEnabled: boolean
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
  tradesThisTurn: number

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
  addBotPlayer: () => void
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

/** A fresh, collision-free id for a player being appended to an existing (possibly already
 * trimmed-down, e.g. after a removal) roster — using array length here would risk reusing an id
 * still held by another player. */
/** Whether it's the local human's turn to act right now — false for a bot's turn (even one this
 * browser is host-driving) and, in online mode, false for any other connected player's turn. Shared
 * by BoardScreen (button gating), useTurnTimer, and EventOverlay (only the active player should be
 * forced to click a predator-event modal closed; bystanders just see it and it clears on its own). */
export function isLocalHumanTurn(s: GameState): boolean {
  const active = s.players[s.currentPlayerIdx]
  if (!active || active.isBot) return false
  if (s.mode === 'online') return active.peerId === myPeerId
  return true
}

function nextPlayerId(players: Player[]): number {
  return players.reduce((max, p) => Math.max(max, p.id), -1) + 1
}

/** Shared-game-progress fields to reset whenever a fresh game is being configured (mode select,
 * hosting, or joining) — without this, leaving a game via backToMode and starting another one in
 * the same session would inherit the previous game's depleted pool, log, and turn state instead of
 * starting clean (the only way to get a truly fresh state used to be reloading the page). */
function freshGameProgress() {
  return {
    mainPool: makeHerd([54, 22, 18, 14, 9, 4, 2]),
    log: [] as LogEntry[],
    currentPlayerIdx: 0,
    diceRolling: false,
    diceResult: null as { a: string; b: string } | null,
    overlay: null as PredatorOverlay | null,
    hasRolledThisTurn: false,
    tradesThisTurn: 0,
    turnTimer: 60,
  }
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
    hostPeerId: s.hostPeerId ?? myPeerId,
    mainPool: s.mainPool,
    log: s.log,
    currentPlayerIdx: s.currentPlayerIdx,
    diceResult: s.diceResult,
    overlay: s.overlay,
    hasRolledThisTurn: s.hasRolledThisTurn,
    tradesThisTurn: s.tradesThisTurn,
    timerEnabled: s.timerEnabled,
    screen: s.screen,
  }
}

/** Removes a departed player and keeps currentPlayerIdx pointing at a valid player,
 * advancing the turn if it was the departed player's turn. */
export function removePlayerAndFixTurn(
  players: Player[],
  currentPlayerIdx: number,
  leftPeerId: string,
): { players: Player[]; currentPlayerIdx: number; wasCurrentTurn: boolean } {
  const leftIdx = players.findIndex((p) => p.peerId === leftPeerId)
  if (leftIdx === -1) {
    return { players, currentPlayerIdx, wasCurrentTurn: false }
  }
  const newPlayers = players.filter((p) => p.peerId !== leftPeerId)
  if (newPlayers.length === 0) {
    return { players: newPlayers, currentPlayerIdx: 0, wasCurrentTurn: leftIdx === currentPlayerIdx }
  }
  let newIdx = currentPlayerIdx
  if (leftIdx < currentPlayerIdx) newIdx -= 1
  else if (leftIdx === currentPlayerIdx) newIdx = currentPlayerIdx
  newIdx = ((newIdx % newPlayers.length) + newPlayers.length) % newPlayers.length
  return { players: newPlayers, currentPlayerIdx: newIdx, wasCurrentTurn: leftIdx === currentPlayerIdx }
}

/** Deterministic pick of who takes over as host among the remaining players — lowest player id wins,
 * so every peer computes the same winner independently without negotiation. */
export function electNewHost(players: Player[]): Player | null {
  const candidates = players.filter((p) => p.peerId).sort((a, b) => a.id - b.id)
  return candidates[0] ?? null
}

function createNetActions(room: Room): NetContext {
  const joinAction = room.makeAction('join') as unknown as NetAction<JoinPayload>
  const lobbyAction = room.makeAction('lobby') as unknown as NetAction<LobbySnapshot>
  const actAction = room.makeAction('act') as unknown as NetAction<GameActionPayload>
  const syncAction = room.makeAction('sync') as unknown as NetAction<GameStateSnapshot>
  return { room, joinAction, lobbyAction, actAction, syncAction }
}

/** Sends the host's authoritative lobby state (roster + shared settings like the turn timer) to
 * every guest — the timer toggle in particular must be a single shared setting the host decides,
 * not something each guest can silently flip only for themselves. */
function sendLobbySnapshot(get: () => GameState, players: Player[]) {
  const s = get()
  netCtx?.lobbyAction.send({ players, hostPeerId: myPeerId, timerEnabled: s.timerEnabled })
}

/** Wires up the host-only message handlers (join requests, action requests from guests) on the
 * current netCtx. Used both when first hosting and when a guest is promoted after host failover. */
function attachHostHandlers(get: () => GameState, set: (partial: Partial<GameState>) => void) {
  if (!netCtx) return
  const { joinAction, actAction } = netCtx

  const broadcastLobby = () => sendLobbySnapshot(get, get().players)

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
            id: nextPlayerId(s.players),
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
}

function promoteSelfToHost(get: () => GameState, set: (partial: Partial<GameState>) => void, leftHostPeerId: string) {
  attachHostHandlers(get, set)
  const s = get()
  const { players, currentPlayerIdx, wasCurrentTurn } = removePlayerAndFixTurn(s.players, s.currentPlayerIdx, leftHostPeerId)
  set({
    netRole: 'host',
    hostPeerId: myPeerId,
    players,
    currentPlayerIdx,
    hasRolledThisTurn: wasCurrentTurn ? false : s.hasRolledThisTurn,
    tradesThisTurn: wasCurrentTurn ? 0 : s.tradesThisTurn,
    diceResult: wasCurrentTurn ? null : s.diceResult,
  })
  get().showToast('toast.becameHost')
  broadcastState(get())
}

/** Shared onPeerLeave handler for both host and guests — detects a departed player, and if it was
 * the host, deterministically elects a replacement (host failover, M4). */
function handlePeerLeave(get: () => GameState, set: (partial: Partial<GameState>) => void, peerId: string) {
  const s = get()
  const left = s.players.find((p) => p.peerId === peerId)
  if (!left) return

  if (s.screen === 'lobby') {
    if (s.netRole !== 'host') return
    const players = s.players.filter((p) => p.peerId !== peerId)
    set({ players })
    sendLobbySnapshot(get, players)
    return
  }

  const wasHost = s.hostPeerId === peerId

  if (wasHost) {
    const remaining = s.players.filter((p) => p.peerId !== peerId)
    const newHost = electNewHost(remaining)
    if (!newHost) {
      set({ players: remaining })
      get().showToast('toast.gameStalled')
      return
    }
    if (newHost.peerId === myPeerId) {
      promoteSelfToHost(get, set, peerId)
    } else {
      set({ players: remaining, hostPeerId: newHost.peerId })
    }
    return
  }

  if (s.netRole !== 'host') {
    set({ players: s.players.filter((p) => p.peerId !== peerId) })
    return
  }
  const { players, currentPlayerIdx, wasCurrentTurn } = removePlayerAndFixTurn(s.players, s.currentPlayerIdx, peerId)
  set({
    players,
    currentPlayerIdx,
    hasRolledThisTurn: wasCurrentTurn ? false : s.hasRolledThisTurn,
    tradesThisTurn: wasCurrentTurn ? 0 : s.tradesThisTurn,
    diceResult: wasCurrentTurn ? null : s.diceResult,
    log: [{ text: i18n.t('board.log.playerLeft', { player: left.name }), danger: true }, ...s.log],
  })
  broadcastState(get())
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
  mainPool: makeHerd([54, 22, 18, 14, 9, 4, 2]),
  log: [],
  toast: null,
  overlay: null,
  rulesOpen: false,
  turnTimer: 60,
  pickingAvatarFor: null,
  hasRolledThisTurn: false,
  tradesThisTurn: 0,

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
    set({ mode, screen: 'lobby', players, ...freshGameProgress() })
  },

  addPlayer: () => {
    const players = get().players
    if (players.length >= 6) return
    const id = nextPlayerId(players)
    set({
      players: [
        ...players,
        {
          id,
          name: NAME_POOL[id] ?? `Gracz ${id + 1}`,
          avatar: AVATARS[id % AVATARS.length],
          isBot: false,
          herd: makeHerd([6, 3, 1, 1, 0, 0, 0]),
        },
      ],
    })
  },

  addBotPlayer: () => {
    const s = get()
    if (s.players.length >= 6) return
    if (s.mode === 'online' && s.netRole !== 'host') return
    const botNumber = s.players.filter((p) => p.isBot).length + 1
    const id = nextPlayerId(s.players)
    const bot: Player = {
      id,
      name: `Bot ${botNumber}`,
      avatar: AVATARS[id % AVATARS.length],
      isBot: true,
      herd: makeHerd([6, 3, 1, 1, 0, 0, 0]),
    }
    const players = [...s.players, bot]
    set({ players })
    if (s.mode === 'online' && s.netRole === 'host') {
      sendLobbySnapshot(get, players)
    }
  },

  removePlayer: (id) => {
    const s = get()
    const players = s.players.filter((p) => p.id !== id)
    set({ players })
    if (s.mode === 'online' && s.netRole === 'host') {
      sendLobbySnapshot(get, players)
    }
  },

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
  toggleTimer: () => {
    const s = get()
    if (s.mode === 'online' && s.netRole !== 'host') return
    const timerEnabled = !s.timerEnabled
    set({ timerEnabled })
    if (s.mode === 'online' && s.netRole === 'host') sendLobbySnapshot(get, s.players)
  },

  startGame: () => {
    const s = get()
    if (s.netRole === 'guest') return
    set({ screen: 'board', currentPlayerIdx: 0, hasRolledThisTurn: false, tradesThisTurn: 0, diceResult: null })
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
    if (s.tradesThisTurn >= MAX_TRADES_PER_TURN) return
    const recipe = TRADE_RECIPES.find((r) => r.id === recipeId)
    if (!recipe) return
    const { players, currentPlayerIdx, mainPool, log, tradesThisTurn } = get()
    const activePlayer = players[currentPlayerIdx]
    const result = applyTrade(activePlayer.herd, mainPool, recipe)
    if (!result) return

    const newPlayers = players.map((p, i) => (i === currentPlayerIdx ? { ...p, herd: result.herd } : p))
    const won = checkWin(result.herd)

    set({
      players: newPlayers,
      mainPool: result.pool,
      log: [tradeLogEntry(recipe, activePlayer.name), ...log],
      tradesThisTurn: tradesThisTurn + 1,
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
    const nextIsBot = !!s.players[next]?.isBot
    const nextScreen: Screen = s.mode === 'online' || s.mode === 'bots' || nextIsBot ? 'board' : 'pass'
    set({ screen: nextScreen, currentPlayerIdx: next, turnTimer: 60, hasRolledThisTurn: false, tradesThisTurn: 0, diceResult: null })
    if (get().netRole === 'host') broadcastState(get())
  },
  confirmPass: () => set({ screen: 'board' }),

  playAgain: () => {
    const s = get()
    if (s.netRole === 'guest') return
    set({ screen: 'board', currentPlayerIdx: 0, hasRolledThisTurn: false, tradesThisTurn: 0, diceResult: null })
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

    netCtx = createNetActions(room)
    attachHostHandlers(get, set)
    room.onPeerLeave = (peerId) => handlePeerLeave(get, set, peerId)

    set({
      mode: 'online',
      netRole: 'host',
      hostPeerId: myPeerId,
      roomCode: code,
      players: [hostPlayer],
      screen: 'lobby',
      ...freshGameProgress(),
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
    set({ connecting: true, joinError: null, ...freshGameProgress() })

    const room = openRoom(code)
    netCtx = createNetActions(room)
    const { joinAction, lobbyAction, syncAction } = netCtx

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
        timerEnabled: data.timerEnabled,
        connecting: false,
        joinError: null,
        screen: s.screen === 'join' || s.screen === 'online-choice' ? 'lobby' : s.screen,
      })
    }

    syncAction.onMessage = (data) => {
      set({
        players: data.players,
        hostPeerId: data.hostPeerId,
        mainPool: data.mainPool,
        log: data.log,
        currentPlayerIdx: data.currentPlayerIdx,
        diceResult: data.diceResult,
        overlay: data.overlay,
        hasRolledThisTurn: data.hasRolledThisTurn,
        tradesThisTurn: data.tradesThisTurn,
        timerEnabled: data.timerEnabled,
        screen: data.screen,
        diceRolling: false,
      })
    }

    room.onPeerJoin = () => {
      if (get().netRole === 'guest') joinAction.send({ name, avatar })
    }

    room.onPeerLeave = (peerId) => handlePeerLeave(get, set, peerId)

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
