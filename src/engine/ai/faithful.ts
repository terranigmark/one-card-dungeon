// Faithful (rulebook) monster AI: kite to be in Range + Line of Sight, as close
// as possible to maximum Range. Monsters are processed closest-to-hero first so
// that earlier movers claim tiles the later ones must route around.

import type { Coord, GameState, Monster } from '../types'
import { coordEq } from '../grid'
import { lexLess, losToHero, rangeToHero, reachableStops, type PositionMap } from './shared'
import type { MonsterMove, MonsterStrategy } from './index'

/**
 * Pick the best tile for `m` to stop on. Objective ladder:
 *   tier 0 — can attack (in Range + LoS): prefer the LARGEST range (kite to max).
 *   tier 1 — cannot attack: prefer the SMALLEST range (close in to attack later).
 * Ties break by cheaper move, then a fixed coordinate order for determinism.
 */
export function chooseDest(state: GameState, m: Monster, positions: PositionMap): Coord {
  const stops = reachableStops(state, m, positions)
  let best: Coord | null = null
  let bestKey: number[] | null = null

  for (const s of stops) {
    const r = rangeToHero(state, s.coord)
    if (r === null) continue
    const canAttack = r <= m.range && losToHero(state, s.coord, positions, m.id)
    const tier = canAttack ? 0 : 1
    // tier 0 wants high range (negate so "less" = better); tier 1 wants low range.
    const rangePref = canAttack ? -r : r
    const key = [tier, rangePref, s.cost, r, s.coord.y, s.coord.x]
    if (bestKey === null || lexLess(key, bestKey)) {
      bestKey = key
      best = s.coord
    }
  }
  return best ?? positions.get(m.id) ?? m.pos
}

export const faithfulStrategy: MonsterStrategy = {
  planMoves(state: GameState): MonsterMove[] {
    const positions: PositionMap = new Map(state.monsters.map((m) => [m.id, m.pos]))
    const order = [...state.monsters].sort((a, b) => {
      const ra = rangeToHero(state, a.pos) ?? Infinity
      const rb = rangeToHero(state, b.pos) ?? Infinity
      return ra - rb || a.id - b.id
    })
    const moves: MonsterMove[] = []
    for (const m of order) {
      const dest = chooseDest(state, m, positions)
      positions.set(m.id, dest)
      if (!coordEq(dest, m.pos)) moves.push({ id: m.id, to: dest })
      else moves.push({ id: m.id, to: m.pos })
    }
    return moves
  },
}
