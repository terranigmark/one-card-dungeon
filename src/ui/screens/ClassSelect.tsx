import { useDispatch, useGameState } from '../../state/hooks'
import { CLASS_LIST } from '../../engine/classes'
import { SwordDivider } from '../SwordDivider'
import { SettingsButton } from '../SettingsButton'

export function ClassSelect({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { hero } = useGameState()
  const dispatch = useDispatch()
  const selected = hero.classId

  return (
    <div className="app">
      <SettingsButton onClick={onOpenSettings} />
      <div className="center-screen">
        <h1>One-Card Dungeon</h1>
        <SwordDivider />
        <p className="lede">
          Descend through 12 increasingly deadly levels to claim the Sceptre of MGuf-yn. Each turn,
          roll three dice and assign them to your Speed, Attack and Defense, then move and strike.
          Choose your class to begin.
        </p>
        <div className="classes">
          {CLASS_LIST.map((c) => (
            <button
              key={c.id}
              className={`class-card ${c.id === 'none' ? 'no-class' : ''} ${selected === c.id ? 'selected' : ''}`}
              onClick={() => dispatch({ type: 'SELECT_CLASS', classId: c.id })}
            >
              <span className="cname">{c.name}</span>
              <span className="cability">{c.ability}</span>
              <span className="cblurb">{c.blurb}</span>
            </button>
          ))}
        </div>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="primary" disabled={!selected} onClick={() => dispatch({ type: 'START_GAME' })}>
            Enter the Dungeon →
          </button>
        </div>
        <p className="banner">
          Single-player · You control the hero (green die); monsters (red dice) are AI-controlled. A
          die's number is its current Health.
        </p>
      </div>
    </div>
  )
}
