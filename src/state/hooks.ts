import { useGameStore } from './store'

// Granular selector hooks so each component re-renders only when its slice
// changes (the whole point of using Zustand over context here).

export const useDispatch = () => useGameStore((s) => s.dispatch)
export const useReset = () => useGameStore((s) => s.reset)

export const usePhase = () => useGameStore((s) => s.state.phase)
export const useHero = () => useGameStore((s) => s.state.hero)
export const useMonsters = () => useGameStore((s) => s.state.monsters)
export const useWalls = () => useGameStore((s) => s.state.walls)
export const useEnergy = () => useGameStore((s) => s.state.energy)
export const useTurn = () => useGameStore((s) => s.state.turn)
export const useLevelIndex = () => useGameStore((s) => s.state.levelIndex)
export const useClassState = () => useGameStore((s) => s.state.classState)
export const useSettings = () => useGameStore((s) => s.state.settings)
export const useLog = () => useGameStore((s) => s.state.log)
export const useDebug = () => useGameStore((s) => s.state.debug ?? false)

/** Escape hatch for components that genuinely need the whole state (selectors). */
export const useGameState = () => useGameStore((s) => s.state)
