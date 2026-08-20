import { joinRoom, selfId } from 'trystero'
import type { Room } from 'trystero'

const APP_ID = 'hodowca-game'

export const myPeerId: string = selfId

export function openRoom(roomCode: string): Room {
  return joinRoom({ appId: APP_ID }, roomCode)
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRoomCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  return code
}

export type { Room }
