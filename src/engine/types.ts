// Core domain types for One-Card Dungeon. Pure data — no logic lives here.

/** The dungeon grid is always 5x5. */
export const GRID = 5

export interface Coord {
  x: number // column, 0..4 (left -> right)
  y: number // row, 0..4 (top -> bottom)
}

export type DieFace = 1 | 2 | 3 | 4 | 5 | 6

export type Skill = 'speed' | 'attack' | 'defense' | 'range'
/**
 * Slots an energy die can be assigned to. Range is normally excluded — only the
 * Ranger class unlocks it for a single turn.
 */
export type AssignSlot = 'speed' | 'attack' | 'defense' | 'range'

export type ClassId = 'paladin' | 'barbarian' | 'ranger' | 'wizard' | 'none'
export type MonsterKind = 'spider' | 'orc' | 'skeleton' | 'demon'
export type Difficulty = 'faithful' | 'aggressive'

export type Phase =
  | 'ClassSelect'
  | 'Energy' // awaiting roll + assignment
  | 'Adventurer' // spending Speed/Attack pools
  | 'MonsterMove'
  | 'MonsterAttack'
  | 'EndOfLevel' // choosing +1 skill or heal
  | 'Won'
  | 'Lost'

export interface HeroBase {
  speed: number
  attack: number
  defense: number
  range: number
}

export interface Hero {
  pos: Coord
  health: number
  maxHealth: number
  base: HeroBase // persistent skills; grow via the end-of-level +1 reward
  classId: ClassId | null
}

export interface MonsterStats {
  health: number
  speed: number
  attack: number
  defense: number
  range: number
}

export interface Monster {
  id: number
  pos: Coord
  health: number
  maxHealth: number
  speed: number
  attack: number
  defense: number
  range: number
  kind: MonsterKind
}

export interface EnergyDice {
  rolled: DieFace[] // empty before the roll, otherwise exactly 3 values
  /** Maps an assignment slot to an index (0..2) into `rolled`. */
  assignment: Partial<Record<AssignSlot, number>>
  /** Ranger ability: the Range slot is assignable this turn. */
  rangerUnlocked: boolean
}

export interface SkillTotals {
  speed: number
  attack: number
  defense: number
  range: number
}

export interface TurnState {
  totals: SkillTotals // base + assigned dice for this turn
  speedLeft: number // remaining Speed points to spend
  attackLeft: number // remaining Attack points to spend
}

export interface ClassState {
  usedThisLevel: boolean // paladin / ranger / wizard (once per dungeon level)
  usedThisTurn: boolean // barbarian (once per turn)
  paladinHeldDie: DieFace | null // a die carried over from last turn
}

export interface Settings {
  difficulty: Difficulty
  seed: number
}

export interface LevelConfig {
  level: number // 1..12
  side: 1 | 2 // which card image
  orientation: 0 | 180 // how the card image is rotated for this level
  walls: Coord[] // display-space coordinates (match the upright overlay)
  heroStart: Coord
  monsterSpawns: Coord[]
  monster: MonsterStats // template instantiated at each spawn
  monsterKind: MonsterKind
}

export interface GameState {
  phase: Phase
  levelIndex: number // 0..11
  hero: Hero
  monsters: Monster[]
  walls: Coord[]
  energy: EnergyDice
  turn: TurnState | null
  classState: ClassState
  settings: Settings
  turnCount: number // turns elapsed in the current level
  log: string[]
  rngState: number // serializable PRNG cursor
  /** Paladin: a die value carried into next turn's roll (consumed on roll). */
  paladinPending: DieFace | null
}
