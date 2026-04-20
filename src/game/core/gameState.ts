import type { GridPos } from "./grid";
import { posKey } from "./grid";
import { GRID_COLS, GRID_ROWS } from "../config";
import type { CombatEvent } from "./events";
import { getClassById } from "../data/classes";
import { makeEnemy } from "../data/enemies";
import type { RoomDef } from "../data/dungeons";
import type { StatBonuses } from "../data/items";
import type { Element, Resistances } from "../data/elements";
import { makeResistances } from "../data/elements";

export type RageState = "neutral" | "enraged" | "punished";

export type TargetMode = "enemy" | "self" | "line-charge";

export enum TileType {
  Empty = "empty",
  Obstacle = "obstacle",
}

export enum ActionMode {
  Move = "move",
  Targeting = "targeting",
}

/**
 * D\u00e9finition d'un sort. Les d\u00e9g\u00e2ts sont exprim\u00e9s en pourcentage de
 * WEAPON_BASE_DAMAGE (spec : arme = 10). L'\u00e9l\u00e9ment et le type (direct /
 * indirect) sont obligatoires ; les sorts indirects (DoT, stacks) ne g\u00e9n\u00e8rent
 * pas de PS et ne d\u00e9clenchent pas Rage.
 */
export interface Spell {
  /** Identifiant stable pour cooldowns / uses par tour. */
  id?: string;
  name: string;
  range: number;
  cost: number; // PA cost
  /** PF (Points de Fonction) cost. */
  pfCost?: number;
  /** PS (Points de Sang) cost. */
  psCost?: number;
  /** PP (Points de Placement) cost. */
  ppCost?: number;
  /** Pourcentage de d\u00e9g\u00e2ts d'arme (100 = 1\u00d7 l'arme = 10 d\u00e9g\u00e2ts bruts). */
  damagePercent: number;
  element: Element;
  damageType?: "direct" | "indirect";
  rangeMin?: number;
  description?: string;

  /** Palier de cooldown (spec Edouard : 0/1/2/3 tours). */
  cooldown?: 0 | 1 | 2 | 3;
  /** Limite d'utilisations par tour (ex : Coup Gratuit = 1/tour). */
  usesPerTurn?: number;

  /** Mode de ciblage. enemy = cible ennemie, self = soi-m\u00eame, line-charge = charge en ligne droite. */
  targetMode?: TargetMode;

  /** % des HP actuels sacrifi\u00e9s \u00e0 l'utilisation (Sacrifice de Chair, Surmenage). */
  selfHarmPercent?: number;
  /** PP gagn\u00e9s \u00e0 l'utilisation (Sacrifice de Chair). */
  gainsPm?: number;
  /** Bonus plat de d\u00e9g\u00e2ts finaux sur la prochaine attaque (Surmenage). */
  nextAttackFlat?: number;
  /** Bonus en % sur la prochaine attaque (Fr\u00e9n\u00e9sie). */
  nextAttackPercent?: number;
  /** Active la Rage imm\u00e9diatement (Fr\u00e9n\u00e9sie). */
  activatesRage?: boolean;

  /** Pouss\u00e9e en cases dans le sens attaquant \u2192 cible (Intimidation). */
  pushDistance?: number;
  /** Bonus en % par case travers\u00e9e (Charge). */
  distanceBonusPercent?: number;

  /** % de r\u00e9sistance tous \u00e9l\u00e9ments pendant X tours (R\u00e9sistance Brutale). */
  resistBuffPercent?: number;
  resistBuffTurns?: number;

  /** Bonus de d\u00e9g\u00e2ts sur cible basse HP (Ex\u00e9cution). */
  executionBonus?: boolean;

  /** Applique des stacks \u00e9l\u00e9mentaires sur la cible touch\u00e9e (Entaille). */
  applyStacks?: { element: Element; count: number };
}

export interface CharacterState {
  pos: GridPos;
  hp: number;
  maxHp: number;
  attack: number;
  /** R\u00e9sistances par \u00e9l\u00e9ment (0..0.7). Appliqu\u00e9es en \u00e9tape 5 du calcul. */
  resistances: Resistances;
  /** PP gained at the start of each player turn (spec : 4) */
  moveRange: number;
  /** PA gained at the start of each player turn (spec : 1) */
  ap: number;
  /** PF gained at the start of each player turn (spec : 1) */
  pf: number;
  /** PS cap (spec : 10) */
  psMax: number;
  selected: boolean;
  spells: Spell[];

  /** La classe poss\u00e8de le passif Rage (Barbare). */
  hasRagePassive: boolean;
  /** \u00c9tat courant de Rage pour ce tour. neutral = pas de modificateur. */
  rageState: RageState;
  /** Vrai si le personnage a inflig\u00e9 au moins 1 d\u00e9g\u00e2t direct pendant ce tour. */
  didDamageThisTurn: boolean;

  /** Bonus plat sur les d\u00e9g\u00e2ts finaux de la prochaine attaque (Surmenage). */
  nextAttackFlat: number;
  /** Bonus en % sur les d\u00e9g\u00e2ts finaux de la prochaine attaque (Fr\u00e9n\u00e9sie). */
  nextAttackPercent: number;

  /** Bonus temporaire de r\u00e9sistance tous \u00e9l\u00e9ments (R\u00e9sistance Brutale). */
  resistBuffPercent: number;
  /** Nb de tours restants pour le resistBuff (0 = pas de buff). */
  resistBuffTurns: number;

  /** Cooldowns en cours par spell id (tours restants). */
  cooldowns: Record<string, number>;
  /** Utilisations restantes par tour par spell id. */
  spellUsesRemaining: Record<string, number>;
}

export interface EnemyState {
  id: string;
  name: string;
  pos: GridPos;
  hp: number;
  maxHp: number;
  attack: number;
  /** R\u00e9sistances par \u00e9l\u00e9ment (0..0.7). */
  resistances: Resistances;
  moveRange: number;
  ap: number;
  spells: Spell[];
  behavior: "melee" | "ranged" | "tank" | "boss" | "dummy";
}

export type FightResult = "ongoing" | "victory" | "defeat";

export interface GameState {
  tiles: TileType[][];
  character: CharacterState;
  enemies: EnemyState[];
  actionMode: ActionMode;
  activeSpellIndex: number | null;
  currentTurn: "player" | "enemy";
  turnNumber: number;
  remainingPM: number;
  remainingPA: number;
  remainingPF: number;
  remainingPS: number;
  fightResult: FightResult;
  combatLog: CombatEvent[];
  /** Currently hovered enemy id (set by BoardScene pointer events) */
  hoveredEnemyId?: string | null;
  /** Stacks \u00e9l\u00e9mentaires appliqu\u00e9s sur chaque cible (ennemi). */
  targetStacks: Record<string, Partial<Record<Element, number>>>;
}

/** Config for a single dungeon room — overrides default enemies and optionally player HP */
export interface RoomConfig {
  room: RoomDef;
  /** If provided, player starts with this HP instead of max */
  playerHp?: number;
}

/** Predefined obstacle positions for the POC */
const OBSTACLE_POSITIONS: GridPos[] = [
  { x: 3, y: 2 },
  { x: 3, y: 3 },
  { x: 4, y: 3 },
  { x: 6, y: 5 },
  { x: 7, y: 5 },
  { x: 7, y: 6 },
  { x: 5, y: 8 },
  { x: 2, y: 7 },
  { x: 1, y: 4 },
];

/** Create the initial game state based on chosen class and optional room config */
export function createInitialState(classId: string, roomConfig?: RoomConfig, bonuses?: StatBonuses): GameState {
  const classDef = getClassById(classId);
  if (!classDef) throw new Error(`Unknown class: ${classId}`);

  const tiles: TileType[][] = Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => TileType.Empty),
  );

  for (const obs of OBSTACLE_POSITIONS) {
    tiles[obs.y][obs.x] = TileType.Obstacle;
  }

  const maxHp = classDef.baseHp + (bonuses?.hp ?? 0);
  const startHp = roomConfig?.playerHp ?? maxHp;

  const enemies = roomConfig
    ? roomConfig.room.enemies.map((e, i) => makeEnemy(e.defId, e.pos, String(i)))
    : [
        makeEnemy("gobelin", { x: 7, y: 2 }, "0"),
        makeEnemy("squelette", { x: 2, y: 1 }, "1"),
        makeEnemy("slime", { x: 8, y: 7 }, "2"),
      ];

  const spells = classDef.spells.map((s) => ({ ...s }));
  const spellUsesRemaining: Record<string, number> = {};
  for (const s of spells) {
    if (s.id && s.usesPerTurn != null) {
      spellUsesRemaining[s.id] = s.usesPerTurn;
    }
  }

  return {
    tiles,
    character: {
      pos: { x: 4, y: 5 },
      hp: startHp,
      maxHp,
      attack: classDef.baseAttack + (bonuses?.attack ?? 0),
      resistances: makeResistances({
        ...classDef.resistances,
        ...bonuses?.resistances,
      }),
      moveRange: classDef.basePm,
      ap: classDef.basePa,
      pf: classDef.basePf,
      psMax: classDef.basePsMax,
      selected: true,
      spells,
      hasRagePassive: classDef.hasRagePassive ?? false,
      rageState: "neutral",
      didDamageThisTurn: false,
      nextAttackFlat: 0,
      nextAttackPercent: 0,
      resistBuffPercent: 0,
      resistBuffTurns: 0,
      cooldowns: {},
      spellUsesRemaining,
    },
    enemies,
    actionMode: ActionMode.Move,
    activeSpellIndex: null,
    currentTurn: "player",
    turnNumber: 1,
    // Turn 1 : on applique directement le gain de d\u00e9but de tour
    remainingPM: classDef.basePm,
    remainingPA: classDef.basePa,
    remainingPF: classDef.basePf,
    remainingPS: 0,
    fightResult: "ongoing",
    combatLog: [],
    targetStacks: {},
  };
}

/** Collect all blocked tile keys (obstacles + enemy positions) */
export function getBlockedSet(state: GameState): Set<string> {
  const blocked = new Set<string>();

  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (state.tiles[y][x] === TileType.Obstacle) {
        blocked.add(posKey({ x, y }));
      }
    }
  }

  for (const enemy of state.enemies) {
    blocked.add(posKey(enemy.pos));
  }

  return blocked;
}
