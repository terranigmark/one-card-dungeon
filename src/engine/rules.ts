import type { EnergyDice, HeroBase, SkillTotals } from './types'

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

/** Resolve the assigned energy dice into per-skill totals for the turn. */
export function computeTotals(base: HeroBase, energy: EnergyDice): SkillTotals {
  const dieFor = (slot: keyof SkillTotals): number => {
    const idx = energy.assignment[slot]
    if (idx === undefined) return 0
    return energy.rolled[idx] ?? 0
  }
  return {
    speed: base.speed + dieFor('speed'),
    attack: base.attack + dieFor('attack'),
    defense: base.defense + dieFor('defense'),
    range: base.range + dieFor('range'),
  }
}
