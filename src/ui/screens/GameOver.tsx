import { useGameState, useReset } from '../../state/hooks'
import { SwordDivider } from '../SwordDivider'
import { SettingsButton } from '../SettingsButton'

export function GameOver({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { phase, levelIndex } = useGameState()
  const reset = useReset()
  const won = phase === 'Won'

  return (
    <div className="app">
      <SettingsButton onClick={onOpenSettings} />
      <div className="center-screen">
        <h1>{won ? '🏆 Victory!' : '☠️ You Died'}</h1>
        <SwordDivider />
        <p className="lede">
          {won
            ? 'You cleared all 12 levels and claimed the Sceptre of MGuf-yn. The village is saved!'
            : `Your adventure ended on level ${levelIndex + 1}. The dungeon claims another hero.`}
        </p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="primary" onClick={() => reset()}>
            Play again
          </button>
        </div>
      </div>
    </div>
  )
}
