import { describe, it, expect } from 'vitest'
import { createInitialState, gameReducer } from './reducer'
import type { Action } from './actions'
import type { GameState, Settings } from './types'
import { BOSS_LEVELS, isBossLevelIndex } from './levels'
import { blocksMove, isVoid } from './board'

const expansion: Settings = { difficulty: 'faithful', seed: 1, expansion: true, treasureChests: false }
const classic: Settings = { difficulty: 'faithful', seed: 1, expansion: false, treasureChests: false }
const run = (s: GameState, ...actions: Action[]) => actions.reduce(gameReducer, s)

/** Drive a fresh game to the point of entering level 3 (index 2). */
function atLevel3(settings: Settings): GameState {
  const start = run(createInitialState(settings), { type: 'SELECT_CLASS', classId: 'none' }, { type: 'START_GAME' })
  // Clear levels 1 and 2 by jumping straight through the EndOfLevel reward.
  let s: GameState = { ...start, phase: 'EndOfLevel', levelIndex: 0 }
  s = run(s, { type: 'CHOOSE_REWARD', reward: { kind: 'heal' } }) // -> level 2 (index 1)
  s = { ...s, phase: 'EndOfLevel' }
  s = run(s, { type: 'CHOOSE_REWARD', reward: { kind: 'heal' } }) // -> level 3 decision
  return s
}

describe('boss level indices', () => {
  it('flags levels 3, 6, 9 and 12 (0-based 2/5/8/11)', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter(isBossLevelIndex)).toEqual([2, 5, 8, 11])
  })
})

describe('optional boss entry', () => {
  it('pauses on BossChoice when reaching a boss level in expansion mode', () => {
    const s = atLevel3(expansion)
    expect(s.phase).toBe('BossChoice')
    expect(s.bossPending).toBe(2)
    // Not yet loaded: still showing the previous level's board.
    expect(s.monsters.length).toBeGreaterThan(0)
  })

  it('skips the choice entirely in classic mode', () => {
    const s = atLevel3(classic)
    expect(s.phase).toBe('Energy')
    expect(s.levelIndex).toBe(2)
    // The regular level-3 foe, not a boss.
    expect(s.monsters[0].kind).toBe('orc')
  })

  it('loads the boss arena when the player accepts', () => {
    let s = atLevel3(expansion)
    s = run(s, { type: 'RESOLVE_BOSS_CHOICE', boss: true })
    expect(s.phase).toBe('Energy')
    expect(s.levelIndex).toBe(2)
    expect(s.monsters).toHaveLength(1)
    expect(s.monsters[0].kind).toBe('lizardTroll')
    expect(s.monsters[0].pos).toEqual({ x: 2, y: 2 }) // spawns dead centre
    expect(s.monsters[0].maxHealth).toBe(7)
    // The (0,0) and (4,4) corners are removed from the arena.
    expect(s.voids).toEqual([{ x: 0, y: 0 }, { x: 4, y: 4 }])
    expect(s.bossPending).toBeNull()
  })

  it('loads the regular level when the player declines', () => {
    let s = atLevel3(expansion)
    s = run(s, { type: 'RESOLVE_BOSS_CHOICE', boss: false })
    expect(s.phase).toBe('Energy')
    expect(s.levelIndex).toBe(2)
    expect(s.monsters[0].kind).toBe('orc')
    expect(s.voids).toEqual([])
  })
})

describe('boss arena voids', () => {
  it('treats removed corners as off-board (blocked, never stoppable)', () => {
    let s = atLevel3(expansion)
    s = run(s, { type: 'RESOLVE_BOSS_CHOICE', boss: true })
    expect(isVoid(s, { x: 0, y: 0 })).toBe(true)
    expect(isVoid(s, { x: 4, y: 4 })).toBe(true)
    expect(blocksMove(s, { x: 0, y: 0 })).toBe(true)
    expect(blocksMove(s, { x: 2, y: 2 })).toBe(false)
  })
})

describe('boss stat blocks', () => {
  it('matches the rulebook (HP/SPD/ATK/DEF/RNG)', () => {
    expect(BOSS_LEVELS[3].monster).toEqual({ health: 7, speed: 3, attack: 7, defense: 4, range: 3 })
    expect(BOSS_LEVELS[6].monster).toEqual({ health: 8, speed: 3, attack: 6, defense: 5, range: 5 })
    expect(BOSS_LEVELS[9].monster).toEqual({ health: 10, speed: 6, attack: 7, defense: 6, range: 3 })
    expect(BOSS_LEVELS[12].monster).toEqual({ health: 12, speed: 6, attack: 8, defense: 7, range: 6 })
  })

  it('every boss has more than 6 Health (drawn on a D12)', () => {
    for (const lvl of [3, 6, 9, 12]) expect(BOSS_LEVELS[lvl].monster.health).toBeGreaterThan(6)
  })
})

describe('boss column obstacles', () => {
  // Cards list columns in y-up; the engine stores them y-down (y -> 4 - y).
  it('places the rulebook columns (converted to y-down)', () => {
    expect(BOSS_LEVELS[3].walls).toEqual([{ x: 3, y: 3 }, { x: 1, y: 1 }])
    expect(BOSS_LEVELS[6].walls).toEqual([{ x: 2, y: 3 }, { x: 3, y: 3 }, { x: 2, y: 1 }])
    expect(BOSS_LEVELS[9].walls).toEqual([{ x: 3, y: 3 }, { x: 1, y: 1 }])
    expect(BOSS_LEVELS[12].walls).toEqual([{ x: 2, y: 3 }, { x: 1, y: 1 }, { x: 2, y: 1 }])
  })

  it('never overlaps the central boss spawn, the voids, or the hero start', () => {
    for (const lvl of [3, 6, 9, 12]) {
      const cfg = BOSS_LEVELS[lvl]
      const clash = (a: { x: number; y: number }, b: { x: number; y: number }) => a.x === b.x && a.y === b.y
      for (const w of cfg.walls) {
        expect(clash(w, { x: 2, y: 2 })).toBe(false)
        expect(clash(w, cfg.heroStart)).toBe(false)
        expect(cfg.voids!.some((v) => clash(v, w))).toBe(false)
      }
    }
  })

  it('carries column walls into the loaded arena', () => {
    let s = atLevel3(expansion)
    s = run(s, { type: 'RESOLVE_BOSS_CHOICE', boss: true })
    expect(s.walls).toEqual([{ x: 3, y: 3 }, { x: 1, y: 1 }])
    expect(blocksMove(s, { x: 3, y: 3 })).toBe(true)
  })
})

describe('boss arena palette', () => {
  it('is red for the lava cards (3/9) and blue for the others (6/12)', () => {
    expect(BOSS_LEVELS[3].palette).toBe('red')
    expect(BOSS_LEVELS[9].palette).toBe('red')
    expect(BOSS_LEVELS[6].palette).toBe('blue')
    expect(BOSS_LEVELS[12].palette).toBe('blue')
  })
})

describe('expansion gating', () => {
  it('omits Treasure Chests in classic mode even when the chest flag is on', () => {
    const s = run(
      createInitialState({ ...classic, treasureChests: true }),
      { type: 'SELECT_CLASS', classId: 'none' },
      { type: 'START_GAME' },
    )
    expect(s.chest).toBeNull()
  })

  it('clears an expansion-only class when the expansion is turned off', () => {
    let s = run(createInitialState(expansion), { type: 'SELECT_CLASS', classId: 'rogue' })
    expect(s.hero.classId).toBe('rogue')
    s = run(s, { type: 'SET_EXPANSION', enabled: false })
    expect(s.hero.classId).toBeNull()
    expect(s.settings.expansion).toBe(false)
  })
})
