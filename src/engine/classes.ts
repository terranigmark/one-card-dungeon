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
    id: 'necromancer',
    name: 'Necromancer',
    blurb: 'Trades life for death.',
    ability: 'Once per level, lose 1 Health to deal 1 damage to an enemy in Range and Line of Sight.',
    timing: 'level',
  },
  {
    id: 'cleric',
    name: 'Cleric',
    blurb: 'Blessed by fortune.',
    ability: 'When you roll triples (e.g. 3-3-3), raise each die by 2 (max 6).',
  },
  {
    id: 'knight',
    name: 'Knight',
    blurb: 'Master of focused force.',
    ability: 'Once per level, stack two energy dice on a single skill.',
    timing: 'level',
  },
  {
    id: 'rogue',
    name: 'Rogue',
    blurb: 'Quick hands, sharp edges.',
    ability: 'Once per level, raise every energy die you rolled by 1 (max 6).',
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
