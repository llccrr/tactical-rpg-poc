import type { GridPos } from "./grid";
import { posKey } from "./grid";
import { GRID_COLS, GRID_ROWS, DEFAULT_MOVE_RANGE } from "../config";

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
}

export interface CharacterState {
  pos: GridPos;
  moveRange: number;
  selected: boolean;
  spells: Spell[];
}

export interface GameState {
  tiles: TileType[][];
  character: CharacterState;
  actionMode: ActionMode;
  activeSpellIndex: number | null;
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
      moveRange: DEFAULT_MOVE_RANGE,
      selected: true,
      spells: [{ name: "Frappe", range: 5 }],
    },
    actionMode: ActionMode.Move,
    activeSpellIndex: null,
  };
}

/** Collect all blocked tile keys (obstacles + character position) */
export function getBlockedSet(state: GameState): Set<string> {
  const blocked = new Set<string>();

  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (state.tiles[y][x] === TileType.Obstacle) {
        blocked.add(posKey({ x, y }));
      }
    }
  }

  // The character's own tile is walkable (it's the origin) but we don't
  // want other entities to share it — for now we skip it since there's
  // only one character.
  return blocked;
}
