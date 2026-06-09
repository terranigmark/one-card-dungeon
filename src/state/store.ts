import { create } from 'zustand'
import type { Action } from '../engine/actions'
import type { GameState, Settings } from '../engine/types'
import { createInitialState, gameReducer } from '../engine/reducer'

export interface GameStore {
  state: GameState
  dispatch: (action: Action) => void
  reset: (settings?: Settings) => void
}

function freshSettings(): Settings {
  // A fresh seed per session; gameplay is otherwise fully deterministic.
  return { difficulty: 'faithful', seed: (Math.random() * 0x7fffffff) | 0 }
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: createInitialState(freshSettings()),
  dispatch: (action) => set((s) => ({ state: gameReducer(s.state, action) })),
  reset: (settings) => set({ state: createInitialState(settings ?? get().state.settings) }),
}))

// Dev-only handle for debugging/inspection from the console. Tree-shaken out of
// production builds.
if (import.meta.env.DEV) {
  ;(window as unknown as { __ocd: typeof useGameStore }).__ocd = useGameStore
}
