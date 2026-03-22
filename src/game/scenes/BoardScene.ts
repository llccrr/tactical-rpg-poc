import Phaser from "phaser";
import { GRID_COLS, GRID_ROWS } from "../config";
import { posKey } from "../core/grid";
import type { GridPos } from "../core/grid";
import {
  createInitialState,
  getBlockedSet,
  TileType,
  ActionMode,
  type GameState,
} from "../core/gameState";
import { getReachableTiles, findPath } from "../core/pathfinding";
import { Tile } from "../entities/Tile";
import { Character } from "../entities/Character";

/** Callback shape for pushing state updates to React */
export type OnStateChange = (state: GameState) => void;

export class BoardScene extends Phaser.Scene {
  private state!: GameState;
  private tileMap = new Map<string, Tile>();
  private character!: Character;
  private reachableKeys = new Set<string>();
  private spellRangeKeys = new Set<string>();
  private onStateChange?: OnStateChange;

  constructor() {
    super({ key: "BoardScene" });
  }

  /** Allow React to subscribe to state changes */
  setOnStateChange(cb: OnStateChange): void {
    this.onStateChange = cb;
  }

  create(): void {
    this.state = createInitialState();
    this.buildBoard();
    this.character = new Character(this, this.state.character.pos);
    this.character.selected = true;

    // Character click → back to move mode
    this.character.on("pointerdown", () => {
      if (this.character.isMoving) return;
      this.switchToMoveMode();
    });

    // Auto-show movement range
    this.showReachable();
    this.emitState();
  }

  /** Reset board to initial state */
  resetBoard(): void {
    this.tileMap.forEach((t) => t.destroy());
    this.tileMap.clear();
    this.character.destroy();
    this.reachableKeys.clear();
    this.spellRangeKeys.clear();

    this.state = createInitialState();
    this.buildBoard();
    this.character = new Character(this, this.state.character.pos);
    this.character.selected = true;
    this.character.on("pointerdown", () => {
      if (this.character.isMoving) return;
      this.switchToMoveMode();
    });
    this.showReachable();
    this.emitState();
  }

  /** Called from React when a spell button is clicked */
  selectSpell(index: number): void {
    if (this.character.isMoving) return;

    // Toggle: clicking the same spell again goes back to move mode
    if (
      this.state.actionMode === ActionMode.Targeting &&
      this.state.activeSpellIndex === index
    ) {
      this.switchToMoveMode();
      return;
    }

    this.clearReachable();
    this.clearSpellRange();

    this.state.actionMode = ActionMode.Targeting;
    this.state.activeSpellIndex = index;

    this.showSpellRange();
    this.emitState();
  }

  // ── internal ──────────────────────────────────────────────

  private switchToMoveMode(): void {
    this.clearSpellRange();
    this.state.actionMode = ActionMode.Move;
    this.state.activeSpellIndex = null;
    this.showReachable();
    this.emitState();
  }

  private buildBoard(): void {
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const tileType = this.state.tiles[y][x];
        const tile = new Tile(this, { x, y }, tileType);
        this.tileMap.set(posKey({ x, y }), tile);

        if (tileType !== TileType.Obstacle) {
          tile.on("pointerover", () => tile.setHover(true));
          tile.on("pointerout", () => tile.setHover(false));
          tile.on("pointerdown", () => this.handleTileClick({ x, y }));
        }
      }
    }
  }

  private showReachable(): void {
    this.clearReachable();
    const blocked = getBlockedSet(this.state);
    const reachable = getReachableTiles(
      this.state.character.pos,
      this.state.character.moveRange,
      blocked,
    );

    for (const key of reachable.keys()) {
      this.reachableKeys.add(key);
      this.tileMap.get(key)?.setReachable(true);
    }
  }

  private clearReachable(): void {
    for (const key of this.reachableKeys) {
      this.tileMap.get(key)?.setReachable(false);
    }
    this.reachableKeys.clear();
  }

  private showSpellRange(): void {
    this.clearSpellRange();
    const spell = this.state.character.spells[this.state.activeSpellIndex!];
    if (!spell) return;

    const blocked = getBlockedSet(this.state);
    const inRange = getReachableTiles(
      this.state.character.pos,
      spell.range,
      blocked,
    );

    for (const key of inRange.keys()) {
      this.spellRangeKeys.add(key);
      this.tileMap.get(key)?.setSpellRange(true);
    }
  }

  private clearSpellRange(): void {
    for (const key of this.spellRangeKeys) {
      this.tileMap.get(key)?.setSpellRange(false);
    }
    this.spellRangeKeys.clear();
  }

  private async handleTileClick(pos: GridPos): Promise<void> {
    if (this.character.isMoving) return;

    const key = posKey(pos);

    // In targeting mode, clicking a tile in range does nothing yet (no enemies)
    if (this.state.actionMode === ActionMode.Targeting) return;

    // Move mode: only move to reachable tiles
    if (!this.reachableKeys.has(key)) return;

    const blocked = getBlockedSet(this.state);
    const path = findPath(this.state.character.pos, pos, blocked);
    if (!path || path.length === 0) return;

    // Clear highlights before moving
    this.clearReachable();
    this.emitState();

    // Animate movement
    await this.character.moveAlongPath(this, path);

    // Update logical state and re-show movement range
    this.state.character.pos = { ...pos };
    this.showReachable();
    this.emitState();
  }

  private emitState(): void {
    this.onStateChange?.({
      ...this.state,
      character: {
        ...this.state.character,
        pos: { ...this.state.character.pos },
        spells: [...this.state.character.spells],
      },
    });
  }
}
