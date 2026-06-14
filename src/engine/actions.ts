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
  | { type: 'OPEN_CHEST' }
  | { type: 'END_ADVENTURER' }
  // treasure chest loot (M'Guf-yn Returns)
  | { type: 'SET_CHEST_SPEND'; slot: Skill; amount: number }
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
  // expansion class abilities (M'Guf-yn Returns)
  | { type: 'ABILITY_NECROMANCER_SMITE'; targetId: number }
  | { type: 'ABILITY_CLERIC_BLESS' }
  | { type: 'ABILITY_KNIGHT_DOUBLE' }
  | { type: 'ABILITY_ROGUE_BOOST' }
  // meta
  | { type: 'SET_DIFFICULTY'; difficulty: Difficulty }
  | { type: 'SET_TREASURE'; enabled: boolean }
  | { type: 'RESTART' }
