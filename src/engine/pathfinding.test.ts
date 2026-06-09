import { describe, it, expect } from 'vitest'
import { costField, pathCost, reachableWithin } from './pathfinding'
import { coordKey } from './grid'
import type { Coord } from './types'

const open = () => true
const notWall =
  (walls: Coord[]) =>
  (c: Coord): boolean =>
    !walls.some((w) => w.x === c.x && w.y === c.y)

describe('pathfinding cost field', () => {
  it('orthogonal neighbour costs 2, diagonal 3, two orthogonal 4', () => {
    const field = costField({ x: 2, y: 2 }, open)
    expect(field.get(coordKey({ x: 3, y: 2 }))).toBe(2) // ortho
    expect(field.get(coordKey({ x: 2, y: 1 }))).toBe(2) // ortho
    expect(field.get(coordKey({ x: 3, y: 3 }))).toBe(3) // diagonal
    expect(field.get(coordKey({ x: 4, y: 2 }))).toBe(4) // two ortho
    expect(field.get(coordKey({ x: 2, y: 2 }))).toBe(0) // source
  })

  it('prefers a diagonal (3) over two orthogonals (4) to a diagonal tile', () => {
    const field = costField({ x: 0, y: 0 }, open)
    expect(field.get(coordKey({ x: 1, y: 1 }))).toBe(3)
  })

  it('routes around walls', () => {
    // Wall column at x=1 for y=0,1 forces a detour to reach (2,0).
    const walls: Coord[] = [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ]
    const cost = pathCost({ x: 0, y: 0 }, { x: 2, y: 0 }, notWall(walls))
    // Cannot go straight; cheapest is (0,0)->(1,2)? blocked-aware diagonal detour.
    // (0,0)-d->(1,1) blocked; go (0,0)-d->(... ) Best: (0,0)->(0,1)2->(1,2)d3->(2,1)d3->(2,0)2 = 10,
    // or (0,0)->(0,2)4? Compute via engine and assert it is strictly worse than the open 4.
    expect(cost).not.toBeNull()
    expect(cost!).toBeGreaterThan(4)
  })

  it('reports unreachable tiles as null', () => {
    // Fully wall off the target tile's neighbourhood.
    const walls: Coord[] = [
      { x: 3, y: 4 },
      { x: 4, y: 3 },
      { x: 3, y: 3 },
    ]
    const cost = pathCost({ x: 0, y: 0 }, { x: 4, y: 4 }, notWall(walls))
    // (4,4) is enclosed by walls on its only approaches -> unreachable.
    expect(cost).toBeNull()
  })
})

describe('range vs movement passability', () => {
  it('range treats an occupied target tile as reachable', () => {
    const monsterAt: Coord = { x: 2, y: 0 }
    // For RANGE: only walls block; a monster tile is transparent.
    const rangePassable = () => true
    const range = pathCost({ x: 0, y: 0 }, monsterAt, rangePassable)
    expect(range).toBe(4) // two orthogonal steps

    // For MOVEMENT: the monster tile is solid, so you cannot end there...
    const movePassable = (c: Coord) => !(c.x === monsterAt.x && c.y === monsterAt.y)
    // ...but pathCost still measures the distance onto it for reach purposes.
    const move = pathCost({ x: 0, y: 0 }, monsterAt, movePassable)
    expect(move).toBe(4)
  })

  it('reachableWithin respects the budget', () => {
    const r = reachableWithin({ x: 2, y: 2 }, 3, open)
    expect(r.has(coordKey({ x: 3, y: 2 }))).toBe(true) // cost 2
    expect(r.has(coordKey({ x: 3, y: 3 }))).toBe(true) // cost 3
    expect(r.has(coordKey({ x: 4, y: 2 }))).toBe(false) // cost 4
  })
})
