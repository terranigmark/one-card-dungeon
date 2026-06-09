import { useState } from 'react'
import { useDispatch, useGameState } from '../../state/hooks'
import type { AssignSlot } from '../../engine/types'
import { computeTotals } from '../../engine/rules'
import { useT } from '../../i18n'
import { Die } from '../board/Die'

const BASE_SLOTS: AssignSlot[] = ['speed', 'attack', 'defense']

function ClassAbilityRow({ selected }: { selected: number | null }) {
  const { hero, classState, energy } = useGameState()
  const dispatch = useDispatch()
  const t = useT()
  const c = hero.classId
  if (!c || c === 'none') return null
  const usedLevel = classState.usedThisLevel
  const noDice = energy.rolled.length === 0

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
    </div>
  )
}

export function TurnPanel() {
  const state = useGameState()
  const dispatch = useDispatch()
  const t = useT()
  const [selected, setSelected] = useState<number | null>(null)
  const { phase, energy, hero } = state

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
    return (
      <div className="panel">
        <h3>{t.turn.yourMove}</h3>
        <p className="hint">{t.turn.yourMoveHint}</p>
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
  const dieToSlot = new Map<number, AssignSlot>()
  for (const [slot, idx] of Object.entries(energy.assignment)) {
    if (idx !== undefined) dieToSlot.set(idx, slot as AssignSlot)
  }
  const allAssigned = energy.rolled.every((_, i) => dieToSlot.has(i))
  const totals = computeTotals(hero.base, energy)

  const onSlotClick = (slot: AssignSlot) => {
    if (selected !== null) {
      dispatch({ type: 'ASSIGN_DIE', slot, dieIndex: selected })
      setSelected(null)
    } else if (energy.assignment[slot] !== undefined) {
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
          const filled = idx !== undefined
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
                  <Die value={energy.rolled[idx]} color="black" />
                </span>
              ) : (
                <span className="empty-die" />
              )}
            </div>
          )
        })}
      </div>
      <ClassAbilityRow selected={selected} />
      <button className="primary" disabled={!allAssigned} onClick={() => dispatch({ type: 'CONFIRM_ENERGY' })}>
        {t.turn.confirm}
      </button>
    </div>
  )
}
