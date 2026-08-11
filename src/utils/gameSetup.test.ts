import { describe, expect, it } from 'vitest'
import { MAX_PLAYERS, createActiveGame, validatePlayerNames } from './gameSetup'

describe('validatePlayerNames', () => {
  it('flags blank and duplicate entries after trimming', () => {
    const result = validatePlayerNames(['Ada', '   ', 'Ada'])

    expect(result.values).toEqual(['Ada', 'Ada'])
    expect(result.errors).toEqual({
      1: 'Please enter a player name.',
      2: 'Player names must be unique.'
    })
  })

  it('rejects an 11th player beyond the table cap', () => {
    const names = Array.from({ length: 11 }, (_, index) => `Player ${index + 1}`)
    const result = validatePlayerNames(names)

    expect(result.values).toHaveLength(11)
    expect(result.errors[10]).toBe(`Only the first ${MAX_PLAYERS} players can be seated.`)
    expect(result.errors[9]).toBeUndefined()
  })
})

describe('createActiveGame', () => {
  it('creates an active game with the provided players', () => {
    const game = createActiveGame(['Ada', 'Grace'])

    expect(game.status).toBe('active')
    expect(game.players).toHaveLength(2)
    expect(game.players.map((player) => player.name)).toEqual(['Ada', 'Grace'])
    expect(game.rounds).toEqual([])
    expect(game.winnerIds).toEqual([])
  })

  it('caps the game at the first 10 players and never repeats an accent at a full table', () => {
    const names = Array.from({ length: 12 }, (_, index) => `Player ${index + 1}`)
    const game = createActiveGame(names)

    expect(game.players).toHaveLength(MAX_PLAYERS)
    expect(game.players.map((player) => player.name)).toEqual(names.slice(0, MAX_PLAYERS))

    const accents = game.players.map((player) => player.accent)
    expect(new Set(accents).size).toBe(MAX_PLAYERS)
  })
})
