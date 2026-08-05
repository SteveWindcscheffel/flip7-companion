import type { Game, Player } from '../types/game'
import { PLAYER_ACCENT_ORDER } from './playerAccents'

export function validatePlayerNames(rawNames: string[]) {
  const trimmedValues = rawNames.map((name) => name.trim())
  const values = trimmedValues.filter(Boolean)
  const errors: Record<number, string> = {}
  const seenNames = new Set<string>()

  trimmedValues.forEach((value, index) => {
    if (!value) {
      errors[index] = 'Please enter a player name.'
      return
    }

    if (seenNames.has(value.toLowerCase())) {
      errors[index] = 'Player names must be unique.'
      return
    }

    seenNames.add(value.toLowerCase())
  })

  return { values, errors }
}

export function createActiveGame(names: string[]): Game {
  const trimmed = names.map((name) => name.trim()).filter(Boolean)
  const players: Player[] = trimmed.map((name, index) => ({
    id: `player-${index + 1}`,
    name,
    accent: PLAYER_ACCENT_ORDER[index % PLAYER_ACCENT_ORDER.length]
  }))

  return {
    id: `game-${Date.now()}`,
    createdAt: new Date().toISOString(),
    players,
    rounds: [],
    status: 'active',
    winnerIds: []
  }
}
