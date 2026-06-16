import { useState } from 'react'
import { useDispatch, useGameState } from '../state/hooks'
import { BOSS_LEVELS, LEVELS, TOTAL_LEVELS } from '../engine/levels'

/**
 * Hidden developer overlay for god-mode (see `state.debug`). It is never part of
 * the normal UI — it only mounts once the secret cheat code in `App.tsx` flips
 * `debug` on. Strings are intentionally hardcoded English (dev-only, not i18n'd).
 *
 * God-mode itself (no damage, free movement/range, one-hit kills) lives in the
 * reducer; this panel just exposes the meta controls: a state readout and level
 * warping. Collapsed to a small badge by default so it stays out of the way.
 */
export function DebugPanel() {
  const state = useGameState()
  const dispatch = useDispatch()
  const [open, setOpen] = useState(true)

  const jump = (idx: number, boss = false) => dispatch({ type: 'DEBUG_JUMP_LEVEL', idx, boss })

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 8,
        left: 8,
        zIndex: 9999,
        font: '12px/1.4 ui-monospace, Menlo, monospace',
        color: '#0f0',
        background: 'rgba(0,0,0,0.85)',
        border: '1px solid #0f0',
        borderRadius: 6,
        maxWidth: 280,
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'block',
          width: '100%',
          boxSizing: 'border-box',
          padding: '4px 8px',
          fontWeight: 700,
          letterSpacing: 1,
        }}
      >
        ⚙ DEBUG {open ? '▾' : '▸'}
      </button>

      {open && (
        <div style={{ padding: '0 8px 8px' }}>
          <div style={{ opacity: 0.8, marginBottom: 6 }}>
            lvl {LEVELS[state.levelIndex]?.level} · {state.phase} · seed {state.settings.seed} ·
            hp {state.hero.health}/{state.hero.maxHealth}
          </div>

          <div style={{ marginBottom: 4, opacity: 0.7 }}>Jump to level:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {Array.from({ length: TOTAL_LEVELS }).map((_, i) => (
              <button
                key={i}
                onClick={() => jump(i)}
                style={btn(i === state.levelIndex)}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div style={{ margin: '6px 0 4px', opacity: 0.7 }}>Boss arenas:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {Object.keys(BOSS_LEVELS).map((lvl) => {
              const idx = Number(lvl) - 1
              return (
                <button key={lvl} onClick={() => jump(idx, true)} style={btn(false)}>
                  {lvl}★
                </button>
              )
            })}
          </div>

          <button
            onClick={() => dispatch({ type: 'TOGGLE_DEBUG' })}
            style={{ ...btn(false), marginTop: 8, width: '100%' }}
          >
            Disable god-mode
          </button>
        </div>
      )}
    </div>
  )
}

function btn(active: boolean): React.CSSProperties {
  return {
    all: 'unset',
    cursor: 'pointer',
    textAlign: 'center',
    minWidth: 22,
    padding: '2px 6px',
    border: '1px solid #0f0',
    borderRadius: 4,
    background: active ? '#0f0' : 'transparent',
    color: active ? '#000' : '#0f0',
  }
}
