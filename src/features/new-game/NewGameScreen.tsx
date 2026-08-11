import { type KeyboardEvent, type TouchEvent, useRef, useState } from 'react'
import { ScreenHeader } from '../../components/ScreenHeader'
import type { Player } from '../../types/game'
import { getAccentColor } from '../../utils/playerAccents'
import { MAX_PLAYERS, MIN_PLAYERS } from '../../utils/gameSetup'

interface NewGameScreenProps {
  roster: Player[]
  selected: string[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onAddPlayer: (name: string) => void
  onStartGame: () => void
  onBack: () => void
}

const SWIPE_THRESHOLD = 50

export function NewGameScreen({ roster, selected, onToggle, onRemove, onAddPlayer, onStartGame, onBack }: NewGameScreenProps) {
  const [editMode, setEditMode] = useState(false)
  const [swipedId, setSwipedId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const touchStartX = useRef<number | null>(null)

  const selectedCount = selected.length
  const canStart = selectedCount >= MIN_PLAYERS && selectedCount <= MAX_PLAYERS
  const startLabel = selectedCount > MAX_PLAYERS ? `MAX ${MAX_PLAYERS} PLAYERS` : `START GAME (${selectedCount})`
  const hint = editMode
    ? 'Tap × to delete a name for good'
    : selectedCount >= MAX_PLAYERS
      ? `Table full — ${MAX_PLAYERS} players is the maximum`
      : 'Tap to pick · swipe left or Manage to delete'

  const handleSwipeStart = (event: TouchEvent<HTMLButtonElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  const handleSwipeEnd = (event: TouchEvent<HTMLButtonElement>, playerId: string) => {
    if (touchStartX.current === null) return
    const dx = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current
    touchStartX.current = null
    if (dx < -SWIPE_THRESHOLD) setSwipedId(playerId)
    else if (dx > SWIPE_THRESHOLD) setSwipedId(null)
  }

  const handleAdd = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    onAddPlayer(trimmed)
    setNewName('')
  }

  const handleNameKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="screen screen--wide">
      <ScreenHeader title="NEW GAME" subtitle="Select 2–10 players" onBack={onBack} />

      <div className="card f7-newgame-card">
        <div className="section-heading">
          <p className="label" style={{ margin: 0 }}>
            RECENT PLAYERS
          </p>
          <button
            type="button"
            className={`pill ${editMode ? 'pill--active' : ''}`}
            onClick={() => {
              setEditMode((current) => !current)
              setSwipedId(null)
            }}
          >
            {editMode ? 'DONE' : 'MANAGE'}
          </button>
        </div>

        <div className="f7-roster-scroll">
          {roster.length === 0 ? (
            <p className="f7-empty-note">Add a player below to build your table.</p>
          ) : (
            roster.map((player) => {
              const isSelected = selected.includes(player.id)
              const isOpen = editMode || swipedId === player.id
              return (
                <div key={player.id} className="f7-roster-row">
                  <button
                    type="button"
                    className="f7-roster-row__delete"
                    onClick={() => onRemove(player.id)}
                    aria-label={`Delete ${player.name}`}
                  >
                    DELETE
                  </button>
                  <div
                    className={`f7-roster-row__content${isSelected ? ' f7-roster-row__content--selected' : ''}${
                      isOpen && !editMode ? ' f7-roster-row__content--swiped' : ''
                    }`}
                  >
                    <button
                      type="button"
                      className="f7-roster-row__main"
                      onClick={() => (swipedId === player.id ? setSwipedId(null) : onToggle(player.id))}
                      onTouchStart={handleSwipeStart}
                      onTouchEnd={(event) => handleSwipeEnd(event, player.id)}
                    >
                      <span
                        className="f7-checkbox"
                        style={{ background: isSelected ? getAccentColor(player.accent) : 'rgba(255,255,255,.6)' }}
                      >
                        {isSelected ? '✓' : ''}
                      </span>
                      <span className="f7-roster-row__name">{player.name}</span>
                      <span className="accent-dot" style={{ backgroundColor: getAccentColor(player.accent) }} aria-hidden="true" />
                    </button>
                    {editMode ? (
                      <button
                        type="button"
                        className="f7-roster-row__manage-x"
                        aria-label={`Delete ${player.name}`}
                        onClick={() => onRemove(player.id)}
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <p className="f7-hint">{hint}</p>

        <div className="f7-add-row">
          <input
            className="f7-add-row__input"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={handleNameKey}
            placeholder="Add new player"
          />
          <button type="button" className="f7-add-row__submit" onClick={handleAdd} aria-label="Add player">
            +
          </button>
        </div>
      </div>

      <button type="button" className="btn btn--primary" style={{ opacity: canStart ? 1 : 0.45 }} disabled={!canStart} onClick={onStartGame}>
        {startLabel}
      </button>
    </div>
  )
}

export default NewGameScreen
