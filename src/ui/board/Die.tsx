export type DieColor = 'green' | 'red' | 'black' | 'white'

interface DieProps {
  value: number
  color: DieColor
  /** Show pips (for 1-6) instead of a number. Defaults on for black/white dice. */
  pips?: boolean
  badge?: string
  selected?: boolean
  onClick?: () => void
  title?: string
}

// Which of the 9 cells (row-major) are filled for each pip count.
const PIP_LAYOUT: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

export function Die({ value, color, pips, badge, selected, onClick, title }: DieProps) {
  const usePips = (pips ?? (color === 'black' || color === 'white')) && value >= 1 && value <= 6
  const cls = [
    'die',
    color,
    usePips ? 'pips' : '',
    onClick ? 'selectable' : '',
    selected ? 'selected' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const content = usePips ? (
    Array.from({ length: 9 }, (_, i) => (
      <span key={i} className={`pip${PIP_LAYOUT[value]?.includes(i) ? '' : ' empty'}`} />
    ))
  ) : (
    <span className="num">{value}</span>
  )

  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick} title={title} aria-label={title}>
        {content}
        {badge && <span className="badge">{badge}</span>}
      </button>
    )
  }
  return (
    <div className={cls} title={title} aria-label={title}>
      {content}
      {badge && <span className="badge">{badge}</span>}
    </div>
  )
}
