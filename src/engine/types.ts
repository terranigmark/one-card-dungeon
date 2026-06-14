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

export type ClassId =
  | 'paladin'
  | 'barbarian'
  | 'ranger'
  | 'wizard'
  // M'Guf-yn Returns expansion classes
  | 'necromancer'
  | 'cleric'
  | 'knight'
  | 'rogue'
  | 'none'
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
  /**
   * Knight ability: a second die stacked onto one skill this turn. At most one
   * entry ever — the expansion lets you double up a single skill, once per level.
   */
  secondary?: Partial<Record<AssignSlot, number>>
  /** Ranger ability: the Range slot is assignable this turn. */
  rangerUnlocked: boolean
  /** Knight ability: a slot may hold a second die this turn. */
  knightUnlocked?: boolean
  /** Cleric ability: the +2 triples bonus has already been applied to this roll. */
  clericBoosted?: boolean
}

/**
 * Treasure Chest (M'Guf-yn Returns). A yellow die placed on the exit stairs at
 * the start of each level. Its face is both its Defense (the Attack needed to
 * open it) and its Loot — bonus energy points you can pour into a single skill
 * per turn after opening. Unopened, it blocks movement and line of sight like a
 * wall. Discarded (unspent points lost) when the level is cleared.
 */
export interface ChestState {
  pos: Coord
  value: DieFace // Defense to open === Loot points granted
  opened: boolean
  remaining: number // unspent loot points (only meaningful once opened)
}

/** A planned allocation of chest loot for the current turn (one skill only). */
export interface ChestSpend {
  slot: Skill
  amount: number
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
  /** M'Guf-yn Returns: place a Treasure Chest on each level. */
  treasureChests: boolean
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

/**
 * A single action-log line, stored structurally (a discriminated event + its
 * data) rather than as a pre-formatted string. This keeps the engine pure and
 * language-agnostic: the UI translates each entry at render time, so the whole
 * log re-renders in the active language when it is switched. Wording lives in
 * `src/i18n/strings.ts`; the formatter is `formatLog` there.
 */
export type LogEntry =
  | { t: 'levelStart'; level: number; count: number; kind: MonsterKind }
  | { t: 'rolled'; dice: number[] }
  | { t: 'turnTotals'; speed: number; attack: number; defense: number; range: number }
  | { t: 'moved'; x: number; y: number; cost: number }
  | { t: 'hit'; kind: MonsterKind; id: number; cost: number }
  | { t: 'killed'; kind: MonsterKind; id: number; cost: number }
  | { t: 'levelCleared' }
  | { t: 'won' }
  | { t: 'monsterAttack'; total: number; defense: number; damage: number }
  | { t: 'died' }
  | { t: 'wizardReroll'; dice: number[] }
  | { t: 'barbarianReroll'; dice: number[] }
  | { t: 'rangerUnlock' }
  | { t: 'paladinKeep'; value: number }
  | { t: 'healed'; health: number }
  | { t: 'upgraded'; skill: Skill; value: number }
  // M'Guf-yn Returns expansion
  | { t: 'chestAppears'; value: number }
  | { t: 'chestOpened'; value: number }
  | { t: 'chestSpend'; slot: Skill; amount: number; remaining: number }
  | { t: 'necroSmite'; kind: MonsterKind; id: number; killed: boolean }
  | { t: 'clericBless'; dice: number[] }
  | { t: 'knightDouble' }
  | { t: 'rogueBoost'; dice: number[] }

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
  log: LogEntry[]
  rngState: number // serializable PRNG cursor
  /** Paladin: a die value carried into next turn's roll (consumed on roll). */
  paladinPending: DieFace | null
  /** M'Guf-yn Returns: the current level's Treasure Chest, if any. */
  chest: ChestState | null
  /** Treasure loot planned for this turn (folded into totals on confirm). */
  chestSpend: ChestSpend | null
}
