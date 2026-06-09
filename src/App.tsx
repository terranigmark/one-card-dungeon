import { useState } from 'react'
import { usePhase } from './state/hooks'
import { ClassSelect } from './ui/screens/ClassSelect'
import { GameScreen } from './ui/screens/GameScreen'
import { GameOver } from './ui/screens/GameOver'
import { SettingsDrawer } from './ui/SettingsDrawer'

export default function App() {
  const phase = usePhase()
  // Settings live at the app level so the same drawer is reachable from every
  // screen via a top-right gear, with no router (kept a pure phase-driven SPA).
  const [settingsOpen, setSettingsOpen] = useState(false)
  const openSettings = () => setSettingsOpen(true)

  let screen
  if (phase === 'ClassSelect') screen = <ClassSelect onOpenSettings={openSettings} />
  else if (phase === 'Won' || phase === 'Lost') screen = <GameOver onOpenSettings={openSettings} />
  else screen = <GameScreen onOpenSettings={openSettings} />

  return (
    <>
      {screen}
      {settingsOpen && <SettingsDrawer onClose={() => setSettingsOpen(false)} />}
    </>
  )
}
