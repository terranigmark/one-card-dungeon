import { create } from 'zustand'

// Presentation-only "tweaks" from the pixel redesign. Each axis is applied as a
// data-attribute on <html>, which index.css reads via attribute selectors
// (html[data-palette='crypt'] { … }). Kept separate from the engine's Settings
// (which stays pure/serialisable) since these are pure view preferences and are
// persisted to localStorage across games.

export type Palette = 'crypt' | 'classic' | 'torchlit'
export type TypeFace = 'arcade' | 'bitmap' | 'terminal'
export type Density = 'cozy' | 'compact'
export type Decor = 'minimal' | 'standard' | 'ornate'
export type Skin = 'retro' | 'modern'
export type Mode = 'dark' | 'light'
// Mobile-only: how the panels below the board are arranged. 'stacked' is the
// vertical column; 'carousel' is a swipeable, dot-paginated single-card view.
export type Layout = 'stacked' | 'carousel'

export interface ThemeTweaks {
  skin: Skin
  mode: Mode
  palette: Palette
  type: TypeFace
  density: Density
  decor: Decor
  layout: Layout
}

export const TWEAK_DEFAULTS: ThemeTweaks = {
  skin: 'retro',
  mode: 'dark',
  palette: 'classic',
  type: 'arcade',
  density: 'cozy',
  decor: 'standard',
  layout: 'stacked',
}

// Allowed values per axis. Doubles as a guard for persisted values that may
// drift if the option set ever changes.
export const TWEAK_OPTIONS: { [K in keyof ThemeTweaks]: readonly ThemeTweaks[K][] } = {
  skin: ['retro', 'modern'],
  mode: ['dark', 'light'],
  palette: ['crypt', 'classic', 'torchlit'],
  type: ['arcade', 'bitmap', 'terminal'],
  density: ['cozy', 'compact'],
  decor: ['minimal', 'standard', 'ornate'],
  layout: ['stacked', 'carousel'],
}

// NOTE: this key is duplicated in index.html's pre-paint boot script — keep both
// in sync so persisted tweaks apply before the first frame.
const STORAGE_KEY = 'ocd:tweaks'

const AXES = Object.keys(TWEAK_DEFAULTS) as (keyof ThemeTweaks)[]

function loadTweaks(): ThemeTweaks {
  const out: ThemeTweaks = { ...TWEAK_DEFAULTS }
  if (typeof localStorage === 'undefined') return out
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return out
    const parsed = JSON.parse(raw) as Partial<Record<keyof ThemeTweaks, string>>
    for (const axis of AXES) {
      const v = parsed[axis]
      if (v && (TWEAK_OPTIONS[axis] as readonly string[]).includes(v)) {
        out[axis] = v as never
      }
    }
  } catch {
    // Corrupt/blocked storage — fall back to defaults.
  }
  return out
}

function applyTweaks(t: ThemeTweaks): void {
  if (typeof document === 'undefined') return
  const el = document.documentElement
  el.dataset.skin = t.skin
  el.dataset.mode = t.mode
  el.dataset.palette = t.palette
  el.dataset.type = t.type
  el.dataset.density = t.density
  el.dataset.decor = t.decor
  el.dataset.layout = t.layout
}

interface ThemeStore {
  tweaks: ThemeTweaks
  setTweak: (axis: keyof ThemeTweaks, value: string) => void
  resetTweaks: () => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
  tweaks: loadTweaks(),
  setTweak: (axis, value) =>
    set((s) => {
      if (!(TWEAK_OPTIONS[axis] as readonly string[]).includes(value)) return s
      const next: ThemeTweaks = { ...s.tweaks, [axis]: value }
      applyTweaks(next)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Ignore write failures (private mode / storage disabled).
      }
      return { tweaks: next }
    }),
  resetTweaks: () =>
    set(() => {
      const next: ThemeTweaks = { ...TWEAK_DEFAULTS }
      applyTweaks(next)
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // Ignore.
      }
      return { tweaks: next }
    }),
}))

// Reflect persisted tweaks onto <html> as soon as this module loads, so the DOM
// matches the store regardless of which screen mounts first.
applyTweaks(useThemeStore.getState().tweaks)
