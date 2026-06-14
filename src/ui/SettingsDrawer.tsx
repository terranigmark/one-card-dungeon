import { useEffect } from 'react'
import { useDispatch, useGameState, useReset } from '../state/hooks'
import { useThemeStore, type ThemeTweaks } from '../state/themeStore'
import { useT, useLangStore, LANGS, LANG_LABELS } from '../i18n'
import type { Difficulty } from '../engine/types'

const DIFFICULTIES: Difficulty[] = ['faithful', 'aggressive']

// Appearance axes, surfaced as picker rows. `retroOnly` rows are hidden when
// the Modern skin is active (they only affect the pixel-art look). Labels for
// the axis and each option come from the active language's bundle.
const APPEARANCE: Array<{
  axis: keyof ThemeTweaks
  options: string[]
  retroOnly?: boolean
}> = [
  { axis: 'skin', options: ['retro', 'modern'] },
  { axis: 'mode', options: ['dark', 'light'] },
  { axis: 'palette', options: ['crypt', 'classic', 'torchlit'] },
  { axis: 'type', retroOnly: true, options: ['arcade', 'bitmap', 'terminal'] },
  { axis: 'density', options: ['cozy', 'compact'] },
  { axis: 'decor', retroOnly: true, options: ['minimal', 'standard', 'ornate'] },
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
  const t = useT()
  const lang = useLangStore((s) => s.lang)
  const setLang = useLangStore((s) => s.setLang)
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
      <aside className="drawer" role="dialog" aria-modal="false" aria-label={t.settings.title}>
        <div className="drawer-head">
          <h2>{t.settings.title}</h2>
          <button className="drawer-close" aria-label={t.settings.close} onClick={onClose}>
            ✕
          </button>
        </div>

        <div>
          <h3>{t.settings.language}</h3>
          <div className="row" style={{ marginTop: 8 }}>
            {LANGS.map((l) => (
              <button key={l} className={lang === l ? 'primary' : ''} onClick={() => setLang(l)}>
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 8 }}>
            {t.settings.languageHint}
          </p>
        </div>

        <div>
          <h3>{t.settings.aiDifficulty}</h3>
          <div className="row" style={{ marginTop: 8 }}>
            {DIFFICULTIES.map((id) => (
              <button
                key={id}
                className={settings.difficulty === id ? 'primary' : ''}
                onClick={() => dispatch({ type: 'SET_DIFFICULTY', difficulty: id })}
              >
                {t.difficulty[id]}
              </button>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 8 }}>
            {t.settings.aiHint}
          </p>
        </div>

        <div>
          <h3>{t.settings.expansion}</h3>
          <div className="row" style={{ marginTop: 8 }}>
            <button
              className={settings.treasureChests ? 'primary' : ''}
              onClick={() => dispatch({ type: 'SET_TREASURE', enabled: true })}
            >
              {t.settings.expansionOn}
            </button>
            <button
              className={!settings.treasureChests ? 'primary' : ''}
              onClick={() => dispatch({ type: 'SET_TREASURE', enabled: false })}
            >
              {t.settings.expansionOff}
            </button>
          </div>
          <p className="hint" style={{ marginTop: 8 }}>
            {t.settings.expansionHint}
          </p>
        </div>

        <div>
          <h3>{t.settings.appearance}</h3>
          {APPEARANCE.filter((tweak) => !(tweak.retroOnly && tweaks.skin === 'modern')).map((tweak) => {
            const optionLabels = t.appearance.options[tweak.axis] as Record<string, string>
            return (
              <div key={tweak.axis} style={{ marginTop: 12 }}>
                <p className="hint" style={{ margin: '0 0 6px', textTransform: 'uppercase' }}>
                  {t.appearance[tweak.axis]}
                </p>
                <div className="row">
                  {tweak.options.map((id) => (
                    <button
                      key={id}
                      className={tweaks[tweak.axis] === id ? 'primary' : ''}
                      onClick={() => setTweak(tweak.axis, id)}
                    >
                      {optionLabels[id]}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          <p className="hint" style={{ marginTop: 12 }}>
            {t.settings.appearanceHint}
          </p>
        </div>

        <div className="row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
          <button
            onClick={() => {
              reset()
              onClose()
            }}
          >
            {t.settings.restart}
          </button>
          <button className="primary" onClick={onClose}>
            {t.settings.closeButton}
          </button>
        </div>
      </aside>
    </>
  )
}
