import type { Coord } from './types'
import { GRID } from './types'

export function coordKey(c: Coord): string {
  return `${c.x},${c.y}`
}

export function keyToCoord(k: string): Coord {
  const i = k.indexOf(',')
  return { x: Number(k.slice(0, i)), y: Number(k.slice(i + 1)) }
}

export function coordEq(a: Coord, b: Coord): boolean {
  return a.x === b.x && a.y === b.y
}

export function inBounds(c: Coord): boolean {
  return c.x >= 0 && c.x < GRID && c.y >= 0 && c.y < GRID
}

export interface Step {
  coord: Coord
  cost: number
}

// Orthogonal moves cost 2, diagonal moves cost 3.
const DIRS: ReadonlyArray<{ dx: number; dy: number; cost: number }> = [
  { dx: 1, dy: 0, cost: 2 },
  { dx: -1, dy: 0, cost: 2 },
  { dx: 0, dy: 1, cost: 2 },
  { dx: 0, dy: -1, cost: 2 },
  { dx: 1, dy: 1, cost: 3 },
  { dx: 1, dy: -1, cost: 3 },
  { dx: -1, dy: 1, cost: 3 },
  { dx: -1, dy: -1, cost: 3 },
]

/** In-bounds 8-neighbours with their step cost. */
export function neighbors(c: Coord): Step[] {
  const out: Step[] = []
  for (const d of DIRS) {
    const n = { x: c.x + d.dx, y: c.y + d.dy }
    if (inBounds(n)) out.push({ coord: n, cost: d.cost })
  }
  return out
}

/** Step cost between two adjacent tiles (2 orthogonal, 3 diagonal). */
export function stepCost(a: Coord, b: Coord): number {
  const dx = Math.abs(a.x - b.x)
  const dy = Math.abs(a.y - b.y)
  return dx === 1 && dy === 1 ? 3 : 2
}

/** Every tile of the 5x5 board, row-major. */
export function allCoords(): Coord[] {
  const out: Coord[] = []
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) out.push({ x, y })
  }
  return out
}

/** Map a coordinate across a 180° card rotation. */
export function rotate180(c: Coord): Coord {
  return { x: GRID - 1 - c.x, y: GRID - 1 - c.y }
}
