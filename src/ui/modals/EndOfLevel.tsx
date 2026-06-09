import { useDispatch, useGameState } from '../../state/hooks'
import type { Skill } from '../../engine/types'

const SKILLS: Array<{ skill: Skill; label: string }> = [
  { skill: 'speed', label: 'Speed' },
  { skill: 'attack', label: 'Attack' },
  { skill: 'defense', label: 'Defense' },
  { skill: 'range', label: 'Range' },
]

export function EndOfLevel() {
  const { hero, levelIndex } = useGameState()
  const dispatch = useDispatch()

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Level {levelIndex + 1} cleared!</h2>
        <p className="hint">
          Rest before descending. Permanently upgrade one skill by +1, or heal back to full Health.
          You may do only one.
        </p>
        <div className="choice-grid">
          {SKILLS.map(({ skill, label }) => (
            <button
              key={skill}
              onClick={() => dispatch({ type: 'CHOOSE_REWARD', reward: { kind: 'skill', skill } })}
            >
              +1 {label}
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
          ❤️ Heal to full ({hero.health} → {hero.maxHealth})
        </button>
      </div>
    </div>
  )
}
