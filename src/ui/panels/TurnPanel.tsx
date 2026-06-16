import { useState } from 'react'
import { useDispatch, useGameState } from '../../state/hooks'
import type { AssignSlot, Skill } from '../../engine/types'
import { computeTotals } from '../../engine/rules'
import { attackableTargets } from '../../engine/selectors'
import { useT } from '../../i18n'
import { Die } from '../board/Die'

const BASE_SLOTS: AssignSlot[] = ['speed', 'attack', 'defense']
const LOOT_SLOTS: Skill[] = ['speed', 'attack', 'defense', 'range']

function ClassAbilityRow({ selected }: { selected: number | null }) {
  const { hero, classState, energy } = useGameState()
  const dispatch = useDispatch()
  const t = useT()
  const c = hero.classId
  if (!c || c === 'none') return null
  const usedLevel = classState.usedThisLevel
  const noDice = energy.rolled.length === 0
  const isTriple =
    energy.rolled.length === 3 &&
    energy.rolled[0] === energy.rolled[1] &&
    energy.rolled[1] === energy.rolled[2]

  return (
    <div className="row">
      {c === 'wizard' && (
        <button disabled={usedLevel || noDice} onClick={() => dispatch({ type: 'ABILITY_WIZARD_REROLL' })}>
          {t.turn.wizardReroll}
        </button>
      )}
      {c === 'barbarian' && (
        <button
          disabled={classState.usedThisTurn || hero.health !== 1 || noDice}
          onClick={() => dispatch({ type: 'ABILITY_BARBARIAN_REROLL' })}
        >
          {t.turn.furyReroll}
        </button>
      )}
      {c === 'ranger' && (
        <button
          disabled={usedLevel || energy.rangerUnlocked}
          onClick={() => dispatch({ type: 'ABILITY_RANGER_RANGE' })}
        >
          {t.turn.unlockRange}
        </button>
      )}
      {c === 'paladin' && (
        <button
          disabled={usedLevel || selected === null}
          onClick={() => selected !== null && dispatch({ type: 'ABILITY_PALADIN_KEEP', dieIndex: selected })}
        >
          {t.turn.keepDie}
        </button>
      )}
      {c === 'cleric' && (
        <button
          disabled={noDice || !isTriple || !!energy.clericBoosted}
          onClick={() => dispatch({ type: 'ABILITY_CLERIC_BLESS' })}
        >
          {t.turn.clericBless}
        </button>
      )}
      {c === 'knight' && (
        <button
          disabled={usedLevel || noDice || !!energy.knightUnlocked}
          onClick={() => dispatch({ type: 'ABILITY_KNIGHT_DOUBLE' })}
        >
          {t.turn.knightDouble}
        </button>
      )}
      {c === 'rogue' && (
        <button disabled={usedLevel || noDice} onClick={() => dispatch({ type: 'ABILITY_ROGUE_BOOST' })}>
          {t.turn.rogueBoost}
        </button>
      )}
    </div>
  )
}

/** Treasure loot allocation for the turn — pour the chest into one skill only. */
function ChestSpendRow() {
  const state = useGameState()
  const dispatch = useDispatch()
  const t = useT()
  const chest = state.chest
  if (!chest || !chest.opened || chest.remaining <= 0) return null

  const spend = state.chestSpend
  const amount = spend?.amount ?? 0
  const slot: Skill = spend?.slot ?? 'attack'
  const set = (s: Skill, amt: number) =>
    dispatch({ type: 'SET_CHEST_SPEND', slot: s, amount: amt })

  return (
    <div className="chest-spend">
      <p className="hint">
        🧰 {t.turn.lootTitle(chest.remaining)} — {t.turn.lootHint}
      </p>
      <div className="row">
        {LOOT_SLOTS.map((s) => (
          <button
            key={s}
            className={spend && spend.slot === s ? 'primary' : ''}
            onClick={() => set(s, amount > 0 ? amount : 1)}
          >
            {t.stats[s]}
          </button>
        ))}
      </div>
      <div className="row" style={{ alignItems: 'center' }}>
        <button disabled={amount <= 0} onClick={() => set(slot, amount - 1)}>
          −
        </button>
        <strong>{amount}</strong>
        <button disabled={amount >= chest.remaining} onClick={() => set(slot, amount + 1)}>
          +
        </button>
        <button disabled={amount <= 0} onClick={() => set(slot, 0)}>
          {t.turn.lootClear}
        </button>
      </div>
    </div>
  )
}

export function TurnPanel() {
  const state = useGameState()
  const dispatch = useDispatch()
  const t = useT()
  const [selected, setSelected] = useState<number | null>(null)
  const { phase, energy, hero, classState, chest } = state

  if (phase === 'MonsterMove') {
    return (
      <div className="panel">
        <h3>{t.turn.monsterPhase}</h3>
        <p className="hint">{t.turn.monstersReposition}</p>
      </div>
    )
  }
  if (phase === 'MonsterAttack') {
    return (
      <div className="panel">
        <h3>{t.turn.monsterPhase}</h3>
        <p className="hint">{t.turn.monstersStrike}</p>
      </div>
    )
  }
  if (phase === 'Adventurer') {
    const canSmite =
      hero.classId === 'necromancer' && !classState.usedThisLevel && hero.health >= 2
    const smiteTargets = canSmite ? attackableTargets(state) : []
    return (
      <div className="panel">
        <h3>{t.turn.yourMove}</h3>
        <p className="hint">{t.turn.yourMoveHint}</p>
        {chest && !chest.opened && <p className="hint">{t.turn.openChestHint}</p>}
        {canSmite && smiteTargets.length > 0 && (
          <>
            <p className="hint">{t.turn.smiteHint}</p>
            <div className="row">
              {smiteTargets.map((target) => (
                <button
                  key={target.id}
                  onClick={() => dispatch({ type: 'ABILITY_NECROMANCER_SMITE', targetId: target.id })}
                >
                  {t.turn.smite(target.id)}
                </button>
              ))}
            </div>
          </>
        )}
        <button className="primary" onClick={() => dispatch({ type: 'END_ADVENTURER' })}>
          {t.turn.endTurn}
        </button>
      </div>
    )
  }
  if (phase !== 'Energy') return null

  if (energy.rolled.length === 0) {
    return (
      <div className="panel">
        <h3>{t.turn.energyPhase}</h3>
        <p className="hint">{t.turn.energyHint}</p>
        <button className="primary" onClick={() => dispatch({ type: 'ROLL_ENERGY' })}>
          {t.turn.rollDice}
        </button>
      </div>
    )
  }

  const slots: AssignSlot[] = energy.rangerUnlocked ? [...BASE_SLOTS, 'range'] : BASE_SLOTS
  const secondary = energy.secondary ?? {}
  const dieToSlot = new Map<number, AssignSlot>()
  for (const [slot, idx] of Object.entries(energy.assignment)) {
    if (idx !== undefined) dieToSlot.set(idx, slot as AssignSlot)
  }
  for (const [slot, idx] of Object.entries(secondary)) {
    if (idx !== undefined) dieToSlot.set(idx, slot as AssignSlot)
  }
  const allAssigned = energy.rolled.every((_, i) => dieToSlot.has(i))
  const totals = computeTotals(hero.base, energy, state.chestSpend)

  const onSlotClick = (slot: AssignSlot) => {
    if (selected !== null) {
      dispatch({ type: 'ASSIGN_DIE', slot, dieIndex: selected })
      setSelected(null)
    } else if (energy.assignment[slot] !== undefined || secondary[slot] !== undefined) {
      dispatch({ type: 'UNASSIGN_DIE', slot })
    }
  }

  return (
    <div className="panel">
      <h3>{t.turn.assignDice}</h3>
      <div className="dice-tray">
        {energy.rolled.map((v, i) => {
          const assignedSlot = dieToSlot.get(i)
          return (
            <span key={i} style={{ display: 'inline-flex', opacity: assignedSlot ? 0.45 : 1 }}>
              <Die
                value={v}
                color="black"
                selected={selected === i}
                onClick={() => setSelected(selected === i ? null : i)}
                title={assignedSlot ? t.turn.assignedTo(t.stats[assignedSlot]) : t.turn.clickToSelect}
              />
            </span>
          )
        })}
      </div>
      <p className="hint">{t.turn.assignHint}</p>
      <div className="slots">
        {slots.map((slot) => {
          const idx = energy.assignment[slot]
          const extra = secondary[slot]
          const filled = idx !== undefined || extra !== undefined
          return (
            <div
              key={slot}
              className={`slot assignable ${filled ? 'filled' : ''}`}
              // Kept a <div> (not <button>) to avoid inheriting the global pixel
              // button styling, but made operable by keyboard/switch users:
              // focusable + Enter/Space activate, matching .slot:focus-visible.
              role="button"
              tabIndex={0}
              aria-label={`${t.stats[slot]}: ${totals[slot]}`}
              onClick={() => onSlotClick(slot)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSlotClick(slot)
                }
              }}
            >
              <span>
                {t.stats[slot]} <strong>{totals[slot]}</strong>
              </span>
              {filled ? (
                <span className="slot-die">
                  {idx !== undefined && <Die value={energy.rolled[idx]} color="black" />}
                  {extra !== undefined && <Die value={energy.rolled[extra]} color="black" />}
                </span>
              ) : (
                <span className="empty-die" />
              )}
            </div>
          )
        })}
      </div>
      <ClassAbilityRow selected={selected} />
      <ChestSpendRow />
      <button className="primary" disabled={!allAssigned && !state.debug} onClick={() => dispatch({ type: 'CONFIRM_ENERGY' })}>
        {t.turn.confirm}
      </button>
    </div>
  )
}
