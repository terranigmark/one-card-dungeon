import type { Coord, LevelConfig, MonsterKind, MonsterStats } from './types'
import { rotate180 } from './grid'

// ---------------------------------------------------------------------------
// The 12 dungeon levels.
//
// Monster stats, spawn tiles and wall layouts are SEEDED here for a smooth,
// winnable difficulty curve and this file is the single place to tune the game.
// Level 1 matches the rulebook exactly (two 2-Health Spiders, Range 3, Attack 4).
// Higher levels are best-effort readings of the printed card and are expected to
// be calibrated during playtesting / against the real card art.
//
// Coordinates are in DISPLAY space (x = column 0..4 left->right, y = row 0..4
// top->bottom). The blocking pillars track the card art: a level's `orientation`
// rotates both the background image AND the pillars, so they stay aligned. The
// hero start does NOT rotate — the hero always begins on the same bottom corner
// of its card side (bottom-left for side 1, bottom-right for side 2).
//
// The base layouts below are read off each printed card at the 180° orientation
// used by levels 1/5/9 (side 1) and 2/6/10 (side 2). The 0° levels (3/7/11 and
// 4/8/12) show the same card flipped, so their pillars are the 180° rotation of
// these (see `flipAll`); their start stays put.
// ---------------------------------------------------------------------------

const C = (x: number, y: number): Coord => ({ x, y })
const flipAll = (cs: Coord[]): Coord[] => cs.map(rotate180)

// Per-side base layouts (side at 180°): start tile + the three blocking pillars.
const side1Walls: Coord[] = [C(1, 3), C(3, 3), C(3, 1)]
const side1Start: Coord = C(0, 4)
const side2Walls: Coord[] = [C(3, 3), C(3, 2), C(0, 2)]
const side2Start: Coord = C(4, 4)

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
    level: 1, side: 1, orientation: 180, kind: 'spider', walls: side1Walls, heroStart: side1Start,
    spawns: [C(4, 2), C(3, 0)], monster: { health: 2, speed: 5, attack: 4, defense: 4, range: 3 },
  }),
  build({
    level: 2, side: 2, orientation: 180, kind: 'skeleton', walls: side2Walls, heroStart: side2Start,
    spawns: [C(0, 1), C(2, 0)], monster: { health: 3, speed: 4, attack: 5, defense: 4, range: 4 },
  }),
  build({
    level: 3, side: 1, orientation: 0, kind: 'orc', walls: flipAll(side1Walls), heroStart: side1Start,
    spawns: [C(4, 1)], monster: { health: 5, speed: 3, attack: 7, defense: 7, range: 2 },
  }),
  build({
    level: 4, side: 2, orientation: 0, kind: 'demon', walls: flipAll(side2Walls), heroStart: side2Start,
    spawns: [C(1, 0)], monster: { health: 5, speed: 5, attack: 5, defense: 5, range: 5 },
  }),
  build({
    level: 5, side: 1, orientation: 180, kind: 'spider', walls: side1Walls, heroStart: side1Start,
    spawns: [C(1, 0), C(4, 1), C(0, 0)], monster: { health: 2, speed: 5, attack: 4, defense: 4, range: 3 },
  }),
  build({
    level: 6, side: 2, orientation: 180, kind: 'skeleton', walls: side2Walls, heroStart: side2Start,
    spawns: [C(0, 4), C(1, 1), C(1, 0)], monster: { health: 3, speed: 4, attack: 5, defense: 4, range: 4 },
  }),
  build({
    level: 7, side: 1, orientation: 0, kind: 'orc', walls: flipAll(side1Walls), heroStart: side1Start,
    spawns: [C(2, 1), C(4, 3)], monster: { health: 5, speed: 3, attack: 7, defense: 7, range: 2 },
  }),
  build({
    level: 8, side: 2, orientation: 0, kind: 'demon', walls: flipAll(side2Walls), heroStart: side2Start,
    spawns: [C(1, 4), C(0, 0)], monster: { health: 5, speed: 5, attack: 5, defense: 5, range: 5 },
  }),
  build({
    level: 9, side: 1, orientation: 180, kind: 'spider', walls: side1Walls, heroStart: side1Start,
    spawns: [C(0, 0), C(2, 4), C(2, 2), C(4, 3)], monster: { health: 2, speed: 5, attack: 4, defense: 4, range: 3 },
  }),
  build({
    level: 10, side: 2, orientation: 180, kind: 'skeleton', walls: side2Walls, heroStart: side2Start,
    spawns: [C(0, 3), C(1, 2), C(2, 1), C(4, 0)], monster: { health: 3, speed: 4, attack: 5, defense: 4, range: 4 },
  }),
  build({
    level: 11, side: 1, orientation: 0, kind: 'orc', walls: flipAll(side1Walls), heroStart: side1Start,
    spawns: [C(1, 0), C(3, 0), C(4, 2)], monster: { health: 5, speed: 3, attack: 7, defense: 7, range: 2 },
  }),
  build({
    level: 12, side: 2, orientation: 0, kind: 'demon', walls: flipAll(side2Walls), heroStart: side2Start,
    spawns: [C(0, 3), C(0, 1), C(2, 1)], monster: { health: 5, speed: 5, attack: 5, defense: 5, range: 5 },
  }),
]

export const TOTAL_LEVELS = LEVELS.length
