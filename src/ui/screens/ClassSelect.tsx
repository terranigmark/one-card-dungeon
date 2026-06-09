import { useDispatch, useGameState } from '../../state/hooks'
import { CLASS_LIST } from '../../engine/classes'
import { useT } from '../../i18n'
import { SwordDivider } from '../SwordDivider'
import { SettingsButton } from '../SettingsButton'

export function ClassSelect({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { hero } = useGameState()
  const dispatch = useDispatch()
  const t = useT()
  const selected = hero.classId

  return (
    <div className="app">
      <SettingsButton onClick={onOpenSettings} />
      <div className="center-screen">
        <h1>{t.app.title}</h1>
        <SwordDivider />
        <p className="lede">{t.classSelect.lede}</p>
        <div className="classes">
          {CLASS_LIST.map((c) => {
            const tc = t.classes[c.id]
            return (
              <button
                key={c.id}
                className={`class-card ${c.id === 'none' ? 'no-class' : ''} ${selected === c.id ? 'selected' : ''}`}
                onClick={() => dispatch({ type: 'SELECT_CLASS', classId: c.id })}
              >
                <span className="cname">{tc.name}</span>
                <span className="cability">{tc.ability}</span>
                <span className="cblurb">{tc.blurb}</span>
              </button>
            )
          })}
        </div>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="primary" disabled={!selected} onClick={() => dispatch({ type: 'START_GAME' })}>
            {t.classSelect.enter}
          </button>
        </div>
        <p className="banner">{t.classSelect.banner}</p>
      </div>
    </div>
  )
}
