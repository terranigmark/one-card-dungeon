import type { ChestSpend, EnergyDice, HeroBase, SkillTotals } from './types'

/**
 * Damage dealt to the hero in the Monster Attack phase:
 * floor(total monster attack / hero total defense). When the sum is below the
 * hero's defense this is 0 automatically.
 *
 * Rulebook examples: 12/7 -> 1, 12/4 -> 3, 8/3 -> 2.
 */
export function damageToHero(totalMonsterAttack: number, heroDefenseTotal: number): number {
  if (heroDefenseTotal <= 0) return totalMonsterAttack
  return Math.floor(totalMonsterAttack / heroDefenseTotal)
}

/** Attack points required to remove one Health from a monster = its Defense. */
export function attackCostPerHit(monsterDefense: number): number {
  return Math.max(1, monsterDefense)
}

/**
 * Resolve the assigned energy dice into per-skill totals for the turn. A slot may
 * carry a second die (Knight ability), and the planned Treasure Chest loot, if
 * any, is added to its single chosen skill.
 */
export function computeTotals(
  base: HeroBase,
  energy: EnergyDice,
  chest?: ChestSpend | null,
): SkillTotals {
  const secondary = energy.secondary ?? {}
  const dieFor = (slot: keyof SkillTotals): number => {
    let sum = 0
    const primary = energy.assignment[slot]
    if (primary !== undefined) sum += energy.rolled[primary] ?? 0
    const extra = secondary[slot]
    if (extra !== undefined) sum += energy.rolled[extra] ?? 0
    return sum
  }
  const totals: SkillTotals = {
    speed: base.speed + dieFor('speed'),
    attack: base.attack + dieFor('attack'),
    defense: base.defense + dieFor('defense'),
    range: base.range + dieFor('range'),
  }
  if (chest && chest.amount > 0) totals[chest.slot] += chest.amount
  return totals
}
