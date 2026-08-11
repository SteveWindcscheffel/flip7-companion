import { useEffect, useRef, useState } from 'react'
import { BrandLockup } from '../../components/Brand'
import type { Game } from '../../types/game'
import { getLeaderboard } from '../../utils/scoring'

interface HomeScreenProps {
  activeGame: Game | null
  history: Game[]
  onResume: () => void
  onNewGame: () => void
  onStats: () => void
  onViewAllHistory: () => void
  onOpenGame: (game: Game) => void
  onResetData: () => void
}

const RESET_CONFIRM_MS = 4000

export function HomeScreen({
  activeGame,
  history,
  onResume,
  onNewGame,
  onStats,
  onViewAllHistory,
  onOpenGame,
  onResetData
}: HomeScreenProps) {
  const [confirmReset, setConfirmReset] = useState(false)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current)
  }, [])

  const hasActiveRounds = Boolean(activeGame && activeGame.rounds.length > 0)
  const leaderboard = activeGame ? getLeaderboard(activeGame) : []
  const leader = leaderboard[0]
  const activeSub = hasActiveRounds && activeGame && leader
    ? `Round ${activeGame.rounds.length + 1} · ${leader.player.name} leading on ${leader.total}`
    : 'Fresh table'

  const recentGames = [...history]
    .sort((left, right) => new Date(right.completedAt ?? right.createdAt).getTime() - new Date(left.completedAt ?? left.createdAt).getTime())
    .slice(0, 3)

  const handleResetClick = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      if (resetTimer.current) clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => setConfirmReset(false), RESET_CONFIRM_MS)
      return
    }
    if (resetTimer.current) clearTimeout(resetTimer.current)
    setConfirmReset(false)
    onResetData()
  }

  return (
    <div className="screen screen--home">
      <BrandLockup />

      <div className="f7-home-actions">
        {hasActiveRounds ? (
          <button type="button" className="btn btn--green" onClick={onResume}>
            <div className="f7-home-cta__title">RESUME GAME</div>
            <div className="f7-home-cta__sub">{activeSub}</div>
          </button>
        ) : null}
        <button type="button" className="btn btn--primary" onClick={onNewGame}>
          NEW GAME
        </button>
        <button type="button" className="btn btn--secondary" onClick={onStats}>
          STATISTICS
        </button>
      </div>

      <div className="section-heading">
        <p className="label label--on-teal" style={{ margin: 0 }}>
          RECENT GAMES
        </p>
        <div className="hairline hairline--teal" />
        <button type="button" className="f7-view-all" onClick={onViewAllHistory}>
          VIEW ALL
        </button>
      </div>

      <div className="card card--list f7-recent-card">
        {recentGames.length === 0 ? (
          <p className="f7-empty-note">Finish a round and your latest scores will show up here.</p>
        ) : (
          recentGames.map((game) => {
            const standings = getLeaderboard(game)
            const winner = standings[0]
            const dateLabel = new Date(game.completedAt ?? game.createdAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })

            return (
              <button key={game.id} type="button" className="f7-recent-row" onClick={() => onOpenGame(game)}>
                <div className="foil-disc f7-recent-row__disc">{winner?.player.name.charAt(0).toUpperCase() ?? '?'}</div>
                <div className="f7-recent-row__meta">
                  <p className="f7-recent-row__name">{winner?.player.name ?? 'Winner pending'}</p>
                  <p className="f7-recent-row__pts">{winner?.total ?? 0} points</p>
                </div>
                <div className="f7-recent-row__right">
                  <p className="f7-recent-row__rounds">{game.rounds.length} Rounds</p>
                  <p className="f7-recent-row__date">{dateLabel}</p>
                </div>
              </button>
            )
          })
        )}
      </div>

      <div className="f7-home-footer">
        <button
          type="button"
          className={`pill ${confirmReset ? 'pill--danger-confirm' : 'pill--danger-idle'}`}
          onClick={handleResetClick}
        >
          {confirmReset ? 'TAP AGAIN TO CONFIRM' : 'DELETE ALL DATA'}
        </button>
        <p className="f7-home-caption">Scores stay on this device</p>
      </div>
    </div>
  )
}

export default HomeScreen
