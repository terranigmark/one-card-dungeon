import { describe, it, expect } from 'vitest'
import { faithfulStrategy } from './faithful'
import { rangeToHero } from './shared'
import { createInitialState } from '../reducer'
import { coordEq } from '../grid'
import type { Coord, GameState, Monster } from '../types'

function mob(over: Partial<Monster> & Pick<Monster, 'id' | 'pos'>): Monster {
  return { health: 3, maxHealth: 3, speed: 5, attack: 4, defense: 2, range: 3, kind: 'spider', ...over }
}

function aiState(hero: Coord, monsters: Monster[], walls: Coord[] = []): GameState {
  const base = createInitialState({ difficulty: 'faithful', seed: 1 })
  return { ...base, phase: 'MonsterMove', hero: { ...base.hero, pos: hero }, monsters, walls }
}

describe('faithful kiting AI', () => {
  it('a too-close monster backs away to maximum range while keeping line of sight', () => {
    // Hero centre, monster orthogonally adjacent (range 2), monster range 3.
    const s = aiState({ x: 2, y: 2 }, [mob({ id: 1, pos: { x: 2, y: 3 }, range: 3, speed: 5 })])
    const moves = faithfulStrategy.planMoves(s)
    const dest = moves[0].to
    // It kites to a tile at exactly its max range (3) — the cheapest, lowest x/y.
    expect(rangeToHero(s, dest)).toBe(3)
    expect(dest).toEqual({ x: 1, y: 3 })
  })

  it('a far monster that cannot reach attack range closes the distance', () => {
    const s = aiState({ x: 0, y: 0 }, [mob({ id: 1, pos: { x: 4, y: 4 }, range: 2, speed: 4 })])
    const before = rangeToHero(s, { x: 4, y: 4 })!
    const dest = faithfulStrategy.planMoves(s)[0].to
    expect(rangeToHero(s, dest)!).toBeLessThan(before)
  })

  it('never lands two monsters on the same tile or on the hero', () => {
    const s = aiState({ x: 2, y: 2 }, [
      mob({ id: 1, pos: { x: 0, y: 2 }, range: 3, speed: 5 }),
      mob({ id: 2, pos: { x: 4, y: 2 }, range: 3, speed: 5 }),
    ])
    const moves = faithfulStrategy.planMoves(s)
    const dests = moves.map((m) => m.to)
    expect(dests).toHaveLength(2)
    expect(coordEq(dests[0], dests[1])).toBe(false)
    expect(dests.some((d) => coordEq(d, s.hero.pos))).toBe(false)
  })

  it('a monster already at max range with LoS stays in an attacking position', () => {
    const s = aiState({ x: 2, y: 2 }, [mob({ id: 1, pos: { x: 0, y: 0 }, range: 3, speed: 5 })])
    // (0,0) is range 6 from hero (too far). It should move to a range<=3 LoS tile.
    const dest = faithfulStrategy.planMoves(s)[0].to
    const r = rangeToHero(s, dest)!
    expect(r).toBeLessThanOrEqual(3)
  })
})
