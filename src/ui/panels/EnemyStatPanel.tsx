import { useGameState } from '../../state/hooks'
import { LEVELS } from '../../engine/levels'
import { useT } from '../../i18n'
import { isBossKind, KIND_EMOJI } from '../board/kinds'

export function EnemyStatPanel() {
  const { levelIndex, monsters } = useGameState()
  const t = useT()
  const cfg = LEVELS[levelIndex]
  // Prefer the live monster (a boss replaces the card's regular foe); fall back
  // to the level template once the level is cleared and the board is empty.
  const live = monsters[0]
  const monster = live ? { ...live, health: live.maxHealth } : cfg.monster
  const monsterKind = live ? live.kind : cfg.monsterKind

  return (
    <div className="panel">
      <h3>
        <span className="enemy-emoji">{KIND_EMOJI[monsterKind]}</span> {t.enemy[monsterKind].one}
        {isBossKind(monsterKind) && <span className="d12-tag"> D12</span>}
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
