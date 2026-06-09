import type { Coord } from './types'
import { coordKey, neighbors } from './grid'

export type Passable = (c: Coord) => boolean

/**
 * Weighted-grid Dijkstra cost field from `source` (orthogonal 2, diagonal 3).
 *
 * `canTraverse(c)` decides whether a tile may be entered or passed through. The
 * source itself is always seeded with cost 0 even if it is not traversable
 * (you always start on your own tile).
 *
 * The board is only 25 tiles, so a linear-scan priority queue is plenty.
 */
export function costField(source: Coord, canTraverse: Passable): Map<string, number> {
  const dist = new Map<string, number>()
  dist.set(coordKey(source), 0)
  const pq: Array<{ c: Coord; d: number }> = [{ c: source, d: 0 }]

  while (pq.length > 0) {
    let mi = 0
    for (let i = 1; i < pq.length; i++) if (pq[i].d < pq[mi].d) mi = i
    const { c, d } = pq.splice(mi, 1)[0]
    if (d > (dist.get(coordKey(c)) ?? Infinity)) continue

    for (const n of neighbors(c)) {
      if (!canTraverse(n.coord)) continue
      const k = coordKey(n.coord)
      const nd = d + n.cost
      if (nd < (dist.get(k) ?? Infinity)) {
        dist.set(k, nd)
        pq.push({ c: n.coord, d: nd })
      }
    }
  }
  return dist
}

/**
 * Cheapest movement-point cost from `from` to `to`, or null if unreachable.
 * The destination is treated as reachable even if `canTraverse` would reject it
 * (used by Range, which measures geometric reach onto an occupied tile).
 */
export function pathCost(from: Coord, to: Coord, canTraverse: Passable): number | null {
  const field = costField(from, (c) => canTraverse(c) || (c.x === to.x && c.y === to.y))
  const v = field.get(coordKey(to))
  return v === undefined ? null : v
}

/** Tiles reachable from `source` within `budget`, keyed by coord, value = cost. */
export function reachableWithin(
  source: Coord,
  budget: number,
  canTraverse: Passable,
): Map<string, number> {
  const field = costField(source, canTraverse)
  const out = new Map<string, number>()
  for (const [k, v] of field) if (v <= budget) out.set(k, v)
  return out
}
