import { GRID_COLS, GRID_ROWS } from "../config";

export interface GridPos {
  x: number;
  y: number;
}

/** Check whether a position is inside the grid bounds */
export function isInBounds(pos: GridPos): boolean {
  return pos.x >= 0 && pos.x < GRID_COLS && pos.y >= 0 && pos.y < GRID_ROWS;
}

/** Return orthogonal neighbours (no diagonals — tactical RPG style) */
export function getNeighbours(pos: GridPos): GridPos[] {
  const dirs: GridPos[] = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ];
  return dirs
    .map((d) => ({ x: pos.x + d.x, y: pos.y + d.y }))
    .filter(isInBounds);
}

/** Manhattan distance */
export function manhattan(a: GridPos, b: GridPos): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/** Unique string key for a grid position — useful for Sets / Maps */
export function posKey(pos: GridPos): string {
  return `${pos.x},${pos.y}`;
}

/** Parse a posKey back into a GridPos */
export function parseKey(key: string): GridPos {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}
