import { describe, expect, it } from 'vitest'
import { createActiveGame, validatePlayerNames } from './gameSetup'

describe('validatePlayerNames', () => {
  it('flags blank and duplicate entries after trimming', () => {
    const result = validatePlayerNames(['Ada', '   ', 'Ada'])

    expect(result.values).toEqual(['Ada', 'Ada'])
    expect(result.errors).toEqual({
      1: 'Please enter a player name.',
      2: 'Player names must be unique.'
    })
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
})
