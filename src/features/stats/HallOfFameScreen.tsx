import { ScreenHeader } from '../../components/ScreenHeader'
import type { Game } from '../../types/game'
import { getHallOfFameEntries } from '../../utils/scoring'

interface HallOfFameScreenProps {
  history: Game[]
  onBack: () => void
}

export function HallOfFameScreen({ history, onBack }: HallOfFameScreenProps) {
  const completedCount = history.filter((game) => game.status === 'complete').length
  const records = getHallOfFameEntries(history)

  return (
    <div className="screen screen--wide">
      <ScreenHeader title="HALL OF FAME" subtitle={`${completedCount} games recorded`} onBack={onBack} />

      <div className="card f7-hof-card">
        {records.every((record) => record.entries.length === 0) ? (
          <p className="f7-empty-note">Once completed games exist, records like most wins and biggest margins will appear here.</p>
        ) : (
          records
            .filter((record) => record.entries.length > 0)
            .map((record) => {
              const top = record.entries[0]
              return (
                <div key={record.title} className="f7-hof-row">
                  <div className="foil-disc f7-hof-disc">{record.title.charAt(0).toUpperCase()}</div>
                  <div>
                    <p className="f7-hof-label">{record.title.toUpperCase()}</p>
                    <p className="f7-hof-value">
                      {top.player.name} ({top.value})
                    </p>
                  </div>
                </div>
              )
            })
        )}
      </div>
    </div>
  )
}

export default HallOfFameScreen
