import { useDispatch, useGameState } from '../../state/hooks'
import { BOSS_LEVELS } from '../../engine/levels'
import { useT } from '../../i18n'
import { Die } from '../board/Die'
import { KIND_EMOJI } from '../board/kinds'

/**
 * M'Guf-yn Returns: before entering level 3/6/9/12 the player chooses whether to
 * brave the boss arena (a single 12-sided commander on a shrunken grid) or take
 * the regular path for that level. Shown over the board during the BossChoice
 * phase; `bossPending` holds the level index being entered.
 */
export function BossChoice() {
  const { bossPending } = useGameState()
  const dispatch = useDispatch()
  const t = useT()
  if (bossPending == null) return null

  const cfg = BOSS_LEVELS[bossPending + 1]
  if (!cfg) return null
  const { monster, monsterKind } = cfg

  return (
    <div className="modal-backdrop">
      <div className="modal boss-choice">
        <h2>{t.bossChoice.title(cfg.level)}</h2>
        <div className="boss-portrait">
          <Die value={monster.health} color="red" d12 badge={KIND_EMOJI[monsterKind]} title={t.enemy[monsterKind].one} />
          <span className="boss-name">{t.enemy[monsterKind].one}</span>
        </div>
        <p className="hint">{t.bossChoice.hint}</p>
        <div className="stats boss-stats">
          <div className="stat health">
            <span className="label">{t.stats.health}</span>
            <span className="value">{monster.health}</span>
          </div>
          <div className="stat">
            <span className="label">{t.stats.range}</span>
            <span className="value">{monster.range}</span>
          </div>
          <div className="stat">
            <span className="label">{t.stats.speed}</span>
            <span className="value">{monster.speed}</span>
          </div>
          <div className="stat">
            <span className="label">{t.stats.attack}</span>
            <span className="value">{monster.attack}</span>
          </div>
          <div className="stat">
            <span className="label">{t.stats.defense}</span>
            <span className="value">{monster.defense}</span>
          </div>
        </div>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button onClick={() => dispatch({ type: 'RESOLVE_BOSS_CHOICE', boss: false })}>
            {t.bossChoice.skip}
          </button>
          <button className="primary" onClick={() => dispatch({ type: 'RESOLVE_BOSS_CHOICE', boss: true })}>
            {t.bossChoice.face}
          </button>
        </div>
      </div>
    </div>
  )
}
