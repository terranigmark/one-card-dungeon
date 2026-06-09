import { useGameState } from '../../state/hooks'
import { LEVELS } from '../../engine/levels'
import { useT } from '../../i18n'
import { KIND_EMOJI } from '../board/kinds'

export function EnemyStatPanel() {
  const { levelIndex } = useGameState()
  const t = useT()
  const cfg = LEVELS[levelIndex]
  const { monster, monsterKind } = cfg

  return (
    <div className="panel">
      <h3>
        <span className="enemy-emoji">{KIND_EMOJI[monsterKind]}</span> {t.enemy[monsterKind].one}
      </h3>
      <div className="stats">
        <div className="stat health">
          <span className="label">{t.stats.health}</span>
          <span className="value">{monster.health}</span>
        </div>
        <div className="stat">
          <span className="label">{t.stats.range}</span>
          <span className="value">{monster.range}</span>
        </div>
        <div className="stat">
          <span className="label">{t.stats.speed}</span>
          <span className="value">{monster.speed}</span>
        </div>
        <div className="stat">
          <span className="label">{t.stats.attack}</span>
          <span className="value">{monster.attack}</span>
        </div>
        <div className="stat">
          <span className="label">{t.stats.defense}</span>
          <span className="value">{monster.defense}</span>
        </div>
      </div>
    </div>
  )
}
