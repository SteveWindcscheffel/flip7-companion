export interface Player {
  id: string
  name: string
  accent: PlayerAccent
}

export type PlayerAccent = 'coral' | 'violet' | 'blue' | 'green' | 'orange' | 'pink' | 'navy' | 'lime' | 'red' | 'purple'

export interface Round {
  id: string
  number: number
  scores: Record<string, number>
  createdAt: string
}

export interface Game {
  id: string
  createdAt: string
  players: Player[]
  rounds: Round[]
  status: 'active' | 'complete'
  winnerIds: string[]
  completedAt?: string
}

export interface PlayerScore {
  player: Player
  total: number
}
