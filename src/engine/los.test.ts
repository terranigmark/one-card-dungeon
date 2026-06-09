import { describe, it, expect } from 'vitest'
import { hasLineOfSight } from './los'
import { parseGrid } from '../test/ascii'
import type { Coord } from './types'

function los(grid: string, blockersFromMonsters = true): boolean {
  const { walls, monsters, hero } = parseGrid(grid)
  if (!hero || monsters.length === 0) throw new Error('need H and at least one M')
  const target = monsters[monsters.length - 1]
  const blockers: Coord[] = [...walls]
  if (blockersFromMonsters) {
    for (const m of monsters) if (m !== target) blockers.push(m)
  }
  return hasLineOfSight(hero, target, blockers)
}

describe('line of sight', () => {
  it('clear board has line of sight', () => {
    expect(
      los(`
        H . . . .
        . . . . .
        . . . . .
        . . . . .
        . . . . M
      `),
    ).toBe(true)
  })

  it('a wall directly between two tiles in the same row blocks sight', () => {
    expect(
      los(`
        . . . . .
        . . . . .
        H # M . .
        . . . . .
        . . . . .
      `),
    ).toBe(false)
  })

  it('a single offset wall can be peeked around (corner-to-corner)', () => {
    // Wall at (1,1); target diagonal at (2,2). You can sight past the corner.
    expect(
      los(`
        H . . . .
        . # . . .
        . . M . .
        . . . . .
        . . . . .
      `),
    ).toBe(true)
  })

  it('a monster fully boxed in by walls is not visible', () => {
    expect(
      los(`
        H . . . .
        . # # # .
        . # M # .
        . # # # .
        . . . . .
      `),
    ).toBe(false)
  })

  it('a front monster shields a back monster in a one-wide corridor', () => {
    // Corridor along row y=2; first monster is the shield, last is the target.
    expect(
      los(`
        # # # # #
        # # # # #
        H M . . M
        # # # # #
        # # # # #
      `),
    ).toBe(false)
  })

  it('without the shielding monster the back tile is visible down the corridor', () => {
    // Same corridor but the middle tile is empty: clear sight.
    expect(
      los(`
        # # # # #
        # # # # #
        H . . . M
        # # # # #
        # # # # #
      `),
    ).toBe(true)
  })

  it('the target tile itself never blocks', () => {
    // Two adjacent monsters; the near one is the target.
    expect(
      los(`
        H . . . .
        . . . . .
        . . M M .
        . . . . .
        . . . . .
      `),
    ).toBe(true)
  })
})
