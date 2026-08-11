import { useEffect, useState } from 'react'
import { storage } from './services/storage'
import type { Game, Player } from './types/game'
import { nextAccent } from './utils/playerAccents'
import { MAX_PLAYERS, MIN_PLAYERS, createActiveGame } from './utils/gameSetup'
import { buildRound, getWinnerIds } from './utils/scoring'

import { HomeScreen } from './features/home/HomeScreen'
import { NewGameScreen } from './features/new-game/NewGameScreen'
import { PlayerCardScreen } from './features/game/PlayerCardScreen'
import { ScoreEntryScreen } from './features/game/ScoreEntryScreen'
import { LeaderboardScreen } from './features/game/LeaderboardScreen'
import { WinnerScreen } from './features/game/WinnerScreen'
import { HallOfFameScreen } from './features/stats/HallOfFameScreen'
import { StatsScreen } from './features/stats/StatsScreen'
import { PlayerStatsScreen } from './features/stats/PlayerStatsScreen'
import { HistoryScreen } from './features/history/HistoryScreen'
import { GameDetailScreen } from './features/history/GameDetailScreen'

type View =
  | 'home'
  | 'new-game'
  | 'active'
  | 'entry'
  | 'leaderboard'
  | 'winner'
  | 'history'
  | 'detail'
  | 'stats'
  | 'player-stats'
  | 'hall-of-fame'

function App() {
  const [view, setView] = useState<View>('home')
  const [activeGame, setActiveGame] = useState<Game | null>(() => storage.loadActiveGame())
  const [history, setHistory] = useState<Game[]>(() => storage.loadHistory())
  const [roster, setRoster] = useState<Player[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [cardIndex, setCardIndex] = useState(0)
  const [entryIndex, setEntryIndex] = useState(0)
  const [draftScores, setDraftScores] = useState<Record<string, string>>({})
  const [entryError, setEntryError] = useState('')
  const [completedGame, setCompletedGame] = useState<Game | null>(null)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  useEffect(() => {
    setRoster(storage.loadPlayers())
    setHistory(storage.loadHistory())
  }, [])

  const resetEntryState = () => {
    setDraftScores({})
    setEntryIndex(0)
    setEntryError('')
  }

  const persistRoster = (next: Player[]) => {
    storage.savePlayers(next)
    setRoster(next)
  }

  // ---------------------------------------------------------------- home --

  const goHome = () => setView('home')
  const openNewGame = () => setView('new-game')
  const openStats = () => setView('stats')
  const openHistory = () => setView('history')

  const resumeGame = () => {
    setCardIndex(0)
    resetEntryState()
    setView('active')
  }

  const openGameDetail = (game: Game) => {
    setSelectedGame(game)
    setView('detail')
  }

  const resetAllData = () => {
    storage.clearActiveGame()
    storage.saveHistory([])
    storage.savePlayers([])
    setActiveGame(null)
    setCompletedGame(null)
    setHistory([])
    setRoster([])
    setSelected([])
    resetEntryState()
    setCardIndex(0)
    setSelectedGame(null)
    setSelectedPlayer(null)
    setView('home')
  }

  // ------------------------------------------------------------ new game --

  const toggleSelected = (id: string) => {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((entry) => entry !== id)
      if (current.length >= MAX_PLAYERS) return current
      return [...current, id]
    })
  }

  const removeRosterPlayer = (id: string) => {
    persistRoster(roster.filter((player) => player.id !== id))
    setSelected((current) => current.filter((entry) => entry !== id))
  }

  const addRosterPlayer = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (roster.some((player) => player.name.toLowerCase() === trimmed.toLowerCase())) return

    const player: Player = {
      id: `player-${Date.now()}`,
      name: trimmed,
      accent: nextAccent(roster.map((entry) => entry.accent))
    }
    const nextRoster = [...roster, player]
    persistRoster(nextRoster)
    setSelected((current) => (current.length < MAX_PLAYERS ? [...current, player.id] : current))
  }

  const handleStartGame = () => {
    const names = selected
      .map((id) => roster.find((player) => player.id === id)?.name)
      .filter((name): name is string => Boolean(name))

    if (names.length < MIN_PLAYERS || names.length > MAX_PLAYERS) return

    const game = createActiveGame(names)
    storage.saveActiveGame(game)

    const playedIds = new Set(selected)
    const reordered = [...roster.filter((player) => playedIds.has(player.id)), ...roster.filter((player) => !playedIds.has(player.id))]
    persistRoster(reordered)

    setActiveGame(game)
    setSelected([])
    setCardIndex(0)
    resetEntryState()
    setView('active')
  }

  // --------------------------------------------------------- active game --

  const openRoundEntry = () => {
    resetEntryState()
    setView('entry')
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
  }

  const saveRound = (scores: Record<string, string>) => {
    if (!activeGame) return

    const roundScores = activeGame.players.reduce<Record<string, number>>((acc, player) => {
      const raw = scores[player.id] ?? ''
      const parsed = raw.trim() === '' ? 0 : Number.parseInt(raw, 10)
      acc[player.id] = Number.isFinite(parsed) ? Math.max(0, parsed) : 0
      return acc
    }, {})

    const round = buildRound(activeGame, roundScores)
    const candidate: Game = { ...activeGame, rounds: [...activeGame.rounds, round] }
    const winnerIds = getWinnerIds(candidate)
    const nextGame: Game = {
      ...candidate,
      status: winnerIds.length > 0 ? 'complete' : 'active',
      winnerIds,
      completedAt: winnerIds.length > 0 ? new Date().toISOString() : undefined
    }

    if (winnerIds.length > 0) {
      // A finished game must not be resumable: push to history, clear the
      // active game, keep a snapshot for the winner screen.
      const storedHistory = storage.loadHistory()
      const nextHistory = [...storedHistory.filter((game) => game.id !== nextGame.id), nextGame]
      storage.saveHistory(nextHistory)
      setHistory(nextHistory)
      storage.clearActiveGame()
      setActiveGame(null)
      setCompletedGame(nextGame)
      resetEntryState()
      setCardIndex(0)
      setView('winner')
      return
    }

    storage.saveActiveGame(nextGame)
    setActiveGame(nextGame)
    resetEntryState()
    setView('active')
  }

  const handleAdvanceEntry = () => {
    if (!activeGame) return
    const currentPlayer = activeGame.players[entryIndex]
    const value = draftScores[currentPlayer.id] ?? ''

    if (value.trim() === '') {
      setEntryError('Enter a score, or tap BUST for 0')
      return
    }

    setEntryError('')
    if (entryIndex >= activeGame.players.length - 1) {
      saveRound(draftScores)
    } else {
      setEntryIndex((current) => current + 1)
    }
  }

  const handleBust = () => {
    if (!activeGame) return
    const currentPlayer = activeGame.players[entryIndex]
    const nextScores = { ...draftScores, [currentPlayer.id]: '0' }
    setDraftScores(nextScores)
    setEntryError('')

    if (entryIndex >= activeGame.players.length - 1) {
      saveRound(nextScores)
    } else {
      setEntryIndex((current) => current + 1)
    }
  }

  const handlePreviousEntry = () => {
    setEntryError('')
    setEntryIndex((current) => (current > 0 ? current - 1 : current))
  }

  const handleCancelEntry = () => {
    resetEntryState()
    setView('active')
  }

  // -------------------------------------------------------------- winner --

  const startAnotherGameFromWinner = () => {
    setCompletedGame(null)
    setSelected([])
    setView('new-game')
  }

  const goHomeFromWinner = () => {
    setCompletedGame(null)
    setView('home')
  }

  // ---------------------------------------------------------------- view --

  if (view === 'winner' && completedGame) {
    return (
      <main className="app-shell">
        <WinnerScreen game={completedGame} onNewGame={startAnotherGameFromWinner} onHome={goHomeFromWinner} />
      </main>
    )
  }

  if (view === 'new-game') {
    return (
      <main className="app-shell">
        <NewGameScreen
          roster={roster}
          selected={selected}
          onToggle={toggleSelected}
          onRemove={removeRosterPlayer}
          onAddPlayer={addRosterPlayer}
          onStartGame={handleStartGame}
          onBack={goHome}
        />
      </main>
    )
  }

  if (view === 'entry' && activeGame) {
    return (
      <main className="app-shell">
        <ScoreEntryScreen
          game={activeGame}
          entryIndex={entryIndex}
          draftScores={draftScores}
          error={entryError}
          onDraftChange={(playerId, value) => setDraftScores((current) => ({ ...current, [playerId]: value }))}
          onClearError={() => setEntryError('')}
          onCancel={handleCancelEntry}
          onPrevious={handlePreviousEntry}
          onBust={handleBust}
          onAdvance={handleAdvanceEntry}
        />
      </main>
    )
  }

  if (view === 'leaderboard' && activeGame) {
    return (
      <main className="app-shell">
        <LeaderboardScreen game={activeGame} onBack={() => setView('active')} />
      </main>
    )
  }

  if (view === 'active' && activeGame) {
    return (
      <main className="app-shell">
        <PlayerCardScreen
          game={activeGame}
          cardIndex={cardIndex}
          onCardIndexChange={setCardIndex}
          onHome={goHome}
          onLeaderboard={() => setView('leaderboard')}
          onUndo={undoLastRound}
          onEnterRound={openRoundEntry}
        />
      </main>
    )
  }

  if (view === 'history') {
    return (
      <main className="app-shell">
        <HistoryScreen history={history} onBack={goHome} onOpenGame={openGameDetail} />
      </main>
    )
  }

  if (view === 'detail' && selectedGame) {
    return (
      <main className="app-shell">
        <GameDetailScreen game={selectedGame} onBack={goHome} />
      </main>
    )
  }

  if (view === 'stats') {
    return (
      <main className="app-shell">
        <StatsScreen
          history={history}
          onBack={goHome}
          onOpenHallOfFame={() => setView('hall-of-fame')}
          onOpenPlayer={(player) => {
            setSelectedPlayer(player)
            setView('player-stats')
          }}
        />
      </main>
    )
  }

  if (view === 'player-stats' && selectedPlayer) {
    return (
      <main className="app-shell">
        <PlayerStatsScreen history={history} player={selectedPlayer} onBack={() => setView('stats')} />
      </main>
    )
  }

  if (view === 'hall-of-fame') {
    return (
      <main className="app-shell">
        <HallOfFameScreen history={history} onBack={() => setView('stats')} />
      </main>
    )
  }

  return (
    <main className="app-shell">
      <HomeScreen
        activeGame={activeGame}
        history={history}
        onResume={resumeGame}
        onNewGame={openNewGame}
        onStats={openStats}
        onViewAllHistory={openHistory}
        onOpenGame={openGameDetail}
        onResetData={resetAllData}
      />
    </main>
  )
}

export default App
