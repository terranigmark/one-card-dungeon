# One-Card Dungeon (web)

[![CI](https://github.com/terranigmark/one-card-dungeon/actions/workflows/ci.yml/badge.svg)](https://github.com/terranigmark/one-card-dungeon/actions/workflows/ci.yml)

A single-player, browser version of the solo board game **One-Card Dungeon**
(Little Rocket Games, 2021). Descend through 12 increasingly deadly levels to claim the
Sceptre of MGuf-yn. You control the hero (a green die); the monsters (red dice) are
AI-controlled. A die's number is its current Health.

Built with **React + TypeScript + Vite**. The game rules live in a pure, framework-agnostic
`engine/` that is fully unit-tested; React only renders and collects input.

## Run it

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build
npm test         # run the Vitest suite
npm run typecheck
```

## How to play

Each turn loops through four phases:

1. **Energy** – Click **Roll the dice**, then assign each of the three dice to **Speed**,
   **Attack** or **Defense**. Range never takes a die (except via the Ranger ability). The skill
   total = its base + the assigned die. Confirm to spend your points.
2. **Adventurer** – Click a **green** tile to move (2 Speed orthogonally, 3 diagonally) or a
   **red** monster to attack (costs the monster's Defense in Attack points per Health removed; the
   target must be within Range and Line of Sight). Act in any order, then **End turn**.
3. **Monster movement** – Monsters kite to stay at maximum Range while keeping Line of Sight.
4. **Monster attack** – Damage to you = `floor(total monster Attack in range / your Defense)`.

Clear all monsters to advance, choosing **+1 to one skill** or **heal to full** between levels.
Clear level 12 to win. Drop to 0 Health and you die.

### Classes
Paladin (keep a die for next turn), Barbarian (reroll all dice at 1 HP), Ranger (assign a die to
Range), Wizard (reroll all energy dice). Pick one on the start screen; use the ability button in
the Energy phase.

The **M'Guf-yn Returns** expansion adds four more, also chosen on the start screen:
- **Necromancer** – once per level, lose 1 Health to deal 1 damage to an enemy in Range + Line of
  Sight (use the *Smite* buttons in the Adventurer phase).
- **Cleric** – when you roll triples (e.g. `3-3-3`), bless them to raise each die by 2 (max 6).
- **Knight** – once per level, stack two energy dice onto a single skill (unlock it, then assign
  two dice to the same slot).
- **Rogue** – once per level, raise every die you rolled by 1 (max 6).

### Treasure Chests (expansion · Settings ⚙)
With **Treasure Chests** enabled, every level spawns a yellow chest die on the exit stairs opposite
your start. Its face is both its Defense (the Attack needed to open it) and its Loot. Until opened
it blocks movement and line of sight like a wall. Open it in the Adventurer phase like attacking a
monster (within Range + Line of Sight, spending Attack equal to its value). Once opened, its value
becomes a pool of **loot points** you can pour into a single skill per turn (Speed, Attack, Defense
or Range) during the Energy phase — split across turns if you like, but only one skill per turn.
Unspent loot is lost when the level is cleared, and a fresh chest is rolled for the next level.

> The expansion's **Boss Dungeon Card** (the D12 commanders at the end of levels 3/6/9/12) is not
> implemented yet — it depends on the new boss monsters, which are coming next.

### Language (Settings ⚙)
The whole interface is available in **English** and **Spanish**. The picker sits at the top of the
settings drawer; the choice is saved to `localStorage` (`ocd:lang`) across games. With no saved
choice, it defaults to the **device language** (any Spanish locale → Spanish, otherwise English),
resolved before first paint by the boot script in [`index.html`](index.html). All copy — including
the live action log, which is stored structurally and re-rendered on switch — lives in
[`src/i18n/strings.ts`](src/i18n/strings.ts); the source of truth is
[`src/i18n/store.ts`](src/i18n/store.ts).

### Difficulty (Settings ⚙)
- **Faithful** – the rulebook's monster behaviour (independent kiting).
- **Aggressive** – monsters are planned *jointly* to maximise the damage they deal each turn,
  coordinating line of sight and exploiting your Defense divisor to cross damage thresholds.

### Appearance (Settings ⚙)
Settings open from a **top-right gear on every screen** (the title screen, in-game topbar, and end
screens) and render as a **right-anchored side drawer** rather than a centered modal — the board /
title stays visible behind it (the scrim is transparent), so the live appearance tweaks preview in
place. Close it with the ✕, the Close button, Esc, or a click outside.

The theme is fully customizable from the **Appearance** section. Each axis is applied
as a `data-*` attribute on `<html>` (read by attribute selectors in
[`src/index.css`](src/index.css)) and persisted to `localStorage` across games:
- **Style** – `Retro` (the pixel-art look) or `Modern` (a clean system-font UI with rounded
  corners and soft shadows).
- **Theme** – `Dark` or `Light`; works under either style.
- **Palette** – `Crypt` (darkest), `Classic` (the box), or `Torchlit` (warm, lit).
- **Pixel font** – `Arcade` (Press Start 2P), `Bitmap` (Silkscreen / Pixelify Sans), or
  `Terminal` (VT323). *Retro only — hidden when Style is Modern.*
- **Density** – `Cozy` or `Compact` spacing.
- **Decoration** – `Minimal`, `Standard`, or `Ornate` (pixel frames, dither, CRT scanlines).
  *Retro only — hidden when Style is Modern.*

The selected values are mirrored onto `<html>` before first paint by a small boot script in
[`index.html`](index.html); the source of truth is [`src/state/themeStore.ts`](src/state/themeStore.ts).

## Using the real card art (optional)

The board uses a themed placeholder by default. To use the physical card's art, drop two images at:

```
public/cards/side-1.png   # Spider / Orc side  (levels 1, 3, 5, 7, 9, 11)
public/cards/side-2.png   # Skeleton / Demon side (levels 2, 4, 6, 8, 10, 12)
```

They load automatically (and rotate 180° on the flipped levels). For best alignment with the 5×5
click overlay, crop each image down to just the square grid region of the card. Missing files
fall back to the placeholder silently.

## Tuning the levels

All 12 levels are data-driven in [`src/engine/levels.ts`](src/engine/levels.ts) — wall layouts,
hero start, monster spawns, and monster stats `{health, speed, attack, defense, range}`. Level 1
matches the rulebook exactly (two 2-Health spiders, Range 3, Attack 4). The other levels are
seeded for a smooth difficulty curve and are the single place to adjust balance or match the exact
printed card values.

## Architecture

```
src/engine/         pure game logic (no React) — fully unit-tested
  types.ts          domain types
  grid.ts           coordinates, 8-neighbours, weighted steps
  pathfinding.ts    Dijkstra cost field; Range vs movement passability
  los.ts            corner-to-corner line of sight (positive-length blocking)
  rules.ts          damage formula, attack cost, skill totals
  reducer.ts        the phase state machine — (state, action) => state
  selectors.ts      reachable tiles / attackable targets for the UI
  levels.ts         the 12-level data table
  classes.ts        the 4 class definitions
  ai/               faithful + aggressive monster strategies
src/state/          Zustand store wrapping the pure reducer
src/i18n/           English/Spanish copy + language store (device-default, persisted)
src/ui/             React components (board, panels, modals, screens)
```

### Notes on the rules model
- **Line of sight** is corner-to-corner: a sightline is blocked only if it overlaps a wall/monster
  tile for a *positive length*. This lets you peek diagonally past a single wall corner, while a
  wall directly in your row/column still blocks. It's localised to `los.ts` if you want to tune it.
- **Range** is the minimum movement-point cost to a tile (orthogonal neighbour = 2, diagonal = 3),
  computed with monsters treated as transparent (it measures reach, not a walk).
