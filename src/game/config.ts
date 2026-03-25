/** Global constants for the tactical board */

/** Device pixel ratio (capped at 2 for performance) */
export const DPR = Math.min(window.devicePixelRatio || 1, 2);

export const GRID_COLS = 10;
export const GRID_ROWS = 10;

/** Half-width / half-height of a single isometric tile (in pixels) */
export const TILE_WIDTH = 64 * DPR;
export const TILE_HEIGHT = 32 * DPR;

/** Default movement points per turn */
export const DEFAULT_MOVE_RANGE = 3;

/** Default action points per turn */
export const DEFAULT_AP = 6;

/** Board origin offset so the grid is centered on screen */
export const BOARD_ORIGIN_X = 512 * DPR;
export const BOARD_ORIGIN_Y = 176 * DPR;

/** Tween duration for one tile-step of movement (ms) */
export const MOVE_STEP_DURATION = 120;
