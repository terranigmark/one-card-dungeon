import { describe, it, expect } from 'vitest'
import { aggressiveStrategy } from './aggressive'
import { faithfulStrategy } from './faithful'
import { rangeToHero, reachableStops } from './shared'
import { hasLineOfSight } from '../los'
import { damageToHero } from '../rules'
import { createInitialState } from '../reducer'
import { coordEq } from '../grid'
import type { Coord, GameState, Monster } from '../types'
import type { MonsterMove } from './index'

function mob(over: Partial<Monster> & Pick<Monster, 'id' | 'pos'>): Monster {
  // Speed 3 keeps the reachable set small enough that the bounded search is exhaustive.
  return { health: 3, maxHealth: 3, speed: 3, attack: 4, defense: 2, range: 3, kind: 'spider', ...over }
}

function aiState(hero: Coord, monsters: Monster[], defense = 5, walls: Coord[] = []): GameState {
  const base = createInitialState({ difficulty: 'aggressive', seed: 1, treasureChests: false })
  return {
    ...base,
    phase: 'MonsterMove',
    hero: { ...base.hero, pos: hero },
    monsters,
    walls,
    turn: { totals: { speed: 0, attack: 0, defense, range: 0 }, speedLeft: 0, attackLeft: 0 },
  }
}

function damageOfCoords(state: GameState, coords: Coord[]): number {
  let sum = 0
  state.monsters.forEach((m, i) => {
    const pos = coords[i]
    const r = rangeToHero(state, pos)
    if (r === null || r > m.range) return
    const blockers: Coord[] = [...state.walls]
    state.monsters.forEach((_other, j) => {
      if (j !== i) blockers.push(coords[j])
    })
    if (hasLineOfSight(pos, state.hero.pos, blockers)) sum += m.attack
  })
  return damageToHero(sum, state.turn!.totals.defense)
}

function damageOfPlan(state: GameState, plan: MonsterMove[]): number {
  const coords = state.monsters.map((m) => plan.find((p) => p.id === m.id)?.to ?? m.pos)
  return damageOfCoords(state, coords)
}

/** Brute-force the best achievable damage over all distinct-tile stop combos. */
function bruteOptimum(state: GameState): number {
  const positions = new Map(state.monsters.map((m) => [m.id, m.pos]))
  const lists = state.monsters.map((m) => reachableStops(state, m, positions).map((s) => s.coord))
  let best = 0
  const chosen: Coord[] = []
  const used = new Set<string>()
  const dfs = (i: number) => {
    if (i === state.monsters.length) {
      best = Math.max(best, damageOfCoords(state, chosen.slice()))
      return
    }
    for (const c of lists[i]) {
      const k = `${c.x},${c.y}`
      if (used.has(k)) continue
      used.add(k)
      chosen.push(c)
      dfs(i + 1)
      chosen.pop()
      used.delete(k)
    }
  }
  dfs(0)
  return best
}

describe('aggressive AI', () => {
  it('achieves the brute-force optimal damage and is never worse than faithful', () => {
    // Hero centre, two attack-4 monsters, Defense 5: one attacker = 0, both = 1.
    const s = aiState({ x: 2, y: 2 }, [
      mob({ id: 1, pos: { x: 0, y: 2 }, attack: 4, range: 3 }),
      mob({ id: 2, pos: { x: 4, y: 2 }, attack: 4, range: 3 }),
    ])
    const aggro = damageOfPlan(s, aggressiveStrategy.planMoves(s))
    const faith = damageOfPlan(s, faithfulStrategy.planMoves(s))
    expect(aggro).toBe(bruteOptimum(s))
    expect(aggro).toBeGreaterThanOrEqual(faith)
    expect(aggro).toBe(1) // both monsters must coordinate to cross the floor
  })

  it('matches the optimum in a higher-defense scenario', () => {
    const s = aiState(
      { x: 2, y: 2 },
      [
        mob({ id: 1, pos: { x: 1, y: 0 }, attack: 5, range: 3 }),
        mob({ id: 2, pos: { x: 3, y: 4 }, attack: 5, range: 3 }),
      ],
      7,
    )
    const aggro = damageOfPlan(s, aggressiveStrategy.planMoves(s))
    const faith = damageOfPlan(s, faithfulStrategy.planMoves(s))
    expect(aggro).toBe(bruteOptimum(s))
    expect(aggro).toBeGreaterThanOrEqual(faith)
  })

  it('returns valid, distinct destinations off the hero tile, deterministically', () => {
    const s = aiState({ x: 2, y: 2 }, [
      mob({ id: 1, pos: { x: 0, y: 0 }, range: 3 }),
      mob({ id: 2, pos: { x: 4, y: 4 }, range: 3 }),
      mob({ id: 3, pos: { x: 4, y: 0 }, range: 3 }),
    ])
    const a = aggressiveStrategy.planMoves(s)
    const b = aggressiveStrategy.planMoves(s)
    expect(a).toEqual(b) // deterministic

    const dests = a.map((m) => m.to)
    const keys = new Set(dests.map((d) => `${d.x},${d.y}`))
    expect(keys.size).toBe(dests.length) // distinct
    expect(dests.some((d) => coordEq(d, s.hero.pos))).toBe(false)
  })
})
