import { useDispatch, useGameState } from '../../state/hooks'
import type { Skill } from '../../engine/types'
import { useT } from '../../i18n'

const SKILLS: Skill[] = ['speed', 'attack', 'defense', 'range']

export function EndOfLevel() {
  const { hero, levelIndex } = useGameState()
  const dispatch = useDispatch()
  const t = useT()

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>{t.endOfLevel.title(levelIndex + 1)}</h2>
        <p className="hint">{t.endOfLevel.hint}</p>
        <div className="choice-grid">
          {SKILLS.map((skill) => (
            <button
              key={skill}
              onClick={() => dispatch({ type: 'CHOOSE_REWARD', reward: { kind: 'skill', skill } })}
            >
              {t.endOfLevel.plus(t.stats[skill])}
              <br />
              <small>
                {hero.base[skill]} → {hero.base[skill] + 1}
              </small>
            </button>
          ))}
        </div>
        <button
          className="primary"
          onClick={() => dispatch({ type: 'CHOOSE_REWARD', reward: { kind: 'heal' } })}
        >
          {t.endOfLevel.healToFull(hero.health, hero.maxHealth)}
        </button>
      </div>
    </div>
  )
}
