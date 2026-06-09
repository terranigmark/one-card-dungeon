import type { MonsterKind } from '../../engine/types'
import { Die } from './Die'
import { KIND_EMOJI } from './kinds'

interface TileProps {
  wall: boolean
  hero: boolean
  heroHealth: number
  monster?: { health: number; kind: MonsterKind }
  highlight: 'move' | 'attack' | null
  onClick: () => void
  interactive: boolean
}

export function Tile({ wall, hero, heroHealth, monster, highlight, onClick, interactive }: TileProps) {
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
          badge={KIND_EMOJI[monster.kind]}
          title={`${monster.kind} — ${monster.health} HP`}
        />
      )}
    </button>
  )
}
