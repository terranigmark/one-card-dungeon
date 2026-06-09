import type { DieFace } from './types'

// A small, fully deterministic PRNG (mulberry32). State is a 32-bit integer that
// threads through each call, so dice rolls are reproducible from a seed — which
// keeps the AI and tests deterministic.

export interface RngResult<T> {
  value: T
  state: number
}

export function nextFloat(state: number): RngResult<number> {
  const a = (state + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return { value, state: a }
}

export function rollDie(state: number): RngResult<DieFace> {
  const r = nextFloat(state)
  const face = (Math.floor(r.value * 6) + 1) as DieFace
  return { value: face, state: r.state }
}

export function rollDice(count: number, state: number): RngResult<DieFace[]> {
  const faces: DieFace[] = []
  let s = state
  for (let i = 0; i < count; i++) {
    const r = rollDie(s)
    faces.push(r.value)
    s = r.state
  }
  return { value: faces, state: s }
}
