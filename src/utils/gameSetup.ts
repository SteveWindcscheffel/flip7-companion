import type { Game, Player } from '../types/game'
import { nextAccent } from './playerAccents'

export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 10

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

  if (values.length > MAX_PLAYERS) {
    trimmedValues.forEach((value, index) => {
      if (value && index >= MAX_PLAYERS && !errors[index]) {
        errors[index] = `Only the first ${MAX_PLAYERS} players can be seated.`
      }
    })
  }

  return { values, errors }
}

export function createActiveGame(names: string[]): Game {
  const trimmed = names.map((name) => name.trim()).filter(Boolean).slice(0, MAX_PLAYERS)
  const players: Player[] = trimmed.reduce<Player[]>((acc, name, index) => {
    acc.push({
      id: `player-${index + 1}`,
      name,
      accent: nextAccent(acc.map((player) => player.accent))
    })
    return acc
  }, [])

  return {
    id: `game-${Date.now()}`,
    createdAt: new Date().toISOString(),
    players,
    rounds: [],
    status: 'active',
    winnerIds: []
  }
}
