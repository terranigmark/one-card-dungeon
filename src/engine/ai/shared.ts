// Primitives shared by the monster AI strategies: range/LoS to the hero from an
// arbitrary tile, and the set of tiles a monster can legally stop on this turn.

import type { Coord, GameState, Monster } from '../types'
import { coordEq, keyToCoord } from '../grid'
import { costField, pathCost } from '../pathfinding'
import { hasLineOfSight } from '../los'
import { blocksMove } from '../board'

export type PositionMap = Map<number, Coord>

/** Movement-point distance from a tile to the hero (walls/chests block; units are transparent). */
export function rangeToHero(state: GameState, from: Coord): number | null {
  return pathCost(from, state.hero.pos, (c) => !blocksMove(state, c))
}

/** Line of sight from a tile to the hero, with other monsters (at their planned
 *  positions) acting as blockers. */
export function losToHero(
  state: GameState,
  from: Coord,
  positions: PositionMap,
  selfId: number,
): boolean {
  const blockers: Coord[] = [...state.walls]
  if (state.chest && !state.chest.opened) blockers.push(state.chest.pos)
  for (const m of state.monsters) {
    if (m.id === selfId) continue
    blockers.push(positions.get(m.id) ?? m.pos)
  }
  return hasLineOfSight(from, state.hero.pos, blockers)
}

export interface Stop {
  coord: Coord
  cost: number
}

/**
 * Tiles monster `m` can stop on this turn: reachable within its Speed, not a
 * wall / the hero / another monster. Monsters may move *through* other monsters
 * (transparent during traversal) but not stop on them or the hero.
 */
export function reachableStops(state: GameState, m: Monster, positions: PositionMap): Stop[] {
  const self = positions.get(m.id) ?? m.pos
  const traverse = (c: Coord) => !blocksMove(state, c) && !coordEq(c, state.hero.pos)
  const field = costField(self, traverse)
  const stops: Stop[] = []
  for (const [k, cost] of field) {
    if (cost > m.speed) continue
    const c = keyToCoord(k)
    if (blocksMove(state, c) || coordEq(c, state.hero.pos)) continue
    let occupied = false
    for (const other of state.monsters) {
      if (other.id === m.id) continue
      if (coordEq(positions.get(other.id) ?? other.pos, c)) {
        occupied = true
        break
      }
    }
    if (occupied) continue
    stops.push({ coord: c, cost })
  }
  if (!stops.some((s) => coordEq(s.coord, self))) stops.push({ coord: self, cost: 0 })
  return stops
}

/** Lexicographic comparison of two equal-length numeric tuples. */
export function lexLess(a: number[], b: number[]): boolean {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] < b[i]
  }
  return false
}
