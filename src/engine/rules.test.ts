import { describe, it, expect } from 'vitest'
import { damageToHero, attackCostPerHit, computeTotals } from './rules'
import type { EnergyDice, HeroBase } from './types'

describe('damageToHero', () => {
  it('matches the rulebook worked examples', () => {
    expect(damageToHero(12, 7)).toBe(1)
    expect(damageToHero(12, 4)).toBe(3)
    expect(damageToHero(8, 3)).toBe(2)
  })

  it('deals no damage when total attack is below defense', () => {
    expect(damageToHero(3, 7)).toBe(0)
    expect(damageToHero(6, 7)).toBe(0)
  })

  it('equal attack and defense deals exactly one', () => {
    expect(damageToHero(7, 7)).toBe(1)
  })
})

describe('attackCostPerHit', () => {
  it('equals the monster defense', () => {
    expect(attackCostPerHit(5)).toBe(5)
    expect(attackCostPerHit(1)).toBe(1)
  })

  it('never costs less than 1', () => {
    expect(attackCostPerHit(0)).toBe(1)
  })
})

describe('computeTotals', () => {
  const base: HeroBase = { speed: 1, attack: 1, defense: 1, range: 2 }

  it('adds assigned dice to bases; range stays at base by default', () => {
    const energy: EnergyDice = {
      rolled: [2, 5, 2],
      assignment: { speed: 0, attack: 1, defense: 2 },
      rangerUnlocked: false,
    }
    expect(computeTotals(base, energy)).toEqual({
      speed: 3,
      attack: 6,
      defense: 3,
      range: 2,
    })
  })

  it('supports a die assigned to range (Ranger)', () => {
    const energy: EnergyDice = {
      rolled: [4, 5, 6],
      assignment: { attack: 1, defense: 2, range: 0 },
      rangerUnlocked: true,
    }
    // speed gets no die -> base 1; range = base 2 + die 4 = 6; defense = 1 + die 6 = 7
    expect(computeTotals(base, energy)).toEqual({
      speed: 1,
      attack: 6,
      defense: 7,
      range: 6,
    })
  })
})
