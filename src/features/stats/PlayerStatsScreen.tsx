import { ScreenHeader } from '../../components/ScreenHeader'
import type { Game, Player } from '../../types/game'
import { getPlayerStatistics } from '../../utils/scoring'

interface PlayerStatsScreenProps {
  history: Game[]
  player: Player
  onBack: () => void
}

export function PlayerStatsScreen({ history, player, onBack }: PlayerStatsScreenProps) {
  const playerStats = getPlayerStatistics(history)
  const entry = playerStats.find((item) => item.player.id === player.id || item.player.name.toLowerCase() === player.name.toLowerCase())

  return (
    <div className="screen screen--wide">
      <ScreenHeader title={player.name} subtitle="Completed-game record" onBack={onBack} />

      {!entry ? (
        <div className="card card--list f7-aux-card">
          <p className="f7-empty-note">This player hasn't appeared in any finished games yet.</p>
        </div>
      ) : (
        <div className="f7-stat-grid">
          <div className="f7-stat-tile">
            <p className="label">Games played</p>
            <strong>{entry.gamesPlayed}</strong>
          </div>
          <div className="f7-stat-tile">
            <p className="label">Games won</p>
            <strong>{entry.gamesWon}</strong>
          </div>
          <div className="f7-stat-tile">
            <p className="label">Win rate</p>
            <strong>{Math.round(entry.winRate * 100)}%</strong>
          </div>
          <div className="f7-stat-tile">
            <p className="label">Highest ever round</p>
            <strong>{entry.highestRoundScore}</strong>
          </div>
          <div className="f7-stat-tile">
            <p className="label">Bust count</p>
            <strong>{entry.bustCount}</strong>
          </div>
          <div className="f7-stat-tile">
            <p className="label">Average round</p>
            <strong>{entry.averageRoundScore.toFixed(1)}</strong>
          </div>
          <div className="f7-stat-tile">
            <p className="label">Highest final</p>
            <strong>{entry.highestFinalScore}</strong>
          </div>
          <div className="f7-stat-tile">
            <p className="label">Fastest win</p>
            <strong>{entry.fastestWinRounds !== null ? `${entry.fastestWinRounds}r` : '—'}</strong>
          </div>
          <div className="f7-stat-tile">
            <p className="label">Total points</p>
            <strong>{entry.totalPointsScored}</strong>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlayerStatsScreen
