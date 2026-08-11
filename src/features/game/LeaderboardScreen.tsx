import { ScreenHeader } from '../../components/ScreenHeader'
import type { Game } from '../../types/game'
import { getAccentColor } from '../../utils/playerAccents'
import { getLeaderboard } from '../../utils/scoring'

interface LeaderboardScreenProps {
  game: Game
  onBack: () => void
}

export function LeaderboardScreen({ game, onBack }: LeaderboardScreenProps) {
  const standings = getLeaderboard(game)
  const roundNo = game.rounds.length + 1

  return (
    <div className="screen screen--wide">
      <ScreenHeader title="LEADERBOARD" subtitle={`Round ${roundNo}`} onBack={onBack} />

      <div className="f7-leaderboard-scroll">
        {standings.map((entry, index) => (
          <div key={entry.player.id} className="card card--list f7-leaderboard-row">
            <div className="f7-leaderboard-rank" style={{ background: getAccentColor(entry.player.accent) }}>
              {index + 1}
            </div>
            <div className="f7-leaderboard-name">{entry.player.name}</div>
            <div className="f7-leaderboard-total numeral" style={{ color: getAccentColor(entry.player.accent) }}>
              {entry.total}
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="btn btn--secondary" onClick={onBack}>
        BACK TO GAME
      </button>
    </div>
  )
}

export default LeaderboardScreen
