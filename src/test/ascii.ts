import type { Coord } from '../engine/types'

export interface ParsedGrid {
  walls: Coord[]
  monsters: Coord[]
  hero?: Coord
}

/**
 * Parse a readable ASCII board for tests. Rows top->bottom are y=0..4,
 * columns left->right are x=0..4. Tokens are whitespace separated:
 *   .  empty   #  wall   H  hero   M  monster
 *
 *   parseGrid(`
 *     H . . . .
 *     . # . . .
 *     . . . . M
 *     . . . . .
 *     . . . . .
 *   `)
 */
export function parseGrid(s: string): ParsedGrid {
  const rows = s
    .trim()
    .split('\n')
    .map((r) => r.trim().split(/\s+/))
  const walls: Coord[] = []
  const monsters: Coord[] = []
  let hero: Coord | undefined
  rows.forEach((row, y) => {
    row.forEach((ch, x) => {
      if (ch === '#') walls.push({ x, y })
      else if (ch === 'H') hero = { x, y }
      else if (ch === 'M') monsters.push({ x, y })
    })
  })
  return { walls, monsters, hero }
}
