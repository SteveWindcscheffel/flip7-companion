import { useMemo } from 'react'
import type { Game } from '../../types/game'
import { getAccentColor } from '../../utils/playerAccents'
import { getLeaderboard } from '../../utils/scoring'

interface WinnerScreenProps {
  game: Game
  onNewGame: () => void
  onHome: () => void
}

const CONFETTI_COLORS = ['#b7862f', '#d85a49', '#f8edd6', '#3c5ecf', '#7b53b5']

function buildConfetti() {
  return Array.from({ length: 26 }, (_, i) => ({
    left: `${((i * 3.9 + (i % 3) * 4) % 96).toFixed(2)}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    duration: `${(2.6 + (i % 5) * 0.45).toFixed(2)}s`,
    delay: `${((i % 9) * 0.32).toFixed(2)}s`
  }))
}

export function WinnerScreen({ game, onNewGame, onHome }: WinnerScreenProps) {
  const confetti = useMemo(buildConfetti, [])
  const standings = getLeaderboard(game)
  const winnerEntry = standings[0]
  const winnerColor = winnerEntry ? getAccentColor(winnerEntry.player.accent) : '#b7862f'

  return (
    <div className="screen screen--winner">
      <div className="f7-confetti-field" aria-hidden="true">
        {confetti.map((piece, index) => (
          <div
            key={index}
            className="f7-confetti-piece"
            style={{
              left: piece.left,
              background: piece.color,
              animationDuration: piece.duration,
              animationDelay: piece.delay
            }}
          />
        ))}
      </div>

      <div className="f7-winner-banner-row">
        <div className="f7-winner-banner">WINNER</div>
      </div>

      <div className="card card--bracketed f7-winner-card">
        <div className="f7-winner-name" style={{ color: winnerColor }}>
          {winnerEntry?.player.name.toUpperCase() ?? ''}
        </div>
        <div className="f7-winner-points">{winnerEntry?.total ?? 0} POINTS</div>
        <p className="f7-winner-rounds">{game.rounds.length} rounds played</p>
        <div className="f7-winner-divider" />
        <p className="f7-winner-standings-label">FINAL STANDINGS</p>
        {standings.map((entry, index) => {
          const color = getAccentColor(entry.player.accent)
          return (
            <div key={entry.player.id} className="f7-winner-standings-row">
              <span className="f7-winner-standings-rank">{index + 1}</span>
              <span className="f7-winner-standings-name" style={{ color }}>
                {entry.player.name}
              </span>
              <span className="f7-winner-standings-total" style={{ color }}>
                {entry.total}
              </span>
            </div>
          )
        })}
      </div>

      <div className="f7-winner-footer">
        <button type="button" className="btn btn--primary" onClick={onNewGame}>
          NEW GAME
        </button>
        <button type="button" className="btn btn--secondary" onClick={onHome}>
          HOME
        </button>
      </div>
    </div>
  )
}

export default WinnerScreen
