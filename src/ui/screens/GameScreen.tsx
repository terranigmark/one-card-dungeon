import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useGameState } from '../../state/hooks'
import { LEVELS } from '../../engine/levels'
import { useT } from '../../i18n'
import { Board } from '../board/Board'
import { ComparisonPanel } from '../panels/ComparisonPanel'
import { TurnPanel } from '../panels/TurnPanel'
import { ActionLog } from '../panels/ActionLog'
import { EndOfLevel } from '../modals/EndOfLevel'
import { BossChoice } from '../modals/BossChoice'

export function GameScreen({ onOpenSettings }: { onOpenSettings: () => void }) {
  const state = useGameState()
  const dispatch = useDispatch()
  const t = useT()
  const cfg = LEVELS[state.levelIndex]

  // Mobile "carousel" layout (Settings → Mobile layout): the side-col becomes a
  // horizontal scroll-snap track and these drive the position dots. On the stacked
  // layout / desktop the side-col never scrolls horizontally, so this stays inert.
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [slideCount, setSlideCount] = useState(0)

  // Slides sorted by on-screen position: CSS `order` reorders the children for the
  // mobile layouts, so visual order ≠ DOM order — sort by left edge to recover it.
  const visualSlides = () => {
    const el = scrollerRef.current
    if (!el) return [] as HTMLElement[]
    return [...el.querySelectorAll<HTMLElement>(':scope > .panel')].sort(
      (a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left,
    )
  }
  const isCarousel = () => {
    const el = scrollerRef.current
    return !!el && el.scrollWidth - el.clientWidth > 4
  }
  const syncActive = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const slides = visualSlides()
    setSlideCount(slides.length)
    const mid = el.getBoundingClientRect().left + el.clientWidth / 2
    let best = 0
    let bestDist = Infinity
    slides.forEach((s, i) => {
      const r = s.getBoundingClientRect()
      const dist = Math.abs(r.left + r.width / 2 - mid)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    setActiveIdx(best)
  }, [])
  const goTo = (i: number) => {
    if (!isCarousel()) return
    visualSlides()[i]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }
  const onScroll = () => requestAnimationFrame(syncActive)

  // Keep the dots in sync on mount and when the viewport / layout changes.
  useEffect(() => {
    syncActive()
    window.addEventListener('resize', syncActive)
    return () => window.removeEventListener('resize', syncActive)
  }, [syncActive])

  // Monster phases resolve automatically, with a short beat for readability.
  useEffect(() => {
    if (state.phase === 'MonsterMove') {
      const t = setTimeout(() => dispatch({ type: 'RESOLVE_MONSTER_MOVE' }), 600)
      return () => clearTimeout(t)
    }
    if (state.phase === 'MonsterAttack') {
      const t = setTimeout(() => dispatch({ type: 'RESOLVE_MONSTER_ATTACK' }), 600)
      return () => clearTimeout(t)
    }
  }, [state.phase, dispatch])

  return (
    <div className="app">
      <div className="topbar">
        <span className="title">{t.app.title}</span>
        <span className="level-pill">
          {t.gameScreen.levelPill(
            cfg.level,
            t.enemy[state.monsters[0]?.kind ?? cfg.monsterKind].many,
          )}
        </span>
        <span className="spacer" />
        <span className="tag">{t.gameScreen.aiTag(t.difficulty[state.settings.difficulty])}</span>
        <button onClick={onOpenSettings}>{t.gameScreen.settingsButton}</button>
      </div>

      <div className="game-layout">
        <Board />
        {/* Child order is load-bearing: the mobile reorder in index.css targets
            these by :nth-child (1=Comparison, 2=Turn, 3=Log) and promotes the
            turn controls to the first slide / first stacked card. */}
        <div className="side-col" ref={scrollerRef} onScroll={onScroll}>
          <ComparisonPanel />
          <TurnPanel />
          <ActionLog />
        </div>
        {/* Position dots for the mobile carousel layout; CSS hides them otherwise. */}
        <div className="side-dots">
          {Array.from({ length: slideCount || 3 }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`dot ${i === activeIdx ? 'active' : ''}`}
              aria-label={t.gameScreen.goToCard(i + 1)}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>

      {state.phase === 'EndOfLevel' && <EndOfLevel />}
      {state.phase === 'BossChoice' && <BossChoice />}
    </div>
  )
}
