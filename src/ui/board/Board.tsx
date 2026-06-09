import { useMemo, useState } from 'react'
import { allCoords, coordKey } from '../../engine/grid'
import { LEVELS } from '../../engine/levels'
import { attackableTargets, reachableTiles } from '../../engine/selectors'
import { isWall, monsterAt } from '../../engine/board'
import { useDispatch, useGameState } from '../../state/hooks'
import type { Coord } from '../../engine/types'
import { Tile } from './Tile'
import { CARD_IMAGES } from './boardLayout'

export function Board() {
  const state = useGameState()
  const dispatch = useDispatch()
  const cfg = LEVELS[state.levelIndex]
  const interactive = state.phase === 'Adventurer'
  const [failedSides, setFailedSides] = useState<Record<number, boolean>>({})

  const reachable = useMemo(() => reachableTiles(state), [state])
  const attackableIds = useMemo(() => {
    const ids = new Set<number>()
    for (const t of attackableTargets(state)) ids.add(t.id)
    return ids
  }, [state])

  const handleClick = (c: Coord) => {
    if (!interactive) return
    const mon = monsterAt(state, c)
    if (mon && attackableIds.has(mon.id)) {
      dispatch({ type: 'ATTACK', targetId: mon.id })
    } else if (!mon && !isWall(state, c) && reachable.has(coordKey(c))) {
      dispatch({ type: 'MOVE_HERO', to: c })
    }
  }

  return (
    <div className="board-wrap">
      <div
        className="board-bg"
        data-side={cfg.side}
        style={{ transform: `rotate(${cfg.orientation}deg)` }}
      >
        {!failedSides[cfg.side] && (
          <img
            src={CARD_IMAGES[cfg.side]}
            alt=""
            onError={() => setFailedSides((f) => ({ ...f, [cfg.side]: true }))}
          />
        )}
      </div>
      <div className="board-grid">
        {allCoords().map((c) => {
          const wall = isWall(state, c)
          const hero = state.hero.pos.x === c.x && state.hero.pos.y === c.y
          const mon = monsterAt(state, c)
          let highlight: 'move' | 'attack' | null = null
          if (interactive) {
            if (mon && attackableIds.has(mon.id)) highlight = 'attack'
            else if (!mon && !wall && !hero && reachable.has(coordKey(c))) highlight = 'move'
          }
          return (
            <Tile
              key={coordKey(c)}
              wall={wall}
              hero={hero}
              heroHealth={state.hero.health}
              monster={mon ? { health: mon.health, kind: mon.kind } : undefined}
              highlight={highlight}
              interactive={interactive}
              onClick={() => handleClick(c)}
            />
          )
        })}
      </div>
    </div>
  )
}
