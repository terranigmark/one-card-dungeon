import { useEffect } from 'react'
import { useDispatch, useGameState } from '../../state/hooks'
import { LEVELS } from '../../engine/levels'
import { useT } from '../../i18n'
import { Board } from '../board/Board'
import { StatPanel } from '../panels/StatPanel'
import { EnemyStatPanel } from '../panels/EnemyStatPanel'
import { TurnPanel } from '../panels/TurnPanel'
import { ActionLog } from '../panels/ActionLog'
import { EndOfLevel } from '../modals/EndOfLevel'
import { BossChoice } from '../modals/BossChoice'

export function GameScreen({ onOpenSettings }: { onOpenSettings: () => void }) {
  const state = useGameState()
  const dispatch = useDispatch()
  const t = useT()
  const cfg = LEVELS[state.levelIndex]

  // Monster phases resolve automatically, with a short beat for readability.
  useEffect(() => {
    if (state.phase === 'MonsterMove') {
      const t = setTimeout(() => dispatch({ type: 'RESOLVE_MONSTER_MOVE' }), 600)
      return () => clearTimeout(t)
    }
    if (state.phase === 'MonsterAttack') {
      const t = setTimeout(() => dispatch({ type: 'RESOLVE_MONSTER_ATTACK' }), 600)
      return () => clearTimeout(t)
    }
  }, [state.phase, dispatch])

  return (
    <div className="app">
      <div className="topbar">
        <span className="title">{t.app.title}</span>
        <span className="level-pill">
          {t.gameScreen.levelPill(
            cfg.level,
            t.enemy[state.monsters[0]?.kind ?? cfg.monsterKind].many,
          )}
        </span>
        <span className="spacer" />
        <span className="tag">{t.gameScreen.aiTag(t.difficulty[state.settings.difficulty])}</span>
        <button onClick={onOpenSettings}>{t.gameScreen.settingsButton}</button>
      </div>

      <div className="game-layout">
        <Board />
        {/* Child order is load-bearing: the mobile reorder in index.css targets
            these by :nth-child (1=Stat, 2=Enemy, 3=Turn, 4=Log). */}
        <div className="side-col">
          <StatPanel />
          <EnemyStatPanel />
          <TurnPanel />
          <ActionLog />
        </div>
      </div>

      {state.phase === 'EndOfLevel' && <EndOfLevel />}
      {state.phase === 'BossChoice' && <BossChoice />}
    </div>
  )
}
