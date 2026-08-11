import { type TouchEvent, useRef } from 'react'
import { GameHeader, Nameplate } from '../../components/PlayerCard'
import type { Game } from '../../types/game'
import { getAccentColor } from '../../utils/playerAccents'
import { getLeaderboard, getPlayerTotal, getRecentRoundSummaries } from '../../utils/scoring'

interface PlayerCardScreenProps {
  game: Game
  cardIndex: number
  onCardIndexChange: (index: number) => void
  onHome: () => void
  onLeaderboard: () => void
  onUndo: () => void
  onEnterRound: () => void
}

const WINNING_TARGET = 200
const CLOSE_THRESHOLD = 170
const PIPS = 10
const SWIPE_THRESHOLD = 50

export function PlayerCardScreen({ game, cardIndex, onCardIndexChange, onHome, onLeaderboard, onUndo, onEnterRound }: PlayerCardScreenProps) {
  const touchStartX = useRef<number | null>(null)
  const total = game.players.length
  const safeIndex = Math.min(cardIndex, Math.max(0, total - 1))
  const currentPlayer = game.players[safeIndex]
  const prevPlayer = game.players[(safeIndex - 1 + total) % total]
  const nextPlayer = game.players[(safeIndex + 1) % total]

  const standings = getLeaderboard(game)
  const leaderId = standings[0]?.player.id ?? null
  const currentTotal = getPlayerTotal(game, currentPlayer.id)
  const filledPips = Math.min(PIPS, Math.round((currentTotal / WINNING_TARGET) * PIPS))

  const recentRounds = getRecentRoundSummaries(game, currentPlayer.id, 4).slice().reverse()
  const roundNo = game.rounds.length + 1

  const goTo = (index: number) => {
    onCardIndexChange(((index % total) + total) % total)
  }

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return
    const dx = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < SWIPE_THRESHOLD) return
    goTo(dx < 0 ? safeIndex + 1 : safeIndex - 1)
  }

  return (
    <div className="screen">
      <GameHeader
        leftLabel="✕"
        onLeft={onHome}
        round={roundNo}
        positionLabel={`PLAYER ${safeIndex + 1} OF ${total}`}
        rightLabel="☰"
        onRight={onLeaderboard}
      />

      <div className="f7-card-stack" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="f7-peek-card f7-peek-card--prev" aria-hidden="true">
          <div className="f7-peek-card__tab" style={{ background: getAccentColor(prevPlayer.accent) }} />
          <div className="f7-peek-card__block" />
        </div>
        <div className="f7-peek-card f7-peek-card--next" aria-hidden="true">
          <div className="f7-peek-card__tab" style={{ background: getAccentColor(nextPlayer.accent) }} />
          <div className="f7-peek-card__block" />
        </div>

        <div key={currentPlayer.id} className="card card--bracketed f7-front-card">
          <Nameplate name={currentPlayer.name} accentColor={getAccentColor(currentPlayer.accent)} crown={currentPlayer.id === leaderId && game.rounds.length > 0} />

          <div className="f7-hero-total numeral">{currentTotal}</div>

          <div className="rule-row">
            <div className="hairline" />
            <p className="label">RACE TO 200</p>
            <div className="hairline" />
          </div>
          <div className="f7-pip-bar">
            {Array.from({ length: PIPS }, (_, i) => (
              <div
                key={i}
                className="f7-pip"
                style={i < filledPips ? { background: getAccentColor(currentPlayer.accent) } : undefined}
              />
            ))}
          </div>
          <p className="f7-fraction-label">{currentTotal} / 200</p>

          <div className="rule-row">
            <div className="hairline" />
            <p className="label">LIVE STANDINGS</p>
            <div className="hairline" />
          </div>
          <div className="f7-standings-scroll">
            {standings.map((entry, index) => {
              const flag = entry.total >= WINNING_TARGET ? 'OVER 200' : entry.total >= CLOSE_THRESHOLD ? 'CLOSE' : ''
              const isCurrent = entry.player.id === currentPlayer.id
              return (
                <div key={entry.player.id} className={`f7-standings-row${isCurrent ? ' f7-standings-row--current' : ''}`}>
                  <span className="f7-standings-rank" style={{ background: getAccentColor(entry.player.accent) }}>
                    {index + 1}
                  </span>
                  <span className="f7-standings-name">{entry.player.name}</span>
                  {flag ? <span className="f7-standings-flag">{flag}</span> : null}
                  <span className="f7-standings-total">{entry.total}</span>
                </div>
              )
            })}
          </div>

          <div className="rule-row">
            <div className="hairline" />
            <p className="label">LAST ROUNDS</p>
            <div className="hairline" />
          </div>
          <div className="f7-rounds-row">
            {recentRounds.length > 0 ? (
              recentRounds.map(({ round, score }) => (
                <div key={round.id} className="f7-round-tile">
                  <div className="f7-round-tile__label">R{round.number}</div>
                  <div className="f7-round-tile__score">{score}</div>
                </div>
              ))
            ) : (
              <div className="f7-round-tile">
                <div className="f7-round-tile__label">—</div>
                <div className="f7-round-tile__score">—</div>
              </div>
            )}
          </div>

          <div className="f7-dots-row">
            <span className="f7-dots-row__arrow">‹</span>
            {game.players.map((player, index) => (
              <span key={player.id} className={`f7-dot${index === safeIndex ? ' f7-dot--active' : ''}`} />
            ))}
            <span className="f7-dots-row__arrow">›</span>
          </div>
          <p className="f7-swipe-hint">Swipe for other players</p>
        </div>
      </div>

      <div className="f7-game-footer">
        <button type="button" className="btn btn--ghost btn--square" onClick={() => goTo(safeIndex - 1)} aria-label="Previous player">
          ‹
        </button>
        <button type="button" className="btn btn--ghost btn--square" onClick={onUndo} disabled={game.rounds.length === 0}>
          UNDO
        </button>
        <button type="button" className="btn btn--primary" onClick={onEnterRound}>
          ENTER ROUND {roundNo}
        </button>
        <button type="button" className="btn btn--ghost btn--square" onClick={() => goTo(safeIndex + 1)} aria-label="Next player">
          ›
        </button>
      </div>
    </div>
  )
}

export default PlayerCardScreen
