import type { LogEntry } from '../engine/types'

// All user-facing copy, in every supported language. English is the source of
// truth: its object literal defines the `Messages` shape, and every other
// language is typed as `Messages`, so a missing or mistyped key is a compile
// error. Dynamic strings are plain functions of their params — interpolation
// stays in the language that owns the wording.

export type Lang = 'en' | 'es'

/** Display order of the supported languages (drives the settings picker). */
export const LANGS: readonly Lang[] = ['en', 'es']

/** Each language's name in its own tongue (autonym) — never translated. */
export const LANG_LABELS: Record<Lang, string> = {
  en: 'English',
  es: 'Español',
}

const en = {
  app: {
    // Proper name of the game — intentionally the same across languages.
    title: 'One-Card Dungeon',
  },

  classSelect: {
    lede:
      'Descend through 12 increasingly deadly levels to claim the Sceptre of MGuf-yn. Each turn, ' +
      'roll three dice and assign them to your Speed, Attack and Defense, then move and strike. ' +
      'Choose your class to begin.',
    enter: 'Enter the Dungeon →',
    banner:
      "Single-player · You control the hero (green die); monsters (red dice) are AI-controlled. A " +
      "die's number is its current Health.",
    modeLabel: 'Game mode',
    modeClassic: 'Classic',
    modeExpansion: "M'Guf-yn Returns",
    modeClassicHint: 'The original 12-level campaign — four classes, no chests, no bosses.',
    modeExpansionHint:
      'Adds four new classes, Treasure Chests, and an optional 12-sided boss on levels 3, 6, 9 and 12.',
    gotoClass: (name: string) => `Show ${name}`,
  },

  classes: {
    paladin: {
      name: 'Paladin',
      blurb: 'Steadfast holy defender.',
      ability: 'Once per level, keep one energy die from last turn instead of rerolling it.',
    },
    barbarian: {
      name: 'Barbarian',
      blurb: 'Reckless, furious brawler.',
      ability: 'Once per turn, reroll all energy dice when at 1 Health.',
    },
    ranger: {
      name: 'Ranger',
      blurb: 'Patient, deadly marksman.',
      ability: 'Once per level, assign a die to Range instead of Movement.',
    },
    wizard: {
      name: 'Wizard',
      blurb: 'Arcane scholar of the dungeon.',
      ability: 'Once per level, reroll all energy dice.',
    },
    necromancer: {
      name: 'Necromancer',
      blurb: 'Trades life for death.',
      ability: 'Once per level, lose 1 Health to deal 1 damage to an enemy in Range and sight.',
    },
    cleric: {
      name: 'Cleric',
      blurb: 'Blessed by fortune.',
      ability: 'When you roll triples (e.g. 3-3-3), raise each die by 2 (max 6).',
    },
    knight: {
      name: 'Knight',
      blurb: 'Master of focused force.',
      ability: 'Once per level, stack two energy dice on a single skill.',
    },
    rogue: {
      name: 'Rogue',
      blurb: 'Quick hands, sharp edges.',
      ability: 'Once per level, raise every energy die you rolled by 1 (max 6).',
    },
    none: {
      name: 'No Class',
      blurb: 'Just you, three dice, and the dungeon.',
      ability: 'No special ability or bonuses — a pure test of nerve.',
    },
  },

  /** Fallback hero name shown when playing with no class. */
  adventurer: 'Adventurer',

  /** Skill / stat labels — shared by the stat panels, dice slots and rewards. */
  stats: {
    health: 'Health',
    range: 'Range',
    speed: 'Speed',
    attack: 'Attack',
    defense: 'Defense',
    loot: 'Loot',
  },

  statPanel: {
    hint:
      "Move costs 2 (orthogonal) / 3 (diagonal) Speed. Each attack spends the target's Defense in " +
      'Attack points to remove 1 Health.',
  },

  /** Treasure Chest (M'Guf-yn Returns). */
  chest: {
    name: 'Treasure Chest',
    sealedTitle: (v: number) => `Treasure Chest — Defense ${v} (blocks the way until opened)`,
    openTitle: (v: number) => `Open the chest — needs ${v} Attack`,
    openedTitle: (n: number) => `Opened chest — ${n} loot left`,
  },

  /** Monster names, singular and plural. */
  enemy: {
    spider: { one: 'Spider', many: 'Spiders' },
    skeleton: { one: 'Skeleton', many: 'Skeletons' },
    orc: { one: 'Orc', many: 'Orcs' },
    demon: { one: 'Demon', many: 'Demons' },
    lizardTroll: { one: 'Lizard Troll', many: 'Lizard Trolls' },
    skeletonWarrior: { one: 'Skeleton Warrior', many: 'Skeleton Warriors' },
    giantMantis: { one: 'Giant Mantis', many: 'Giant Mantises' },
    mgufyn: { one: "M'Guf-yn", many: "M'Guf-yn" },
  },

  /** Boss arena opt-in (M'Guf-yn Returns). */
  bossChoice: {
    title: (level: number) => `Level ${level}: A boss stirs`,
    hint:
      'Face the boss in its shrunken arena (the far corners collapse), or take the regular path ' +
      'for this level. Your choice.',
    face: 'Face the boss ⚔',
    skip: 'Take the regular path',
  },

  turn: {
    monsterPhase: 'Monster phase',
    monstersReposition: 'The monsters reposition to keep you at range…',
    monstersStrike: 'The monsters strike…',
    yourMove: 'Your move',
    yourMoveHint:
      'Click a green tile to move, or a red monster to attack. Act in any order until your points ' +
      'run out.',
    endTurn: 'End turn ⟶ Monsters',
    energyPhase: 'Energy phase',
    energyHint:
      'Roll three dice and assign one each to Speed, Attack and Defense. Range never takes a die ' +
      '(unless you are a Ranger).',
    rollDice: '🎲 Roll the dice',
    assignDice: 'Assign your dice',
    assignHint: 'Select a die, then click a stat to assign it. Click a filled stat to clear it.',
    confirm: 'Confirm ⟶ Move',
    assignedTo: (slot: string) => `Assigned to ${slot}`,
    clickToSelect: 'Click to select',
    wizardReroll: '↻ Reroll all (Wizard)',
    furyReroll: '💢 Fury reroll (needs 1 HP)',
    unlockRange: '🎯 Unlock Range slot',
    keepDie: '✋ Keep selected die next turn',
    clericBless: '✨ Bless triples (+2)',
    knightDouble: '⚔ Stack two dice on a skill',
    rogueBoost: '🗡 Sharpen all dice (+1)',
    smite: (id: number) => `☠ Smite #${id} (−1 HP)`,
    smiteHint: 'Necromancer: lose 1 Health to deal 1 damage to a target in range.',
    openChestHint: '🧰 Click the chest to open it (needs Attack ≥ its value).',
    lootTitle: (n: number) => `Treasure loot: ${n}`,
    lootHint: 'Pour loot into one skill this turn — you cannot split it across skills.',
    lootClear: 'Clear',
  },

  endOfLevel: {
    title: (n: number) => `Level ${n} cleared!`,
    hint:
      'Rest before descending. Permanently upgrade one skill by +1, or heal back to full Health. ' +
      'You may do only one.',
    plus: (label: string) => `+1 ${label}`,
    healToFull: (health: number, max: number) => `❤️ Heal to full (${health} → ${max})`,
  },

  gameScreen: {
    levelPill: (level: number, enemiesPlural: string) => `Level ${level}/12 · ${enemiesPlural}`,
    aiTag: (difficulty: string) => `${difficulty} AI`,
    settingsButton: '⚙ Settings',
  },

  gameOver: {
    victory: '🏆 Victory!',
    died: '☠️ You Died',
    wonLede: 'You cleared all 12 levels and claimed the Sceptre of MGuf-yn. The village is saved!',
    lostLede: (level: number) =>
      `Your adventure ended on level ${level}. The dungeon claims another hero.`,
    playAgain: 'Play again',
  },

  settings: {
    title: 'Settings',
    aria: 'Settings',
    close: 'Close settings',
    closeButton: 'Close',
    restart: 'Restart game',
    language: 'Language',
    languageHint:
      'Choose the interface language. Defaults to your device language and is saved across games.',
    aiDifficulty: 'Enemy AI difficulty',
    aiHint:
      "Faithful follows the rulebook's kiting behaviour. Aggressive coordinates monsters to " +
      'maximise the damage they deal each turn.',
    expansion: 'Expansion: Treasure Chests',
    expansionOn: 'On',
    expansionOff: 'Off',
    expansionHint:
      "M'Guf-yn Returns: each level spawns a Treasure Chest on the far stairs. Open it like a " +
      'monster for loot — bonus energy you can spend across the level. Takes effect next level.',
    appearance: 'Appearance',
    appearanceHint:
      'Switch between the retro pixel look and a clean modern UI, toggle a light theme, and tune ' +
      'the palette, font, spacing, and ornamentation. Saved across games.',
  },

  difficulty: {
    faithful: 'Faithful',
    aggressive: 'Aggressive',
  },

  // Appearance axis labels + per-option labels, mirroring the data-* tweaks.
  appearance: {
    skin: 'Style',
    mode: 'Theme',
    palette: 'Palette',
    type: 'Pixel font',
    density: 'Density',
    decor: 'Decoration',
    options: {
      skin: { retro: 'Retro', modern: 'Modern' },
      mode: { dark: 'Dark', light: 'Light' },
      palette: { crypt: 'Crypt', classic: 'Classic', torchlit: 'Torchlit' },
      type: { arcade: 'Arcade', bitmap: 'Bitmap', terminal: 'Terminal' },
      density: { cozy: 'Cozy', compact: 'Compact' },
      decor: { minimal: 'Minimal', standard: 'Standard', ornate: 'Ornate' },
    },
  },

  log: {
    heading: 'Log',
    levelStart: (level: number, enemies: string) => `— Level ${level}: ${enemies} —`,
    rolled: (dice: number[]) => `Rolled ${dice.join(', ')}`,
    turnTotals: (speed: number, attack: number, defense: number, range: number) =>
      `Turn totals — SPD ${speed}  ATK ${attack}  DEF ${defense}  RNG ${range}`,
    moved: (x: number, y: number, cost: number) => `Moved to (${x},${y})  [-${cost} Speed]`,
    hit: (enemy: string, id: number, cost: number) => `Hit ${enemy} #${id} (-1 HP)  [-${cost} Attack]`,
    killed: (enemy: string, id: number, cost: number) => `Killed ${enemy} #${id}  [-${cost} Attack]`,
    levelCleared: 'Level cleared!',
    won: 'The dungeon is cleared. You win!',
    monsterAttack: (total: number, defense: number, damage: number) =>
      `Monsters: ${total} Attack vs ${defense} Defense → ${damage} damage`,
    died: 'You have died.',
    wizardReroll: (dice: number[]) => `Wizard rerolls: ${dice.join(', ')}`,
    barbarianReroll: (dice: number[]) => `Barbarian's fury rerolls: ${dice.join(', ')}`,
    rangerUnlock: 'Ranger may assign a die to Range this turn',
    paladinKeep: (value: number) => `Paladin keeps a ${value} for next turn`,
    healed: (health: number) => `Rested and healed to ${health} Health`,
    upgraded: (skill: string, value: number) => `Upgraded ${skill} to ${value}`,
    chestAppears: (value: number) => `A Treasure Chest (Defense ${value}) guards the far stairs`,
    chestOpened: (value: number) => `Opened the chest — ${value} loot points to spend`,
    chestSpend: (skill: string, amount: number, remaining: number) =>
      `Spent ${amount} loot on ${skill} (${remaining} left)`,
    necroSmite: (enemy: string, id: number, killed: boolean) =>
      killed
        ? `Necromancer smites ${enemy} #${id} dead (-1 HP to you)`
        : `Necromancer smites ${enemy} #${id} (-1 HP each)`,
    clericBless: (dice: number[]) => `Cleric's blessing: dice become ${dice.join(', ')}`,
    knightDouble: "Knight may stack two dice on one skill this turn",
    rogueBoost: (dice: number[]) => `Rogue sharpens the dice to ${dice.join(', ')}`,
    bossEntered: (enemy: string) => `A boss bars the way: ${enemy} (12-sided)!`,
    bossSkipped: 'You take the regular path, leaving the boss behind',
  },
}

export type Messages = typeof en

const es: Messages = {
  app: {
    title: 'One-Card Dungeon',
  },

  classSelect: {
    lede:
      'Desciende por 12 niveles cada vez más mortíferos para reclamar el Cetro de MGuf-yn. Cada ' +
      'turno, tira tres dados y asígnalos a tu Velocidad, Ataque y Defensa; luego muévete y ataca. ' +
      'Elige tu clase para empezar.',
    enter: 'Entra en la mazmorra →',
    banner:
      'Un jugador · Tú controlas al héroe (dado verde); los monstruos (dados rojos) los controla ' +
      'la IA. El número de un dado es su Salud actual.',
    modeLabel: 'Modo de juego',
    modeClassic: 'Clásico',
    modeExpansion: "M'Guf-yn Returns",
    modeClassicHint: 'La campaña original de 12 niveles: cuatro clases, sin cofres ni jefes.',
    modeExpansionHint:
      'Añade cuatro clases nuevas, cofres del tesoro y un jefe opcional de 12 caras en los niveles 3, 6, 9 y 12.',
    gotoClass: (name: string) => `Mostrar ${name}`,
  },

  classes: {
    paladin: {
      name: 'Paladín',
      blurb: 'Defensor sagrado e inquebrantable.',
      ability:
        'Una vez por nivel, conserva un dado de energía del turno anterior en lugar de volver a ' +
        'tirarlo.',
    },
    barbarian: {
      name: 'Bárbaro',
      blurb: 'Luchador temerario y furioso.',
      ability:
        'Una vez por turno, vuelve a tirar todos los dados de energía cuando tienes 1 de Salud.',
    },
    ranger: {
      name: 'Explorador',
      blurb: 'Tirador paciente y letal.',
      ability: 'Una vez por nivel, asigna un dado a Alcance en lugar de a Movimiento.',
    },
    wizard: {
      name: 'Mago',
      blurb: 'Erudito arcano de la mazmorra.',
      ability: 'Una vez por nivel, vuelve a tirar todos los dados de energía.',
    },
    necromancer: {
      name: 'Nigromante',
      blurb: 'Cambia vida por muerte.',
      ability:
        'Una vez por nivel, pierde 1 de Salud para infligir 1 de daño a un enemigo a Alcance y a la vista.',
    },
    cleric: {
      name: 'Clérigo',
      blurb: 'Bendecido por la fortuna.',
      ability: 'Cuando sacas trío (p. ej. 3-3-3), sube cada dado en 2 (máx. 6).',
    },
    knight: {
      name: 'Caballero',
      blurb: 'Maestro de la fuerza concentrada.',
      ability: 'Una vez por nivel, acumula dos dados de energía en una sola característica.',
    },
    rogue: {
      name: 'Pícaro',
      blurb: 'Manos rápidas, filos afilados.',
      ability: 'Una vez por nivel, sube en 1 cada dado de energía que hayas tirado (máx. 6).',
    },
    none: {
      name: 'Sin clase',
      blurb: 'Solo tú, tres dados y la mazmorra.',
      ability: 'Sin habilidad especial ni bonificaciones: una pura prueba de temple.',
    },
  },

  adventurer: 'Aventurero',

  stats: {
    health: 'Salud',
    range: 'Alcance',
    speed: 'Velocidad',
    attack: 'Ataque',
    defense: 'Defensa',
    loot: 'Botín',
  },

  statPanel: {
    hint:
      'Moverse cuesta 2 (ortogonal) / 3 (diagonal) de Velocidad. Cada ataque gasta la Defensa del ' +
      'objetivo en puntos de Ataque para quitar 1 de Salud.',
  },

  chest: {
    name: 'Cofre del tesoro',
    sealedTitle: (v: number) => `Cofre del tesoro — Defensa ${v} (bloquea el paso hasta abrirlo)`,
    openTitle: (v: number) => `Abre el cofre — necesita ${v} de Ataque`,
    openedTitle: (n: number) => `Cofre abierto — quedan ${n} de botín`,
  },

  enemy: {
    spider: { one: 'Araña', many: 'Arañas' },
    skeleton: { one: 'Esqueleto', many: 'Esqueletos' },
    orc: { one: 'Orco', many: 'Orcos' },
    demon: { one: 'Demonio', many: 'Demonios' },
    lizardTroll: { one: 'Trol Lagarto', many: 'Troles Lagarto' },
    skeletonWarrior: { one: 'Esqueleto Guerrero', many: 'Esqueletos Guerreros' },
    giantMantis: { one: 'Mantis Gigante', many: 'Mantis Gigantes' },
    mgufyn: { one: "M'Guf-yn", many: "M'Guf-yn" },
  },

  bossChoice: {
    title: (level: number) => `Nivel ${level}: un jefe acecha`,
    hint:
      'Enfréntate al jefe en su arena reducida (las esquinas lejanas se hunden) o toma el camino ' +
      'normal de este nivel. Tú decides.',
    face: 'Enfrentar al jefe ⚔',
    skip: 'Tomar el camino normal',
  },

  turn: {
    monsterPhase: 'Fase de monstruos',
    monstersReposition: 'Los monstruos se reposicionan para mantenerte a distancia…',
    monstersStrike: 'Los monstruos atacan…',
    yourMove: 'Tu turno',
    yourMoveHint:
      'Haz clic en una casilla verde para moverte, o en un monstruo rojo para atacar. Actúa en ' +
      'cualquier orden hasta que se agoten tus puntos.',
    endTurn: 'Terminar turno ⟶ Monstruos',
    energyPhase: 'Fase de energía',
    energyHint:
      'Tira tres dados y asigna uno a Velocidad, Ataque y Defensa. Alcance nunca recibe un dado (a ' +
      'menos que seas Explorador).',
    rollDice: '🎲 Tira los dados',
    assignDice: 'Asigna tus dados',
    assignHint:
      'Selecciona un dado y luego haz clic en una característica para asignarlo. Haz clic en una ' +
      'característica ocupada para vaciarla.',
    confirm: 'Confirmar ⟶ Mover',
    assignedTo: (slot: string) => `Asignado a ${slot}`,
    clickToSelect: 'Haz clic para seleccionar',
    wizardReroll: '↻ Volver a tirar todo (Mago)',
    furyReroll: '💢 Tirada de furia (necesita 1 PV)',
    unlockRange: '🎯 Desbloquear casilla de Alcance',
    keepDie: '✋ Conservar el dado para el próximo turno',
    clericBless: '✨ Bendecir el trío (+2)',
    knightDouble: '⚔ Acumular dos dados en una característica',
    rogueBoost: '🗡 Afilar todos los dados (+1)',
    smite: (id: number) => `☠ Castigar n.º${id} (−1 PV)`,
    smiteHint: 'Nigromante: pierde 1 de Salud para infligir 1 de daño a un objetivo a Alcance.',
    openChestHint: '🧰 Haz clic en el cofre para abrirlo (necesita Ataque ≥ su valor).',
    lootTitle: (n: number) => `Botín del tesoro: ${n}`,
    lootHint: 'Vierte el botín en una sola característica este turno: no puedes repartirlo.',
    lootClear: 'Limpiar',
  },

  endOfLevel: {
    title: (n: number) => `¡Nivel ${n} superado!`,
    hint:
      'Descansa antes de descender. Mejora permanentemente una característica en +1, o cúrate ' +
      'hasta la Salud máxima. Solo puedes hacer una cosa.',
    plus: (label: string) => `+1 ${label}`,
    healToFull: (health: number, max: number) => `❤️ Curarse al máximo (${health} → ${max})`,
  },

  gameScreen: {
    levelPill: (level: number, enemiesPlural: string) => `Nivel ${level}/12 · ${enemiesPlural}`,
    aiTag: (difficulty: string) => `IA ${difficulty}`,
    settingsButton: '⚙ Ajustes',
  },

  gameOver: {
    victory: '🏆 ¡Victoria!',
    died: '☠️ Has muerto',
    wonLede:
      'Has superado los 12 niveles y reclamado el Cetro de MGuf-yn. ¡El pueblo está a salvo!',
    lostLede: (level: number) =>
      `Tu aventura terminó en el nivel ${level}. La mazmorra reclama a otro héroe.`,
    playAgain: 'Jugar de nuevo',
  },

  settings: {
    title: 'Ajustes',
    aria: 'Ajustes',
    close: 'Cerrar ajustes',
    closeButton: 'Cerrar',
    restart: 'Reiniciar partida',
    language: 'Idioma',
    languageHint:
      'Elige el idioma de la interfaz. Se ajusta por defecto al de tu dispositivo y se guarda ' +
      'entre partidas.',
    aiDifficulty: 'Dificultad de la IA enemiga',
    aiHint:
      'Fiel sigue el comportamiento de pateo del reglamento. Agresivo coordina a los monstruos ' +
      'para maximizar el daño que infligen cada turno.',
    expansion: 'Expansión: cofres del tesoro',
    expansionOn: 'Sí',
    expansionOff: 'No',
    expansionHint:
      'M\'Guf-yn Returns: cada nivel coloca un cofre del tesoro en las escaleras opuestas. Ábrelo ' +
      'como a un monstruo para obtener botín: energía extra que puedes gastar durante el nivel. Se ' +
      'aplica en el próximo nivel.',
    appearance: 'Apariencia',
    appearanceHint:
      'Cambia entre el aspecto retro de píxeles y una interfaz moderna y limpia, activa un tema ' +
      'claro y ajusta la paleta, la fuente, el espaciado y la ornamentación. Se guarda entre ' +
      'partidas.',
  },

  difficulty: {
    faithful: 'Fiel',
    aggressive: 'Agresivo',
  },

  appearance: {
    skin: 'Estilo',
    mode: 'Tema',
    palette: 'Paleta',
    type: 'Fuente de píxeles',
    density: 'Densidad',
    decor: 'Decoración',
    options: {
      skin: { retro: 'Retro', modern: 'Moderno' },
      mode: { dark: 'Oscuro', light: 'Claro' },
      palette: { crypt: 'Cripta', classic: 'Clásica', torchlit: 'Antorchas' },
      type: { arcade: 'Arcade', bitmap: 'Bitmap', terminal: 'Terminal' },
      density: { cozy: 'Cómoda', compact: 'Compacta' },
      decor: { minimal: 'Mínima', standard: 'Estándar', ornate: 'Recargada' },
    },
  },

  log: {
    heading: 'Registro',
    levelStart: (level: number, enemies: string) => `— Nivel ${level}: ${enemies} —`,
    rolled: (dice: number[]) => `Tirada: ${dice.join(', ')}`,
    turnTotals: (speed: number, attack: number, defense: number, range: number) =>
      `Totales del turno — VEL ${speed}  ATQ ${attack}  DEF ${defense}  ALC ${range}`,
    moved: (x: number, y: number, cost: number) => `Movido a (${x},${y})  [-${cost} Velocidad]`,
    hit: (enemy: string, id: number, cost: number) =>
      `Golpeas a ${enemy} n.º${id} (-1 PV)  [-${cost} Ataque]`,
    killed: (enemy: string, id: number, cost: number) =>
      `Eliminas a ${enemy} n.º${id}  [-${cost} Ataque]`,
    levelCleared: '¡Nivel superado!',
    won: 'La mazmorra está despejada. ¡Ganaste!',
    monsterAttack: (total: number, defense: number, damage: number) =>
      `Monstruos: ${total} Ataque vs ${defense} Defensa → ${damage} de daño`,
    died: 'Has muerto.',
    wizardReroll: (dice: number[]) => `El Mago vuelve a tirar: ${dice.join(', ')}`,
    barbarianReroll: (dice: number[]) => `La furia del Bárbaro vuelve a tirar: ${dice.join(', ')}`,
    rangerUnlock: 'El Explorador puede asignar un dado a Alcance este turno',
    paladinKeep: (value: number) => `El Paladín conserva un ${value} para el próximo turno`,
    healed: (health: number) => `Descansas y te curas a ${health} de Salud`,
    upgraded: (skill: string, value: number) => `${skill} mejorado a ${value}`,
    chestAppears: (value: number) => `Un cofre del tesoro (Defensa ${value}) custodia las escaleras opuestas`,
    chestOpened: (value: number) => `Abres el cofre: ${value} puntos de botín para gastar`,
    chestSpend: (skill: string, amount: number, remaining: number) =>
      `Gastas ${amount} de botín en ${skill} (quedan ${remaining})`,
    necroSmite: (enemy: string, id: number, killed: boolean) =>
      killed
        ? `El Nigromante fulmina a ${enemy} n.º${id} (-1 PV para ti)`
        : `El Nigromante castiga a ${enemy} n.º${id} (-1 PV cada uno)`,
    clericBless: (dice: number[]) => `Bendición del Clérigo: los dados pasan a ${dice.join(', ')}`,
    knightDouble: 'El Caballero puede acumular dos dados en una característica este turno',
    rogueBoost: (dice: number[]) => `El Pícaro afila los dados a ${dice.join(', ')}`,
    bossEntered: (enemy: string) => `¡Un jefe cierra el paso: ${enemy} (12 caras)!`,
    bossSkipped: 'Tomas el camino normal y dejas atrás al jefe',
  },
}

export const messages: Record<Lang, Messages> = { en, es }

/**
 * Render one structured log entry to a localized string. The mapping from event
 * to wording lives here once (language-agnostic); the wording itself comes from
 * `t`, so switching language re-renders the whole log.
 */
export function formatLog(entry: LogEntry, t: Messages): string {
  switch (entry.t) {
    case 'levelStart':
      return t.log.levelStart(
        entry.level,
        `${entry.count} ${entry.count === 1 ? t.enemy[entry.kind].one : t.enemy[entry.kind].many}`,
      )
    case 'rolled':
      return t.log.rolled(entry.dice)
    case 'turnTotals':
      return t.log.turnTotals(entry.speed, entry.attack, entry.defense, entry.range)
    case 'moved':
      return t.log.moved(entry.x, entry.y, entry.cost)
    case 'hit':
      return t.log.hit(t.enemy[entry.kind].one, entry.id, entry.cost)
    case 'killed':
      return t.log.killed(t.enemy[entry.kind].one, entry.id, entry.cost)
    case 'levelCleared':
      return t.log.levelCleared
    case 'won':
      return t.log.won
    case 'monsterAttack':
      return t.log.monsterAttack(entry.total, entry.defense, entry.damage)
    case 'died':
      return t.log.died
    case 'wizardReroll':
      return t.log.wizardReroll(entry.dice)
    case 'barbarianReroll':
      return t.log.barbarianReroll(entry.dice)
    case 'rangerUnlock':
      return t.log.rangerUnlock
    case 'paladinKeep':
      return t.log.paladinKeep(entry.value)
    case 'healed':
      return t.log.healed(entry.health)
    case 'upgraded':
      return t.log.upgraded(t.stats[entry.skill], entry.value)
    case 'chestAppears':
      return t.log.chestAppears(entry.value)
    case 'chestOpened':
      return t.log.chestOpened(entry.value)
    case 'chestSpend':
      return t.log.chestSpend(t.stats[entry.slot], entry.amount, entry.remaining)
    case 'necroSmite':
      return t.log.necroSmite(t.enemy[entry.kind].one, entry.id, entry.killed)
    case 'clericBless':
      return t.log.clericBless(entry.dice)
    case 'knightDouble':
      return t.log.knightDouble
    case 'rogueBoost':
      return t.log.rogueBoost(entry.dice)
    case 'bossEntered':
      return t.log.bossEntered(t.enemy[entry.kind].one)
    case 'bossSkipped':
      return t.log.bossSkipped
  }
}
