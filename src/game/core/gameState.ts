import type { GridPos } from "./grid";
import { posKey } from "./grid";
import { GRID_COLS, GRID_ROWS } from "../config";
import type { CombatEvent } from "./events";
import { getClassById } from "../data/classes";
import { makeEnemy } from "../data/enemies";
import type { RoomDef } from "../data/dungeons";
import type { StatBonuses } from "../data/items";

export enum TileType {
  Empty = "empty",
  Obstacle = "obstacle",
}

export enum ActionMode {
  Move = "move",
  Targeting = "targeting",
}

export interface Spell {
  name: string;
  range: number;
  cost: number; // PA cost
  baseDamage: number;
}

export interface CharacterState {
  pos: GridPos;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  moveRange: number; // max PM per turn
  ap: number;        // max PA per turn
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
  defense: number;
  moveRange: number;
  ap: number;
  spells: Spell[];
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
  fightResult: FightResult;
  combatLog: CombatEvent[];
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
      defense: classDef.baseDefense + (bonuses?.defense ?? 0),
      moveRange: classDef.basePm,
      ap: classDef.basePa,
      selected: true,
      spells: [...classDef.spells],
    },
    enemies,
    actionMode: ActionMode.Move,
    activeSpellIndex: null,
    currentTurn: "player",
    turnNumber: 1,
    remainingPM: classDef.basePm,
    remainingPA: classDef.basePa,
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
