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
  name: string;
  range: number;
  cost: number; // PA cost
  /** Pourcentage de d\u00e9g\u00e2ts d'arme (100 = 1\u00d7 l'arme = 10 d\u00e9g\u00e2ts bruts). */
  damagePercent: number;
  element: Element;
  damageType?: "direct" | "indirect";
  rangeMin?: number;
  description?: string;
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
  behavior: "melee" | "ranged" | "tank" | "boss";
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
      spells: [...classDef.spells],
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
