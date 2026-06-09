import type { Coord, Difficulty, GameState } from '../types'
import { faithfulStrategy } from './faithful'
import { aggressiveStrategy } from './aggressive'

export interface MonsterMove {
  id: number
  to: Coord
}

export interface MonsterStrategy {
  planMoves(state: GameState): MonsterMove[]
}

export function getStrategy(difficulty: Difficulty): MonsterStrategy {
  switch (difficulty) {
    case 'aggressive':
      return aggressiveStrategy
    case 'faithful':
    default:
      return faithfulStrategy
  }
}
