import type { Game, Player, PlayerScore, Round } from '../types/game'

export const WINNING_SCORE = 200

export interface RoundSummary {
  round: Round
  score: number
  runningTotal: number
}

export function getPlayerTotal(game: Game, playerId: string): number {
  return game.rounds.reduce((total, round) => total + (round.scores[playerId] ?? 0), 0)
}

export function getLeaderboard(game: Game): PlayerScore[] {
  return game.players
    .map((player) => ({ player, total: getPlayerTotal(game, player.id) }))
    .sort((left, right) => right.total - left.total || left.player.name.localeCompare(right.player.name))
}

export function getLiveStandings(game: Game, draftScores: Record<string, string>): PlayerScore[] {
  return game.players
    .map((player) => {
      const savedTotal = getPlayerTotal(game, player.id)
      const rawDraftValue = draftScores[player.id] ?? ''
      const parsedValue = rawDraftValue.trim() === '' ? 0 : Number.parseInt(rawDraftValue, 10)
      const draftTotal = Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0

      return { player, total: savedTotal + draftTotal }
    })
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

export function getRecentRoundSummaries(game: Game, playerId: string, count = 5): RoundSummary[] {
  const runningTotals = getRunningTotals(game, playerId)
  const startIndex = Math.max(0, game.rounds.length - count)

  return game.rounds.slice(startIndex).map((round, index) => ({
    round,
    score: round.scores[playerId] ?? 0,
    runningTotal: runningTotals[startIndex + index] ?? 0
  }))
}

export function buildRound(game: Game, scores: Record<string, number>): Round {
  return {
    id: `round-${game.rounds.length + 1}`,
    number: game.rounds.length + 1,
    scores,
    createdAt: new Date().toISOString()
  }
}

function normalizePlayerName(name: string): string {
  return name.trim().toLowerCase()
}

function isSamePlayer(left: Player, right: Player): boolean {
  return left.id === right.id || normalizePlayerName(left.name) === normalizePlayerName(right.name)
}

function getGamePlayer(game: Game, playerId: string): Player | undefined {
  return game.players.find((entry) => entry.id === playerId || normalizePlayerName(entry.name) === normalizePlayerName(playerId))
}

export interface PlayerStats {
  player: Player
  gamesPlayed: number
  gamesWon: number
  winRate: number
  highestRoundScore: number
  bustCount: number
  averageRoundScore: number
  highestFinalScore: number
  fastestWinRounds: number | null
  totalPointsScored: number
  games: Game[]
}

export interface HallOfFameEntry {
  title: string
  entries: Array<{ player: Player; value: number | string; game?: Game }>
}

export function getPlayerStatistics(history: Game[]): PlayerStats[] {
  const groupedPlayers = new Map<string, { player: Player; games: Game[] }>()

  const getOrCreate = (player: Player) => {
    const existingEntry = Array.from(groupedPlayers.values()).find((entry) => isSamePlayer(entry.player, player))
    if (existingEntry) {
      return existingEntry
    }

    const key = `${normalizePlayerName(player.name)}:${player.id}`
    const nextEntry = { player, games: [] as Game[] }
    groupedPlayers.set(key, nextEntry)
    return nextEntry
  }

  history.forEach((game) => {
    const completedGame = game.status === 'complete' ? game : null
    game.players.forEach((player) => {
      const entry = getOrCreate(player)
      if (!entry.games.some((candidate) => candidate.id === game.id)) {
        entry.games.push(game)
      }
    })

    if (!completedGame) {
      return
    }

    completedGame.players.forEach((player) => {
      const entry = getOrCreate(player)
      if (!entry.games.some((candidate) => candidate.id === completedGame.id)) {
        entry.games.push(completedGame)
      }
    })
  })

  return Array.from(groupedPlayers.values())
    .map(({ player, games }) => {
      const completedGames = games.filter((game) => game.status === 'complete')
      const records = completedGames.map((game) => {
        const gamePlayer = game.players.find((entry) => isSamePlayer(entry, player))
        const playerId = gamePlayer?.id ?? player.id
        const winner = game.winnerIds.includes(playerId)
        const finalTotal = getPlayerTotal(game, playerId)
        const roundScores = game.rounds.map((round) => round.scores[playerId] ?? 0)
        const highestRoundScore = roundScores.reduce((max, score) => Math.max(max, score), 0)
        const bustCount = roundScores.filter((score) => score === 0).length
        const roundTotal = roundScores.reduce((sum, score) => sum + score, 0)
        const averageRoundScore = roundScores.length > 0 ? roundTotal / roundScores.length : 0
        const fastestWinRounds = winner ? game.rounds.length : null
        return { winner, finalTotal, highestRoundScore, bustCount, averageRoundScore, fastestWinRounds }
      })

      const gamesPlayed = completedGames.length
      const gamesWon = records.filter((entry) => entry.winner).length
      const winRate = gamesPlayed > 0 ? gamesWon / gamesPlayed : 0
      const highestRoundScore = records.reduce((max, entry) => Math.max(max, entry.highestRoundScore), 0)
      const bustCount = records.reduce((sum, entry) => sum + entry.bustCount, 0)
      const averageRoundScore = records.length > 0 ? records.reduce((sum, entry) => sum + entry.averageRoundScore, 0) / records.length : 0
      const highestFinalScore = records.reduce((max, entry) => Math.max(max, entry.finalTotal), 0)
      const fastestWinRounds = records.filter((entry) => entry.fastestWinRounds !== null).length > 0
        ? Math.min(...records.filter((entry) => entry.fastestWinRounds !== null).map((entry) => entry.fastestWinRounds as number))
        : null
      const totalPointsScored = records.reduce((sum, entry) => sum + entry.finalTotal, 0)

      return {
        player,
        gamesPlayed,
        gamesWon,
        winRate,
        highestRoundScore,
        bustCount,
        averageRoundScore,
        highestFinalScore,
        fastestWinRounds,
        totalPointsScored,
        games: completedGames
      }
    })
    .sort((left, right) => right.gamesWon - left.gamesWon || right.totalPointsScored - left.totalPointsScored || left.player.name.localeCompare(right.player.name))
}

function getWinningScore(game: Game): number {
  const leaderboard = getLeaderboard(game)
  return leaderboard[0]?.total ?? 0
}

function getWinningMargin(game: Game): number {
  const leaderboard = getLeaderboard(game)
  const winnerScore = leaderboard[0]?.total ?? 0
  const runnerUpScore = leaderboard[1]?.total ?? 0
  return Math.max(0, winnerScore - runnerUpScore)
}

export function getHallOfFameEntries(history: Game[]): HallOfFameEntry[] {
  const completedGames = history.filter((game) => game.status === 'complete')
  const playerStats = getPlayerStatistics(completedGames)
  const mostWins = playerStats.filter((entry) => entry.gamesWon > 0)
  const highestRound = playerStats.filter((entry) => entry.highestRoundScore > 0)
  const highestWinningScore = completedGames
    .filter((game) => game.winnerIds.length > 0)
    .flatMap((game) => game.winnerIds.map((winnerId) => ({
      player: getGamePlayer(game, winnerId) ?? game.players[0],
      value: getWinningScore(game),
      game
    })))
  const fastestWin = playerStats
    .filter((entry) => entry.fastestWinRounds !== null)
    .map((entry) => ({ player: entry.player, value: entry.fastestWinRounds ?? 0, game: entry.games.find((game) => game.winnerIds.includes(entry.player.id)) }))
  const largestMargin = completedGames
    .filter((game) => game.winnerIds.length > 0)
    .flatMap((game) => game.winnerIds.map((winnerId) => ({
      player: getGamePlayer(game, winnerId) ?? game.players[0],
      value: getWinningMargin(game),
      game
    })))
  const closestFinish = completedGames
    .filter((game) => game.winnerIds.length > 0)
    .flatMap((game) => game.winnerIds.map((winnerId) => ({
      player: getGamePlayer(game, winnerId) ?? game.players[0],
      value: getWinningMargin(game),
      game
    })))

  return [
    {
      title: 'Most wins',
      entries: mostWins
        .sort((left, right) => right.gamesWon - left.gamesWon || left.player.name.localeCompare(right.player.name))
        .slice(0, 5)
        .map((entry) => ({ player: entry.player, value: entry.gamesWon }))
    },
    {
      title: 'Highest round',
      entries: highestRound
        .sort((left, right) => right.highestRoundScore - left.highestRoundScore || left.player.name.localeCompare(right.player.name))
        .slice(0, 5)
        .map((entry) => ({ player: entry.player, value: entry.highestRoundScore }))
    },
    {
      title: 'Highest winning score',
      entries: highestWinningScore
        .sort((left, right) => (right.value as number) - (left.value as number) || left.player.name.localeCompare(right.player.name))
        .slice(0, 5)
    },
    {
      title: 'Fastest win',
      entries: fastestWin
        .sort((left, right) => (left.value as number) - (right.value as number) || left.player.name.localeCompare(right.player.name))
        .slice(0, 5)
    },
    {
      title: 'Largest winning margin',
      entries: largestMargin
        .sort((left, right) => (right.value as number) - (left.value as number) || left.player.name.localeCompare(right.player.name))
        .slice(0, 5)
    },
    {
      title: 'Closest finish',
      entries: closestFinish
        .sort((left, right) => (left.value as number) - (right.value as number) || left.player.name.localeCompare(right.player.name))
        .slice(0, 5)
    }
  ]
}
