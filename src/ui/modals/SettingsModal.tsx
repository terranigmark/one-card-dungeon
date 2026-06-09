import { useDispatch, useGameState, useReset } from '../../state/hooks'
import type { Difficulty } from '../../engine/types'

const OPTIONS: Array<{ id: Difficulty; label: string }> = [
  { id: 'faithful', label: 'Faithful' },
  { id: 'aggressive', label: 'Aggressive' },
]

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings } = useGameState()
  const dispatch = useDispatch()
  const reset = useReset()

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>
        <div>
          <h3>Enemy AI difficulty</h3>
          <div className="row" style={{ justifyContent: 'center', marginTop: 8 }}>
            {OPTIONS.map((o) => (
              <button
                key={o.id}
                className={settings.difficulty === o.id ? 'primary' : ''}
                onClick={() => dispatch({ type: 'SET_DIFFICULTY', difficulty: o.id })}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 8 }}>
            Faithful follows the rulebook's kiting behaviour. Aggressive coordinates monsters to
            maximise the damage they deal each turn.
          </p>
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <button
            onClick={() => {
              reset()
              onClose()
            }}
          >
            Restart game
          </button>
          <button className="primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
