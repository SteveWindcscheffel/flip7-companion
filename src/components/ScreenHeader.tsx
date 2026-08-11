interface ScreenHeaderProps {
  title: string
  subtitle?: string
  onBack: () => void
  backLabel?: string
}

/**
 * Back-chevron + centred title/subtitle + right-hand spacer, shared by
 * New Game, Leaderboard, Hall of Fame, and the aux (history/stats) screens.
 */
export function ScreenHeader({ title, subtitle, onBack, backLabel = '←' }: ScreenHeaderProps) {
  return (
    <div className="header-row">
      <button type="button" className="btn btn--ghost btn--icon" onClick={onBack} aria-label="Back">
        {backLabel}
      </button>
      <div className="header-row__center">
        <h1 className="screen-title">{title}</h1>
        {subtitle ? <p className="screen-subtitle">{subtitle}</p> : null}
      </div>
      <div className="header-row__spacer" />
    </div>
  )
}
