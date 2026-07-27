import type { Game, PlayerScore } from '../types/game'

export const WINNING_SCORE = 200

export function getPlayerTotal(game: Game, playerId: string): number {
  return game.rounds.reduce((total, round) => total + (round.scores[playerId] ?? 0), 0)
}

export function getLeaderboard(game: Game): PlayerScore[] {
  return game.players
    .map((player) => ({ player, total: getPlayerTotal(game, player.id) }))
    .sort((left, right) => right.total - left.total || left.player.name.localeCompare(right.player.name))
}

export function shouldFinishGame(game: Game): boolean {
  return getLeaderboard(game).some(({ total }) => total >= WINNING_SCORE)
}

export function getWinnerIds(game: Game): string[] {
  if (!shouldFinishGame(game)) return []

  const leaderboard = getLeaderboard(game)
  const highestScore = leaderboard[0]?.total
  return leaderboard.filter(({ total }) => total === highestScore).map(({ player }) => player.id)
}

export function getRunningTotals(game: Game, playerId: string): number[] {
  let total = 0
  return game.rounds.map((round) => {
    total += round.scores[playerId] ?? 0
    return total
  })
}
