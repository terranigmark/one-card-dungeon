// Derived, read-only view data for the UI. Reuses the same primitives the rules
// and AI use, so highlighting can never disagree with what the reducer allows.

import type { Coord, GameState } from './types'
import { pathCost, reachableWithin } from './pathfinding'
import { hasLineOfSight } from './los'
import { attackCostPerHit } from './rules'
import { heroTraverse, rangeTraverse, losBlockers, tileEmpty } from './board'

/** Tiles the hero can reach this turn, keyed by coordKey -> movement cost. */
export function reachableTiles(state: GameState): Map<string, number> {
  if (!state.turn) return new Map()
  return reachableWithin(state.hero.pos, state.turn.speedLeft, heroTraverse(state))
}

export interface TargetInfo {
  id: number
  range: number
  cost: number // attack points per hit
  hits: number // how many hits are affordable right now
}

/** Monsters the hero can currently attack (in Range + LoS), with affordability. */
export function attackableTargets(state: GameState): TargetInfo[] {
  const t = state.turn
  if (!t) return []
  const out: TargetInfo[] = []
  for (const m of state.monsters) {
    const r = pathCost(state.hero.pos, m.pos, rangeTraverse(state))
    if (r === null || r > t.totals.range) continue
    if (!hasLineOfSight(state.hero.pos, m.pos, losBlockers(state))) continue
    const cost = attackCostPerHit(m.defense)
    out.push({ id: m.id, range: r, cost, hits: Math.floor(t.attackLeft / cost) })
  }
  return out
}

/**
 * Whether the level's Treasure Chest can be opened right now: within Range and
 * Line of Sight, with enough Attack points left to match its value.
 */
export function chestOpenable(state: GameState): boolean {
  const t = state.turn
  const chest = state.chest
  if (!t || !chest || chest.opened) return false
  const r = pathCost(state.hero.pos, chest.pos, rangeTraverse(state))
  if (r === null || r > t.totals.range) return false
  if (!hasLineOfSight(state.hero.pos, chest.pos, losBlockers(state))) return false
  return t.attackLeft >= chest.value
}

/** Movement cost to a specific tile, or null if it isn't a legal move this turn. */
export function moveCostTo(state: GameState, to: Coord): number | null {
  if (!state.turn) return null
  if (!tileEmpty(state, to)) return null
  const c = pathCost(state.hero.pos, to, heroTraverse(state))
  if (c === null || c > state.turn.speedLeft || c === 0) return null
  return c
}
