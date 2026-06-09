import { create } from 'zustand'
import { messages, type Lang, type Messages } from './strings'

// Language is a persisted view preference, modelled like the appearance tweaks
// in themeStore: a small Zustand store, mirrored to localStorage, applied to
// <html lang> as a side effect. The initial value is the user's device language
// (falling back to English) unless they've previously chosen one.

// NOTE: this key is duplicated in index.html's pre-paint boot script — keep both
// in sync so <html lang> is correct before the first frame.
const STORAGE_KEY = 'ocd:lang'

function isLang(v: unknown): v is Lang {
  return v === 'en' || v === 'es'
}

/** The best supported match for the device's preferred languages. */
function deviceLang(): Lang {
  if (typeof navigator === 'undefined') return 'en'
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const p of prefs) {
    // Match on the primary subtag, so 'es-419' / 'es-ES' all resolve to Spanish.
    if (p?.toLowerCase().startsWith('es')) return 'es'
    if (p?.toLowerCase().startsWith('en')) return 'en'
  }
  return 'en'
}

function loadLang(): Lang {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (isLang(raw)) return raw
    } catch {
      // Corrupt/blocked storage — fall through to the device default.
    }
  }
  return deviceLang()
}

function applyLang(lang: Lang): void {
  if (typeof document !== 'undefined') document.documentElement.lang = lang
}

interface LangStore {
  lang: Lang
  setLang: (lang: Lang) => void
}

export const useLangStore = create<LangStore>((set) => ({
  lang: loadLang(),
  setLang: (lang) =>
    set(() => {
      applyLang(lang)
      try {
        localStorage.setItem(STORAGE_KEY, lang)
      } catch {
        // Ignore write failures (private mode / storage disabled).
      }
      return { lang }
    }),
}))

// Reflect the resolved language onto <html lang> as soon as this module loads.
applyLang(useLangStore.getState().lang)

/** Subscribe a component to the active language's message bundle. */
export function useT(): Messages {
  return messages[useLangStore((s) => s.lang)]
}
