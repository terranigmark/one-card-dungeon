import type { Coord, LevelConfig, MonsterKind, MonsterStats } from './types'

// ---------------------------------------------------------------------------
// The 12 dungeon levels.
//
// Monster stats, spawn tiles and wall layouts are SEEDED here for a smooth,
// winnable difficulty curve and this file is the single place to tune the game.
// Level 1 matches the rulebook exactly (two 2-Health Spiders, Range 3, Attack 4).
// Higher levels are best-effort readings of the printed card and are expected to
// be calibrated during playtesting / against the real card art.
//
// Coordinates are in DISPLAY space (they line up with the upright 5x5 overlay).
// `side` + `orientation` only control how the background card image is rotated.
// ---------------------------------------------------------------------------

const C = (x: number, y: number): Coord => ({ x, y })

// Two wall motifs, one per card side.
const wallsA: Coord[] = [C(1, 1), C(3, 1), C(2, 3)]
const wallsB: Coord[] = [C(2, 1), C(1, 3), C(3, 3)]

interface Spec {
  level: number
  side: 1 | 2
  orientation: 0 | 180
  kind: MonsterKind
  walls: Coord[]
  heroStart: Coord
  spawns: Coord[]
  monster: MonsterStats
}

function build(s: Spec): LevelConfig {
  return {
    level: s.level,
    side: s.side,
    orientation: s.orientation,
    walls: s.walls,
    heroStart: s.heroStart,
    monsterSpawns: s.spawns,
    monster: s.monster,
    monsterKind: s.kind,
  }
}

export const LEVELS: LevelConfig[] = [
  build({
    level: 1, side: 1, orientation: 180, kind: 'spider', walls: wallsA, heroStart: C(0, 4),
    spawns: [C(1, 0), C(3, 0)], monster: { health: 2, speed: 5, attack: 4, defense: 2, range: 3 },
  }),
  build({
    level: 2, side: 2, orientation: 180, kind: 'skeleton', walls: wallsB, heroStart: C(4, 4),
    spawns: [C(0, 0), C(2, 0)], monster: { health: 3, speed: 4, attack: 4, defense: 2, range: 4 },
  }),
  build({
    level: 3, side: 1, orientation: 0, kind: 'orc', walls: wallsA, heroStart: C(0, 4),
    spawns: [C(1, 0), C(3, 0)], monster: { health: 4, speed: 3, attack: 6, defense: 3, range: 2 },
  }),
  build({
    level: 4, side: 2, orientation: 0, kind: 'demon', walls: wallsB, heroStart: C(4, 4),
    spawns: [C(0, 0), C(2, 0)], monster: { health: 5, speed: 4, attack: 6, defense: 3, range: 3 },
  }),
  build({
    level: 5, side: 1, orientation: 180, kind: 'spider', walls: wallsA, heroStart: C(0, 4),
    spawns: [C(0, 0), C(2, 0), C(4, 0)], monster: { health: 3, speed: 5, attack: 4, defense: 2, range: 3 },
  }),
  build({
    level: 6, side: 2, orientation: 180, kind: 'skeleton', walls: wallsB, heroStart: C(4, 4),
    spawns: [C(0, 0), C(4, 0)], monster: { health: 4, speed: 4, attack: 5, defense: 3, range: 4 },
  }),
  build({
    level: 7, side: 1, orientation: 0, kind: 'orc', walls: wallsA, heroStart: C(0, 4),
    spawns: [C(0, 0), C(4, 0)], monster: { health: 5, speed: 3, attack: 7, defense: 3, range: 2 },
  }),
  build({
    level: 8, side: 2, orientation: 0, kind: 'demon', walls: wallsB, heroStart: C(4, 4),
    spawns: [C(0, 0), C(2, 0)], monster: { health: 6, speed: 5, attack: 7, defense: 4, range: 3 },
  }),
  build({
    level: 9, side: 1, orientation: 180, kind: 'spider', walls: wallsA, heroStart: C(0, 4),
    spawns: [C(0, 0), C(4, 0), C(2, 1)], monster: { health: 4, speed: 6, attack: 5, defense: 2, range: 3 },
  }),
  build({
    level: 10, side: 2, orientation: 180, kind: 'skeleton', walls: wallsB, heroStart: C(4, 4),
    spawns: [C(0, 0), C(2, 0), C(4, 0)], monster: { health: 5, speed: 5, attack: 6, defense: 3, range: 4 },
  }),
  build({
    level: 11, side: 1, orientation: 0, kind: 'orc', walls: wallsA, heroStart: C(0, 4),
    spawns: [C(1, 0), C(3, 0), C(2, 0)], monster: { health: 6, speed: 4, attack: 8, defense: 4, range: 2 },
  }),
  build({
    level: 12, side: 2, orientation: 0, kind: 'demon', walls: wallsB, heroStart: C(4, 4),
    spawns: [C(0, 0), C(2, 0), C(4, 0)], monster: { health: 7, speed: 5, attack: 8, defense: 4, range: 4 },
  }),
]

export const TOTAL_LEVELS = LEVELS.length
