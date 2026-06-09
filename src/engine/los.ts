import type { Coord } from './types'
import { coordEq } from './grid'

// Line of sight, corner-to-corner.
//
// Each tile (x,y) is the unit square [x, x+1] x [y, y+1]. There is line of sight
// from tile A to tile B if SOME corner of A connects to SOME corner of B by a
// segment that does not overlap any blocker tile (wall or intervening monster)
// for a positive length.
//
// "Positive length" is the key: a segment that merely touches a blocker at a
// single corner point is NOT blocked (this is what lets you peek diagonally past
// a wall corner), but a segment that runs along a blocker's edge or crosses its
// interior IS blocked (so a wall in your row/column genuinely blocks sight).

const EPS = 1e-9

interface Pt {
  x: number
  y: number
}

function corners(c: Coord): Pt[] {
  return [
    { x: c.x, y: c.y },
    { x: c.x + 1, y: c.y },
    { x: c.x, y: c.y + 1 },
    { x: c.x + 1, y: c.y + 1 },
  ]
}

/**
 * Liang–Barsky clip of segment p->q against the closed box [xmin,xmax]x[ymin,ymax].
 * Returns true if the overlap with the box has positive length (a single-point
 * touch returns false).
 */
function segOverlapsBox(
  p: Pt,
  q: Pt,
  xmin: number,
  xmax: number,
  ymin: number,
  ymax: number,
): boolean {
  const dx = q.x - p.x
  const dy = q.y - p.y
  const P = [-dx, dx, -dy, dy]
  const Q = [p.x - xmin, xmax - p.x, p.y - ymin, ymax - p.y]
  let t0 = 0
  let t1 = 1
  for (let i = 0; i < 4; i++) {
    if (P[i] === 0) {
      // Segment parallel to this slab: outside if its position is negative.
      if (Q[i] < 0) return false
    } else {
      const r = Q[i] / P[i]
      if (P[i] < 0) {
        if (r > t1) return false
        if (r > t0) t0 = r
      } else {
        if (r < t0) return false
        if (r < t1) t1 = r
      }
    }
  }
  return t1 - t0 > EPS
}

function blockedByAny(p: Pt, q: Pt, blockers: Coord[]): boolean {
  for (const b of blockers) {
    if (segOverlapsBox(p, q, b.x, b.x + 1, b.y, b.y + 1)) return true
  }
  return false
}

/**
 * Line of sight from `from` to `to`. `blockers` is the set of wall and monster
 * tiles; the endpoints' own tiles never block.
 */
export function hasLineOfSight(from: Coord, to: Coord, blockers: Coord[]): boolean {
  if (coordEq(from, to)) return true
  const blk = blockers.filter((b) => !coordEq(b, from) && !coordEq(b, to))
  const fromCorners = corners(from)
  const toCorners = corners(to)
  for (const p of fromCorners) {
    for (const q of toCorners) {
      if (!blockedByAny(p, q, blk)) return true
    }
  }
  return false
}
