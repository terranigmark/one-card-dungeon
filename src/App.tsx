import { usePhase } from './state/hooks'
import { ClassSelect } from './ui/screens/ClassSelect'
import { GameScreen } from './ui/screens/GameScreen'
import { GameOver } from './ui/screens/GameOver'

export default function App() {
  const phase = usePhase()
  if (phase === 'ClassSelect') return <ClassSelect />
  if (phase === 'Won' || phase === 'Lost') return <GameOver />
  return <GameScreen />
}
