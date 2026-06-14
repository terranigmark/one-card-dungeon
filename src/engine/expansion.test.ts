import { describe, it, expect } from 'vitest'
import { createInitialState, gameReducer } from './reducer'
import type { Action } from './actions'
import type { ChestState, GameState, Monster } from './types'

const settings = { difficulty: 'faithful' as const, seed: 1, treasureChests: true }
const noChest = { ...settings, treasureChests: false }
const run = (s: GameState, ...actions: Action[]) => actions.reduce(gameReducer, s)

function mob(over: Partial<Monster> & Pick<Monster, 'id' | 'pos'>): Monster {
  return { health: 2, maxHealth: 2, speed: 5, attack: 4, defense: 2, range: 3, kind: 'spider', ...over }
}

/** An Energy-phase state with a fixed roll and chosen class. */
function energyState(classId: GameState['hero']['classId'], rolled: number[], over: Partial<GameState> = {}): GameState {
  const base = createInitialState(noChest)
  return {
    ...base,
    phase: 'Energy',
    hero: { ...base.hero, classId },
    energy: { rolled: rolled as never, assignment: {}, secondary: {}, rangerUnlocked: false, knightUnlocked: false, clericBoosted: false },
    ...over,
  }
}

/** A ready-to-act Adventurer-phase state with generous pools. */
function adventurer(over: Partial<GameState> = {}): GameState {
  const base = createInitialState(noChest)
  return {
    ...base,
    phase: 'Adventurer',
    hero: { ...base.hero, pos: { x: 0, y: 0 } },
    turn: { totals: { speed: 6, attack: 10, defense: 3, range: 4 }, speedLeft: 6, attackLeft: 10 },
    ...over,
  }
}

describe('treasure chest placement', () => {
  it('spawns on the opposite stairs at level start when enabled', () => {
    const s = run(createInitialState(settings), { type: 'SELECT_CLASS', classId: 'none' }, { type: 'START_GAME' })
    expect(s.chest).not.toBeNull()
    // Level 1 hero starts at (0,4); the opposite corner is (4,0).
    expect(s.chest!.pos).toEqual({ x: 4, y: 0 })
    expect(s.chest!.value).toBeGreaterThanOrEqual(1)
    expect(s.chest!.value).toBeLessThanOrEqual(6)
    expect(s.chest!.opened).toBe(false)
  })

  it('is omitted when the expansion is off', () => {
    const s = run(createInitialState(noChest), { type: 'SELECT_CLASS', classId: 'none' }, { type: 'START_GAME' })
    expect(s.chest).toBeNull()
  })

  it('blocks the hero from moving onto an unopened chest', () => {
    const chest: ChestState = { pos: { x: 1, y: 0 }, value: 3, opened: false, remaining: 3 }
    const s = run(adventurer({ chest }), { type: 'MOVE_HERO', to: { x: 1, y: 0 } })
    expect(s.hero.pos).toEqual({ x: 0, y: 0 })
  })
})

describe('treasure chest opening + loot', () => {
  it('opens an in-range chest, spending Attack equal to its value', () => {
    const chest: ChestState = { pos: { x: 1, y: 0 }, value: 3, opened: false, remaining: 3 }
    const s = run(adventurer({ chest }), { type: 'OPEN_CHEST' })
    expect(s.chest!.opened).toBe(true)
    expect(s.chest!.remaining).toBe(3)
    expect(s.turn!.attackLeft).toBe(7) // 10 - 3
  })

  it('refuses to open without enough Attack', () => {
    const chest: ChestState = { pos: { x: 1, y: 0 }, value: 5, opened: false, remaining: 5 }
    const s = run(adventurer({ chest, turn: { totals: { speed: 6, attack: 4, defense: 3, range: 4 }, speedLeft: 6, attackLeft: 4 } }), {
      type: 'OPEN_CHEST',
    })
    expect(s.chest!.opened).toBe(false)
  })

  it('pours loot into one skill on confirm and decrements the remaining', () => {
    const chest: ChestState = { pos: { x: 4, y: 0 }, value: 4, opened: true, remaining: 4 }
    let s = energyState('none', [2, 3, 4], { chest })
    s = run(
      s,
      { type: 'SET_CHEST_SPEND', slot: 'attack', amount: 2 },
      { type: 'ASSIGN_DIE', slot: 'speed', dieIndex: 0 },
      { type: 'ASSIGN_DIE', slot: 'attack', dieIndex: 1 },
      { type: 'ASSIGN_DIE', slot: 'defense', dieIndex: 2 },
      { type: 'CONFIRM_ENERGY' },
    )
    expect(s.phase).toBe('Adventurer')
    // attack = base 1 + die 3 + 2 loot = 6
    expect(s.turn!.totals.attack).toBe(6)
    expect(s.chest!.remaining).toBe(2)
  })

  it('clamps a loot request to what remains', () => {
    const chest: ChestState = { pos: { x: 4, y: 0 }, value: 2, opened: true, remaining: 2 }
    const s = run(energyState('none', [1, 1, 1], { chest }), { type: 'SET_CHEST_SPEND', slot: 'defense', amount: 9 })
    expect(s.chestSpend).toEqual({ slot: 'defense', amount: 2 })
  })

  it('discards the chest (loot lost) when the level is cleared', () => {
    const chest: ChestState = { pos: { x: 4, y: 0 }, value: 5, opened: true, remaining: 5 }
    let s: GameState = { ...adventurer({ chest, settings }), phase: 'EndOfLevel', levelIndex: 0 }
    s = run(s, { type: 'CHOOSE_REWARD', reward: { kind: 'heal' } })
    expect(s.levelIndex).toBe(1)
    // A brand-new chest was rolled for level 2 (loot reset).
    expect(s.chest!.opened).toBe(false)
    expect(s.chest!.remaining).toBe(s.chest!.value)
  })
})

describe('Necromancer', () => {
  it('loses 1 Health to deal 1 damage to an enemy in range, once per level', () => {
    const monsters = [mob({ id: 1, pos: { x: 1, y: 0 }, health: 2 })]
    let s = adventurer({ monsters, hero: { ...createInitialState(noChest).hero, pos: { x: 0, y: 0 }, classId: 'necromancer', health: 6 } })
    s = run(s, { type: 'ABILITY_NECROMANCER_SMITE', targetId: 1 })
    expect(s.hero.health).toBe(5)
    expect(s.monsters[0].health).toBe(1)
    expect(s.classState.usedThisLevel).toBe(true)
    // Second use is blocked this level.
    s = run(s, { type: 'ABILITY_NECROMANCER_SMITE', targetId: 1 })
    expect(s.hero.health).toBe(5)
  })

  it('clears the level when the smite is the killing blow', () => {
    const monsters = [mob({ id: 1, pos: { x: 1, y: 0 }, health: 1 })]
    let s = adventurer({ monsters, hero: { ...createInitialState(noChest).hero, pos: { x: 0, y: 0 }, classId: 'necromancer', health: 6 } })
    s = run(s, { type: 'ABILITY_NECROMANCER_SMITE', targetId: 1 })
    expect(s.monsters).toHaveLength(0)
    expect(s.phase).toBe('EndOfLevel')
  })

  it('will not smite when it would drop the hero to 0 Health', () => {
    const monsters = [mob({ id: 1, pos: { x: 1, y: 0 } })]
    const s = run(
      adventurer({ monsters, hero: { ...createInitialState(noChest).hero, pos: { x: 0, y: 0 }, classId: 'necromancer', health: 1 } }),
      { type: 'ABILITY_NECROMANCER_SMITE', targetId: 1 },
    )
    expect(s.hero.health).toBe(1)
    expect(s.monsters[0].health).toBe(2)
  })
})

describe('Cleric', () => {
  it('raises triples by 2, capped at 6, only once per roll', () => {
    let s = energyState('cleric', [3, 3, 3])
    s = run(s, { type: 'ABILITY_CLERIC_BLESS' })
    expect(s.energy.rolled).toEqual([5, 5, 5])
    expect(s.energy.clericBoosted).toBe(true)
    // Re-applying is rejected.
    s = run(s, { type: 'ABILITY_CLERIC_BLESS' })
    expect(s.energy.rolled).toEqual([5, 5, 5])
  })

  it('caps at 6', () => {
    const s = run(energyState('cleric', [5, 5, 5]), { type: 'ABILITY_CLERIC_BLESS' })
    expect(s.energy.rolled).toEqual([6, 6, 6])
  })

  it('does nothing without triples', () => {
    const s = run(energyState('cleric', [3, 3, 4]), { type: 'ABILITY_CLERIC_BLESS' })
    expect(s.energy.rolled).toEqual([3, 3, 4])
  })
})

describe('Knight', () => {
  it('stacks two dice on one skill once per level', () => {
    let s = energyState('knight', [2, 3, 4])
    s = run(s, { type: 'ABILITY_KNIGHT_DOUBLE' })
    expect(s.energy.knightUnlocked).toBe(true)
    expect(s.classState.usedThisLevel).toBe(true)
    s = run(
      s,
      { type: 'ASSIGN_DIE', slot: 'attack', dieIndex: 0 },
      { type: 'ASSIGN_DIE', slot: 'attack', dieIndex: 1 }, // stacks into secondary
      { type: 'ASSIGN_DIE', slot: 'speed', dieIndex: 2 },
      { type: 'CONFIRM_ENERGY' },
    )
    expect(s.phase).toBe('Adventurer')
    // attack = base 1 + die 2 + die 3 = 6; defense gets no die.
    expect(s.turn!.totals.attack).toBe(6)
    expect(s.turn!.totals.defense).toBe(1)
  })
})

describe('Rogue', () => {
  it('raises every rolled die by 1, capped at 6, once per level', () => {
    let s = energyState('rogue', [1, 4, 6])
    s = run(s, { type: 'ABILITY_ROGUE_BOOST' })
    expect(s.energy.rolled).toEqual([2, 5, 6])
    expect(s.classState.usedThisLevel).toBe(true)
    s = run(s, { type: 'ABILITY_ROGUE_BOOST' })
    expect(s.energy.rolled).toEqual([2, 5, 6]) // blocked second time
  })
})
