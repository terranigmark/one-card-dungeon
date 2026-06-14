import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useGameState } from '../../state/hooks'
import { CLASS_LIST } from '../../engine/classes'
import { useT } from '../../i18n'
import { SwordDivider } from '../SwordDivider'
import { SettingsButton } from '../SettingsButton'

const EXPANSION_CLASS_IDS = new Set(['necromancer', 'cleric', 'knight', 'rogue'])

export function ClassSelect({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { hero, settings } = useGameState()
  const dispatch = useDispatch()
  const t = useT()
  const selected = hero.classId
  const expansion = settings.expansion ?? true
  const classes = expansion ? CLASS_LIST : CLASS_LIST.filter((c) => !EXPANSION_CLASS_IDS.has(c.id))

  // On mobile the cards are a horizontal swipe carousel (see `.classes` in the
  // CSS). We track which card is centred to drive the dot indicators and to let
  // a dot tap snap to a card. On desktop the cards are a static grid, the
  // scroller never scrolls, and the dots are hidden — so this all stays inert.
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)

  const isCarousel = () => {
    const el = scrollerRef.current
    return !!el && el.scrollWidth - el.clientWidth > 4
  }

  const syncActive = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const mid = el.getBoundingClientRect().left + el.clientWidth / 2
    let best = 0
    let bestDist = Infinity
    el.querySelectorAll<HTMLElement>('.class-card').forEach((card, i) => {
      const r = card.getBoundingClientRect()
      const dist = Math.abs(r.left + r.width / 2 - mid)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    setActiveIdx(best)
  }, [])

  // Reset to the first card whenever the set of classes changes (mode toggle).
  useEffect(() => {
    const el = scrollerRef.current
    if (el) el.scrollTo({ left: 0 })
    const id = requestAnimationFrame(() => setActiveIdx(0))
    return () => cancelAnimationFrame(id)
  }, [expansion])

  const goTo = (i: number) => {
    if (!isCarousel()) return
    const cards = scrollerRef.current?.querySelectorAll<HTMLElement>('.class-card')
    cards?.[i]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  const onScroll = () => requestAnimationFrame(syncActive)

  return (
    <div className="app">
      <SettingsButton onClick={onOpenSettings} />
      <div className="center-screen">
        <h1>{t.app.title}</h1>
        <SwordDivider />
        <p className="lede">{t.classSelect.lede}</p>

        <div className="mode-toggle">
          <span className="mode-label">{t.classSelect.modeLabel}</span>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button
              className={!expansion ? 'primary' : ''}
              onClick={() => dispatch({ type: 'SET_EXPANSION', enabled: false })}
            >
              {t.classSelect.modeClassic}
            </button>
            <button
              className={expansion ? 'primary' : ''}
              onClick={() => dispatch({ type: 'SET_EXPANSION', enabled: true })}
            >
              {t.classSelect.modeExpansion}
            </button>
          </div>
          <p className="hint">{expansion ? t.classSelect.modeExpansionHint : t.classSelect.modeClassicHint}</p>
        </div>

        <div className="classes" ref={scrollerRef} onScroll={onScroll}>
          {classes.map((c, i) => {
            const tc = t.classes[c.id]
            return (
              <button
                key={c.id}
                className={`class-card ${c.id === 'none' ? 'no-class' : ''} ${selected === c.id ? 'selected' : ''}`}
                onClick={() => {
                  dispatch({ type: 'SELECT_CLASS', classId: c.id })
                  goTo(i)
                }}
              >
                <span className="cname">{tc.name}</span>
                <span className="cability">{tc.ability}</span>
                <span className="cblurb">{tc.blurb}</span>
              </button>
            )
          })}
        </div>

        {/* Carousel position dots — shown only on the mobile carousel. */}
        <div className="carousel-dots">
          {classes.map((c, i) => (
            <button
              key={c.id}
              type="button"
              className={`dot ${i === Math.min(activeIdx, classes.length - 1) ? 'active' : ''}`}
              aria-label={t.classSelect.gotoClass(t.classes[c.id].name)}
              onClick={() => goTo(i)}
            />
          ))}
        </div>

        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="primary" disabled={!selected} onClick={() => dispatch({ type: 'START_GAME' })}>
            {t.classSelect.enter}
          </button>
        </div>
        <p className="banner">{t.classSelect.banner}</p>
      </div>
    </div>
  )
}
