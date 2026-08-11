import type { ReactNode } from 'react'

interface GameHeaderProps {
  leftLabel: string
  onLeft: () => void
  round: number
  positionLabel: string
  rightLabel?: string
  onRight?: () => void
}

/**
 * The header row shared by the active-game player card and score-entry
 * screens: a left icon button, a centred gold ROUND badge with a position
 * line beneath it, and an optional right icon button (leaderboard on the
 * player-card screen; blank on score entry).
 */
export function GameHeader({ leftLabel, onLeft, round, positionLabel, rightLabel, onRight }: GameHeaderProps) {
  return (
    <div className="header-row">
      <button type="button" className="btn btn--ghost btn--icon-sm" onClick={onLeft} aria-label={leftLabel}>
        {leftLabel}
      </button>
      <div className="header-row__center">
        <span className="plaque--round">ROUND {round}</span>
        <p className="screen-subtitle" style={{ letterSpacing: '.2em', marginTop: 5 }}>
          {positionLabel}
        </p>
      </div>
      {onRight ? (
        <button type="button" className="btn btn--ghost btn--icon-sm" onClick={onRight} aria-label="Leaderboard">
          {rightLabel}
        </button>
      ) : (
        <div className="header-row__spacer--sm" />
      )}
    </div>
  )
}

interface NameplateProps {
  name: string
  accentColor: string
  crown?: boolean
  children?: ReactNode
}

/** The accent-coloured player nameplate used on the front card and entry card. */
export function Nameplate({ name, accentColor, crown, children }: NameplateProps) {
  return (
    <div className="f7-nameplate-row">
      <div className="f7-nameplate" style={{ background: accentColor }}>
        {crown ? (
          <span className="f7-nameplate__crown" aria-hidden="true">
            👑
          </span>
        ) : null}
        {name.toUpperCase()}
        {children}
      </div>
    </div>
  )
}
