import { useGameState } from '../../state/hooks'
import { CLASSES } from '../../engine/classes'

export function StatPanel() {
  const { hero, turn, phase } = useGameState()
  const className = hero.classId ? CLASSES[hero.classId].name : 'Adventurer'

  return (
    <div className="panel">
      <h3>{className}</h3>
      <div className="stats">
        <div className="stat health">
          <span className="label">Health</span>
          <span className="value">
            {hero.health}/{hero.maxHealth}
          </span>
        </div>
        <div className="stat">
          <span className="label">Range</span>
          <span className="value">{turn ? turn.totals.range : hero.base.range}</span>
        </div>
        <div className="stat">
          <span className="label">Speed</span>
          <span className="value">
            {turn ? (
              <>
                <span className="left">{turn.speedLeft}</span>/{turn.totals.speed}
              </>
            ) : (
              hero.base.speed
            )}
          </span>
        </div>
        <div className="stat">
          <span className="label">Attack</span>
          <span className="value">
            {turn ? (
              <>
                <span className="left">{turn.attackLeft}</span>/{turn.totals.attack}
              </>
            ) : (
              hero.base.attack
            )}
          </span>
        </div>
        <div className="stat">
          <span className="label">Defense</span>
          <span className="value">{turn ? turn.totals.defense : hero.base.defense}</span>
        </div>
      </div>
      {phase === 'Adventurer' && (
        <p className="hint">
          Move costs 2 (orthogonal) / 3 (diagonal) Speed. Each attack spends the target's Defense
          in Attack points to remove 1 Health.
        </p>
      )}
    </div>
  )
}
