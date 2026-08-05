import { type FormEvent, type TouchEvent, useEffect, useRef, useState } from 'react'
import { storage } from './services/storage'
import type { Game, Player } from './types/game'
import { createActiveGame, validatePlayerNames } from './utils/gameSetup'
import { buildRound, getHallOfFameEntries, getLeaderboard, getLiveStandings, getPlayerStatistics, getPlayerTotal, getRecentRoundSummaries, getWinnerIds } from './utils/scoring'

const MIN_PLAYERS = 2
const MAX_PLAYERS = 10
const WINNING_TARGET = 200
const SWIPE_THRESHOLD = 60
const accentColors: Record<string, string> = {
  coral: '#d76348',
  violet: '#6a5aa6',
  blue: '#3f6f93',
  green: '#4f7a58',
  orange: '#c78632',
  pink: '#a4597a',
  navy: '#35536f',
  lime: '#6a8f3b',
  red: '#b33d45',
  purple: '#6d4c7a'
}

function createStarterPlayers(count: number) {
  return Array.from({ length: count }, () => '')
}

function App() {
  const [players, setPlayers] = useState<string[]>(() => createStarterPlayers(MIN_PLAYERS))
  const [recentPlayers, setRecentPlayers] = useState<Player[]>([])
  const [history, setHistory] = useState<Game[]>(() => storage.loadHistory())
  const [activeGame, setActiveGame] = useState<Game | null>(() => storage.loadActiveGame())
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [feedback, setFeedback] = useState('')
  const [isEnteringRound, setIsEnteringRound] = useState(false)
  const [draftScores, setDraftScores] = useState<Record<string, string>>({})
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [activePlayerIndex, setActivePlayerIndex] = useState(0)
  const [completedGame, setCompletedGame] = useState<Game | null>(null)
  const [view, setView] = useState<'home' | 'new-game' | 'active' | 'history' | 'detail' | 'stats' | 'player-stats' | 'hall-of-fame'>('home')
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    setRecentPlayers(storage.loadPlayers())
    setHistory(storage.loadHistory())
  }, [])

  useEffect(() => {
    if (activeGame) {
      setPlayers(activeGame.players.map((player) => player.name))
    }
  }, [activeGame])

  const addPlayer = () => {
    setPlayers((current) => (current.length < MAX_PLAYERS ? [...current, ''] : current))
  }

  const removePlayer = (index: number) => {
    setPlayers((current) => (current.length > MIN_PLAYERS ? current.filter((_, itemIndex) => itemIndex !== index) : current))
  }

  const updatePlayerName = (index: number, value: string) => {
    setPlayers((current) => current.map((entry, itemIndex) => (itemIndex === index ? value : entry)))
    setErrors({})
    setFeedback('')
  }

  const fillRecentPlayer = (name: string) => {
    const nextPlayers = [...players]
    const emptyIndex = nextPlayers.findIndex((entry) => !entry.trim())

    if (emptyIndex >= 0) {
      nextPlayers[emptyIndex] = name
      setPlayers(nextPlayers)
      return
    }

    if (players.length < MAX_PLAYERS) {
      setPlayers([...nextPlayers, name])
      return
    }

    nextPlayers[nextPlayers.length - 1] = name
    setPlayers(nextPlayers)
  }

  const removeRecentPlayer = (player: Player) => {
    const shouldRemove = window.confirm(`Remove ${player.name} from recent players?`)
    if (!shouldRemove) return

    const nextRecentPlayers = recentPlayers.filter((entry) => entry.id !== player.id)
    storage.savePlayers(nextRecentPlayers)
    setRecentPlayers(nextRecentPlayers)
  }

  const handleStartGame = (event: FormEvent) => {
    event.preventDefault()
    setFeedback('')

    const { values, errors: validationErrors } = validatePlayerNames(players)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      setFeedback('Please fix the blank or duplicate names before starting.')
      return
    }

    const trimmedNames = values.filter(Boolean)
    if (trimmedNames.length < MIN_PLAYERS || trimmedNames.length > MAX_PLAYERS) {
      setFeedback(`Choose between ${MIN_PLAYERS} and ${MAX_PLAYERS} players.`)
      return
    }

    const game = createActiveGame(trimmedNames)
    storage.saveActiveGame(game)

    const nextRecentPlayers = [...game.players]
    const recentNames = new Set(nextRecentPlayers.map((player) => player.name.toLowerCase()))

    recentPlayers.forEach((player) => {
      if (!recentNames.has(player.name.toLowerCase())) {
        nextRecentPlayers.push(player)
        recentNames.add(player.name.toLowerCase())
      }
    })

    const savedRecentPlayers = nextRecentPlayers.slice(0, 10)
    storage.savePlayers(savedRecentPlayers)
    setRecentPlayers(savedRecentPlayers)
    setActiveGame(game)
    setView('active')
    setPlayers(game.players.map((player) => player.name))
    setIsEnteringRound(false)
    setDraftScores({})
    setCurrentPlayerIndex(0)
    setActivePlayerIndex(0)
  }

  const startAnotherGame = () => {
    setActiveGame(null)
    setCompletedGame(null)
    setView('home')
    setPlayers(createStarterPlayers(MIN_PLAYERS))
    setErrors({})
    setFeedback('')
    setIsEnteringRound(false)
    setDraftScores({})
    setCurrentPlayerIndex(0)
    setActivePlayerIndex(0)
  }

  const openRoundEntry = () => {
    if (!activeGame) return
    setIsEnteringRound(true)
    setCurrentPlayerIndex(0)
    setDraftScores({})
    setFeedback('')
  }

  const updateDraftScore = (playerId: string, value: string) => {
    setDraftScores((current) => ({ ...current, [playerId]: value }))
  }

  const advanceRoundEntry = (direction: 'next' | 'previous') => {
    if (!activeGame) return
    if (direction === 'previous' && currentPlayerIndex > 0) {
      setCurrentPlayerIndex((current) => current - 1)
      return
    }
    if (direction === 'next' && currentPlayerIndex < activeGame.players.length - 1) {
      setCurrentPlayerIndex((current) => current + 1)
    }
  }

  const saveRound = (scoresOverride?: Record<string, string>) => {
    if (!activeGame) return

    const nextDraft = scoresOverride ?? draftScores
    const roundIsReady = activeGame.players.every((player) => {
      const value = nextDraft[player.id] ?? ''
      return value.trim() !== ''
    })

    if (!roundIsReady) {
      setFeedback('Enter every player\'s score before saving the round.')
      return
    }
    const roundScores = activeGame.players.reduce<Record<string, number>>((nextScores, player) => {
      const rawValue = nextDraft[player.id] ?? ''
      const parsedValue = rawValue.trim() === '' ? 0 : Number.parseInt(rawValue, 10)
      nextScores[player.id] = Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0
      return nextScores
    }, {})

    const round = buildRound(activeGame, roundScores)
    const candidateGame: Game = {
      ...activeGame,
      rounds: [...activeGame.rounds, round]
    }
    const winnerIds = getWinnerIds(candidateGame)
    const nextGame: Game = {
      ...candidateGame,
      status: winnerIds.length > 0 ? 'complete' : 'active',
      winnerIds,
      completedAt: winnerIds.length > 0 ? new Date().toISOString() : undefined
    }

    if (winnerIds.length > 0) {
      const storedHistory = storage.loadHistory()
      const nextHistory = [...storedHistory.filter((game) => game.id !== nextGame.id), nextGame]
      storage.saveHistory(nextHistory)
      setHistory(nextHistory)
      storage.clearActiveGame()
      setActiveGame(null)
      setCompletedGame(nextGame)
      setIsEnteringRound(false)
      setDraftScores({})
      setCurrentPlayerIndex(0)
      setActivePlayerIndex(0)
      setFeedback('Game finished!')
      return
    }

    storage.saveActiveGame(nextGame)
    setActiveGame(nextGame)
    setIsEnteringRound(false)
    setDraftScores({})
    setCurrentPlayerIndex(0)
    setActivePlayerIndex(0)
    setFeedback('Round saved.')
  }

  const handleBust = () => {
    if (!activeGame) return
    const currentPlayer = activeGame.players[currentPlayerIndex]
    const nextScores = { ...draftScores, [currentPlayer.id]: '0' }
    setDraftScores(nextScores)

    if (currentPlayerIndex === activeGame.players.length - 1) {
      saveRound(nextScores)
      return
    }

    setCurrentPlayerIndex((current) => current + 1)
  }

  const undoLastRound = () => {
    if (!activeGame || activeGame.rounds.length === 0) return

    const nextGame: Game = {
      ...activeGame,
      rounds: activeGame.rounds.slice(0, -1),
      status: 'active',
      winnerIds: []
    }

    storage.saveActiveGame(nextGame)
    setActiveGame(nextGame)
    setFeedback('Last round removed.')
  }

  const openNewGame = () => {
    setView('new-game')
    setSelectedGame(null)
    setSelectedPlayer(null)
  }

  const openHistory = () => {
    setHistory(storage.loadHistory())
    setView('history')
    setSelectedGame(null)
    setSelectedPlayer(null)
  }

  const openGameDetail = (game: Game) => {
    setSelectedGame(game)
    setView('detail')
    setSelectedPlayer(null)
  }

  const openStats = () => {
    setHistory(storage.loadHistory())
    setView('stats')
    setSelectedGame(null)
    setSelectedPlayer(null)
  }

  const openPlayerStats = (player: Player) => {
    setSelectedPlayer(player)
    setView('player-stats')
    setSelectedGame(null)
  }

  const openHallOfFame = () => {
    setView('hall-of-fame')
    setSelectedGame(null)
    setSelectedPlayer(null)
  }

  const goHome = () => {
    setView('home')
    setSelectedGame(null)
    setSelectedPlayer(null)
  }

  const resumeSavedGame = () => {
    if (!activeGame) return
    setView('active')
    setFeedback('')
    setIsEnteringRound(false)
    setDraftScores({})
    setCurrentPlayerIndex(0)
  }

  const saveAndExit = () => {
    if (!activeGame) return
    storage.saveActiveGame(activeGame)
    setView('home')
    setFeedback('')
    setIsEnteringRound(false)
    setDraftScores({})
    setCurrentPlayerIndex(0)
    setActivePlayerIndex(0)
  }

  const deleteSavedGame = () => {
    if (!activeGame) return
    const shouldDelete = window.confirm('Delete this saved game? This cannot be undone.')
    if (!shouldDelete) return

    storage.clearActiveGame()
    setActiveGame(null)
    setView('home')
    setFeedback('')
    setIsEnteringRound(false)
    setDraftScores({})
    setCurrentPlayerIndex(0)
    setActivePlayerIndex(0)
  }

  const resetAllData = () => {
    const shouldReset = window.confirm('Reset all app data? This will remove the saved game, history, and recent players.')
    if (!shouldReset) return

    storage.clearActiveGame()
    storage.saveHistory([])
    storage.savePlayers([])
    setActiveGame(null)
    setCompletedGame(null)
    setHistory([])
    setRecentPlayers([])
    setPlayers(createStarterPlayers(MIN_PLAYERS))
    setErrors({})
    setFeedback('')
    setIsEnteringRound(false)
    setDraftScores({})
    setCurrentPlayerIndex(0)
    setActivePlayerIndex(0)
    setView('home')
    setSelectedGame(null)
    setSelectedPlayer(null)
  }

  const handleSwipeStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleSwipeEnd = (event: TouchEvent<HTMLElement>, mode: 'active-card' | 'round-entry') => {
    const start = touchStartRef.current
    if (!start) return

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y
    const target = event.target as HTMLElement
    const isInputLike = Boolean(target.closest('input, textarea, select'))

    if (isInputLike || Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) {
      touchStartRef.current = null
      return
    }

    if (!activeGame) {
      touchStartRef.current = null
      return
    }

    const totalPlayers = activeGame.players.length
    if (mode === 'active-card') {
      setActivePlayerIndex((current) => {
        if (deltaX < 0 && current < totalPlayers - 1) {
          return current + 1
        }
        if (deltaX > 0 && current > 0) {
          return current - 1
        }
        return current
      })
    } else {
      setCurrentPlayerIndex((current) => {
        if (deltaX < 0 && current < totalPlayers - 1) {
          return current + 1
        }
        if (deltaX > 0 && current > 0) {
          return current - 1
        }
        return current
      })
    }

    touchStartRef.current = null
  }

  if (completedGame) {
    const winnerNames = completedGame.players
      .filter((player) => completedGame.winnerIds.includes(player.id))
      .map((player) => player.name)
    const finalStandings = getLeaderboard(completedGame)
    const winningScore = finalStandings[0]?.total ?? 0

    return (
      <main className="app-shell">
        <section className="hero-card winner-card" aria-labelledby="winner-title">
          <div className="celebration" aria-hidden="true">
            <span>✦</span>
            <span>🏆</span>
            <span>✦</span>
          </div>
          <div className="title-plaque">
            <p className="eyebrow">Round complete</p>
            <h1 id="winner-title">Winner</h1>
          </div>
          <p className="winner-name">{winnerNames.join(', ')}</p>
          <p className="winner-summary">Winning score {winningScore} • {completedGame.rounds.length} rounds</p>

          <div className="leaderboard-card">
            <p className="section-label">Final standings</p>
            <div className="leaderboard-list">
              {finalStandings.map((entry, index) => (
                <div key={entry.player.id} className="leaderboard-row">
                  <span>{index + 1}. {entry.player.name}</span>
                  <strong>{entry.total}</strong>
                </div>
              ))}
            </div>
          </div>

          <button type="button" className="primary-button" onClick={startAnotherGame}>
            New Game
          </button>
        </section>
      </main>
    )
  }

  if (view === 'history') {
    const sortedHistory = [...history].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())

    return (
      <main className="app-shell">
        <section className="hero-card" aria-labelledby="history-title">
          <div className="title-plaque">
            <p className="eyebrow">Game history</p>
            <h1 id="history-title">History</h1>
          </div>
          <p className="tagline">Replay completed games and keep the night’s scores close at hand.</p>
          <div className="ornament" aria-hidden="true">✦</div>

          <div className="setup-panel">
            <div className="action-row">
              <button type="button" className="secondary-button" onClick={goHome}>
                Back
              </button>
            </div>

            {sortedHistory.length === 0 ? (
              <div className="leaderboard-card">
                <p className="section-label">No history yet</p>
                <p className="helper-text">Finished games will appear here after a round reaches 200+.</p>
              </div>
            ) : (
              <div className="history-list">
                {sortedHistory.map((game) => {
                  const winnerNames = game.players
                    .filter((player) => game.winnerIds.includes(player.id))
                    .map((player) => player.name)
                  const finalStandings = getLeaderboard(game)
                  const winningScore = finalStandings[0]?.total ?? 0
                  const dateLabel = new Date(game.completedAt ?? game.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })

                  return (
                    <button key={game.id} type="button" className="history-card" onClick={() => openGameDetail(game)}>
                      <div className="history-card__top">
                        <strong>{winnerNames.join(', ') || 'Winners pending'}</strong>
                        <span>{dateLabel}</span>
                      </div>
                      <p className="helper-text">{winningScore} pts • {game.rounds.length} rounds</p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    )
  }

  if (view === 'stats') {
    const playerStats = getPlayerStatistics(history)

    return (
      <main className="app-shell">
        <section className="hero-card" aria-labelledby="stats-title">
          <div className="title-plaque">
            <p className="eyebrow">Player statistics</p>
            <h1 id="stats-title">Statistics</h1>
          </div>
          <p className="tagline">Follow every player’s completed-game record with a glance.</p>
          <div className="ornament" aria-hidden="true">✦</div>

          <div className="setup-panel">
            <div className="action-row">
              <button type="button" className="secondary-button" onClick={goHome}>
                Back
              </button>
              <button type="button" className="secondary-button" onClick={openHallOfFame}>
                Hall of Fame
              </button>
            </div>

            {playerStats.length === 0 ? (
              <div className="leaderboard-card">
                <p className="section-label">No stats yet</p>
                <p className="helper-text">No completed games yet. Finish a game to see your statistics.</p>
              </div>
            ) : (
              <div className="stats-list">
                {playerStats.map((entry) => (
                  <button key={`${entry.player.id}-${entry.player.name}`} type="button" className="history-card" onClick={() => openPlayerStats(entry.player)}>
                    <div className="history-card__top">
                      <strong>{entry.player.name}</strong>
                      <span>{entry.gamesPlayed} games</span>
                    </div>
                    <p className="helper-text">{entry.gamesWon} wins • {Math.round(entry.winRate * 100)}% win rate</p>
                    <div className="stats-pill-row">
                      <span className="stat-pill">Highest ever round {entry.highestRoundScore}</span>
                      <span className="stat-pill">Busts {entry.bustCount}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    )
  }

  if (view === 'player-stats' && selectedPlayer) {
    const playerStats = getPlayerStatistics(history)
    const selectedEntry = playerStats.find((entry) => entry.player.id === selectedPlayer.id || entry.player.name.toLowerCase() === selectedPlayer.name.toLowerCase())

    return (
      <main className="app-shell">
        <section className="hero-card" aria-labelledby="player-stats-title">
          <div className="title-plaque">
            <p className="eyebrow">Player profile</p>
            <h1 id="player-stats-title">{selectedPlayer.name}</h1>
          </div>
          <p className="tagline">A quick view of their completed-game record.</p>
          <div className="ornament" aria-hidden="true">✦</div>

          <div className="setup-panel">
            <div className="action-row">
              <button type="button" className="secondary-button" onClick={() => setView('stats')}>
                Back
              </button>
            </div>

            {!selectedEntry ? (
              <div className="leaderboard-card">
                <p className="section-label">No completed games</p>
                <p className="helper-text">This player hasn’t appeared in any finished games yet.</p>
              </div>
            ) : (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <p className="section-label">Games played</p>
                    <strong>{selectedEntry.gamesPlayed}</strong>
                  </div>
                  <div className="stat-card">
                    <p className="section-label">Games won</p>
                    <strong>{selectedEntry.gamesWon}</strong>
                  </div>
                  <div className="stat-card">
                    <p className="section-label">Win rate</p>
                    <strong>{Math.round(selectedEntry.winRate * 100)}%</strong>
                  </div>
                  <div className="stat-card">
                    <p className="section-label">Highest ever round</p>
                    <strong>{selectedEntry.highestRoundScore}</strong>
                  </div>
                  <div className="stat-card">
                    <p className="section-label">Bust count</p>
                    <strong>{selectedEntry.bustCount}</strong>
                  </div>
                  <div className="stat-card">
                    <p className="section-label">Average round</p>
                    <strong>{selectedEntry.averageRoundScore.toFixed(1)}</strong>
                  </div>
                  <div className="stat-card">
                    <p className="section-label">Highest final</p>
                    <strong>{selectedEntry.highestFinalScore}</strong>
                  </div>
                  <div className="stat-card">
                    <p className="section-label">Fastest win</p>
                    <strong>{selectedEntry.fastestWinRounds !== null ? `${selectedEntry.fastestWinRounds} rounds` : '—'}</strong>
                  </div>
                  <div className="stat-card">
                    <p className="section-label">Total points</p>
                    <strong>{selectedEntry.totalPointsScored}</strong>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    )
  }

  if (view === 'hall-of-fame') {
    const hallOfFame = getHallOfFameEntries(history)

    return (
      <main className="app-shell">
        <section className="hero-card" aria-labelledby="hall-title">
          <div className="title-plaque">
            <p className="eyebrow">Hall of Fame</p>
            <h1 id="hall-title">Hall of Fame</h1>
          </div>
          <p className="tagline">Celebrating top records from finished games.</p>
          <div className="ornament" aria-hidden="true">✦</div>

          <div className="setup-panel">
            <div className="action-row">
              <button type="button" className="secondary-button" onClick={() => setView('stats')}>
                Back
              </button>
            </div>

            {hallOfFame.length === 0 ? (
              <div className="leaderboard-card">
                <p className="section-label">No hall of fame yet</p>
                <p className="helper-text">Once completed games exist, records such as most wins and biggest margins will appear here.</p>
              </div>
            ) : (
              hallOfFame.map((section) => (
                <div key={section.title} className="leaderboard-card">
                  <p className="section-label">{section.title}</p>
                  {section.entries.length > 0 ? (
                    <div className="leaderboard-list">
                      {section.entries.map((entry, index) => (
                        <div key={`${section.title}-${entry.player.id}-${index}`} className="leaderboard-row">
                          <span>{index + 1}. {entry.player.name}</span>
                          <strong>{entry.value}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="helper-text">No records yet for this category.</p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    )
  }

  if (view === 'detail' && selectedGame) {
    const finalStandings = getLeaderboard(selectedGame)
    const winnerNames = selectedGame.players
      .filter((player) => selectedGame.winnerIds.includes(player.id))
      .map((player) => player.name)

    return (
      <main className="app-shell">
        <section className="hero-card" aria-labelledby="detail-title">
          <div className="title-plaque">
            <p className="eyebrow">Game detail</p>
            <h1 id="detail-title">Replay</h1>
          </div>
          <p className="tagline">Review the final standings and every round in order.</p>
          <div className="ornament" aria-hidden="true">✦</div>

          <div className="setup-panel">
            <div className="action-row">
              <button type="button" className="secondary-button" onClick={goHome}>
                Back
              </button>
            </div>

            <div className="leaderboard-card">
              <p className="section-label">Final standings</p>
              <div className="leaderboard-list">
                {finalStandings.map((entry, index) => (
                  <div key={entry.player.id} className="leaderboard-row">
                    <span>{index + 1}. {entry.player.name}</span>
                    <strong>{entry.total}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="leaderboard-card">
              <p className="section-label">Winners</p>
              <p className="winner-name">{winnerNames.join(', ')}</p>
            </div>

            <div className="history-table history-table--stacked">
              {selectedGame.players.map((player) => {
                const runningTotals: number[] = []
                let total = 0
                selectedGame.rounds.forEach((round) => {
                  total += round.scores[player.id] ?? 0
                  runningTotals.push(total)
                })

                return (
                  <div key={player.id} className="leaderboard-card">
                    <p className="section-label">{player.name}</p>
                    <div className="history-table">
                      <div className="history-row history-row--head">
                        <span>Round</span>
                        <span>Score</span>
                        <span>Total</span>
                      </div>
                      {selectedGame.rounds.map((round, index) => (
                        <div key={round.id} className="history-row">
                          <span>#{round.number}</span>
                          <span>{round.scores[player.id] ?? 0}</span>
                          <span>{runningTotals[index]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (view === 'home') {
    const savedGameLeaderboard = activeGame ? getLeaderboard(activeGame) : []
    const savedGameLeader = savedGameLeaderboard[0]
    const hasSavedRoundData = Boolean(activeGame && activeGame.rounds.length > 0)
    const currentRoundNumber = activeGame ? activeGame.rounds.length + 1 : 1

    return (
      <main className="app-shell">
        <section className="hero-card home-card" aria-label="Flip7 Companion home">
          <div className="title-plaque title-plaque--home">
            <img
              className="home-brand-image"
              src={`${import.meta.env.BASE_URL}brand/flip7-companion-wordmark.svg`}
              alt="Flip7 Companion"
            />
            <p className="tagline">A premium table-side scorekeeper for fast rounds and sharp finishes.</p>
          </div>

          <div className="home-actions">
            {activeGame ? (
              <button type="button" className="primary-button home-cta" onClick={resumeSavedGame}>
                Resume Game
              </button>
            ) : (
              <button type="button" className="primary-button home-cta" onClick={openNewGame}>
                New Game
              </button>
            )}
            <div className="action-row action-row--compact">
              <button type="button" className="secondary-button" onClick={openStats}>
                Statistics
              </button>
              <button type="button" className="secondary-button" onClick={openHistory}>
                History
              </button>
            </div>
          </div>

          {activeGame ? (
            <div className="home-panel saved-game-card home-panel--row-group">
              <p className="section-label">Saved unfinished game</p>
              <p className="helper-text saved-game-summary">Players: {activeGame.players.map((player) => player.name).join(', ')}</p>
              <p className="helper-text saved-game-summary">Current round: {currentRoundNumber}</p>
              <p className="helper-text saved-game-summary">
                {hasSavedRoundData && savedGameLeader ? `Leader: ${savedGameLeader.player.name} (${savedGameLeader.total})` : 'Leader: not available yet'}
              </p>
              <button type="button" className="secondary-button delete-saved-game-button" onClick={deleteSavedGame}>
                Delete Saved Game
              </button>
            </div>
          ) : history.length > 0 ? (
            <div className="home-panel home-panel--row-group">
              <div className="panel-head">
                <p className="section-label">Recent completed games</p>
              </div>
              <div className="history-list history-list--compact">
                {history
                  .slice(0, 3)
                  .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
                  .map((game) => {
                    const winnerNames = game.players
                      .filter((player) => game.winnerIds.includes(player.id))
                      .map((player) => player.name)
                    const dateLabel = new Date(game.completedAt ?? game.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })
                    return (
                      <button key={game.id} type="button" className="history-card history-card--compact home-history-row" onClick={() => openGameDetail(game)}>
                        <div className="history-card__top">
                          <strong>{winnerNames.join(', ') || 'Winners pending'}</strong>
                          <span>{dateLabel}</span>
                        </div>
                        <p className="helper-text">{getLeaderboard(game)[0]?.total ?? 0} pts • {game.rounds.length} rounds</p>
                      </button>
                    )
                  })}
              </div>
            </div>
          ) : (
            <div className="home-panel home-panel--empty">
              <p className="section-label">No finished games yet</p>
              <p className="helper-text">Finish a round and your latest scores will appear here as polished card rows.</p>
            </div>
          )}

          <div className="home-reset-row">
            <button type="button" className="secondary-button reset-data-button" onClick={resetAllData}>
              Reset All Data
            </button>
          </div>
        </section>
      </main>
    )
  }

  if (!activeGame) {

    return (
      <main className="app-shell">
        <section className="hero-card new-game-screen" aria-labelledby="new-game-title">
          <div className="title-plaque title-plaque--new-game">
            <button type="button" className="back-button" onClick={goHome}>
              ← Back
            </button>
            <p className="eyebrow">New Game</p>
            <h1 id="new-game-title">New Game</h1>
          </div>

          <form className="setup-panel setup-panel--new-game" onSubmit={handleStartGame}>
            <div className="panel-header">
              <p>Build your table, save names, and begin the round.</p>
            </div>

            {recentPlayers.length > 0 ? (
              <div className="recent-player-group">
                <p className="section-label">Recent players</p>
                <div className="recent-player-list">
                  {recentPlayers.map((player) => (
                    <div key={player.id} className="recent-player-item">
                      <button type="button" className="recent-player-button" onClick={() => fillRecentPlayer(player.name)}>
                        <span className="recent-player-button__name">{player.name}</span>
                        <span className="recent-player-button__hint">Use</span>
                      </button>
                      <button
                        type="button"
                        className="recent-player-remove"
                        aria-label={`Remove ${player.name} from recent players`}
                        onClick={() => removeRecentPlayer(player)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="player-list player-list--deck">
              {players.map((name, index) => (
                <div key={`player-row-${index}`} className={`player-row${errors[index] ? ' player-row--invalid' : ''}`}>
                  <div className="player-row__head">
                    <label className="player-label" htmlFor={`player-${index + 1}`}>
                      Player {index + 1}
                    </label>
                    <span className="accent-dot" aria-hidden="true" />
                  </div>
                  <div className="player-input-row">
                    <input
                      id={`player-${index + 1}`}
                      value={name}
                      onChange={(event) => updatePlayerName(index, event.target.value)}
                      placeholder={`Player ${index + 1}`}
                    />
                    {players.length > MIN_PLAYERS ? (
                      <button type="button" className="remove-player-button" aria-label={`Remove player ${index + 1}`} onClick={() => removePlayer(index)}>
                        ×
                      </button>
                    ) : null}
                  </div>
                  {errors[index] ? <p className="field-error">{errors[index]}</p> : null}
                </div>
              ))}
            </div>

            <div className="action-row action-row--bottom">
              <button type="button" className="secondary-button" onClick={addPlayer}>
                + Add player
              </button>
              <button type="submit" className="primary-button">
                Start Game
              </button>
            </div>

            {feedback ? <p className="feedback-message">{feedback}</p> : null}
            <p className="helper-text">Blank names and duplicate names are flagged before the game starts.</p>
          </form>
        </section>
      </main>
    )
  }

  const leaderboard = getLeaderboard(activeGame)
  const liveStandings = getLiveStandings(activeGame, draftScores)
  const currentPlayer = activeGame.players[activePlayerIndex] ?? activeGame.players[0]
  const currentTotal = getPlayerTotal(activeGame, currentPlayer.id)
  const progress = Math.min(100, (currentTotal / WINNING_TARGET) * 100)
  const recentRounds = getRecentRoundSummaries(activeGame, currentPlayer.id, 5)
  const nextRoundNumber = activeGame.rounds.length + 1
  const roundIsReady = activeGame.players.every((player) => {
    const value = draftScores[player.id] ?? ''
    return value.trim() !== ''
  })
  const enteredScoresCount = activeGame.players.filter((player) => {
    const value = draftScores[player.id] ?? ''
    return value.trim() !== ''
  }).length

  return (
    <main className="app-shell">
      <section className="hero-card active-game-screen" aria-labelledby="active-title">
        <div className="title-plaque title-plaque--active">
          <span className="round-badge">Round {nextRoundNumber}</span>
          <h1 id="active-title">ACTIVE GAME</h1>
        </div>

        <div className="setup-panel">
          {isEnteringRound ? (
            <div className="round-entry-card active-round-entry-card">
              <div className="round-entry-head">
                <p className="section-label">Round {activeGame.rounds.length + 1}</p>
                <p className="section-label">Player {currentPlayerIndex + 1} of {activeGame.players.length}</p>
              </div>
              <div
                className="score-card score-card--hero active-hero-card"
                onTouchStart={handleSwipeStart}
                onTouchEnd={(event) => handleSwipeEnd(event, 'round-entry')}
              >
                <div className="score-card__nameplate" style={{ borderColor: accentColors[activeGame.players[currentPlayerIndex].accent] }}>
                  <span className="accent-dot" style={{ backgroundColor: accentColors[activeGame.players[currentPlayerIndex].accent] }} aria-hidden="true" />
                  <h3>{activeGame.players[currentPlayerIndex].name}</h3>
                </div>
                <div className="score-card__meta">
                  <p className="section-label">Round {activeGame.rounds.length + 1} · Player {currentPlayerIndex + 1} of {activeGame.players.length}</p>
                  <p className="card-hint">Swipe to move between players</p>
                </div>
                <label className="player-label" htmlFor="round-score-input">
                  Enter score
                </label>
                <input
                  id="round-score-input"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  className="score-input"
                  value={draftScores[activeGame.players[currentPlayerIndex].id] ?? ''}
                  onChange={(event) => updateDraftScore(activeGame.players[currentPlayerIndex].id, event.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="leaderboard-card leaderboard-card--compact active-leaderboard-card">
                <p className="section-label">Live standings</p>
                <p className="live-standings-summary">{enteredScoresCount} of {activeGame.players.length} scores entered</p>
                <div className="leaderboard-list">
                  {liveStandings.map((entry, index) => (
                    <div key={entry.player.id} className="leaderboard-row">
                      <div className="leaderboard-row__identity">
                        <span className="leaderboard-rank-badge" aria-hidden="true">{index + 1}</span>
                        <span className="leaderboard-player-name">{entry.player.name}</span>
                        {activeGame.players[currentPlayerIndex]?.id === entry.player.id ? (
                          <span className="round-status-chip round-status-chip--playing">● Playing now</span>
                        ) : (draftScores[entry.player.id] ?? '').trim() !== '' ? (
                          <span className="round-status-chip round-status-chip--scored">✓ Scored</span>
                        ) : (
                          <span className="round-status-chip round-status-chip--pending">○ Still to play</span>
                        )}
                      </div>
                      <strong>{entry.total}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="action-row action-row--stacked">
                <button type="button" className="secondary-button" onClick={() => advanceRoundEntry('previous')}>
                  Previous
                </button>
                <button type="button" className="secondary-button" onClick={handleBust}>
                  BUST
                </button>
                {currentPlayerIndex === activeGame.players.length - 1 ? (
                  <button type="button" className="primary-button" onClick={() => saveRound()} disabled={!roundIsReady}>
                    Save Round
                  </button>
                ) : (
                  <button type="button" className="primary-button" onClick={() => advanceRoundEntry('next')}>
                    Next
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div
                className={`score-card score-card--hero active-hero-card${leaderboard[0]?.player.id === currentPlayer.id ? ' score-card--leader' : ''}`}
                onTouchStart={handleSwipeStart}
                onTouchEnd={(event) => handleSwipeEnd(event, 'active-card')}
              >
                <div className="card-nav-row">
                  <button type="button" className="secondary-button" onClick={() => setActivePlayerIndex((current) => (current > 0 ? current - 1 : activeGame.players.length - 1))}>
                    ←
                  </button>
                  <div className="score-card__header">
                    <p className="section-label">Current card</p>
                    <h3>{currentPlayer.name}</h3>
                  </div>
                  <button type="button" className="secondary-button" onClick={() => setActivePlayerIndex((current) => (current < activeGame.players.length - 1 ? current + 1 : 0))}>
                    →
                  </button>
                </div>
                <div className="score-card__nameplate" style={{ borderColor: accentColors[currentPlayer.accent] }}>
                  <span className="accent-dot" style={{ backgroundColor: accentColors[currentPlayer.accent] }} aria-hidden="true" />
                  <div>
                    <p className="section-label">Player {activePlayerIndex + 1} of {activeGame.players.length}</p>
                    <h3>{currentPlayer.name}</h3>
                  </div>
                </div>
                <div className="score-display">{currentTotal}</div>
                <div className="progress-pill">
                  <span>Race to 200</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="progress-bar" aria-hidden="true">
                  <div className="progress-bar__fill" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accentColors[currentPlayer.accent]} 0%, #c94b32 100%)` }} />
                </div>
                <div className="score-card__meta">
                  <p className="section-label">Last five rounds</p>
                  <p className="card-hint">Swipe to move between cards</p>
                </div>
                <div className="round-history">
                  <div className="history-table">
                    <div className="history-row history-row--head">
                      <span>Round</span>
                      <span>Score</span>
                      <span>Total</span>
                    </div>
                    {recentRounds.length > 0 ? recentRounds.map(({ round, runningTotal, score }) => (
                      <div key={round.id} className="history-row">
                        <span>#{round.number}</span>
                        <span>{score}</span>
                        <span>{runningTotal}</span>
                      </div>
                    )) : (
                      <div className="history-row">
                        <span>No rounds yet</span>
                        <span>—</span>
                        <span>—</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="leaderboard-card active-leaderboard-card">
                <p className="section-label">Live leaderboard</p>
                <div className="leaderboard-list">
                  {leaderboard.map((entry, index) => (
                    <div key={entry.player.id} className="leaderboard-row">
                      <div className="leaderboard-row__identity">
                        <span className="leaderboard-rank-badge" aria-hidden="true">{index + 1}</span>
                        <span className="leaderboard-player-name">{entry.player.name}</span>
                      </div>
                      <strong>{entry.total}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="game-footer">
            {!isEnteringRound ? (
              <button type="button" className="primary-button" onClick={openRoundEntry}>
                Start Round {nextRoundNumber}
              </button>
            ) : null}
            <div className="action-row action-row--compact">
              <button type="button" className="secondary-button" onClick={undoLastRound} disabled={activeGame.rounds.length === 0}>
                Undo
              </button>
              <button type="button" className="secondary-button" onClick={saveAndExit}>
                Save & Exit
              </button>
            </div>
          </div>

          {feedback ? <p className="feedback-message">{feedback}</p> : null}
          {activeGame.winnerIds.length > 0 ? <p className="helper-text">Winner locked in — round scoring is complete.</p> : null}
        </div>
      </section>
    </main>
  )
}

export default App
