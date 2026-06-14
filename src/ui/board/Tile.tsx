import type { MonsterKind } from '../../engine/types'
import { Die } from './Die'
import { isBossKind, KIND_EMOJI } from './kinds'

interface TileProps {
  wall: boolean
  /** A removed boss-arena tile: render an empty hole, never interactive. */
  hole?: boolean
  hero: boolean
  heroHealth: number
  monster?: { health: number; kind: MonsterKind }
  chest?: { value: number; title: string }
  highlight: 'move' | 'attack' | null
  onClick: () => void
  interactive: boolean
}

export function Tile({ wall, hole, hero, heroHealth, monster, chest, highlight, onClick, interactive }: TileProps) {
  if (hole) return <div className="tile void" aria-hidden="true" />

  const cls = [
    'tile',
    wall ? 'wall' : '',
    highlight === 'move' ? 'hl-move' : '',
    highlight === 'attack' ? 'hl-attack' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const clickable = interactive && highlight !== null

  return (
    <button type="button" className={cls} onClick={onClick} disabled={!clickable}>
      {hero && <Die value={heroHealth} color="green" badge="❤️" title={`Hero — ${heroHealth} HP`} />}
      {monster && (
        <Die
          value={monster.health}
          color="red"
          d12={isBossKind(monster.kind)}
          badge={KIND_EMOJI[monster.kind]}
          title={`${monster.kind} — ${monster.health} HP`}
        />
      )}
      {chest && <Die value={chest.value} color="yellow" badge="🧰" title={chest.title} />}
    </button>
  )
}
