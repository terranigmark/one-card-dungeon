// Aggressive monster AI.
//
// Where the faithful strategy moves each monster independently (closest-first,
// greedy kite), the aggressive strategy plans all monsters JOINTLY to maximise
// the damage actually dealt this turn:
//
//     damage = floor( sum of attacks of monsters in Range+LoS / hero Defense )
//
// Because the hero has already finished their turn, the Defense divisor and the
// hero's position are fixed, so this turn's damage is fully determined by where
// the monsters end up. The planner searches joint final positions to:
//   1. maximise floored damage (exploiting the divisor — pile attackers on to
//      cross the next floor threshold, e.g. 4+4 vs Defense 5 = 1 where 4 = 0);
//   2. coordinate line of sight (one monster's body can block another's, so a
//      joint plan can get MORE attackers shooting than independent greed would);
//   3. then keep the rest at maximum range for safety next turn.
//
// It is seeded with the faithful plan, so it is never worse than faithful, and
// the search is bounded so it stays fast.

import type { Coord, GameState, Monster } from '../types'
import { hasLineOfSight } from '../los'
import { damageToHero } from '../rules'
import { rangeToHero, reachableStops, type PositionMap } from './shared'
import { faithfulStrategy } from './faithful'
import type { MonsterMove, MonsterStrategy } from './index'

interface Cand {
  coord: Coord
  range: number
  cost: number
}

const MAX_CANDS = 12
const MAX_MONSTERS = 4
const NODE_CAP = 60000

function candidatesFor(state: GameState, m: Monster, positions: PositionMap): Cand[] {
  const cands = reachableStops(state, m, positions)
    .map((s) => ({ coord: s.coord, range: rangeToHero(state, s.coord) ?? Infinity, cost: s.cost }))
    .filter((c) => Number.isFinite(c.range))
  cands.sort((a, b) => {
    const aAttack = a.range <= m.range ? 0 : 1
    const bAttack = b.range <= m.range ? 0 : 1
    if (aAttack !== bAttack) return aAttack - bAttack // attacking tiles first
    if (aAttack === 0) {
      if (a.range !== b.range) return b.range - a.range // attackers: prefer max range
    } else if (a.range !== b.range) {
      return a.range - b.range // non-attackers: prefer closer
    }
    return a.cost - b.cost
  })
  return cands.slice(0, MAX_CANDS)
}

interface Score {
  tuple: number[]
  sig: number[]
}

function scoreConfig(state: GameState, monsters: Monster[], coords: Coord[], defense: number): Score {
  let attackSum = 0
  let attackerCount = 0
  let sumRange = 0
  for (let i = 0; i < monsters.length; i++) {
    const m = monsters[i]
    const pos = coords[i]
    const r = rangeToHero(state, pos)
    if (r === null) continue
    sumRange += r
    if (r <= m.range) {
      const blockers: Coord[] = [...state.walls]
      for (let j = 0; j < monsters.length; j++) if (j !== i) blockers.push(coords[j])
      if (hasLineOfSight(pos, state.hero.pos, blockers)) {
        attackSum += m.attack
        attackerCount++
      }
    }
  }
  return {
    tuple: [damageToHero(attackSum, defense), attackerCount, sumRange],
    sig: coords.map((c) => c.y * 5 + c.x),
  }
}

/** True if `a` is strictly better than `b` (maximise tuple; tie -> smaller sig). */
function better(a: Score, b: Score): boolean {
  for (let i = 0; i < a.tuple.length; i++) {
    if (a.tuple[i] !== b.tuple[i]) return a.tuple[i] > b.tuple[i]
  }
  for (let i = 0; i < a.sig.length; i++) {
    if (a.sig[i] !== b.sig[i]) return a.sig[i] < b.sig[i]
  }
  return false
}

export const aggressiveStrategy: MonsterStrategy = {
  planMoves(state: GameState): MonsterMove[] {
    const monsters = state.monsters
    if (monsters.length === 0) return []

    const defense = state.turn?.totals.defense ?? 1

    // Seed with the faithful plan so we can never do worse.
    const faithful = faithfulStrategy.planMoves(state)
    const byId = new Map(faithful.map((mv) => [mv.id, mv.to]))
    let bestCoords = monsters.map((m) => byId.get(m.id) ?? m.pos)
    let bestScore = scoreConfig(state, monsters, bestCoords, defense)

    // Joint search only for a tractable number of monsters.
    if (monsters.length <= MAX_MONSTERS) {
      const initial: PositionMap = new Map(monsters.map((m) => [m.id, m.pos]))
      const candLists = monsters.map((m) => candidatesFor(state, m, initial))
      const chosen: Coord[] = []
      const used = new Set<string>()
      let nodes = 0

      const dfs = (i: number): void => {
        if (nodes > NODE_CAP) return
        if (i === monsters.length) {
          nodes++
          const score = scoreConfig(state, monsters, chosen, defense)
          if (better(score, bestScore)) {
            bestScore = score
            bestCoords = chosen.slice()
          }
          return
        }
        for (const cand of candLists[i]) {
          const k = `${cand.coord.x},${cand.coord.y}`
          if (used.has(k)) continue
          used.add(k)
          chosen.push(cand.coord)
          dfs(i + 1)
          chosen.pop()
          used.delete(k)
          if (nodes > NODE_CAP) return
        }
      }
      dfs(0)
    }

    return monsters.map((m, i) => ({ id: m.id, to: bestCoords[i] }))
  },
}
