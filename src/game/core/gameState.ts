import type { GridPos } from "./grid";
import { posKey } from "./grid";
import { GRID_COLS, GRID_ROWS, DEFAULT_MOVE_RANGE, DEFAULT_AP } from "../config";
import type { CombatEvent } from "./events";

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

/** Create the initial game state */
export function createInitialState(): GameState {
  const tiles: TileType[][] = Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => TileType.Empty),
  );

  for (const obs of OBSTACLE_POSITIONS) {
    tiles[obs.y][obs.x] = TileType.Obstacle;
  }

  return {
    tiles,
    character: {
      pos: { x: 4, y: 5 },
      hp: 30,
      maxHp: 30,
      attack: 5,
      defense: 2,
      moveRange: DEFAULT_MOVE_RANGE,
      ap: DEFAULT_AP,
      selected: true,
      spells: [{ name: "Frappe", range: 5, cost: 3, baseDamage: 4 }],
    },
    enemies: [
      {
        id: "gobelin",
        name: "Gobelin",
        pos: { x: 7, y: 2 },
        hp: 8,
        maxHp: 8,
        attack: 2,
        defense: 0,
        moveRange: 4,
        ap: DEFAULT_AP,
        spells: [{ name: "Griffe", range: 1, cost: 3, baseDamage: 3 }],
      },
      {
        id: "squelette",
        name: "Squelette",
        pos: { x: 2, y: 1 },
        hp: 12,
        maxHp: 12,
        attack: 3,
        defense: 1,
        moveRange: DEFAULT_MOVE_RANGE,
        ap: DEFAULT_AP,
        spells: [{ name: "Os tranchant", range: 1, cost: 3, baseDamage: 4 }],
      },
      {
        id: "slime",
        name: "Slime",
        pos: { x: 8, y: 7 },
        hp: 20,
        maxHp: 20,
        attack: 2,
        defense: 3,
        moveRange: 2,
        ap: DEFAULT_AP,
        spells: [{ name: "Ecrasement", range: 1, cost: 3, baseDamage: 2 }],
      },
    ],
    actionMode: ActionMode.Move,
    activeSpellIndex: null,
    currentTurn: "player",
    turnNumber: 1,
    remainingPM: DEFAULT_MOVE_RANGE,
    remainingPA: DEFAULT_AP,
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
