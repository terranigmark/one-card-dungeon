import { useState } from 'react'
import { useDispatch, useGameState } from '../../state/hooks'
import type { AssignSlot } from '../../engine/types'
import { computeTotals } from '../../engine/rules'
import { Die } from '../board/Die'

const BASE_SLOTS: Array<{ slot: AssignSlot; label: string }> = [
  { slot: 'speed', label: 'Speed' },
  { slot: 'attack', label: 'Attack' },
  { slot: 'defense', label: 'Defense' },
]

function ClassAbilityRow({ selected }: { selected: number | null }) {
  const { hero, classState, energy } = useGameState()
  const dispatch = useDispatch()
  const c = hero.classId
  if (!c || c === 'none') return null
  const usedLevel = classState.usedThisLevel
  const noDice = energy.rolled.length === 0

  return (
    <div className="row">
      {c === 'wizard' && (
        <button disabled={usedLevel || noDice} onClick={() => dispatch({ type: 'ABILITY_WIZARD_REROLL' })}>
          ↻ Reroll all (Wizard)
        </button>
      )}
      {c === 'barbarian' && (
        <button
          disabled={classState.usedThisTurn || hero.health !== 1 || noDice}
          onClick={() => dispatch({ type: 'ABILITY_BARBARIAN_REROLL' })}
        >
          💢 Fury reroll (needs 1 HP)
        </button>
      )}
      {c === 'ranger' && (
        <button
          disabled={usedLevel || energy.rangerUnlocked}
          onClick={() => dispatch({ type: 'ABILITY_RANGER_RANGE' })}
        >
          🎯 Unlock Range slot
        </button>
      )}
      {c === 'paladin' && (
        <button
          disabled={usedLevel || selected === null}
          onClick={() => selected !== null && dispatch({ type: 'ABILITY_PALADIN_KEEP', dieIndex: selected })}
        >
          ✋ Keep selected die next turn
        </button>
      )}
    </div>
  )
}

export function TurnPanel() {
  const state = useGameState()
  const dispatch = useDispatch()
  const [selected, setSelected] = useState<number | null>(null)
  const { phase, energy, hero } = state

  if (phase === 'MonsterMove') {
    return (
      <div className="panel">
        <h3>Monster phase</h3>
        <p className="hint">The monsters reposition to keep you at range…</p>
      </div>
    )
  }
  if (phase === 'MonsterAttack') {
    return (
      <div className="panel">
        <h3>Monster phase</h3>
        <p className="hint">The monsters strike…</p>
      </div>
    )
  }
  if (phase === 'Adventurer') {
    return (
      <div className="panel">
        <h3>Your move</h3>
        <p className="hint">
          Click a green tile to move, or a red monster to attack. Act in any order until your points
          run out.
        </p>
        <button className="primary" onClick={() => dispatch({ type: 'END_ADVENTURER' })}>
          End turn ⟶ Monsters
        </button>
      </div>
    )
  }
  if (phase !== 'Energy') return null

  if (energy.rolled.length === 0) {
    return (
      <div className="panel">
        <h3>Energy phase</h3>
        <p className="hint">
          Roll three dice and assign one each to Speed, Attack and Defense. Range never takes a die
          (unless you are a Ranger).
        </p>
        <button className="primary" onClick={() => dispatch({ type: 'ROLL_ENERGY' })}>
          🎲 Roll the dice
        </button>
      </div>
    )
  }

  const slots = energy.rangerUnlocked
    ? [...BASE_SLOTS, { slot: 'range' as AssignSlot, label: 'Range' }]
    : BASE_SLOTS
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
      <h3>Assign your dice</h3>
      <div className="dice-tray">
        {energy.rolled.map((v, i) => (
          <span key={i} style={{ display: 'inline-flex', opacity: dieToSlot.has(i) ? 0.45 : 1 }}>
            <Die
              value={v}
              color="black"
              selected={selected === i}
              onClick={() => setSelected(selected === i ? null : i)}
              title={dieToSlot.get(i) ? `Assigned to ${dieToSlot.get(i)}` : 'Click to select'}
            />
          </span>
        ))}
      </div>
      <p className="hint">Select a die, then click a stat to assign it. Click a filled stat to clear it.</p>
      <div className="slots">
        {slots.map(({ slot, label }) => {
          const idx = energy.assignment[slot]
          const filled = idx !== undefined
          return (
            <div key={slot} className={`slot assignable ${filled ? 'filled' : ''}`} onClick={() => onSlotClick(slot)}>
              <span>
                {label} <strong>{totals[slot]}</strong>
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
        Confirm ⟶ Move
      </button>
    </div>
  )
}
