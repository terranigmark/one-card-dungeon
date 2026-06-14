import { useGameState } from '../../state/hooks'
import { useT } from '../../i18n'

export function StatPanel() {
  const { hero, turn, phase, chest } = useGameState()
  const t = useT()
  const className =
    hero.classId && hero.classId !== 'none' ? t.classes[hero.classId].name : t.adventurer

  return (
    <div className="panel">
      <h3>{className}</h3>
      <div className="stats">
        <div className="stat health">
          <span className="label">{t.stats.health}</span>
          <span className="value">
            {hero.health}/{hero.maxHealth}
          </span>
        </div>
        <div className="stat">
          <span className="label">{t.stats.range}</span>
          <span className="value">{turn ? turn.totals.range : hero.base.range}</span>
        </div>
        <div className="stat">
          <span className="label">{t.stats.speed}</span>
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
          <span className="label">{t.stats.attack}</span>
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
          <span className="label">{t.stats.defense}</span>
          <span className="value">{turn ? turn.totals.defense : hero.base.defense}</span>
        </div>
        {chest && chest.opened && chest.remaining > 0 && (
          <div className="stat">
            <span className="label">🧰 {t.stats.loot}</span>
            <span className="value">{chest.remaining}</span>
          </div>
        )}
      </div>
      {phase === 'Adventurer' && <p className="hint">{t.statPanel.hint}</p>}
    </div>
  )
}
