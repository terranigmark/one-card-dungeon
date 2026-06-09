import type { ClassId } from './types'

export interface ClassDef {
  id: ClassId
  name: string
  blurb: string
  ability: string
  /** When the ability recharges. Omitted for the classless option. */
  timing?: 'level' | 'turn'
}

export const CLASS_LIST: ClassDef[] = [
  {
    id: 'paladin',
    name: 'Paladin',
    blurb: 'Steadfast holy defender.',
    ability: 'Once per level, keep one energy die from last turn instead of rerolling it.',
    timing: 'level',
  },
  {
    id: 'barbarian',
    name: 'Barbarian',
    blurb: 'Reckless, furious brawler.',
    ability: 'Once per turn, reroll all energy dice when at 1 Health.',
    timing: 'turn',
  },
  {
    id: 'ranger',
    name: 'Ranger',
    blurb: 'Patient, deadly marksman.',
    ability: 'Once per level, assign a die to Range instead of Movement.',
    timing: 'level',
  },
  {
    id: 'wizard',
    name: 'Wizard',
    blurb: 'Arcane scholar of the dungeon.',
    ability: 'Once per level, reroll all energy dice.',
    timing: 'level',
  },
  {
    id: 'none',
    name: 'No Class',
    blurb: 'Just you, three dice, and the dungeon.',
    ability: 'No special ability or bonuses — a pure test of nerve.',
  },
]

export const CLASSES: Record<ClassId, ClassDef> = Object.fromEntries(
  CLASS_LIST.map((c) => [c.id, c]),
) as Record<ClassId, ClassDef>
