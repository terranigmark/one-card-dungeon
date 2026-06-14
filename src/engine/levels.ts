import type { Coord, LevelConfig, MonsterKind, MonsterStats } from './types'
import { allCoords, coordEq, rotate180 } from './grid'

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

// ---------------------------------------------------------------------------
// M'Guf-yn Returns — boss levels.
//
// On levels 3, 6, 9 and 12 the expansion lets the player OPT IN to a boss
// fight. A boss arena shrinks the grid by removing the (0,0) and (4,4) corners
// (the `voids`), spawns a single boss in the dead centre (2,2) and clears the
// pillars so the duel has room. Bosses have more than 6 Health and are drawn on
// a 12-sided die. The hero starts on a corner that still exists — bottom-left
// for the side-1 cards (3/9), top-right for the side-2 cards (6/12) whose usual
// (4,4) start is now a void.
// ---------------------------------------------------------------------------

const BOSS_VOIDS: Coord[] = [C(0, 0), C(4, 4)]

// Column obstacles read off the printed boss cards. The rulebook lists them in
// y-up (bottom-left origin) coordinates; the engine is y-down, so each y is
// flipped with `4 - y` via Cy().
const Cy = (x: number, yUp: number): Coord => C(x, 4 - yUp)

interface BossSpec {
  level: number
  side: 1 | 2
  orientation: 0 | 180
  kind: MonsterKind
  monster: MonsterStats
  /** 'red' lava cards (levels 3/9) vs 'blue' cards (levels 6/12). */
  palette: 'red' | 'blue'
  /** Column obstacles, given in the card's y-up coordinates. */
  columns: Coord[]
}

function boss(s: BossSpec): LevelConfig {
  return {
    level: s.level,
    side: s.side,
    orientation: s.orientation,
    walls: s.columns,
    heroStart: s.side === 1 ? C(0, 4) : C(4, 0),
    monsterSpawns: [C(2, 2)],
    monster: s.monster,
    monsterKind: s.kind,
    voids: BOSS_VOIDS.map((c) => ({ ...c })),
    palette: s.palette,
    isBoss: true,
  }
}

/** Boss variants keyed by level number (3 / 6 / 9 / 12). Stats: HP/SPD/ATK/DEF/RNG. */
export const BOSS_LEVELS: Record<number, LevelConfig> = {
  3: boss({
    level: 3, side: 1, orientation: 0, kind: 'lizardTroll', palette: 'red',
    monster: { health: 7, speed: 3, attack: 7, defense: 4, range: 3 },
    columns: [Cy(3, 1), Cy(1, 3)],
  }),
  6: boss({
    level: 6, side: 2, orientation: 180, kind: 'skeletonWarrior', palette: 'blue',
    monster: { health: 8, speed: 3, attack: 6, defense: 5, range: 5 },
    columns: [Cy(2, 1), Cy(3, 1), Cy(2, 3)],
  }),
  9: boss({
    level: 9, side: 1, orientation: 180, kind: 'giantMantis', palette: 'red',
    monster: { health: 10, speed: 6, attack: 7, defense: 6, range: 3 },
    columns: [Cy(3, 1), Cy(1, 3)],
  }),
  12: boss({
    level: 12, side: 2, orientation: 0, kind: 'mgufyn', palette: 'blue',
    monster: { health: 12, speed: 6, attack: 8, defense: 7, range: 6 },
    columns: [Cy(2, 1), Cy(1, 3), Cy(2, 3)],
  }),
}

/** Whether a level index (0-based) is one of the boss levels (3/6/9/12). */
export function isBossLevelIndex(idx: number): boolean {
  return (idx + 1) % 3 === 0
}

/**
 * Where the Treasure Chest sits: the exit stairs "opposite to the entrance"
 * (the hero's start), i.e. the diagonally opposite corner. If that tile is taken
 * by a wall or a monster spawn (level 8's far corner is), fall back to the
 * nearest free tile so the chest is always placeable.
 */
export function chestTileFor(cfg: LevelConfig): Coord {
  const target = rotate180(cfg.heroStart)
  const occupied = (c: Coord): boolean =>
    cfg.walls.some((w) => coordEq(w, c)) ||
    (cfg.voids ?? []).some((v) => coordEq(v, c)) ||
    cfg.monsterSpawns.some((s) => coordEq(s, c)) ||
    coordEq(c, cfg.heroStart)
  if (!occupied(target)) return target
  let best: Coord = target
  let bestDist = Infinity
  for (const c of allCoords()) {
    if (occupied(c)) continue
    const dist = Math.abs(c.x - target.x) + Math.abs(c.y - target.y)
    if (dist < bestDist) {
      bestDist = dist
      best = c
    }
  }
  return best
}
