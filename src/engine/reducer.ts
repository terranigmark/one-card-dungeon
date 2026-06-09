import type { Action } from './actions'
import type {
  AssignSlot,
  ClassState,
  EnergyDice,
  GameState,
  Hero,
  Monster,
  Settings,
} from './types'
import { LEVELS, TOTAL_LEVELS } from './levels'
import { rollDice } from './rng'
import { attackCostPerHit, computeTotals, damageToHero } from './rules'
import { coordEq } from './grid'
import { pathCost } from './pathfinding'
import { hasLineOfSight } from './los'
import {
  heroTraverse,
  isWall,
  losBlockers,
  monsterAt,
  monsterCanHitHero,
  rangeTraverse,
} from './board'
import { getStrategy } from './ai'

const HERO_BASE = { speed: 1, attack: 1, defense: 1, range: 2 }

function emptyEnergy(): EnergyDice {
  return { rolled: [], assignment: {}, rangerUnlocked: false }
}

function freshClassState(): ClassState {
  return { usedThisLevel: false, usedThisTurn: false, paladinHeldDie: null }
}

export function createInitialState(settings: Settings): GameState {
  return {
    phase: 'ClassSelect',
    levelIndex: 0,
    hero: { pos: { x: 0, y: 0 }, health: 6, maxHealth: 6, base: { ...HERO_BASE }, classId: null },
    monsters: [],
    walls: [],
    energy: emptyEnergy(),
    turn: null,
    classState: freshClassState(),
    settings,
    turnCount: 0,
    log: [],
    rngState: settings.seed | 0,
    paladinPending: null,
  }
}

function loadLevel(state: GameState, idx: number): GameState {
  const cfg = LEVELS[idx]
  const monsters: Monster[] = cfg.monsterSpawns.map((pos, i) => ({
    id: i + 1,
    pos: { ...pos },
    health: cfg.monster.health,
    maxHealth: cfg.monster.health,
    speed: cfg.monster.speed,
    attack: cfg.monster.attack,
    defense: cfg.monster.defense,
    range: cfg.monster.range,
    kind: cfg.monsterKind,
  }))
  return {
    ...state,
    levelIndex: idx,
    walls: cfg.walls.map((c) => ({ ...c })),
    monsters,
    hero: { ...state.hero, pos: { ...cfg.heroStart } },
    energy: emptyEnergy(),
    turn: null,
    turnCount: 0,
    classState: freshClassState(),
    paladinPending: null,
    phase: 'Energy',
    log: [...state.log, `— Level ${cfg.level}: ${monsters.length} ${cfg.monsterKind}(s) —`],
  }
}

function startNextTurn(state: GameState): GameState {
  return {
    ...state,
    turn: null,
    energy: emptyEnergy(),
    classState: { ...state.classState, usedThisTurn: false },
    turnCount: state.turnCount + 1,
    phase: 'Energy',
  }
}

function diceAllAssigned(e: EnergyDice): boolean {
  if (e.rolled.length === 0) return false
  const used = new Set(Object.values(e.assignment))
  if (used.size !== e.rolled.length) return false
  for (let i = 0; i < e.rolled.length; i++) if (!used.has(i)) return false
  return true
}

function withLog(state: GameState, msg: string): GameState {
  return { ...state, log: [...state.log, msg] }
}

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SELECT_CLASS': {
      if (state.phase !== 'ClassSelect') return state
      return { ...state, hero: { ...state.hero, classId: action.classId } }
    }

    case 'START_GAME': {
      if (state.phase !== 'ClassSelect' || !state.hero.classId) return state
      return loadLevel(state, 0)
    }

    case 'ROLL_ENERGY': {
      if (state.phase !== 'Energy' || state.turn) return state
      if (state.energy.rolled.length > 0) return state
      const r = rollDice(3, state.rngState)
      const rolled = state.paladinPending != null ? [state.paladinPending, r.value[1], r.value[2]] : r.value
      return withLog(
        {
          ...state,
          rngState: r.state,
          paladinPending: null,
          energy: { rolled, assignment: {}, rangerUnlocked: state.energy.rangerUnlocked },
        },
        `Rolled ${rolled.join(', ')}`,
      )
    }

    case 'ASSIGN_DIE': {
      if (state.phase !== 'Energy') return state
      const { slot, dieIndex } = action
      if (dieIndex < 0 || dieIndex >= state.energy.rolled.length) return state
      if (slot === 'range' && !state.energy.rangerUnlocked) return state
      const assignment = { ...state.energy.assignment }
      for (const k of Object.keys(assignment) as AssignSlot[]) {
        if (assignment[k] === dieIndex) delete assignment[k]
      }
      assignment[slot] = dieIndex
      return { ...state, energy: { ...state.energy, assignment } }
    }

    case 'UNASSIGN_DIE': {
      if (state.phase !== 'Energy') return state
      const assignment = { ...state.energy.assignment }
      delete assignment[action.slot]
      return { ...state, energy: { ...state.energy, assignment } }
    }

    case 'CONFIRM_ENERGY': {
      if (state.phase !== 'Energy') return state
      if (!diceAllAssigned(state.energy)) return state
      const totals = computeTotals(state.hero.base, state.energy)
      return withLog(
        {
          ...state,
          turn: { totals, speedLeft: totals.speed, attackLeft: totals.attack },
          phase: 'Adventurer',
        },
        `Turn totals — SPD ${totals.speed}  ATK ${totals.attack}  DEF ${totals.defense}  RNG ${totals.range}`,
      )
    }

    case 'MOVE_HERO': {
      if (state.phase !== 'Adventurer' || !state.turn) return state
      const to = action.to
      if (isWall(state, to) || monsterAt(state, to) || coordEq(state.hero.pos, to)) return state
      const cost = pathCost(state.hero.pos, to, heroTraverse(state))
      if (cost === null || cost > state.turn.speedLeft) return state
      return withLog(
        {
          ...state,
          hero: { ...state.hero, pos: { ...to } },
          turn: { ...state.turn, speedLeft: state.turn.speedLeft - cost },
        },
        `Moved to (${to.x},${to.y})  [-${cost} Speed]`,
      )
    }

    case 'ATTACK': {
      if (state.phase !== 'Adventurer' || !state.turn) return state
      const m = state.monsters.find((x) => x.id === action.targetId)
      if (!m) return state
      const r = pathCost(state.hero.pos, m.pos, rangeTraverse(state))
      if (r === null || r > state.turn.totals.range) return state
      if (!hasLineOfSight(state.hero.pos, m.pos, losBlockers(state))) return state
      const cost = attackCostPerHit(m.defense)
      if (state.turn.attackLeft < cost) return state

      const turn = { ...state.turn, attackLeft: state.turn.attackLeft - cost }
      const newHealth = m.health - 1
      let monsters: Monster[]
      let msg: string
      if (newHealth <= 0) {
        monsters = state.monsters.filter((x) => x.id !== m.id)
        msg = `Killed ${m.kind} #${m.id}  [-${cost} Attack]`
      } else {
        monsters = state.monsters.map((x) => (x.id === m.id ? { ...x, health: newHealth } : x))
        msg = `Hit ${m.kind} #${m.id} (-1 HP)  [-${cost} Attack]`
      }
      const base = withLog({ ...state, monsters, turn }, msg)
      if (monsters.length === 0) {
        if (state.levelIndex === TOTAL_LEVELS - 1) {
          return withLog({ ...base, phase: 'Won' }, 'The dungeon is cleared. You win!')
        }
        return withLog({ ...base, phase: 'EndOfLevel' }, 'Level cleared!')
      }
      return base
    }

    case 'END_ADVENTURER': {
      if (state.phase !== 'Adventurer') return state
      return { ...state, phase: 'MonsterMove' }
    }

    case 'RESOLVE_MONSTER_MOVE': {
      if (state.phase !== 'MonsterMove') return state
      const plan = getStrategy(state.settings.difficulty).planMoves(state)
      const monsters = state.monsters.map((m) => {
        const mv = plan.find((p) => p.id === m.id)
        return mv ? { ...m, pos: { ...mv.to } } : m
      })
      return { ...state, monsters, phase: 'MonsterAttack' }
    }

    case 'RESOLVE_MONSTER_ATTACK': {
      if (state.phase !== 'MonsterAttack' || !state.turn) return state
      const attackers = state.monsters.filter((m) => monsterCanHitHero(state, m))
      const total = attackers.reduce((s, m) => s + m.attack, 0)
      const dmg = damageToHero(total, state.turn.totals.defense)
      const newHealth = state.hero.health - dmg
      const msg = `Monsters: ${total} Attack vs ${state.turn.totals.defense} Defense → ${dmg} damage`
      if (newHealth <= 0) {
        return withLog({ ...state, hero: { ...state.hero, health: 0 }, phase: 'Lost' }, `${msg}. You have died.`)
      }
      return startNextTurn(withLog({ ...state, hero: { ...state.hero, health: newHealth } }, msg))
    }

    case 'CHOOSE_REWARD': {
      if (state.phase !== 'EndOfLevel') return state
      const reward = action.reward
      let hero: Hero
      let msg: string
      if (reward.kind === 'heal') {
        hero = { ...state.hero, health: state.hero.maxHealth }
        msg = `Rested and healed to ${state.hero.maxHealth} Health`
      } else {
        hero = {
          ...state.hero,
          base: { ...state.hero.base, [reward.skill]: state.hero.base[reward.skill] + 1 },
        }
        msg = `Upgraded ${reward.skill} to ${hero.base[reward.skill]}`
      }
      return loadLevel(withLog({ ...state, hero }, msg), state.levelIndex + 1)
    }

    case 'ABILITY_WIZARD_REROLL': {
      if (state.phase !== 'Energy' || state.hero.classId !== 'wizard') return state
      if (state.classState.usedThisLevel || state.energy.rolled.length === 0) return state
      const r = rollDice(3, state.rngState)
      return withLog(
        {
          ...state,
          rngState: r.state,
          energy: { rolled: r.value, assignment: {}, rangerUnlocked: state.energy.rangerUnlocked },
          classState: { ...state.classState, usedThisLevel: true },
        },
        `Wizard rerolls: ${r.value.join(', ')}`,
      )
    }

    case 'ABILITY_BARBARIAN_REROLL': {
      if (state.phase !== 'Energy' || state.hero.classId !== 'barbarian') return state
      if (state.classState.usedThisTurn || state.hero.health !== 1 || state.energy.rolled.length === 0) {
        return state
      }
      const r = rollDice(3, state.rngState)
      return withLog(
        {
          ...state,
          rngState: r.state,
          energy: { rolled: r.value, assignment: {}, rangerUnlocked: state.energy.rangerUnlocked },
          classState: { ...state.classState, usedThisTurn: true },
        },
        `Barbarian's fury rerolls: ${r.value.join(', ')}`,
      )
    }

    case 'ABILITY_RANGER_RANGE': {
      if (state.phase !== 'Energy' || state.hero.classId !== 'ranger') return state
      if (state.classState.usedThisLevel) return state
      return withLog(
        {
          ...state,
          energy: { ...state.energy, rangerUnlocked: true },
          classState: { ...state.classState, usedThisLevel: true },
        },
        'Ranger may assign a die to Range this turn',
      )
    }

    case 'ABILITY_PALADIN_KEEP': {
      if (state.phase !== 'Energy' || state.hero.classId !== 'paladin') return state
      if (state.classState.usedThisLevel || state.energy.rolled.length === 0) return state
      const idx = action.dieIndex
      if (idx < 0 || idx >= state.energy.rolled.length) return state
      return withLog(
        {
          ...state,
          paladinPending: state.energy.rolled[idx],
          classState: { ...state.classState, usedThisLevel: true },
        },
        `Paladin keeps a ${state.energy.rolled[idx]} for next turn`,
      )
    }

    case 'SET_DIFFICULTY':
      return { ...state, settings: { ...state.settings, difficulty: action.difficulty } }

    case 'RESTART':
      return createInitialState(state.settings)

    default:
      return state
  }
}
