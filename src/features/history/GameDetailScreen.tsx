import { ScreenHeader } from '../../components/ScreenHeader'
import type { Game } from '../../types/game'
import { getAccentColor } from '../../utils/playerAccents'
import { getLeaderboard } from '../../utils/scoring'

interface GameDetailScreenProps {
  game: Game
  onBack: () => void
}

export function GameDetailScreen({ game, onBack }: GameDetailScreenProps) {
  const standings = getLeaderboard(game)

  return (
    <div className="screen screen--wide">
      <ScreenHeader title="REPLAY" subtitle="Final standings and every round" onBack={onBack} />

      <div className="card card--list f7-aux-card">
        <p className="label">FINAL STANDINGS</p>
        {standings.map((entry, index) => (
          <div key={entry.player.id} className="f7-winner-standings-row">
            <span className="f7-winner-standings-rank">{index + 1}</span>
            <span className="f7-winner-standings-name" style={{ color: getAccentColor(entry.player.accent), fontSize: 16 }}>
              {entry.player.name}
            </span>
            <span className="f7-winner-standings-total" style={{ fontSize: 15 }}>
              {entry.total}
            </span>
          </div>
        ))}
      </div>

      <div className="f7-aux-list">
        {game.players.map((player) => {
          let running = 0
          const rows = game.rounds.map((round) => {
            running += round.scores[player.id] ?? 0
            return { round, running }
          })

          return (
            <div key={player.id} className="card card--list f7-aux-card">
              <p className="label" style={{ color: getAccentColor(player.accent) }}>
                {player.name.toUpperCase()}
              </p>
              <div className="f7-table">
                <div className="f7-table-row f7-table-row--head">
                  <span>Round</span>
                  <span>Score</span>
                  <span>Total</span>
                </div>
                {rows.map(({ round, running: runningTotal }) => (
                  <div key={round.id} className="f7-table-row">
                    <span>#{round.number}</span>
                    <span>{round.scores[player.id] ?? 0}</span>
                    <span>{runningTotal}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default GameDetailScreen
