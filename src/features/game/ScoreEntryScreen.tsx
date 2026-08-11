import { GameHeader, Nameplate } from '../../components/PlayerCard'
import type { Game } from '../../types/game'
import { getAccentColor } from '../../utils/playerAccents'
import { getLiveStandings, getPlayerTotal } from '../../utils/scoring'

interface ScoreEntryScreenProps {
  game: Game
  entryIndex: number
  draftScores: Record<string, string>
  error: string
  onDraftChange: (playerId: string, value: string) => void
  onClearError: () => void
  onCancel: () => void
  onPrevious: () => void
  onBust: () => void
  onAdvance: () => void
}

const WINNING_TARGET = 200
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'C']

function nextValue(current: string, key: string): string {
  if (key === 'C') return ''
  if (key === '⌫') return current.slice(0, -1)
  if (current.length >= 3) return current
  return (current + key).replace(/^0+(?=\d)/, '')
}

export function ScoreEntryScreen({
  game,
  entryIndex,
  draftScores,
  error,
  onDraftChange,
  onClearError,
  onCancel,
  onPrevious,
  onBust,
  onAdvance
}: ScoreEntryScreenProps) {
  const total = game.players.length
  const safeIndex = Math.min(entryIndex, total - 1)
  const currentPlayer = game.players[safeIndex]
  const currentValue = draftScores[currentPlayer.id] ?? ''
  const roundNo = game.rounds.length + 1
  const runningTotal = getPlayerTotal(game, currentPlayer.id)
  const scoredCount = safeIndex

  const liveStandings = getLiveStandings(game, draftScores)
  const overPlayers = liveStandings.filter((entry) => entry.total >= WINNING_TARGET)

  const alertText =
    overPlayers.length === 1
      ? `${overPlayers[0].player.name.toUpperCase()} HAS PASSED 200 — FINAL ROUND`
      : overPlayers.length > 1
        ? `${overPlayers.length} PLAYERS PAST 200 — FINAL ROUND`
        : ''

  const top3 = liveStandings.slice(0, 3).map((entry, index) => {
    const playerOrder = game.players.findIndex((player) => player.id === entry.player.id)
    const isCurrent = playerOrder === safeIndex
    const hasPlayed = playerOrder < safeIndex
    return {
      rank: index + 1,
      entry,
      isCurrent,
      hasPlayed
    }
  })

  const youIndex = liveStandings.findIndex((entry) => entry.player.id === currentPlayer.id)
  const showNowRow = youIndex > 2
  const you = liveStandings[youIndex]
  const leaderTotal = liveStandings[0]?.total ?? 0
  const gap = you ? leaderTotal - you.total : 0

  const handleKey = (key: string) => {
    onClearError()
    onDraftChange(currentPlayer.id, nextValue(currentValue, key))
  }

  const isLastPlayer = safeIndex === total - 1

  return (
    <div className="screen">
      <GameHeader leftLabel="✕" onLeft={onCancel} round={roundNo} positionLabel={`PLAYER ${safeIndex + 1} OF ${total}`} />

      <div className="card card--bracketed f7-entry-card">
        <Nameplate name={currentPlayer.name} accentColor={getAccentColor(currentPlayer.accent)} />

        <p className="f7-entry-meta">
          Total {runningTotal} · {scoredCount} of {total} scored this round
        </p>

        <div className="f7-entry-well">
          <div className={`f7-entry-well__value${currentValue === '' ? ' f7-entry-well__value--placeholder' : ''}`}>
            {currentValue === '' ? '0' : currentValue}
          </div>
        </div>
        <p className="f7-entry-error">{error}</p>

        {alertText ? <div className="f7-entry-alert">{alertText}</div> : null}

        <div className="f7-top3-row">
          <span className="f7-top3-label">TOP 3</span>
          <div className="f7-top3-tiles">
            {top3.map(({ rank, entry, isCurrent, hasPlayed }) => (
              <div
                key={entry.player.id}
                className={`f7-top3-tile${isCurrent ? ' f7-top3-tile--current' : ''}${!isCurrent && !hasPlayed ? ' f7-top3-tile--upcoming' : ''}`}
              >
                <span
                  className={`f7-top3-disc${isCurrent ? ' f7-top3-disc--current' : ''}`}
                  style={
                    hasPlayed || isCurrent
                      ? { background: getAccentColor(entry.player.accent), color: '#fff6e0' }
                      : { background: 'transparent', borderColor: getAccentColor(entry.player.accent), color: getAccentColor(entry.player.accent) }
                  }
                >
                  {rank}
                </span>
                <span className="f7-top3-name">{entry.player.name}</span>
                <span className={`f7-top3-total${entry.total >= WINNING_TARGET ? ' f7-top3-total--over' : ''}`}>{entry.total}</span>
              </div>
            ))}
          </div>
        </div>

        {showNowRow && you ? (
          <div className="f7-now-row">
            <span className="f7-now-row__label">NOW</span>
            <div className="f7-now-row__tile">
              <span className="f7-now-row__disc" style={{ background: getAccentColor(you.player.accent) }}>
                {youIndex + 1}
              </span>
              <span className="f7-now-row__name">{you.player.name}</span>
              <span className="f7-now-row__gap">{gap > 0 ? `−${gap} to lead` : 'leading'}</span>
              <span className="f7-now-row__total">{you.total}</span>
            </div>
          </div>
        ) : null}

        <div className="f7-keypad">
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className={`f7-key${key === '⌫' || key === 'C' ? ' f7-key--small' : ''}`}
              onClick={() => handleKey(key)}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className="f7-entry-footer">
        <button
          type="button"
          className="btn btn--ghost"
          style={{ opacity: safeIndex > 0 ? 1 : 0.4 }}
          disabled={safeIndex === 0}
          onClick={onPrevious}
          aria-label="Previous player"
        >
          ‹
        </button>
        <button type="button" className="btn btn--green" onClick={onBust}>
          BUST (0)
        </button>
        <button type="button" className="btn btn--primary" onClick={onAdvance}>
          {isLastPlayer ? 'SAVE ROUND' : `NEXT (${total - 1 - safeIndex})`}
        </button>
      </div>
    </div>
  )
}

export default ScoreEntryScreen
