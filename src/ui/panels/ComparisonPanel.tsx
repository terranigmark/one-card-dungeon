import type { ReactNode } from 'react'
import { useGameState } from '../../state/hooks'
import { LEVELS } from '../../engine/levels'
import { useT } from '../../i18n'
import { isBossKind, KIND_EMOJI } from '../board/kinds'

type StatKey = 'health' | 'range' | 'speed' | 'attack' | 'defense'

/**
 * Hero and monster stats side by side as a single comparison table — the matchup
 * the player reads most (my Attack vs their Defense, their Speed/Range vs mine).
 * Replaces the separate StatPanel + EnemyStatPanel: denser (one panel instead of
 * two) and easier to compare. Used on every viewport.
 */
export function ComparisonPanel() {
  const state = useGameState()
  const { hero, turn, phase, chest, levelIndex, monsters } = state
  const t = useT()

  const heroName =
    hero.classId && hero.classId !== 'none' ? t.classes[hero.classId].name : t.adventurer

  // Prefer the live monster (a boss replaces the card's regular foe); fall back
  // to the level template once the level is cleared and the board is empty.
  const cfg = LEVELS[levelIndex]
  const live = monsters[0]
  const monster = live ? { ...live, health: live.maxHealth } : cfg.monster
  const monsterKind = live ? live.kind : cfg.monsterKind

  // Hero values mirror StatPanel: during a turn, Speed/Attack show remaining/total
  // (the remaining part green), Range/Defense show the turn total, else the base.
  const heroValue = (key: StatKey): ReactNode => {
    switch (key) {
      case 'health':
        return `${hero.health}/${hero.maxHealth}`
      case 'range':
        return turn ? turn.totals.range : hero.base.range
      case 'speed':
        return turn ? (
          <>
            <span className="left">{turn.speedLeft}</span>/{turn.totals.speed}
          </>
        ) : (
          hero.base.speed
        )
      case 'attack':
        return turn ? (
          <>
            <span className="left">{turn.attackLeft}</span>/{turn.totals.attack}
          </>
        ) : (
          hero.base.attack
        )
      case 'defense':
        return turn ? turn.totals.defense : hero.base.defense
    }
  }
  const foeValue: Record<StatKey, number> = {
    health: monster.health,
    range: monster.range,
    speed: monster.speed,
    attack: monster.attack,
    defense: monster.defense,
  }

  const rows: Array<{ key: StatKey; label: string }> = [
    { key: 'health', label: t.stats.health },
    { key: 'range', label: t.stats.range },
    { key: 'speed', label: t.stats.speed },
    { key: 'attack', label: t.stats.attack },
    { key: 'defense', label: t.stats.defense },
  ]

  return (
    <div className="panel compare">
      <div className="compare-head">
        <span className="compare-you">{heroName}</span>
        <span className="compare-foe">
          <span className="enemy-emoji">{KIND_EMOJI[monsterKind]}</span> {t.enemy[monsterKind].one}
          {isBossKind(monsterKind) && <span className="d12-tag"> D12</span>}
        </span>
      </div>
      <div className="compare-grid">
        {rows.map((r) => {
          const hp = r.key === 'health' ? ' hp' : ''
          return (
            <div className="compare-row" key={r.key}>
              <span className={`cv you${hp}`}>{heroValue(r.key)}</span>
              <span className="ck">{r.label}</span>
              <span className={`cv foe${hp}`}>{foeValue[r.key]}</span>
            </div>
          )
        })}
        {chest && chest.opened && chest.remaining > 0 && (
          <div className="compare-row loot">
            <span className="cv you">{chest.remaining}</span>
            <span className="ck">🧰 {t.stats.loot}</span>
            <span className="cv foe">—</span>
          </div>
        )}
      </div>
      {phase === 'Adventurer' && <p className="hint">{t.statPanel.hint}</p>}
    </div>
  )
}
