import type { Game, Player } from '../types/game'

const ACTIVE_GAME_KEY = 'flip7-companion.active-game'
const HISTORY_KEY = 'flip7-companion.game-history'
const PLAYERS_KEY = 'flip7-companion.players'

function read<T>(key: string, fallback: T): T {
  const raw = window.localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export const storage = {
  loadActiveGame: () => read<Game | null>(ACTIVE_GAME_KEY, null),
  saveActiveGame: (game: Game) => window.localStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify(game)),
  clearActiveGame: () => window.localStorage.removeItem(ACTIVE_GAME_KEY),
  loadHistory: () => read<Game[]>(HISTORY_KEY, []),
  saveHistory: (games: Game[]) => window.localStorage.setItem(HISTORY_KEY, JSON.stringify(games)),
  loadPlayers: () => read<Player[]>(PLAYERS_KEY, []),
  savePlayers: (players: Player[]) => window.localStorage.setItem(PLAYERS_KEY, JSON.stringify(players))
}
