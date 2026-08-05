import { describe, expect, it } from 'vitest'
import type { Game } from '../types/game'
import { buildRound, getHallOfFameEntries, getLiveStandings, getPlayerStatistics, getPlayerTotal, getRecentRoundSummaries, getWinnerIds } from './scoring'

const game: Game = {
  id: 'game-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  players: [
    { id: 'p1', name: 'Ada', accent: 'coral-red' },
    { id: 'p2', name: 'Grace', accent: 'amethyst-purple' }
  ],
  rounds: [
    { id: 'round-1', number: 1, scores: { p1: 30, p2: 20 }, createdAt: '2024-01-01T00:00:00.000Z' }
  ],
  status: 'active',
  winnerIds: []
}

describe('buildRound', () => {
  it('uses the next round number and stores the provided scores', () => {
    const round = buildRound(game, { p1: 40, p2: 15 })

    expect(round.number).toBe(2)
    expect(round.scores).toEqual({ p1: 40, p2: 15 })
  })
})

describe('getPlayerTotal', () => {
  it('totals a players score across all rounds', () => {
    expect(getPlayerTotal(game, 'p1')).toBe(30)
    expect(getPlayerTotal(game, 'p2')).toBe(20)
  })
})

describe('getRecentRoundSummaries', () => {
  it('returns cumulative running totals for each visible round', () => {
    const summaries = getRecentRoundSummaries(game, 'p1', 5)

    expect(summaries).toEqual([
      { round: game.rounds[0], score: 30, runningTotal: 30 }
    ])
  })
})

describe('getLiveStandings', () => {
  it('combines saved totals with draft scores for the current round', () => {
    const standings = getLiveStandings(game, { p1: '53', p2: '' })

    expect(standings.map(({ player, total }) => ({ player: player.id, total }))).toEqual([
      { player: 'p1', total: 83 },
      { player: 'p2', total: 20 }
    ])
  })
})

describe('getWinnerIds', () => {
  it('returns joint winners when totals tie at the winning threshold', () => {
    const completedGame: Game = {
      ...game,
      rounds: [
        { id: 'round-2', number: 2, scores: { p1: 200, p2: 200 }, createdAt: '2024-01-01T00:00:00.000Z' }
      ],
      status: 'complete'
    }

    expect(getWinnerIds(completedGame)).toEqual(['p1', 'p2'])
  })
})

describe('player statistics', () => {
  it('aggregates completed-game records and hall of fame entries across persistent identities', () => {
    const history: Game[] = [
      {
        id: 'game-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        players: [
          { id: 'player-1', name: 'Ada', accent: 'coral-red' },
          { id: 'player-2', name: 'Grace', accent: 'amethyst-purple' }
        ],
        rounds: [
          { id: 'round-1', number: 1, scores: { 'player-1': 30, 'player-2': 20 }, createdAt: '2024-01-01T00:00:00.000Z' }
        ],
        status: 'complete',
        winnerIds: ['player-1'],
        completedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'game-2',
        createdAt: '2024-01-02T00:00:00.000Z',
        players: [
          { id: 'ada-42', name: 'Ada', accent: 'coral-red' },
          { id: 'grace-99', name: 'Grace', accent: 'amethyst-purple' }
        ],
        rounds: [
          { id: 'round-1', number: 1, scores: { 'ada-42': 18, 'grace-99': 22 }, createdAt: '2024-01-02T00:00:00.000Z' },
          { id: 'round-2', number: 2, scores: { 'ada-42': 0, 'grace-99': 10 }, createdAt: '2024-01-02T00:00:00.000Z' }
        ],
        status: 'complete',
        winnerIds: ['ada-42'],
        completedAt: '2024-01-02T00:00:00.000Z'
      }
    ]

    const stats = getPlayerStatistics(history)
    const adaStats = stats.find((entry) => entry.player.name === 'Ada')
    const hallOfFame = getHallOfFameEntries(history)

    expect(adaStats).toMatchObject({
      gamesPlayed: 2,
      gamesWon: 2,
      highestRoundScore: 30,
      bustCount: 1,
      highestFinalScore: 30,
      fastestWinRounds: 1,
      totalPointsScored: 48
    })
    expect(hallOfFame[0]?.entries[0]?.player.name).toBe('Ada')
  })
})
