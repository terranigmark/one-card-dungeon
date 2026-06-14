import { describe, it, expect } from 'vitest'
import { createInitialState, gameReducer } from './reducer'
import type { Action } from './actions'
import type { GameState, Monster } from './types'

const settings = { difficulty: 'faithful' as const, seed: 1, treasureChests: false }
const run = (s: GameState, ...actions: Action[]) => actions.reduce(gameReducer, s)

function mob(over: Partial<Monster> & Pick<Monster, 'id' | 'pos'>): Monster {
  return {
    health: 2,
    maxHealth: 2,
    speed: 5,
    attack: 4,
    defense: 2,
    range: 3,
    kind: 'spider',
    ...over,
  }
}

/** A ready-to-act Adventurer-phase state with generous pools. */
function adventurer(hero: { x: number; y: number }, monsters: Monster[], over: Partial<GameState> = {}): GameState {
  const base = createInitialState(settings)
  return {
    ...base,
    phase: 'Adventurer',
    hero: { ...base.hero, pos: hero },
    monsters,
    turn: { totals: { speed: 6, attack: 10, defense: 3, range: 2 }, speedLeft: 6, attackLeft: 10 },
    ...over,
  }
}

describe('setup + class select', () => {
  it('starts at ClassSelect and begins level 1 after choosing a class', () => {
    let s = createInitialState(settings)
    expect(s.phase).toBe('ClassSelect')

    s = run(s, { type: 'START_GAME' }) // no class yet -> ignored
    expect(s.phase).toBe('ClassSelect')

    s = run(s, { type: 'SELECT_CLASS', classId: 'barbarian' }, { type: 'START_GAME' })
    expect(s.phase).toBe('Energy')
    expect(s.levelIndex).toBe(0)
    expect(s.monsters).toHaveLength(2)
    expect(s.monsters.every((m) => m.health === 2 && m.kind === 'spider')).toBe(true)
    expect(s.hero.pos).toEqual({ x: 0, y: 4 })
  })
})

describe('energy phase', () => {
  const start = () =>
    run(createInitialState(settings), { type: 'SELECT_CLASS', classId: 'wizard' }, { type: 'START_GAME' }, { type: 'ROLL_ENERGY' })

  it('rolls three dice', () => {
    const s = start()
    expect(s.energy.rolled).toHaveLength(3)
    expect(s.energy.rolled.every((d) => d >= 1 && d <= 6)).toBe(true)
  })

  it('refuses to confirm until all dice are assigned', () => {
    let s = start()
    s = run(s, { type: 'ASSIGN_DIE', slot: 'speed', dieIndex: 0 }, { type: 'CONFIRM_ENERGY' })
    expect(s.phase).toBe('Energy') // still not assigned
  })

  it('ignores a die assigned to Range without the Ranger ability', () => {
    let s = start()
    s = run(s, { type: 'ASSIGN_DIE', slot: 'range', dieIndex: 0 })
    expect(s.energy.assignment.range).toBeUndefined()
  })

  it('confirms with all dice assigned and computes totals', () => {
    let s = start()
    const [d0, d1, d2] = s.energy.rolled
    s = run(
      s,
      { type: 'ASSIGN_DIE', slot: 'speed', dieIndex: 0 },
      { type: 'ASSIGN_DIE', slot: 'attack', dieIndex: 1 },
      { type: 'ASSIGN_DIE', slot: 'defense', dieIndex: 2 },
      { type: 'CONFIRM_ENERGY' },
    )
    expect(s.phase).toBe('Adventurer')
    expect(s.turn).not.toBeNull()
    expect(s.turn!.totals).toEqual({ speed: 1 + d0, attack: 1 + d1, defense: 1 + d2, range: 2 })
    expect(s.turn!.speedLeft).toBe(1 + d0)
  })
})

describe('adventurer phase — movement', () => {
  it('moves the hero and deducts speed; rejects walls and over-budget moves', () => {
    let s = adventurer({ x: 0, y: 0 }, [mob({ id: 1, pos: { x: 4, y: 4 } })], { walls: [{ x: 1, y: 0 }] })
    s = run(s, { type: 'MOVE_HERO', to: { x: 1, y: 0 } }) // wall
    expect(s.hero.pos).toEqual({ x: 0, y: 0 })

    s = run(s, { type: 'MOVE_HERO', to: { x: 0, y: 1 } }) // ortho, cost 2
    expect(s.hero.pos).toEqual({ x: 0, y: 1 })
    expect(s.turn!.speedLeft).toBe(4)

    const far = run(s, { type: 'MOVE_HERO', to: { x: 4, y: 1 } }) // cost 6 > 4 left
    expect(far.hero.pos).toEqual({ x: 0, y: 1 })
  })
})

describe('adventurer phase — attacks', () => {
  it('spends attack equal to defense, kills at 0 HP, and clears the level', () => {
    let s = adventurer({ x: 0, y: 0 }, [mob({ id: 1, pos: { x: 1, y: 0 }, health: 2, defense: 2 })])
    s = run(s, { type: 'ATTACK', targetId: 1 })
    expect(s.monsters[0].health).toBe(1)
    expect(s.turn!.attackLeft).toBe(8) // 10 - 2

    s = run(s, { type: 'ATTACK', targetId: 1 })
    expect(s.monsters).toHaveLength(0)
    expect(s.phase).toBe('EndOfLevel') // level 1 cleared (not final)
  })

  it('rejects attacks out of range', () => {
    let s = adventurer({ x: 0, y: 0 }, [mob({ id: 1, pos: { x: 2, y: 2 } })]) // range cost 6 > 2
    s = run(s, { type: 'ATTACK', targetId: 1 })
    expect(s.monsters[0].health).toBe(2)
  })

  it('wins the game when the final level is cleared', () => {
    let s = adventurer({ x: 0, y: 0 }, [mob({ id: 1, pos: { x: 1, y: 0 }, health: 1, defense: 1 })], {
      levelIndex: 11,
    })
    s = run(s, { type: 'ATTACK', targetId: 1 })
    expect(s.phase).toBe('Won')
  })
})

describe('monster phases', () => {
  it('resolves movement then attack, applying the damage formula', () => {
    // Monster adjacent, Attack 8; hero Defense total 3 -> floor(8/3) = 2 damage.
    let s = adventurer({ x: 0, y: 0 }, [mob({ id: 1, pos: { x: 1, y: 0 }, attack: 8, range: 3 })])
    s = { ...s, hero: { ...s.hero, health: 6 } }
    s = run(s, { type: 'END_ADVENTURER' })
    expect(s.phase).toBe('MonsterMove')
    s = run(s, { type: 'RESOLVE_MONSTER_MOVE' })
    expect(s.phase).toBe('MonsterAttack')
    s = run(s, { type: 'RESOLVE_MONSTER_ATTACK' })
    expect(s.hero.health).toBe(4)
    expect(s.phase).toBe('Energy') // next turn
  })

  it('ends the game when damage reduces health to zero', () => {
    let s = adventurer({ x: 0, y: 0 }, [mob({ id: 1, pos: { x: 1, y: 0 }, attack: 8, range: 3 })])
    s = { ...s, phase: 'MonsterAttack', hero: { ...s.hero, health: 1 } }
    s = run(s, { type: 'RESOLVE_MONSTER_ATTACK' })
    expect(s.phase).toBe('Lost')
    expect(s.hero.health).toBe(0)
  })
})

describe('end of level rewards', () => {
  it('upgrades a skill and advances to the next level', () => {
    let s: GameState = { ...adventurer({ x: 0, y: 0 }, []), phase: 'EndOfLevel', levelIndex: 0 }
    s = run(s, { type: 'CHOOSE_REWARD', reward: { kind: 'skill', skill: 'attack' } })
    expect(s.hero.base.attack).toBe(2)
    expect(s.levelIndex).toBe(1)
    expect(s.phase).toBe('Energy')
  })

  it('heals to full instead of upgrading', () => {
    let s: GameState = {
      ...adventurer({ x: 0, y: 0 }, []),
      phase: 'EndOfLevel',
      levelIndex: 0,
      hero: { ...createInitialState(settings).hero, health: 2 },
    }
    s = run(s, { type: 'CHOOSE_REWARD', reward: { kind: 'heal' } })
    expect(s.hero.health).toBe(6)
    expect(s.hero.base.attack).toBe(1)
  })
})

describe('class abilities', () => {
  it('Ranger unlocks the Range slot for one turn', () => {
    const s = run(
      createInitialState(settings),
      { type: 'SELECT_CLASS', classId: 'ranger' },
      { type: 'START_GAME' },
      { type: 'ROLL_ENERGY' },
      { type: 'ABILITY_RANGER_RANGE' },
      { type: 'ASSIGN_DIE', slot: 'range', dieIndex: 0 },
    )
    expect(s.energy.rangerUnlocked).toBe(true)
    expect(s.energy.assignment.range).toBe(0)
    expect(s.classState.usedThisLevel).toBe(true)
  })
})
