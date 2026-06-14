import type { MonsterKind } from '../../engine/types'

export const KIND_EMOJI: Record<MonsterKind, string> = {
  spider: '🕷️',
  skeleton: '💀',
  orc: '👹',
  demon: '😈',
  // M'Guf-yn Returns bosses
  lizardTroll: '🦎',
  skeletonWarrior: '☠️',
  giantMantis: '🦗',
  mgufyn: '👁️',
}

/** Bosses are drawn on a 12-sided die (they have more than 6 Health). */
export const BOSS_KINDS: ReadonlySet<MonsterKind> = new Set<MonsterKind>([
  'lizardTroll',
  'skeletonWarrior',
  'giantMantis',
  'mgufyn',
])

export function isBossKind(kind: MonsterKind): boolean {
  return BOSS_KINDS.has(kind)
}
