import { useGameState, useReset } from '../../state/hooks'
import { useT } from '../../i18n'
import { SwordDivider } from '../SwordDivider'
import { SettingsButton } from '../SettingsButton'

export function GameOver({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { phase, levelIndex } = useGameState()
  const reset = useReset()
  const t = useT()
  const won = phase === 'Won'

  return (
    <div className="app">
      <SettingsButton onClick={onOpenSettings} />
      <div className="center-screen">
        <h1>{won ? t.gameOver.victory : t.gameOver.died}</h1>
        <SwordDivider />
        <p className="lede">{won ? t.gameOver.wonLede : t.gameOver.lostLede(levelIndex + 1)}</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="primary" onClick={() => reset()}>
            {t.gameOver.playAgain}
          </button>
        </div>
      </div>
    </div>
  )
}
