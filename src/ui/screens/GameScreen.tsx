import { useEffect, useState } from 'react'
import { useDispatch, useGameState } from '../../state/hooks'
import { LEVELS } from '../../engine/levels'
import { Board } from '../board/Board'
import { StatPanel } from '../panels/StatPanel'
import { TurnPanel } from '../panels/TurnPanel'
import { ActionLog } from '../panels/ActionLog'
import { EndOfLevel } from '../modals/EndOfLevel'
import { SettingsModal } from '../modals/SettingsModal'

export function GameScreen() {
  const state = useGameState()
  const dispatch = useDispatch()
  const [showSettings, setShowSettings] = useState(false)
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
        <span className="title">One-Card Dungeon</span>
        <span className="level-pill">
          Level {cfg.level}/12 · {cfg.monsterKind}s
        </span>
        <span className="spacer" />
        <span className="tag">{state.settings.difficulty} AI</span>
        <button onClick={() => setShowSettings(true)}>⚙ Settings</button>
      </div>

      <div className="game-layout">
        <Board />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <StatPanel />
          <TurnPanel />
          <ActionLog />
        </div>
      </div>

      {state.phase === 'EndOfLevel' && <EndOfLevel />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
