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

/** A tile removed from a boss arena — off the board entirely (M'Guf-yn Returns). */
export function isVoid(state: GameState, c: Coord): boolean {
  return state.voids.some((v) => coordEq(v, c))
}

/** An unopened Treasure Chest sits here — it blocks like a wall until opened. */
export function unopenedChestAt(state: GameState, c: Coord): boolean {
  return !!state.chest && !state.chest.opened && coordEq(state.chest.pos, c)
}

/** A static obstacle for movement / range: a wall, a void, or an unopened chest. */
export function blocksMove(state: GameState, c: Coord): boolean {
  return isWall(state, c) || isVoid(state, c) || unopenedChestAt(state, c)
}

export function monsterAt(state: GameState, c: Coord): Monster | undefined {
  return state.monsters.find((m) => coordEq(m.pos, c))
}

export function heroAt(state: GameState, c: Coord): boolean {
  return coordEq(state.hero.pos, c)
}

/** A tile a unit could stop on: not a wall/chest, the hero, or a monster. */
export function tileEmpty(state: GameState, c: Coord): boolean {
  return !blocksMove(state, c) && !heroAt(state, c) && !monsterAt(state, c)
}

/** Hero movement: cannot pass through walls, chests or monsters. */
export function heroTraverse(state: GameState): Passable {
  return (c) => !blocksMove(state, c) && !monsterAt(state, c)
}

/** Range distance: walls and unopened chests block; units are transparent. */
export function rangeTraverse(state: GameState): Passable {
  return (c) => !blocksMove(state, c)
}

/** Line-of-sight blockers: walls, every monster tile, and an unopened chest.
 *  Endpoints are filtered out inside hasLineOfSight, so passing the full list is
 *  safe (a chest you are targeting won't block sight to itself). */
export function losBlockers(state: GameState): Coord[] {
  const blockers = [...state.walls, ...state.voids, ...state.monsters.map((m) => m.pos)]
  if (state.chest && !state.chest.opened) blockers.push(state.chest.pos)
  return blockers
}

/** Whether monster `m` can hit the hero this turn (in Range and Line of Sight). */
export function monsterCanHitHero(state: GameState, m: Monster): boolean {
  const r = pathCost(m.pos, state.hero.pos, (c) => !blocksMove(state, c))
  if (r === null || r > m.range) return false
  const blockers: Coord[] = [...state.walls, ...state.voids]
  if (state.chest && !state.chest.opened) blockers.push(state.chest.pos)
  for (const other of state.monsters) if (other.id !== m.id) blockers.push(other.pos)
  return hasLineOfSight(m.pos, state.hero.pos, blockers)
}
