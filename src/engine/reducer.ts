import type { Action } from './actions'
import type {
  AssignSlot,
  ChestState,
  ClassState,
  EnergyDice,
  GameState,
  Hero,
  LogEntry,
  Monster,
  Settings,
} from './types'
import { BOSS_LEVELS, chestTileFor, isBossLevelIndex, LEVELS, TOTAL_LEVELS } from './levels'
import { rollDice, rollDie } from './rng'
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
  unopenedChestAt,
} from './board'
import { getStrategy } from './ai'

const HERO_BASE = { speed: 1, attack: 1, defense: 1, range: 2 }

/** God-mode skill totals: enough Speed/Attack/Range to do anything in one turn. */
const DEBUG_TOTALS = { speed: 99, attack: 99, defense: 99, range: 99 }

function emptyEnergy(): EnergyDice {
  return { rolled: [], assignment: {}, secondary: {}, rangerUnlocked: false, knightUnlocked: false, clericBoosted: false }
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
    voids: [],
    energy: emptyEnergy(),
    turn: null,
    classState: freshClassState(),
    settings,
    turnCount: 0,
    log: [],
    rngState: settings.seed | 0,
    paladinPending: null,
    chest: null,
    chestSpend: null,
    bossPending: null,
  }
}

/** Class ids unlocked only by the M'Guf-yn Returns expansion. */
const EXPANSION_CLASSES = new Set(['necromancer', 'cleric', 'knight', 'rogue'])

/** Whether the expansion is active for this game (defaults to "on" when unset). */
function expansionOn(state: GameState): boolean {
  return state.settings.expansion ?? true
}

/** Roll and place the level's Treasure Chest, threading the PRNG cursor. */
function rollChest(cfg: (typeof LEVELS)[number], rngState: number): { chest: ChestState; rngState: number } {
  const r = rollDie(rngState)
  return {
    chest: { pos: chestTileFor(cfg), value: r.value, opened: false, remaining: r.value },
    rngState: r.state,
  }
}

function loadLevel(state: GameState, idx: number, useBoss = false): GameState {
  const cfg = useBoss && BOSS_LEVELS[idx + 1] ? BOSS_LEVELS[idx + 1] : LEVELS[idx]
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
  let rngState = state.rngState
  let chest: ChestState | null = null
  const log: LogEntry[] = [
    ...state.log,
    { t: 'levelStart', level: cfg.level, count: monsters.length, kind: cfg.monsterKind },
  ]
  if (cfg.isBoss) log.push({ t: 'bossEntered', kind: cfg.monsterKind })
  if (expansionOn(state) && state.settings.treasureChests) {
    const rolled = rollChest(cfg, rngState)
    chest = rolled.chest
    rngState = rolled.rngState
    log.push({ t: 'chestAppears', value: chest.value })
  }
  return {
    ...state,
    levelIndex: idx,
    walls: cfg.walls.map((c) => ({ ...c })),
    voids: (cfg.voids ?? []).map((c) => ({ ...c })),
    monsters,
    hero: { ...state.hero, pos: { ...cfg.heroStart } },
    energy: emptyEnergy(),
    turn: null,
    turnCount: 0,
    classState: freshClassState(),
    paladinPending: null,
    chest,
    chestSpend: null,
    bossPending: null,
    rngState,
    phase: 'Energy',
    log,
  }
}

/**
 * Advance to level `idx`. On expansion boss levels (3/6/9/12) the player first
 * chooses whether to face the boss, so we pause in the BossChoice phase instead
 * of loading immediately.
 */
function advanceTo(state: GameState, idx: number): GameState {
  if (expansionOn(state) && isBossLevelIndex(idx) && BOSS_LEVELS[idx + 1]) {
    return { ...state, phase: 'BossChoice', bossPending: idx }
  }
  return loadLevel(state, idx)
}

function startNextTurn(state: GameState): GameState {
  return {
    ...state,
    turn: null,
    energy: emptyEnergy(),
    chestSpend: null,
    classState: { ...state.classState, usedThisTurn: false },
    turnCount: state.turnCount + 1,
    phase: 'Energy',
  }
}

function diceAllAssigned(e: EnergyDice): boolean {
  if (e.rolled.length === 0) return false
  const used = new Set([...Object.values(e.assignment), ...Object.values(e.secondary ?? {})])
  if (used.size !== e.rolled.length) return false
  for (let i = 0; i < e.rolled.length; i++) if (!used.has(i)) return false
  return true
}

function withLog(state: GameState, entry: LogEntry): GameState {
  return { ...state, log: [...state.log, entry] }
}

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SELECT_CLASS': {
      if (state.phase !== 'ClassSelect') return state
      return { ...state, hero: { ...state.hero, classId: action.classId } }
    }

    case 'START_GAME': {
      if (state.phase !== 'ClassSelect' || !state.hero.classId) return state
      return advanceTo(state, 0)
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
          energy: {
            rolled,
            assignment: {},
            secondary: {},
            rangerUnlocked: state.energy.rangerUnlocked,
            knightUnlocked: state.energy.knightUnlocked,
            clericBoosted: false,
          },
        },
        { t: 'rolled', dice: rolled },
      )
    }

    case 'ASSIGN_DIE': {
      if (state.phase !== 'Energy') return state
      const { slot, dieIndex } = action
      if (dieIndex < 0 || dieIndex >= state.energy.rolled.length) return state
      if (slot === 'range' && !state.energy.rangerUnlocked) return state
      const assignment = { ...state.energy.assignment }
      const secondary = { ...(state.energy.secondary ?? {}) }
      // Detach this die from wherever it currently sits (primary or secondary).
      for (const k of Object.keys(assignment) as AssignSlot[]) {
        if (assignment[k] === dieIndex) delete assignment[k]
      }
      for (const k of Object.keys(secondary) as AssignSlot[]) {
        if (secondary[k] === dieIndex) delete secondary[k]
      }
      if (assignment[slot] === undefined) {
        assignment[slot] = dieIndex
      } else if (state.energy.knightUnlocked && Object.keys(secondary).length === 0) {
        // Knight: stack a second die onto this skill (only one slot may double).
        secondary[slot] = dieIndex
      } else {
        assignment[slot] = dieIndex
      }
      return { ...state, energy: { ...state.energy, assignment, secondary } }
    }

    case 'UNASSIGN_DIE': {
      if (state.phase !== 'Energy') return state
      const assignment = { ...state.energy.assignment }
      const secondary = { ...(state.energy.secondary ?? {}) }
      delete assignment[action.slot]
      delete secondary[action.slot]
      return { ...state, energy: { ...state.energy, assignment, secondary } }
    }

    case 'CONFIRM_ENERGY': {
      if (state.phase !== 'Energy') return state
      // God-mode skips the assignment requirement and grants huge totals so a
      // developer can roam and one-shot freely without fiddling with dice.
      if (state.debug) {
        const totals = { ...DEBUG_TOTALS }
        return withLog(
          {
            ...state,
            turn: { totals, speedLeft: totals.speed, attackLeft: totals.attack },
            chestSpend: null,
            phase: 'Adventurer',
          },
          { t: 'turnTotals', speed: totals.speed, attack: totals.attack, defense: totals.defense, range: totals.range },
        )
      }
      if (!diceAllAssigned(state.energy)) return state
      // Only spend chest loot the player actually still has.
      const spend =
        state.chestSpend && state.chest && state.chest.opened && state.chestSpend.amount > 0
          ? { slot: state.chestSpend.slot, amount: Math.min(state.chestSpend.amount, state.chest.remaining) }
          : null
      const totals = computeTotals(state.hero.base, state.energy, spend)
      const chest =
        spend && state.chest ? { ...state.chest, remaining: state.chest.remaining - spend.amount } : state.chest
      let next: GameState = {
        ...state,
        turn: { totals, speedLeft: totals.speed, attackLeft: totals.attack },
        chest,
        chestSpend: null,
        phase: 'Adventurer',
      }
      next = withLog(next, {
        t: 'turnTotals',
        speed: totals.speed,
        attack: totals.attack,
        defense: totals.defense,
        range: totals.range,
      })
      if (spend && chest) {
        next = withLog(next, { t: 'chestSpend', slot: spend.slot, amount: spend.amount, remaining: chest.remaining })
      }
      return next
    }

    case 'MOVE_HERO': {
      if (state.phase !== 'Adventurer' || !state.turn) return state
      const to = action.to
      if (isWall(state, to) || unopenedChestAt(state, to) || monsterAt(state, to) || coordEq(state.hero.pos, to)) {
        return state
      }
      const cost = pathCost(state.hero.pos, to, heroTraverse(state))
      if (cost === null || cost > state.turn.speedLeft) return state
      return withLog(
        {
          ...state,
          hero: { ...state.hero, pos: { ...to } },
          turn: { ...state.turn, speedLeft: state.turn.speedLeft - cost },
        },
        { t: 'moved', x: to.x, y: to.y, cost },
      )
    }

    case 'ATTACK': {
      if (state.phase !== 'Adventurer' || !state.turn) return state
      const m = state.monsters.find((x) => x.id === action.targetId)
      if (!m) return state
      // God-mode: ignore range / line-of-sight / cost and one-shot the target.
      if (!state.debug) {
        const r = pathCost(state.hero.pos, m.pos, rangeTraverse(state))
        if (r === null || r > state.turn.totals.range) return state
        if (!hasLineOfSight(state.hero.pos, m.pos, losBlockers(state))) return state
      }
      const cost = state.debug ? 0 : attackCostPerHit(m.defense)
      if (state.turn.attackLeft < cost) return state

      const turn = { ...state.turn, attackLeft: state.turn.attackLeft - cost }
      const newHealth = state.debug ? 0 : m.health - 1
      let monsters: Monster[]
      let entry: LogEntry
      if (newHealth <= 0) {
        monsters = state.monsters.filter((x) => x.id !== m.id)
        entry = { t: 'killed', kind: m.kind, id: m.id, cost }
      } else {
        monsters = state.monsters.map((x) => (x.id === m.id ? { ...x, health: newHealth } : x))
        entry = { t: 'hit', kind: m.kind, id: m.id, cost }
      }
      const base = withLog({ ...state, monsters, turn }, entry)
      if (monsters.length === 0) {
        if (state.levelIndex === TOTAL_LEVELS - 1) {
          return withLog({ ...base, phase: 'Won' }, { t: 'won' })
        }
        return withLog({ ...base, phase: 'EndOfLevel' }, { t: 'levelCleared' })
      }
      return base
    }

    case 'OPEN_CHEST': {
      if (state.phase !== 'Adventurer' || !state.turn) return state
      const chest = state.chest
      if (!chest || chest.opened) return state
      // Open it "as you would attack a monster": within Range + Line of Sight,
      // spending Attack points equal to its value.
      const r = pathCost(state.hero.pos, chest.pos, rangeTraverse(state))
      if (r === null || r > state.turn.totals.range) return state
      if (!hasLineOfSight(state.hero.pos, chest.pos, losBlockers(state))) return state
      if (state.turn.attackLeft < chest.value) return state
      return withLog(
        {
          ...state,
          chest: { ...chest, opened: true, remaining: chest.value },
          turn: { ...state.turn, attackLeft: state.turn.attackLeft - chest.value },
        },
        { t: 'chestOpened', value: chest.value },
      )
    }

    case 'SET_CHEST_SPEND': {
      if (state.phase !== 'Energy') return state
      if (!state.chest || !state.chest.opened) return state
      const amount = Math.max(0, Math.min(action.amount, state.chest.remaining))
      return { ...state, chestSpend: amount === 0 ? null : { slot: action.slot, amount } }
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
      const dmg = state.debug ? 0 : damageToHero(total, state.turn.totals.defense)
      const newHealth = state.hero.health - dmg
      const entry: LogEntry = { t: 'monsterAttack', total, defense: state.turn.totals.defense, damage: dmg }
      if (newHealth <= 0) {
        const hit = withLog({ ...state, hero: { ...state.hero, health: 0 }, phase: 'Lost' }, entry)
        return withLog(hit, { t: 'died' })
      }
      return startNextTurn(withLog({ ...state, hero: { ...state.hero, health: newHealth } }, entry))
    }

    case 'CHOOSE_REWARD': {
      if (state.phase !== 'EndOfLevel') return state
      const reward = action.reward
      let hero: Hero
      let entry: LogEntry
      if (reward.kind === 'heal') {
        hero = { ...state.hero, health: state.hero.maxHealth }
        entry = { t: 'healed', health: state.hero.maxHealth }
      } else {
        hero = {
          ...state.hero,
          base: { ...state.hero.base, [reward.skill]: state.hero.base[reward.skill] + 1 },
        }
        entry = { t: 'upgraded', skill: reward.skill, value: hero.base[reward.skill] }
      }
      return advanceTo(withLog({ ...state, hero }, entry), state.levelIndex + 1)
    }

    case 'RESOLVE_BOSS_CHOICE': {
      if (state.phase !== 'BossChoice' || state.bossPending == null) return state
      const idx = state.bossPending
      if (action.boss) return loadLevel(state, idx, true)
      return loadLevel(withLog(state, { t: 'bossSkipped' }), idx)
    }

    case 'ABILITY_WIZARD_REROLL': {
      if (state.phase !== 'Energy' || state.hero.classId !== 'wizard') return state
      if (state.classState.usedThisLevel || state.energy.rolled.length === 0) return state
      const r = rollDice(3, state.rngState)
      return withLog(
        {
          ...state,
          rngState: r.state,
          energy: {
            rolled: r.value,
            assignment: {},
            secondary: {},
            rangerUnlocked: state.energy.rangerUnlocked,
            knightUnlocked: state.energy.knightUnlocked,
            clericBoosted: false,
          },
          classState: { ...state.classState, usedThisLevel: true },
        },
        { t: 'wizardReroll', dice: r.value },
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
          energy: {
            rolled: r.value,
            assignment: {},
            secondary: {},
            rangerUnlocked: state.energy.rangerUnlocked,
            knightUnlocked: state.energy.knightUnlocked,
            clericBoosted: false,
          },
          classState: { ...state.classState, usedThisTurn: true },
        },
        { t: 'barbarianReroll', dice: r.value },
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
        { t: 'rangerUnlock' },
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
        { t: 'paladinKeep', value: state.energy.rolled[idx] },
      )
    }

    case 'ABILITY_NECROMANCER_SMITE': {
      if (state.phase !== 'Adventurer' || !state.turn) return state
      if (state.hero.classId !== 'necromancer' || state.classState.usedThisLevel) return state
      // "Lose 1 Life to inflict 1 Damage to an enemy within range" — never
      // self-destruct, so this needs at least 2 Health.
      if (state.hero.health < 2) return state
      const m = state.monsters.find((x) => x.id === action.targetId)
      if (!m) return state
      const r = pathCost(state.hero.pos, m.pos, rangeTraverse(state))
      if (r === null || r > state.turn.totals.range) return state
      if (!hasLineOfSight(state.hero.pos, m.pos, losBlockers(state))) return state

      const newHealth = m.health - 1
      const killed = newHealth <= 0
      const monsters = killed
        ? state.monsters.filter((x) => x.id !== m.id)
        : state.monsters.map((x) => (x.id === m.id ? { ...x, health: newHealth } : x))
      const base = withLog(
        {
          ...state,
          hero: { ...state.hero, health: state.hero.health - 1 },
          monsters,
          classState: { ...state.classState, usedThisLevel: true },
        },
        { t: 'necroSmite', kind: m.kind, id: m.id, killed },
      )
      if (monsters.length === 0) {
        if (state.levelIndex === TOTAL_LEVELS - 1) return withLog({ ...base, phase: 'Won' }, { t: 'won' })
        return withLog({ ...base, phase: 'EndOfLevel' }, { t: 'levelCleared' })
      }
      return base
    }

    case 'ABILITY_CLERIC_BLESS': {
      if (state.phase !== 'Energy' || state.hero.classId !== 'cleric') return state
      const { rolled } = state.energy
      if (rolled.length !== 3 || state.energy.clericBoosted) return state
      if (!(rolled[0] === rolled[1] && rolled[1] === rolled[2])) return state
      const boosted = rolled.map((v) => Math.min(6, v + 2)) as typeof rolled
      return withLog(
        { ...state, energy: { ...state.energy, rolled: boosted, clericBoosted: true } },
        { t: 'clericBless', dice: boosted },
      )
    }

    case 'ABILITY_KNIGHT_DOUBLE': {
      if (state.phase !== 'Energy' || state.hero.classId !== 'knight') return state
      if (state.classState.usedThisLevel || state.energy.rolled.length === 0 || state.energy.knightUnlocked) {
        return state
      }
      return withLog(
        {
          ...state,
          energy: { ...state.energy, knightUnlocked: true },
          classState: { ...state.classState, usedThisLevel: true },
        },
        { t: 'knightDouble' },
      )
    }

    case 'ABILITY_ROGUE_BOOST': {
      if (state.phase !== 'Energy' || state.hero.classId !== 'rogue') return state
      if (state.classState.usedThisLevel || state.energy.rolled.length === 0) return state
      const boosted = state.energy.rolled.map((v) => Math.min(6, v + 1)) as typeof state.energy.rolled
      return withLog(
        {
          ...state,
          energy: { ...state.energy, rolled: boosted },
          classState: { ...state.classState, usedThisLevel: true },
        },
        { t: 'rogueBoost', dice: boosted },
      )
    }

    case 'SET_DIFFICULTY':
      return { ...state, settings: { ...state.settings, difficulty: action.difficulty } }

    case 'SET_TREASURE':
      return { ...state, settings: { ...state.settings, treasureChests: action.enabled } }

    case 'SET_EXPANSION': {
      // Turning the expansion off must not strand the hero on a now-hidden class.
      const classId =
        !action.enabled && state.hero.classId && EXPANSION_CLASSES.has(state.hero.classId)
          ? null
          : state.hero.classId
      return {
        ...state,
        hero: { ...state.hero, classId },
        settings: { ...state.settings, expansion: action.enabled },
      }
    }

    case 'RESTART':
      return createInitialState(state.settings)

    case 'TOGGLE_DEBUG':
      return { ...state, debug: !state.debug }

    case 'DEBUG_JUMP_LEVEL': {
      // Developer warp: jump straight into any level (or its boss arena),
      // bypassing the normal BossChoice / reward flow. Only honoured in god-mode.
      if (!state.debug) return state
      if (action.idx < 0 || action.idx >= TOTAL_LEVELS) return state
      const useBoss = !!action.boss && !!BOSS_LEVELS[action.idx + 1]
      return loadLevel(state, action.idx, useBoss)
    }

    default:
      return state
  }
}
