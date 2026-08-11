import { ScreenHeader } from '../../components/ScreenHeader'
import type { Game } from '../../types/game'
import { getLeaderboard } from '../../utils/scoring'

interface HistoryScreenProps {
  history: Game[]
  onBack: () => void
  onOpenGame: (game: Game) => void
}

export function HistoryScreen({ history, onBack, onOpenGame }: HistoryScreenProps) {
  const sorted = [...history].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())

  return (
    <div className="screen screen--wide">
      <ScreenHeader title="HISTORY" subtitle="Every finished game" onBack={onBack} />

      {sorted.length === 0 ? (
        <div className="card card--list f7-aux-card">
          <p className="f7-empty-note">Finished games will appear here once a round reaches 200+.</p>
        </div>
      ) : (
        <div className="f7-aux-list">
          {sorted.map((game) => {
            const standings = getLeaderboard(game)
            const winner = standings[0]
            const dateLabel = new Date(game.completedAt ?? game.createdAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })
            return (
              <button key={game.id} type="button" className="f7-aux-row" onClick={() => onOpenGame(game)}>
                <div className="f7-aux-row__top">
                  <span>{winner?.player.name ?? 'Winner pending'}</span>
                  <span>{dateLabel}</span>
                </div>
                <p className="f7-aux-row__meta">
                  {winner?.total ?? 0} pts · {game.rounds.length} rounds
                </p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default HistoryScreen
