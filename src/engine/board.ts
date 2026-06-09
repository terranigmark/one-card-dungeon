// Helpers that read a GameState: occupancy queries and the passability
// predicates shared by the reducer, selectors and the AI. Centralising these
// keeps the movement/range/line-of-sight rules in exactly one place.

import type { Coord, GameState, Monster } from './types'
import type { Passable } from './pathfinding'
import { coordEq } from './grid'
import { pathCost } from './pathfinding'
import { hasLineOfSight } from './los'

export function isWall(state: GameState, c: Coord): boolean {
  return state.walls.some((w) => coordEq(w, c))
}

export function monsterAt(state: GameState, c: Coord): Monster | undefined {
  return state.monsters.find((m) => coordEq(m.pos, c))
}

export function heroAt(state: GameState, c: Coord): boolean {
  return coordEq(state.hero.pos, c)
}

/** A tile a unit could stop on: not a wall, the hero, or a monster. */
export function tileEmpty(state: GameState, c: Coord): boolean {
  return !isWall(state, c) && !heroAt(state, c) && !monsterAt(state, c)
}

/** Hero movement: cannot pass through walls or monsters. */
export function heroTraverse(state: GameState): Passable {
  return (c) => !isWall(state, c) && !monsterAt(state, c)
}

/** Range distance: only walls block; units are transparent (geometric reach). */
export function rangeTraverse(state: GameState): Passable {
  return (c) => !isWall(state, c)
}

/** Line-of-sight blockers: walls plus every monster tile. Endpoints are filtered
 *  out inside hasLineOfSight, so passing the full list is safe. */
export function losBlockers(state: GameState): Coord[] {
  return [...state.walls, ...state.monsters.map((m) => m.pos)]
}

/** Whether monster `m` can hit the hero this turn (in Range and Line of Sight). */
export function monsterCanHitHero(state: GameState, m: Monster): boolean {
  const r = pathCost(m.pos, state.hero.pos, (c) => !isWall(state, c))
  if (r === null || r > m.range) return false
  const blockers: Coord[] = [...state.walls]
  for (const other of state.monsters) if (other.id !== m.id) blockers.push(other.pos)
  return hasLineOfSight(m.pos, state.hero.pos, blockers)
}
