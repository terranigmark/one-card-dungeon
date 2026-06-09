import { useGameState } from '../../state/hooks'
import { LEVELS } from '../../engine/levels'
import { KIND_EMOJI } from '../board/kinds'

export function EnemyStatPanel() {
  const { levelIndex } = useGameState()
  const cfg = LEVELS[levelIndex]
  const { monster, monsterKind } = cfg
  const name = monsterKind.charAt(0).toUpperCase() + monsterKind.slice(1)

  return (
    <div className="panel">
      <h3>
        <span className="enemy-emoji">{KIND_EMOJI[monsterKind]}</span> {name}
      </h3>
      <div className="stats">
        <div className="stat health">
          <span className="label">Health</span>
          <span className="value">{monster.health}</span>
        </div>
        <div className="stat">
          <span className="label">Range</span>
          <span className="value">{monster.range}</span>
        </div>
        <div className="stat">
          <span className="label">Speed</span>
          <span className="value">{monster.speed}</span>
        </div>
        <div className="stat">
          <span className="label">Attack</span>
          <span className="value">{monster.attack}</span>
        </div>
        <div className="stat">
          <span className="label">Defense</span>
          <span className="value">{monster.defense}</span>
        </div>
      </div>
    </div>
  )
}
