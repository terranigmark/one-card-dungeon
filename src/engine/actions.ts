import type { AssignSlot, ClassId, Coord, Difficulty, Skill } from './types'

export type Reward = { kind: 'skill'; skill: Skill } | { kind: 'heal' }

export type Action =
  // setup
  | { type: 'SELECT_CLASS'; classId: ClassId }
  | { type: 'START_GAME' }
  // energy phase
  | { type: 'ROLL_ENERGY' }
  | { type: 'ASSIGN_DIE'; slot: AssignSlot; dieIndex: number }
  | { type: 'UNASSIGN_DIE'; slot: AssignSlot }
  | { type: 'CONFIRM_ENERGY' }
  // adventurer phase
  | { type: 'MOVE_HERO'; to: Coord }
  | { type: 'ATTACK'; targetId: number }
  | { type: 'END_ADVENTURER' }
  // monster phases (driven by the UI / tests)
  | { type: 'RESOLVE_MONSTER_MOVE' }
  | { type: 'RESOLVE_MONSTER_ATTACK' }
  // end of level
  | { type: 'CHOOSE_REWARD'; reward: Reward }
  // class abilities
  | { type: 'ABILITY_PALADIN_KEEP'; dieIndex: number }
  | { type: 'ABILITY_BARBARIAN_REROLL' }
  | { type: 'ABILITY_RANGER_RANGE' }
  | { type: 'ABILITY_WIZARD_REROLL' }
  // meta
  | { type: 'SET_DIFFICULTY'; difficulty: Difficulty }
  | { type: 'RESTART' }
