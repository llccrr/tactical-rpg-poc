import Phaser from "phaser";
import { GRID_COLS, GRID_ROWS } from "../config";
import { posKey, manhattan } from "../core/grid";
import type { GridPos } from "../core/grid";
import {
  createInitialState,
  getBlockedSet,
  TileType,
  ActionMode,
  type GameState,
  type EnemyState,
} from "../core/gameState";
import { computeDamage } from "../core/combat";
import { TurnManager } from "../core/turnManager";
import { getReachableTiles, findPath } from "../core/pathfinding";
import { Tile } from "../entities/Tile";
import { Character, ENEMY_COLORS } from "../entities/Character";

/** Callback shape for pushing state updates to React */
export type OnStateChange = (state: GameState) => void;

export class BoardScene extends Phaser.Scene {
  private state!: GameState;
  private tileMap = new Map<string, Tile>();
  private character!: Character;
  private enemySprites: Character[] = [];
  private reachableKeys = new Set<string>();
  private spellRangeKeys = new Set<string>();
  private onStateChange?: OnStateChange;
  private hoveredEnemy: number | null = null;

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
    this.character = this.createPlayerCharacter();
    this.createEnemySprites();

    this.showReachable();
    this.emitState();
  }

  /** Reset board to initial state */
  resetBoard(): void {
    this.tileMap.forEach((t) => t.destroy());
    this.tileMap.clear();
    this.character.destroy();
    this.enemySprites.forEach((e) => e.destroy());
    this.enemySprites = [];
    this.reachableKeys.clear();
    this.spellRangeKeys.clear();
    this.hoveredEnemy = null;

    this.state = createInitialState();
    this.buildBoard();
    this.character = this.createPlayerCharacter();
    this.createEnemySprites();
    this.showReachable();
    this.emitState();
  }

  /** Called from React when a spell button is clicked */
  selectSpell(index: number): void {
    if (this.state.fightResult !== "ongoing") return;
    if (!TurnManager.isPlayerTurn(this.state)) return;
    if (this.character.isMoving) return;

    const spell = this.state.character.spells[index];
    if (!spell) return;

    // Not enough PA
    if (!TurnManager.canPlayerAfford(this.state, spell.cost)) return;

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

  /** Called from React when End Turn button is clicked */
  endTurn(): void {
    if (this.state.fightResult !== "ongoing") return;
    if (!TurnManager.isPlayerTurn(this.state)) return;

    this.clearReachable();
    this.clearSpellRange();
    this.state.actionMode = ActionMode.Move;
    this.state.activeSpellIndex = null;

    TurnManager.endPlayerTurn(this.state);
    this.emitState();

    // Run enemy turn after a short delay
    this.time.delayedCall(500, () => this.runEnemyTurn());
  }

  // ── internal ──────────────────────────────────────────────

  private createPlayerCharacter(): Character {
    const char = new Character(this, this.state.character.pos);
    char.selected = true;
    char.on("pointerdown", () => {
      if (!TurnManager.isPlayerTurn(this.state)) return;
      if (char.isMoving) return;
      this.switchToMoveMode();
    });
    return char;
  }

  private createEnemySprites(): void {
    for (let i = 0; i < this.state.enemies.length; i++) {
      const enemy = this.state.enemies[i];
      const sprite = new Character(this, enemy.pos, ENEMY_COLORS);

      sprite.on("pointerover", () => {
        this.hoveredEnemy = i;
        this.emitState();
      });
      sprite.on("pointerout", () => {
        if (this.hoveredEnemy === i) {
          this.hoveredEnemy = null;
          this.emitState();
        }
      });
      sprite.on("pointerdown", () => {
        this.handleTileClick(enemy.pos);
      });

      this.enemySprites.push(sprite);
    }
  }

  private switchToMoveMode(): void {
    this.clearSpellRange();
    this.state.actionMode = ActionMode.Move;
    this.state.activeSpellIndex = null;

    if (TurnManager.canPlayerMove(this.state)) {
      this.showReachable();
    }
    this.emitState();
  }

  /** Refresh highlights based on current state (PM left, action mode, etc.) */
  private refreshHighlights(): void {
    this.clearReachable();
    this.clearSpellRange();

    if (this.state.actionMode === ActionMode.Targeting) {
      this.showSpellRange();
    } else if (TurnManager.canPlayerMove(this.state)) {
      this.showReachable();
    }
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
    if (!TurnManager.canPlayerMove(this.state)) return;

    const blocked = getBlockedSet(this.state);
    // Use remainingPM instead of full moveRange
    const reachable = getReachableTiles(
      this.state.character.pos,
      this.state.remainingPM,
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

    // Spell range ignores enemies — only obstacles block line of fire
    const obstaclesOnly = getBlockedSet(this.state);
    for (const enemy of this.state.enemies) {
      obstaclesOnly.delete(posKey(enemy.pos));
    }
    const inRange = getReachableTiles(
      this.state.character.pos,
      spell.range,
      obstaclesOnly,
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
    if (this.state.fightResult !== "ongoing") return;
    if (!TurnManager.isPlayerTurn(this.state)) return;
    if (this.character.isMoving) return;

    const key = posKey(pos);

    // ── Targeting mode: cast spell on enemy ──
    if (this.state.actionMode === ActionMode.Targeting) {
      if (!this.spellRangeKeys.has(key)) return;

      const enemyIndex = this.state.enemies.findIndex(
        (e) => posKey(e.pos) === key,
      );
      if (enemyIndex === -1) return;

      const spell = this.state.character.spells[this.state.activeSpellIndex!];
      if (!spell) return;
      if (!TurnManager.canPlayerAfford(this.state, spell.cost)) return;

      // Spend PA
      TurnManager.spendPA(this.state, spell.cost);

      // Compute and apply damage
      const enemy = this.state.enemies[enemyIndex];
      const { damage, killed } = computeDamage(
        this.state.character,
        enemy,
        spell,
        enemy.hp,
      );
      enemy.hp -= damage;

      // Flash the enemy to give feedback
      const enemySprite = this.enemySprites[enemyIndex];
      enemySprite.selected = true;
      this.time.delayedCall(200, () => {
        enemySprite.selected = false;
      });

      // Handle enemy death
      if (killed) {
        this.removeEnemy(enemyIndex);
      }

      // Go back to move mode and refresh what's available
      this.state.actionMode = ActionMode.Move;
      this.state.activeSpellIndex = null;
      this.refreshHighlights();
      this.checkFightEnd();
      this.emitState();
      return;
    }

    // ── Move mode: move to reachable tile ──
    if (!TurnManager.canPlayerMove(this.state)) return;
    if (!this.reachableKeys.has(key)) return;

    const blocked = getBlockedSet(this.state);
    const path = findPath(this.state.character.pos, pos, blocked);
    if (!path || path.length === 0) return;

    // Check we have enough PM for this path
    if (path.length > this.state.remainingPM) return;

    // Clear highlights before moving
    this.clearReachable();
    this.emitState();

    // Animate movement
    await this.character.moveAlongPath(this, path);

    // Deduct PM and update position
    TurnManager.spendPM(this.state, path.length);
    this.state.character.pos = { ...pos };

    // Re-show reachable with remaining PM
    this.refreshHighlights();
    this.emitState();
  }

  /** Simple enemy AI: move toward the player, attack if adjacent, then end turn */
  private async runEnemyTurn(): Promise<void> {
    for (let i = 0; i < this.state.enemies.length; i++) {
      const enemy = this.state.enemies[i];
      const sprite = this.enemySprites[i];

      // Build blocked set excluding this enemy so it can move
      const blocked = getBlockedSet(this.state);
      blocked.delete(posKey(enemy.pos));
      // Also block the player position
      blocked.add(posKey(this.state.character.pos));

      // Find reachable tiles for this enemy
      const reachable = getReachableTiles(
        enemy.pos,
        enemy.moveRange,
        blocked,
      );

      // Pick the tile closest to the player
      let bestKey: string | null = null;
      let bestDist = Infinity;
      const playerPos = this.state.character.pos;

      for (const [tileKey] of reachable) {
        const [tx, ty] = tileKey.split(",").map(Number);
        const dist =
          Math.abs(tx - playerPos.x) + Math.abs(ty - playerPos.y);
        if (dist < bestDist) {
          bestDist = dist;
          bestKey = tileKey;
        }
      }

      if (bestKey) {
        const [tx, ty] = bestKey.split(",").map(Number);
        const target: GridPos = { x: tx, y: ty };
        const path = findPath(enemy.pos, target, blocked);

        if (path && path.length > 0) {
          await sprite.moveAlongPath(this, path);
          enemy.pos = { ...target };
        }
      }

      // Attack if adjacent to player (manhattan ≤ 1)
      if (manhattan(enemy.pos, playerPos) <= 1) {
        this.enemyAttack(enemy);
        if (this.state.fightResult !== "ongoing") break;
      }

      this.emitState();
    }

    if (this.state.fightResult !== "ongoing") return;

    // Enemy turn done — back to player with full PM/PA
    TurnManager.endEnemyTurn(this.state);
    this.refreshHighlights();
    this.emitState();
  }

  /** Enemy attacks the player with a basic melee hit */
  private enemyAttack(enemy: EnemyState): void {
    const meleeSpell: import("../core/gameState").Spell = {
      name: "Attaque",
      range: 1,
      cost: 3,
      baseDamage: 3,
    };

    const { damage } = computeDamage(enemy, this.state.character, meleeSpell, this.state.character.hp);
    this.state.character.hp -= damage;

    // Flash player
    this.character.selected = false;
    this.time.delayedCall(200, () => {
      this.character.selected = true;
    });

    this.checkFightEnd();
  }

  /** Remove a dead enemy from state and scene */
  private removeEnemy(index: number): void {
    this.state.enemies.splice(index, 1);
    const sprite = this.enemySprites.splice(index, 1)[0];
    sprite.destroy();
  }

  /** Check if fight is over (victory or defeat) */
  private checkFightEnd(): void {
    if (this.state.character.hp <= 0) {
      this.state.character.hp = 0;
      this.state.fightResult = "defeat";
    } else if (this.state.enemies.length === 0) {
      this.state.fightResult = "victory";
    }
  }

  /** Sync all HP bar visuals with current state */
  private syncHpBars(): void {
    this.character.updateHp(this.state.character.hp, this.state.character.maxHp);
    for (let i = 0; i < this.state.enemies.length; i++) {
      const enemy = this.state.enemies[i];
      this.enemySprites[i]?.updateHp(enemy.hp, enemy.maxHp);
    }
  }

  private emitState(): void {
    this.syncHpBars();
    this.onStateChange?.({
      ...this.state,
      character: {
        ...this.state.character,
        pos: { ...this.state.character.pos },
        spells: [...this.state.character.spells],
      },
      enemies: this.state.enemies.map((e) => ({
        ...e,
        pos: { ...e.pos },
      })),
      hoveredEnemy: this.hoveredEnemy,
    } as GameState & { hoveredEnemy: number | null });
  }
}
