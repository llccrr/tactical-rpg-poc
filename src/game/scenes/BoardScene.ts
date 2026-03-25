import Phaser from "phaser";
import { GRID_COLS, GRID_ROWS, DPR } from "../config";
import { posKey } from "../core/grid";
import type { GridPos } from "../core/grid";
import {
  createInitialState,
  getBlockedSet,
  TileType,
  ActionMode,
  type GameState,
  type RoomConfig,
} from "../core/gameState";
import { computeDamage } from "../core/combat";
import type { StatBonuses } from "../data/items";
import { FightController } from "../core/fightController";
import { CombatEventBus } from "../core/events";
import { decideEnemyMove, decideEnemyAttack, decideEnemyFlee } from "../core/ai";
import { getReachableTiles, findPath } from "../core/pathfinding";
import { Tile } from "../entities/Tile";
import { Character, ENEMY_COLORS } from "../entities/Character";
import { showDamagePopup } from "../entities/DamagePopup";
import { gridToScreen } from "../core/iso";
import { IopLikeCombatEngine, getSpellDef } from "../core/ioplike";

/** Callback shape for pushing state updates to React */
export type OnStateChange = (state: GameState) => void;

export class BoardScene extends Phaser.Scene {
  private state!: GameState;
  private tileMap = new Map<string, Tile>();
  private character!: Character;
  private enemySprites = new Map<string, Character>();
  private reachableKeys = new Set<string>();
  private pathPreviewKeys = new Set<string>();
  private spellRangeKeys = new Set<string>();
  private enemyThreatKeys = new Set<string>();
  private onStateChange?: OnStateChange;
  private hoveredEnemyId: string | null = null;
  private enemyHoverTooltip: Phaser.GameObjects.Container | null = null;

  private fight!: FightController;
  private eventBus!: CombatEventBus;
  private classId = "ioplike";
  private roomConfig?: RoomConfig;
  private equipmentBonuses?: StatBonuses;

  /** IopLike combat engine — only created when classId is "ioplike" */
  private iopEngine: IopLikeCombatEngine | null = null;

  constructor() {
    super({ key: "BoardScene" });
  }

  /** Allow React to subscribe to state changes */
  setOnStateChange(cb: OnStateChange): void {
    this.onStateChange = cb;
  }

  /** Set classId before scene starts */
  setClassId(classId: string): void {
    this.classId = classId;
  }

  /** Set the room config (enemies + optional starting HP) before scene starts or reset */
  setRoomConfig(config: RoomConfig): void {
    this.roomConfig = config;
  }

  /** Set equipment stat bonuses before scene starts */
  setEquipmentBonuses(bonuses: StatBonuses): void {
    this.equipmentBonuses = bonuses;
  }

  /** Return current player HP (useful to persist between rooms) */
  getPlayerHp(): number {
    return this.state?.character?.hp ?? 0;
  }

  /** Start a fight with the given class — called from React */
  startFight(classId: string): void {
    this.classId = classId;
    this.resetBoard();
  }

  create(): void {
    this.initFight();
    this.buildBoard();
    this.character = this.createPlayerCharacter();
    this.createEnemySprites();
    this.showReachable();
    this.setupTargetingCancelInput();
    this.emitState();
  }

  /** Reset board to initial state */
  resetBoard(): void {
    this.tileMap.forEach((t) => t.destroy());
    this.tileMap.clear();
    this.character.destroy();
    this.enemySprites.forEach((s) => s.destroy());
    this.enemySprites.clear();
    this.reachableKeys.clear();
    this.pathPreviewKeys.clear();
    this.spellRangeKeys.clear();
    this.enemyThreatKeys.clear();
    this.hoveredEnemyId = null;
    this.hideEnemyMiniTooltip();
    this.eventBus.clear();

    this.initFight();
    this.buildBoard();
    this.character = this.createPlayerCharacter();
    this.createEnemySprites();
    this.showReachable();
    this.emitState();
  }

  /** Called from React when a spell button is clicked */
  selectSpell(index: number): void {
    if (this.state.fightResult !== "ongoing") return;
    if (!this.fight.isPlayerTurn()) return;
    if (this.character.isMoving) return;

    const spell = this.state.character.spells[index];
    if (!spell) return;

    // Check affordability based on cost type
    if (!this.canAffordSpell(spell)) return;

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
    if (!this.fight.isPlayerTurn()) return;

    this.clearReachable();
    this.clearSpellRange();
    this.state.actionMode = ActionMode.Move;
    this.state.activeSpellIndex = null;

    this.fight.endPlayerTurn();
    this.emitState();

    // Run enemy turns after a short delay
    this.time.delayedCall(500, () => this.runEnemyPhase());
  }

  // ── internal ──────────────────────────────────────────────

  /** Escape or click on empty canvas: exit spell targeting */
  private setupTargetingCancelInput(): void {
    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey?.on("down", () => {
      if (this.state.fightResult !== "ongoing") return;
      if (!this.fight.isPlayerTurn()) return;
      if (this.character.isMoving) return;
      if (this.state.actionMode !== ActionMode.Targeting) return;
      this.switchToMoveMode();
      this.emitState();
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.state.actionMode !== ActionMode.Targeting) return;
      if (this.state.fightResult !== "ongoing") return;
      if (!this.fight.isPlayerTurn()) return;
      if (this.character.isMoving) return;
      if (!pointer.leftButtonDown()) return;

      const hits = this.input.hitTestPointer(pointer);
      if (hits.length > 0) return;

      this.switchToMoveMode();
      this.emitState();
    });
  }

  private initFight(): void {
    this.state = createInitialState(this.classId, this.roomConfig, this.equipmentBonuses);
    this.eventBus = new CombatEventBus();
    this.fight = new FightController(this.state, this.eventBus);

    // Initialize IopLike engine if playing that class
    if (this.classId === "ioplike") {
      this.iopEngine = new IopLikeCombatEngine();
      this.state.ioplikeState = this.iopEngine.getState();
    } else {
      this.iopEngine = null;
    }
  }

  /** Check if the player can afford a spell (handles PA, PM, blood points) */
  private canAffordSpell(spell: { cost: number; bloodPointCost?: number; mpCost?: number; spellDefId?: string }): boolean {
    if (!this.fight.isPlayerTurn()) return false;

    if (this.iopEngine && spell.spellDefId) {
      return this.iopEngine.canAffordSpell(
        spell.spellDefId,
        this.state.remainingPA,
        this.state.remainingPM,
      );
    }

    // Default: check PA
    return this.state.remainingPA >= spell.cost;
  }

  private createPlayerCharacter(): Character {
    const char = new Character(this, this.state.character.pos);
    char.selected = true;
    char.on("pointerdown", () => {
      if (!this.fight.isPlayerTurn()) return;
      if (char.isMoving) return;
      this.switchToMoveMode();
    });
    return char;
  }

  private createEnemySprites(): void {
    for (const enemy of this.state.enemies) {
      const sprite = new Character(this, enemy.pos, ENEMY_COLORS);
      const id = enemy.id;

      sprite.on("pointerover", () => {
        this.hoveredEnemyId = id;
        if (this.state.actionMode !== ActionMode.Targeting) {
          this.showEnemyThreatZone(id);
        }
        this.showEnemyMiniTooltip(id);
        this.emitState();
      });
      sprite.on("pointerout", () => {
        if (this.hoveredEnemyId === id) {
          this.hoveredEnemyId = null;
          this.clearEnemyThreatZone();
          this.hideEnemyMiniTooltip();
          this.emitState();
        }
      });
      sprite.on("pointerdown", () => {
        const e = this.state.enemies.find((en) => en.id === id);
        if (e) this.handleTileClick(e.pos);
      });

      this.enemySprites.set(id, sprite);
    }
  }

  private switchToMoveMode(): void {
    this.clearSpellRange();
    this.state.actionMode = ActionMode.Move;
    this.state.activeSpellIndex = null;

    if (this.fight.canPlayerMove()) {
      this.showReachable();
    }
    this.emitState();
  }

  /** Refresh highlights based on current state */
  private refreshHighlights(): void {
    this.clearReachable();
    this.clearSpellRange();

    if (this.state.actionMode === ActionMode.Targeting) {
      this.showSpellRange();
    } else if (this.fight.canPlayerMove()) {
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
          tile.on("pointerover", () => {
            const useBlueHover = !(
              this.state.actionMode === ActionMode.Move && this.fight.canPlayerMove()
            );
            if (useBlueHover) tile.setHover(true);
            this.updateMovePathPreview({ x, y });
          });
          tile.on("pointerout", () => {
            tile.setHover(false);
            this.clearMovePathPreview();
          });
          tile.on("pointerdown", () => this.handleTileClick({ x, y }));
        }
      }
    }
  }

  private showReachable(): void {
    this.clearReachable();
    if (!this.fight.canPlayerMove()) return;

    const blocked = getBlockedSet(this.state);
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

  /** Preview the BFS shortest path to `dest` while hovering a reachable tile */
  private updateMovePathPreview(dest: GridPos): void {
    this.clearMovePathPreview();
    if (this.state.actionMode !== ActionMode.Move) return;
    if (!this.fight.canPlayerMove()) return;
    if (this.character.isMoving) return;

    const destKey = posKey(dest);
    if (!this.reachableKeys.has(destKey)) return;

    const blocked = getBlockedSet(this.state);
    const path = findPath(this.state.character.pos, dest, blocked);
    if (!path || path.length === 0) return;
    if (path.length > this.state.remainingPM) return;

    for (const step of path) {
      const k = posKey(step);
      this.pathPreviewKeys.add(k);
      this.tileMap.get(k)?.setPathPreview(true);
    }
  }

  private clearMovePathPreview(): void {
    for (const key of this.pathPreviewKeys) {
      this.tileMap.get(key)?.setPathPreview(false);
    }
    this.pathPreviewKeys.clear();
  }

  private clearReachable(): void {
    this.clearMovePathPreview();
    for (const key of this.reachableKeys) {
      this.tileMap.get(key)?.setReachable(false);
    }
    this.reachableKeys.clear();
  }

  private showSpellRange(): void {
    this.clearSpellRange();
    const spell = this.state.character.spells[this.state.activeSpellIndex!];
    if (!spell) return;

    const isMobility = spell.tags?.includes("mobility") || spell.tags?.includes("movementSkill");
    const rangeMin = spell.rangeMin ?? 0;

    // Spell range ignores enemies — only obstacles block line of fire
    const obstaclesOnly = getBlockedSet(this.state);
    for (const enemy of this.state.enemies) {
      obstaclesOnly.delete(posKey(enemy.pos));
    }
    // For mobility spells, also unblock the player's own position isn't an issue
    // but we need to block enemy positions for movement
    const blocked = isMobility ? getBlockedSet(this.state) : obstaclesOnly;

    const inRange = getReachableTiles(
      this.state.character.pos,
      spell.range,
      blocked,
    );

    for (const [key, dist] of inRange.entries()) {
      // Filter by minimum range
      if (rangeMin > 0 && dist < rangeMin) continue;
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

  /** Show the potential movement zone of an enemy on hover */
  private showEnemyThreatZone(enemyId: string): void {
    this.clearEnemyThreatZone();
    const enemy = this.state.enemies.find((e) => e.id === enemyId);
    if (!enemy) return;

    // Build blocked set: obstacles + other enemies + player position
    // but exclude the hovered enemy itself (they move from their spot)
    const blocked = getBlockedSet(this.state);
    blocked.delete(posKey(enemy.pos));
    blocked.add(posKey(this.state.character.pos));

    const reachable = getReachableTiles(enemy.pos, enemy.moveRange, blocked);

    for (const key of reachable.keys()) {
      this.enemyThreatKeys.add(key);
      this.tileMap.get(key)?.setEnemyThreat(true);
    }
  }

  /** Clear enemy threat zone highlight */
  private clearEnemyThreatZone(): void {
    for (const key of this.enemyThreatKeys) {
      this.tileMap.get(key)?.setEnemyThreat(false);
    }
    this.enemyThreatKeys.clear();
  }

  /** Show a mini tooltip (name + HP) above the hovered enemy */
  private showEnemyMiniTooltip(enemyId: string): void {
    this.hideEnemyMiniTooltip();

    const enemy = this.state.enemies.find((e) => e.id === enemyId);
    if (!enemy) return;
    const sprite = this.enemySprites.get(enemyId);
    if (!sprite) return;

    const textStyle = {
      fontFamily: "monospace",
      fontSize: `${11 * DPR}px`,
      fontStyle: "bold" as const,
      color: "#f0f0f0",
    };
    const padBlock = { top: 3 * DPR, bottom: 3 * DPR } as const;

    const nameText = this.add.text(0, 0, `${enemy.name} | `, {
      ...textStyle,
      padding: { ...padBlock, left: 8 * DPR, right: 0 },
    });
    const hpText = this.add.text(0, 0, `${enemy.hp}/${enemy.maxHp}`, {
      ...textStyle,
      padding: { ...padBlock, left: 0, right: 8 * DPR },
    });

    const heart = this.add.text(0, 0, "❤", {
      fontFamily: "monospace",
      fontSize: `${12 * DPR}px`,
      color: "#ef4444",
    });

    const gapAfterName = 3 * DPR;
    const gapBeforeHp = 2 * DPR;
    const padX = 2 * DPR;
    const totalW =
      padX +
      nameText.width +
      gapAfterName +
      heart.width +
      gapBeforeHp +
      hpText.width +
      padX;
    const totalH = Math.max(nameText.height, heart.height, hpText.height);
    const centerY = -totalH / 2;

    nameText.setOrigin(0.5, 0.5);
    heart.setOrigin(0.5, 0.5);
    hpText.setOrigin(0.5, 0.5);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0c0c14, 0.9);
    bg.fillRoundedRect(-totalW / 2 - 2, -totalH - 2, totalW + 4, totalH + 4, 4 * DPR);
    bg.lineStyle(1, 0x2a3050, 1);
    bg.strokeRoundedRect(-totalW / 2 - 2, -totalH - 2, totalW + 4, totalH + 4, 4 * DPR);

    const left = -totalW / 2 + padX;
    const heartLeft = left + nameText.width + gapAfterName;
    const hpLeft = heartLeft + heart.width + gapBeforeHp;
    nameText.setPosition(left + nameText.width / 2, centerY);
    heart.setPosition(heartLeft + heart.width / 2, centerY);
    hpText.setPosition(hpLeft + hpText.width / 2, centerY);

    const container = this.add.container(sprite.x, sprite.y - 38 * DPR, [bg, nameText, heart, hpText]);
    container.setDepth(50);

    this.enemyHoverTooltip = container;
  }

  /** Remove the mini tooltip */
  private hideEnemyMiniTooltip(): void {
    if (this.enemyHoverTooltip) {
      this.enemyHoverTooltip.destroy();
      this.enemyHoverTooltip = null;
    }
  }

  private async handleTileClick(pos: GridPos): Promise<void> {
    if (this.state.fightResult !== "ongoing") return;
    if (!this.fight.isPlayerTurn()) return;
    if (this.character.isMoving) return;

    const key = posKey(pos);

    // ── Targeting mode: cast spell ──
    if (this.state.actionMode === ActionMode.Targeting) {
      if (!this.spellRangeKeys.has(key)) {
        this.switchToMoveMode();
        this.emitState();
        return;
      }

      const spell = this.state.character.spells[this.state.activeSpellIndex!];
      if (!spell) return;
      if (!this.canAffordSpell(spell)) return;

      const isMobility = spell.tags?.includes("mobility") || spell.tags?.includes("movementSkill");

      // ── IopLike mobility spell (Jump) ──
      if (this.iopEngine && spell.spellDefId && isMobility) {
        await this.handleIopLikeMobility(spell, pos);
        return;
      }

      // ── IopLike combat spell ──
      if (this.iopEngine && spell.spellDefId) {
        const enemy = this.state.enemies.find((e) => posKey(e.pos) === key);
        if (!enemy) return;
        await this.handleIopLikeCast(spell, enemy);
        return;
      }

      // ── Default (non-IopLike) spell cast ──
      const enemy = this.state.enemies.find((e) => posKey(e.pos) === key);
      if (!enemy) return;
      if (!this.fight.canPlayerAfford(spell.cost)) return;

      this.fight.spendPA(spell.cost);

      const { damage, killed } = computeDamage(
        this.state.character,
        enemy,
        spell,
        enemy.hp,
      );
      enemy.hp -= damage;

      this.eventBus.emit({
        type: "damage",
        attackerId: "player",
        targetId: enemy.id,
        damage,
        spell: spell.name,
      });

      const enemySprite = this.enemySprites.get(enemy.id);
      if (enemySprite) {
        const screen = gridToScreen(enemy.pos);
        showDamagePopup(this, screen.x, screen.y, damage);
        enemySprite.playHitReaction(this);
      }

      if (killed) {
        this.eventBus.emit({ type: "death", entityId: enemy.id });
        this.killEnemy(enemy.id);
      }

      this.state.actionMode = ActionMode.Move;
      this.state.activeSpellIndex = null;
      this.refreshHighlights();
      this.checkFightEnd();
      this.emitState();
      return;
    }

    // ── Move mode: move to reachable tile ──
    if (!this.fight.canPlayerMove()) return;
    if (!this.reachableKeys.has(key)) return;

    const blocked = getBlockedSet(this.state);
    const path = findPath(this.state.character.pos, pos, blocked);
    if (!path || path.length === 0) return;
    if (path.length > this.state.remainingPM) return;

    this.clearReachable();
    this.emitState();

    await this.character.moveAlongPath(this, path);

    this.fight.spendPM(path.length);
    this.state.character.pos = { ...pos };

    this.refreshHighlights();
    this.emitState();
  }

  // ── IopLike spell handlers ────────────────────────────────

  /** Handle IopLike mobility spell (Jump) */
  private async handleIopLikeMobility(
    spell: { cost: number; name: string; spellDefId?: string },
    targetPos: GridPos,
  ): Promise<void> {
    if (!this.iopEngine || !spell.spellDefId) return;

    // Spend AP
    if (spell.cost > 0) this.fight.spendPA(spell.cost);

    // Run through engine for cost recording / combo detection
    const result = this.iopEngine.castSpell(
      spell.spellDefId,
      this.state.character.attack,
      0, // no defender
      0,
      "",
      this.fight.getRemainingPA(),
    );

    // Teleport player
    this.state.character.pos = { ...targetPos };
    const screen = gridToScreen(targetPos);
    this.character.setPosition(screen.x, screen.y);
    this.character.gridPos = targetPos;
    this.character.syncHpBarPosition();

    this.eventBus.emit({ type: "info", message: `${spell.name} → téléportation` });

    // Apply combo rewards
    this.applyIopLikeRewards(result);

    this.state.actionMode = ActionMode.Move;
    this.state.activeSpellIndex = null;
    this.syncIopLikeState();
    this.refreshHighlights();
    this.emitState();
  }

  /** Handle IopLike combat spell cast on an enemy */
  private async handleIopLikeCast(
    spell: { cost: number; name: string; bloodPointCost?: number; mpCost?: number; spellDefId?: string },
    enemy: { id: string; pos: GridPos; hp: number; maxHp: number; attack: number; defense: number },
  ): Promise<void> {
    if (!this.iopEngine || !spell.spellDefId) return;

    // Spend PA / PM (blood points are spent by the engine)
    if (spell.cost > 0) this.fight.spendPA(spell.cost);
    if (spell.mpCost && spell.mpCost > 0) this.fight.spendPM(spell.mpCost);

    // Run through engine
    const result = this.iopEngine.castSpell(
      spell.spellDefId,
      this.state.character.attack,
      enemy.defense,
      enemy.hp,
      enemy.id,
      this.fight.getRemainingPA(),
    );

    if (!result.success) return;

    // Apply damage
    if (result.damage > 0) {
      enemy.hp -= result.damage;

      this.eventBus.emit({
        type: "damage",
        attackerId: "player",
        targetId: enemy.id,
        damage: result.damage,
        spell: spell.name,
      });

      const enemySprite = this.enemySprites.get(enemy.id);
      if (enemySprite) {
        const screen = gridToScreen(enemy.pos);
        showDamagePopup(this, screen.x, screen.y, result.damage);
        enemySprite.playHitReaction(this);
      }
    }

    // Log effects
    for (const effect of result.effects) {
      this.eventBus.emit({ type: "info", message: effect });
    }

    // Concentration event
    if (result.concentrationGained > 0) {
      const iopState = this.iopEngine.getState();
      this.eventBus.emit({
        type: "concentration",
        entityId: "player",
        amount: result.concentrationGained,
        total: iopState.concentration,
      });
    }

    // Combo event
    if (result.comboTriggered) {
      this.eventBus.emit({
        type: "combo",
        comboName: result.comboTriggered,
        reward: `+${result.comboReward?.ap ?? 0} PA, +${result.comboReward?.concentration ?? 0} Concentration`,
      });
    }

    // Handle pull (Rafale)
    if (result.pullDistance > 0 && !result.killed) {
      this.applyPull(enemy, result.pullDistance);
    }

    // Handle kill
    if (result.killed) {
      this.eventBus.emit({ type: "death", entityId: enemy.id });
      this.killEnemy(enemy.id);
    }

    // Apply rewards (PA from finisher kill or combo)
    this.applyIopLikeRewards(result);

    this.state.actionMode = ActionMode.Move;
    this.state.activeSpellIndex = null;
    this.syncIopLikeState();
    this.refreshHighlights();
    this.checkFightEnd();
    this.emitState();
  }

  /** Apply PA/concentration rewards from engine results */
  private applyIopLikeRewards(result: {
    killed: boolean;
    comboReward: { ap: number; concentration: number } | null;
    effects: string[];
    spellId: string;
  }): void {
    // Finisher AP reward (Super Iop Punch kill)
    if (result.killed) {
      const def = getSpellDef(result.spellId);
      if (def?.effect.isFinisher && def.effect.finisherApReward) {
        this.fight.addPA(def.effect.finisherApReward);
      }
    }

    // Combo PA reward
    if (result.comboReward && result.comboReward.ap > 0) {
      this.fight.addPA(result.comboReward.ap);
    }
  }

  /** Pull an enemy closer to the player */
  private applyPull(
    enemy: { id: string; pos: GridPos },
    distance: number,
  ): void {
    const playerPos = this.state.character.pos;
    const dx = playerPos.x - enemy.pos.x;
    const dy = playerPos.y - enemy.pos.y;

    // Determine pull direction (towards player along the dominant axis)
    let newPos = { ...enemy.pos };
    for (let i = 0; i < distance; i++) {
      const absDx = Math.abs(playerPos.x - newPos.x);
      const absDy = Math.abs(playerPos.y - newPos.y);
      let candidate: GridPos;

      if (absDx >= absDy && dx !== 0) {
        candidate = { x: newPos.x + Math.sign(dx), y: newPos.y };
      } else if (dy !== 0) {
        candidate = { x: newPos.x, y: newPos.y + Math.sign(dy) };
      } else {
        break;
      }

      // Don't pull onto player or obstacles
      const candidateKey = posKey(candidate);
      if (candidateKey === posKey(playerPos)) break;
      if (this.state.tiles[candidate.y]?.[candidate.x] === TileType.Obstacle) break;
      if (this.state.enemies.some((e) => e.id !== enemy.id && posKey(e.pos) === candidateKey)) break;

      newPos = candidate;
    }

    if (posKey(newPos) !== posKey(enemy.pos)) {
      enemy.pos = newPos;
      const sprite = this.enemySprites.get(enemy.id);
      if (sprite) {
        const screen = gridToScreen(newPos);
        sprite.setPosition(screen.x, screen.y);
        sprite.gridPos = newPos;
      }
    }
  }

  /** Sync IopLike engine state to GameState */
  private syncIopLikeState(): void {
    if (this.iopEngine) {
      this.state.ioplikeState = this.iopEngine.getState();
    }
  }

  // ── Enemy phase ──────────────────────────────────────────

  /** Run all enemy turns sequentially */
  private async runEnemyPhase(): Promise<void> {
    const enemyIds = this.fight.getLivingEnemyIds();

    for (const id of enemyIds) {
      const enemy = this.state.enemies.find((e) => e.id === id);
      if (!enemy) continue;

      const sprite = this.enemySprites.get(id);
      if (!sprite) continue;

      this.eventBus.emit({
        type: "turnStart",
        entityId: id,
        turnNumber: this.state.turnNumber,
      });

      const moveDecision = decideEnemyMove(enemy, this.state);
      const pmUsed = moveDecision ? moveDecision.path.length : 0;
      if (moveDecision) {
        await sprite.moveAlongPath(this, moveDecision.path);
        enemy.pos = { ...moveDecision.target };
      }

      const spell = decideEnemyAttack(enemy, this.state.character.pos);
      if (spell) {
        const { damage } = computeDamage(
          enemy,
          this.state.character,
          spell,
          this.state.character.hp,
        );
        this.state.character.hp -= damage;

        this.eventBus.emit({
          type: "damage",
          attackerId: id,
          targetId: "player",
          damage,
          spell: spell.name,
        });

        const playerScreen = gridToScreen(this.state.character.pos);
        showDamagePopup(this, playerScreen.x, playerScreen.y, damage);
        this.character.playHitReaction(this);

        this.checkFightEnd();
        if (this.state.fightResult !== "ongoing") {
          this.emitState();
          return;
        }
      }

      if (enemy.behavior === "ranged" && spell) {
        const remainingPM = enemy.moveRange - pmUsed;
        const fleeDecision = decideEnemyFlee(enemy, this.state, remainingPM);
        if (fleeDecision) {
          await sprite.moveAlongPath(this, fleeDecision.path);
          enemy.pos = { ...fleeDecision.target };
        }
      }

      this.eventBus.emit({ type: "turnEnd", entityId: id });
      this.emitState();
    }

    // Enemy phase done — back to player
    this.fight.endEnemyPhase();

    // IopLike: reset per-turn state (combo, cost history)
    if (this.iopEngine) {
      this.iopEngine.onTurnStart();
      this.syncIopLikeState();
    }

    this.refreshHighlights();
    this.emitState();
  }

  /** Remove a dead enemy from state and scene (no animation) */
  private removeEnemy(id: string): void {
    const index = this.state.enemies.findIndex((e) => e.id === id);
    if (index !== -1) this.state.enemies.splice(index, 1);

    const sprite = this.enemySprites.get(id);
    if (sprite) {
      sprite.destroy();
      this.enemySprites.delete(id);
    }

    if (this.hoveredEnemyId === id) {
      this.hoveredEnemyId = null;
      this.hideEnemyMiniTooltip();
    }
  }

  /** Kill enemy with death animation then remove from state */
  private killEnemy(id: string): void {
    const index = this.state.enemies.findIndex((e) => e.id === id);
    if (index !== -1) this.state.enemies.splice(index, 1);

    const sprite = this.enemySprites.get(id);
    if (sprite) {
      this.enemySprites.delete(id);
      sprite.playDeathAnimation(this);
    }

    if (this.hoveredEnemyId === id) {
      this.hoveredEnemyId = null;
      this.hideEnemyMiniTooltip();
    }
  }

  /** Check if fight is over (victory or defeat) */
  private checkFightEnd(): void {
    if (this.state.character.hp <= 0) {
      this.state.character.hp = 0;
      this.state.fightResult = "defeat";
      this.eventBus.emit({ type: "fightEnd", result: "defeat" });
    } else if (this.state.enemies.length === 0) {
      this.state.fightResult = "victory";
      this.eventBus.emit({ type: "fightEnd", result: "victory" });
    }
  }

  /** Sync all HP bar visuals with current state */
  private syncHpBars(): void {
    this.character.updateHp(this.state.character.hp, this.state.character.maxHp);
    for (const enemy of this.state.enemies) {
      this.enemySprites.get(enemy.id)?.updateHp(enemy.hp, enemy.maxHp);
    }
  }

  private emitState(): void {
    this.syncHpBars();
    this.fight.syncLog();
    if (this.iopEngine) {
      this.state.ioplikeState = this.iopEngine.getState();
    }
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
        spells: [...e.spells],
      })),
      combatLog: [...this.state.combatLog],
      ioplikeState: this.state.ioplikeState ? { ...this.state.ioplikeState } : undefined,
      hoveredEnemyId: this.hoveredEnemyId,
    });
  }
}
