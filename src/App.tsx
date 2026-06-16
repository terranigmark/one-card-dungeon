import { useEffect, useRef, useState } from 'react'
import { useDebug, useDispatch, usePhase } from './state/hooks'
import { ClassSelect } from './ui/screens/ClassSelect'
import { GameScreen } from './ui/screens/GameScreen'
import { GameOver } from './ui/screens/GameOver'
import { SettingsDrawer } from './ui/SettingsDrawer'
import { DebugPanel } from './ui/DebugPanel'

// Secret cheat code: type these letters in order (anywhere) to toggle god-mode.
// Deliberately undocumented and absent from the UI so players never stumble on it.
const CHEAT = 'idkfa'

export default function App() {
  const phase = usePhase()
  const debug = useDebug()
  const dispatch = useDispatch()
  // Settings live at the app level so the same drawer is reachable from every
  // screen via a top-right gear, with no router (kept a pure phase-driven SPA).
  const [settingsOpen, setSettingsOpen] = useState(false)
  const openSettings = () => setSettingsOpen(true)

  // Listen for the cheat code as a rolling buffer of recent keystrokes. Ignored
  // while typing in a field so it can't fire accidentally.
  const bufRef = useRef('')
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      if (e.key.length !== 1) return
      bufRef.current = (bufRef.current + e.key.toLowerCase()).slice(-CHEAT.length)
      if (bufRef.current === CHEAT) {
        bufRef.current = ''
        dispatch({ type: 'TOGGLE_DEBUG' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])

  let screen
  if (phase === 'ClassSelect') screen = <ClassSelect onOpenSettings={openSettings} />
  else if (phase === 'Won' || phase === 'Lost') screen = <GameOver onOpenSettings={openSettings} />
  else screen = <GameScreen onOpenSettings={openSettings} />

  return (
    <>
      {screen}
      {settingsOpen && <SettingsDrawer onClose={() => setSettingsOpen(false)} />}
      {debug && <DebugPanel />}
    </>
  )
}
