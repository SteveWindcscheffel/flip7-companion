import { ScreenHeader } from '../../components/ScreenHeader'
import type { Game, Player } from '../../types/game'
import { getPlayerStatistics } from '../../utils/scoring'

interface StatsScreenProps {
  history: Game[]
  onBack: () => void
  onOpenHallOfFame: () => void
  onOpenPlayer: (player: Player) => void
}

export function StatsScreen({ history, onBack, onOpenHallOfFame, onOpenPlayer }: StatsScreenProps) {
  const playerStats = getPlayerStatistics(history)

  return (
    <div className="screen screen--wide">
      <ScreenHeader title="STATISTICS" subtitle="Every player's completed-game record" onBack={onBack} />

      <div className="f7-add-row" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="pill pill--active" onClick={onOpenHallOfFame}>
          HALL OF FAME
        </button>
      </div>

      {playerStats.length === 0 ? (
        <div className="card card--list f7-aux-card">
          <p className="f7-empty-note">No completed games yet. Finish a game to see your statistics.</p>
        </div>
      ) : (
        <div className="f7-aux-list">
          {playerStats.map((entry) => (
            <button
              key={`${entry.player.id}-${entry.player.name}`}
              type="button"
              className="f7-aux-row"
              onClick={() => onOpenPlayer(entry.player)}
            >
              <div className="f7-aux-row__top">
                <span>{entry.player.name}</span>
                <span>{entry.gamesPlayed} games</span>
              </div>
              <p className="f7-aux-row__meta">
                {entry.gamesWon} wins · {Math.round(entry.winRate * 100)}% win rate · highest round {entry.highestRoundScore}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default StatsScreen
