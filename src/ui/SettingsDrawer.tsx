import { useEffect } from 'react'
import { useDispatch, useGameState, useReset } from '../state/hooks'
import { useThemeStore, type ThemeTweaks } from '../state/themeStore'
import type { Difficulty } from '../engine/types'

const OPTIONS: Array<{ id: Difficulty; label: string }> = [
  { id: 'faithful', label: 'Faithful' },
  { id: 'aggressive', label: 'Aggressive' },
]

// Appearance tweaks, surfaced as picker rows. `retroOnly` rows are hidden when
// the Modern skin is active (they only affect the pixel-art look).
const APPEARANCE: Array<{
  axis: keyof ThemeTweaks
  label: string
  options: Array<{ id: string; label: string }>
  retroOnly?: boolean
}> = [
  {
    axis: 'skin',
    label: 'Style',
    options: [
      { id: 'retro', label: 'Retro' },
      { id: 'modern', label: 'Modern' },
    ],
  },
  {
    axis: 'mode',
    label: 'Theme',
    options: [
      { id: 'dark', label: 'Dark' },
      { id: 'light', label: 'Light' },
    ],
  },
  {
    axis: 'palette',
    label: 'Palette',
    options: [
      { id: 'crypt', label: 'Crypt' },
      { id: 'classic', label: 'Classic' },
      { id: 'torchlit', label: 'Torchlit' },
    ],
  },
  {
    axis: 'type',
    label: 'Pixel font',
    retroOnly: true,
    options: [
      { id: 'arcade', label: 'Arcade' },
      { id: 'bitmap', label: 'Bitmap' },
      { id: 'terminal', label: 'Terminal' },
    ],
  },
  {
    axis: 'density',
    label: 'Density',
    options: [
      { id: 'cozy', label: 'Cozy' },
      { id: 'compact', label: 'Compact' },
    ],
  },
  {
    axis: 'decor',
    label: 'Decoration',
    retroOnly: true,
    options: [
      { id: 'minimal', label: 'Minimal' },
      { id: 'standard', label: 'Standard' },
      { id: 'ornate', label: 'Ornate' },
    ],
  },
]

/**
 * Settings as a right-anchored side drawer rather than a centered modal: the
 * board / title stays visible behind it, so the live appearance tweaks preview
 * in place. The scrim is transparent (not a dimming backdrop) for the same
 * reason; clicking it — or pressing Esc — closes the drawer.
 */
export function SettingsDrawer({ onClose }: { onClose: () => void }) {
  const { settings } = useGameState()
  const dispatch = useDispatch()
  const reset = useReset()
  const tweaks = useThemeStore((s) => s.tweaks)
  const setTweak = useThemeStore((s) => s.setTweak)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="false" aria-label="Settings">
        <div className="drawer-head">
          <h2>Settings</h2>
          <button className="drawer-close" aria-label="Close settings" onClick={onClose}>
            ✕
          </button>
        </div>

        <div>
          <h3>Enemy AI difficulty</h3>
          <div className="row" style={{ marginTop: 8 }}>
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

        <div>
          <h3>Appearance</h3>
          {APPEARANCE.filter((tweak) => !(tweak.retroOnly && tweaks.skin === 'modern')).map((tweak) => (
            <div key={tweak.axis} style={{ marginTop: 12 }}>
              <p className="hint" style={{ margin: '0 0 6px', textTransform: 'uppercase' }}>
                {tweak.label}
              </p>
              <div className="row">
                {tweak.options.map((o) => (
                  <button
                    key={o.id}
                    className={tweaks[tweak.axis] === o.id ? 'primary' : ''}
                    onClick={() => setTweak(tweak.axis, o.id)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="hint" style={{ marginTop: 12 }}>
            Switch between the retro pixel look and a clean modern UI, toggle a light theme, and tune
            the palette, font, spacing, and ornamentation. Saved across games.
          </p>
        </div>

        <div className="row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
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
      </aside>
    </>
  )
}
