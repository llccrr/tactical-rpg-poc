import Phaser from "phaser";
import { GRID_COLS, GRID_ROWS, DPR } from "../config";
import { posKey, manhattan } from "../core/grid";
import type { GridPos } from "../core/grid";
import {
  createInitialState,
  getBlockedSet,
  TileType,
  ActionMode,
  type GameState,
  type RoomConfig,
  type Spell,
  type EnemyState,
} from "../core/gameState";
import { computeDamage, type AttackModifiers } from "../core/combat";
import type { StatBonuses } from "../data/items";
import { FightController } from "../core/fightController";
import { CombatEventBus } from "../core/events";
import { decideEnemyMove, decideEnemyAttack, decideEnemyFlee } from "../core/ai";
import { getReachableTiles, findPath } from "../core/pathfinding";
import { Tile, TILE_TEX } from "../entities/Tile";
import { getDungeonById, type Biome } from "../data/dungeons";
import { Character } from "../entities/Character";
import { EnemyCharacter, BLOB_TEX_IDLE, BLOB_TEX_WALK, BLOB_TEX_ATTACK, BLOB_TEX_HIT } from "../entities/EnemyCharacter";
import { showDamagePopup } from "../entities/DamagePopup";
import { gridToScreen } from "../core/iso";
import blobRedUrl from "../../assets/sprites/blob_red.png";
import blobRedWalkUrl from "../../assets/sprites/blob_red_walk.png";
import blobRedAttackUrl from "../../assets/sprites/blob_red_attack.png";
import blobRedHitUrl from "../../assets/sprites/blob_red_hit.png";
import tileGrass0Url from "../../assets/sprites/tile_grass_0.png";
import tileGrass1Url from "../../assets/sprites/tile_grass_1.png";
import tileGrass2Url from "../../assets/sprites/tile_grass_2.png";
import tileCrypt0Url from "../../assets/sprites/tile_crypt_0.png";
import tileCrypt1Url from "../../assets/sprites/tile_crypt_1.png";
import tileCrypt2Url from "../../assets/sprites/tile_crypt_2.png";
import tileSwamp0Url from "../../assets/sprites/tile_swamp_0.png";
import tileSwamp1Url from "../../assets/sprites/tile_swamp_1.png";
import tileSwamp2Url from "../../assets/sprites/tile_swamp_2.png";
import tileFortress0Url from "../../assets/sprites/tile_fortress_0.png";
import tileFortress1Url from "../../assets/sprites/tile_fortress_1.png";
import tileFortress2Url from "../../assets/sprites/tile_fortress_2.png";

/** Callback shape for pushing state updates to React */
export type OnStateChange = (state: GameState) => void;

export class BoardScene extends Phaser.Scene {
  private state!: GameState;
  private tileMap = new Map<string, Tile>();
  private character!: Character;
  private enemySprites = new Map<string, EnemyCharacter>();
  private reachableKeys = new Set<string>();
  private pathPreviewKeys = new Set<string>();
  private spellRangeKeys = new Set<string>();
  private enemyThreatKeys = new Set<string>();
  private onStateChange?: OnStateChange;
  private hoveredEnemyId: string | null = null;
  private enemyHoverTooltip: Phaser.GameObjects.Container | null = null;

  private fight!: FightController;
  private eventBus!: CombatEventBus;
  private classId = "bretteur";
  private roomConfig?: RoomConfig;
  private equipmentBonuses?: StatBonuses;
  private dungeonId?: string;

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

  /** Set dungeon ID to determine biome tiles */
  setDungeonId(id: string): void {
    this.dungeonId = id;
  }

  private get biome(): Biome {
    if (this.dungeonId) {
      const dungeon = getDungeonById(this.dungeonId);
      if (dungeon) return dungeon.biome;
    }
    return "grass";
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

  preload(): void {
    this.load.image(BLOB_TEX_IDLE, blobRedUrl);
    this.load.image(BLOB_TEX_WALK, blobRedWalkUrl);
    this.load.image(BLOB_TEX_ATTACK, blobRedAttackUrl);
    this.load.image(BLOB_TEX_HIT, blobRedHitUrl);

    // Grass biome
    this.load.image(TILE_TEX.grass[0], tileGrass0Url);
    this.load.image(TILE_TEX.grass[1], tileGrass1Url);
    this.load.image(TILE_TEX.grass[2], tileGrass2Url);
    // Crypt biome
    this.load.image(TILE_TEX.crypt[0], tileCrypt0Url);
    this.load.image(TILE_TEX.crypt[1], tileCrypt1Url);
    this.load.image(TILE_TEX.crypt[2], tileCrypt2Url);
    // Swamp biome
    this.load.image(TILE_TEX.swamp[0], tileSwamp0Url);
    this.load.image(TILE_TEX.swamp[1], tileSwamp1Url);
    this.load.image(TILE_TEX.swamp[2], tileSwamp2Url);
    // Fortress biome
    this.load.image(TILE_TEX.fortress[0], tileFortress0Url);
    this.load.image(TILE_TEX.fortress[1], tileFortress1Url);
    this.load.image(TILE_TEX.fortress[2], tileFortress2Url);

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

  /** Called from React when a PS conversion button is clicked */
  convertPS(type: "pp" | "pf" | "pa"): void {
    if (this.state.fightResult !== "ongoing") return;
    if (!this.fight.convertPS(type)) return;
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
  }

  private canAffordSpell(spell: Spell): boolean {
    return this.fight.canCastSpell(spell);
  }

  private createPlayerCharacter(): Character {
    const char = new Character(this, this.state.character.pos);
    char.selected = true;
    char.on("pointerdown", () => {
      if (!this.fight.isPlayerTurn()) return;
      if (char.isMoving) return;
      // En mode ciblage avec sort self-cast, clic sur soi → valide le sort
      if (this.state.actionMode === ActionMode.Targeting) {
        const spell = this.state.character.spells[this.state.activeSpellIndex!];
        if (spell?.targetMode === "self") {
          this.handleTileClick(this.state.character.pos);
          return;
        }
      }
      this.switchToMoveMode();
    });
    return char;
  }

  private createEnemySprites(): void {
    for (const enemy of this.state.enemies) {
      const sprite = new EnemyCharacter(this, enemy.pos);
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
        const tile = new Tile(this, { x, y }, tileType, this.biome);
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

    // Sort self-cast : surligne uniquement la case du joueur
    if (spell.targetMode === "self") {
      const selfKey = posKey(this.state.character.pos);
      this.spellRangeKeys.add(selfKey);
      this.tileMap.get(selfKey)?.setSpellRange(true);
      return;
    }

    // Charge : surligne les cases en ligne droite (N/S/E/O) jusqu'à obstacle ou cible
    if (spell.targetMode === "line-charge") {
      this.showChargeRange(spell.range);
      return;
    }

    const rangeMin = spell.rangeMin ?? 0;

    // Spell range ignores enemies — only obstacles block line of fire
    const blocked = getBlockedSet(this.state);
    for (const enemy of this.state.enemies) {
      blocked.delete(posKey(enemy.pos));
    }

    const inRange = getReachableTiles(
      this.state.character.pos,
      spell.range,
      blocked,
    );

    for (const [key, dist] of inRange.entries()) {
      if (rangeMin > 0 && dist < rangeMin) continue;
      this.spellRangeKeys.add(key);
      this.tileMap.get(key)?.setSpellRange(true);
    }
  }

  /**
   * Charge : surligne toutes les cases atteignables en ligne droite (4 directions)
   * jusqu'à un obstacle, une autre cible, ou un ennemi (la cible finale est incluse).
   * La distance traversée détermine le bonus +20% / case.
   */
  private showChargeRange(maxRange: number): void {
    const origin = this.state.character.pos;
    const directions: GridPos[] = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ];

    for (const dir of directions) {
      for (let step = 1; step <= maxRange; step++) {
        const x = origin.x + dir.x * step;
        const y = origin.y + dir.y * step;
        if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) break;

        const key = posKey({ x, y });
        const tile = this.state.tiles[y][x];
        if (tile === TileType.Obstacle) break;

        const enemyHere = this.state.enemies.find((e) => posKey(e.pos) === key);
        if (enemyHere) {
          // Charge impossible sur ennemi adjacent (distance 1 : aucune case traversée).
          if (step >= 2) {
            this.spellRangeKeys.add(key);
            this.tileMap.get(key)?.setSpellRange(true);
          }
          break; // on s'arrête au premier ennemi dans la ligne
        }

        this.spellRangeKeys.add(key);
        this.tileMap.get(key)?.setSpellRange(true);
      }
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

      await this.castSpell(spell, pos);
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

  /** Applique du self-harm en % des HP actuels au personnage. */
  private applySelfHarm(percent: number): void {
    const current = this.state.character.hp;
    const loss = Math.max(1, Math.floor((current * percent) / 100));
    this.state.character.hp = Math.max(0, current - loss);
    this.eventBus.emit({ type: "selfHarm", amount: loss });
    const playerScreen = gridToScreen(this.state.character.pos);
    showDamagePopup(this, playerScreen.x, playerScreen.y, loss);
    this.character.playHitReaction(this);
  }

  /** Dispatch principal de lancement de sort selon targetMode. */
  private async castSpell(spell: Spell, pos: GridPos): Promise<void> {
    const mode = spell.targetMode ?? "enemy";

    if (mode === "self") {
      await this.castSelfSpell(spell);
    } else if (mode === "line-charge") {
      await this.castChargeSpell(spell, pos);
    } else {
      await this.castEnemySpell(spell, pos);
    }

    this.state.actionMode = ActionMode.Move;
    this.state.activeSpellIndex = null;
    this.refreshHighlights();
    this.checkFightEnd();
    this.emitState();
  }

  /** Sort ciblant le joueur lui-même (Sacrifice, Surmenage, Frénésie, Résistance Brutale). */
  private async castSelfSpell(spell: Spell): Promise<void> {
    this.fight.paySpellCosts(spell);
    this.fight.consumeUse(spell);
    this.fight.startCooldown(spell);

    if (spell.selfHarmPercent) {
      this.applySelfHarm(spell.selfHarmPercent);
    }
    if (spell.gainsPm) {
      this.fight.addPM(spell.gainsPm);
      this.eventBus.emit({ type: "info", message: `+${spell.gainsPm} PP (${spell.name})` });
    }
    if (spell.nextAttackFlat) {
      this.fight.addNextAttackFlat(spell.nextAttackFlat);
      this.eventBus.emit({ type: "info", message: `${spell.name} : +${spell.nextAttackFlat} dégâts prochaine attaque` });
    }
    if (spell.nextAttackPercent) {
      this.fight.addNextAttackPercent(spell.nextAttackPercent);
      this.eventBus.emit({ type: "info", message: `${spell.name} : +${spell.nextAttackPercent}% prochaine attaque` });
    }
    if (spell.activatesRage) {
      this.fight.forceEnraged();
      this.eventBus.emit({ type: "info", message: `Rage activée immédiatement !` });
    }
    if (spell.resistBuffPercent && spell.resistBuffTurns) {
      this.fight.applyResistBuff(spell.resistBuffPercent, spell.resistBuffTurns);
      this.eventBus.emit({
        type: "info",
        message: `+${spell.resistBuffPercent}% résistances pour ${spell.resistBuffTurns} tour(s)`,
      });
    }
  }

  /** Charge : déplacement en ligne droite puis attaque sur la cible. */
  private async castChargeSpell(spell: Spell, targetPos: GridPos): Promise<void> {
    const origin = this.state.character.pos;
    const enemy = this.state.enemies.find((e) => posKey(e.pos) === posKey(targetPos));
    if (!enemy) {
      this.eventBus.emit({ type: "info", message: "Charge : cliquez un ennemi en ligne droite." });
      return;
    }

    // Détermine la direction et le nombre de cases traversées (jusqu'à adjacent de la cible).
    const dx = Math.sign(targetPos.x - origin.x);
    const dy = Math.sign(targetPos.y - origin.y);
    if ((dx !== 0 && dy !== 0) || (dx === 0 && dy === 0)) {
      this.eventBus.emit({ type: "info", message: "Charge : cible non alignée en ligne droite." });
      return;
    }

    const totalDist = manhattan(origin, targetPos);
    const traversed = totalDist - 1; // on s'arrête adjacent à la cible
    if (traversed < 1) {
      this.eventBus.emit({ type: "info", message: "Charge impossible : cible adjacente." });
      return;
    }

    // Construit le path case-par-case et vérifie qu'aucune tile n'est bloquée
    const path: GridPos[] = [];
    for (let step = 1; step <= traversed; step++) {
      const next = { x: origin.x + dx * step, y: origin.y + dy * step };
      if (this.state.tiles[next.y][next.x] === TileType.Obstacle) {
        this.eventBus.emit({ type: "info", message: "Charge bloquée par un obstacle." });
        return;
      }
      if (this.state.enemies.some((e) => e.id !== enemy.id && e.pos.x === next.x && e.pos.y === next.y)) {
        this.eventBus.emit({ type: "info", message: "Charge bloquée par un autre ennemi." });
        return;
      }
      path.push(next);
    }

    // Paye les coûts
    this.fight.paySpellCosts(spell);
    this.fight.consumeUse(spell);
    this.fight.startCooldown(spell);

    // Fait avancer le sprite le long du chemin
    await this.character.moveAlongPath(this, path);
    this.state.character.pos = { ...path[path.length - 1] };

    // Calcule et applique les dégâts avec le bonus distance
    const distanceBonus = (spell.distanceBonusPercent ?? 0) * traversed;
    const buffs = this.fight.consumeNextAttackBuffs();
    const modifiers: AttackModifiers = {
      ragePercent: this.fight.getRagePercent(),
      flatBonus: buffs.flat,
      extraPercentBonus: buffs.percent,
      distanceBonusPercent: distanceBonus,
      executionBonus: spell.executionBonus,
    };
    this.applyDirectDamage(spell, enemy, modifiers);
  }

  /** Sort ciblant un ennemi (cas général). */
  private async castEnemySpell(spell: Spell, pos: GridPos): Promise<void> {
    const enemy = this.state.enemies.find((e) => posKey(e.pos) === posKey(pos));
    if (!enemy) return;

    this.fight.paySpellCosts(spell);
    this.fight.consumeUse(spell);
    this.fight.startCooldown(spell);

    const buffs = this.fight.consumeNextAttackBuffs();
    const modifiers: AttackModifiers = {
      ragePercent: this.fight.getRagePercent(),
      flatBonus: buffs.flat,
      extraPercentBonus: buffs.percent,
      executionBonus: spell.executionBonus,
    };

    this.applyDirectDamage(spell, enemy, modifiers);

    // Push (Intimidation) — toujours après les dégâts, même si la cible est morte on skip
    if (spell.pushDistance && enemy.hp > 0) {
      this.pushEnemy(enemy, this.state.character.pos, spell.pushDistance);
    }

    // Applique les stacks (Entaille : 3 stacks de Poison)
    if (spell.applyStacks && enemy.hp > 0) {
      this.fight.addStacks(enemy.id, spell.applyStacks.element, spell.applyStacks.count);
      this.eventBus.emit({
        type: "stacks",
        targetId: enemy.id,
        element: spell.applyStacks.element,
        count: spell.applyStacks.count,
        action: "apply",
      });
    }
  }

  /**
   * Applique les dégâts directs d'un sort sur un ennemi, gère PS, notification Rage,
   * déclenchement des stacks poison (trigger "on-hit"), popup + animation, mort.
   */
  private applyDirectDamage(spell: Spell, enemy: EnemyState, modifiers: AttackModifiers): void {
    const { damage, killed } = computeDamage(
      this.state.character,
      enemy,
      spell,
      enemy.hp,
      enemy.maxHp,
      modifiers,
    );
    enemy.hp -= damage;

    // PS : +1 sur dégâts directs (1x / attaque)
    if (damage > 0 && spell.damageType !== "indirect") {
      this.fight.addPS(1, "inflict");
      this.fight.notifyDirectDamageDealt();
    }

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

    // Trigger Poison (terre) : "à chaque hit" — max 1 fois / événement, spec stacks.
    if (!killed && spell.damageType !== "indirect") {
      this.triggerPoisonOnHit(enemy);
    }

    if (enemy.hp <= 0) {
      this.eventBus.emit({ type: "death", entityId: enemy.id });
      this.fight.clearStacksFor(enemy.id);
      this.killEnemy(enemy.id);
    }
  }

  /** Déclenche les stacks de Poison sur la cible (on-hit). */
  private triggerPoisonOnHit(enemy: EnemyState): void {
    const stacks = this.state.targetStacks[enemy.id]?.terre ?? 0;
    if (stacks <= 0) return;
    const consumed = this.fight.consumeStacks(enemy.id, "terre");
    if (consumed <= 0) return;
    // Formule poison : 2 dégâts par stack consommé (indirect — ne génère pas de PS).
    const poisonDmg = Math.max(1, consumed * 2);
    enemy.hp = Math.max(0, enemy.hp - poisonDmg);

    this.eventBus.emit({
      type: "damage",
      attackerId: "player",
      targetId: enemy.id,
      damage: poisonDmg,
      spell: "Poison (Terre)",
    });
    this.eventBus.emit({
      type: "stacks",
      targetId: enemy.id,
      element: "terre",
      count: consumed,
      action: "tick",
    });

    const enemySprite = this.enemySprites.get(enemy.id);
    if (enemySprite) {
      const screen = gridToScreen(enemy.pos);
      showDamagePopup(this, screen.x, screen.y - 10 * DPR, poisonDmg);
    }

    if (enemy.hp <= 0) {
      this.eventBus.emit({ type: "death", entityId: enemy.id });
      this.fight.clearStacksFor(enemy.id);
      this.killEnemy(enemy.id);
    }
  }

  /** Pousse un ennemi de N cases dans la direction opposée au joueur. */
  private pushEnemy(enemy: EnemyState, from: GridPos, distance: number): void {
    const dx = Math.sign(enemy.pos.x - from.x);
    const dy = Math.sign(enemy.pos.y - from.y);
    // Doit être cardinal strict (X ou Y, pas les deux)
    if ((dx !== 0 && dy !== 0) || (dx === 0 && dy === 0)) {
      this.eventBus.emit({
        type: "info",
        message: `${enemy.name} : push annulé (direction non cardinale)`,
      });
      return;
    }

    let finalPos = { ...enemy.pos };
    let blockedBy: string | null = null;
    let pushedCases = 0;
    for (let step = 1; step <= distance; step++) {
      const next = { x: enemy.pos.x + dx * step, y: enemy.pos.y + dy * step };
      if (next.x < 0 || next.x >= GRID_COLS || next.y < 0 || next.y >= GRID_ROWS) {
        blockedBy = "bord";
        break;
      }
      if (this.state.tiles[next.y][next.x] === TileType.Obstacle) {
        blockedBy = "obstacle";
        break;
      }
      if (this.state.enemies.some((e) => e.id !== enemy.id && e.pos.x === next.x && e.pos.y === next.y)) {
        blockedBy = "un autre ennemi";
        break;
      }
      if (this.state.character.pos.x === next.x && this.state.character.pos.y === next.y) {
        blockedBy = "le joueur";
        break;
      }
      finalPos = next;
      pushedCases = step;
    }

    if (pushedCases === 0) {
      this.eventBus.emit({
        type: "info",
        message: `${enemy.name} n'a pas pu être poussé (${blockedBy ?? "bloqué"})`,
      });
      return;
    }

    this.eventBus.emit({
      type: "info",
      message:
        pushedCases < distance
          ? `${enemy.name} poussé de ${pushedCases} case(s) (${blockedBy})`
          : `${enemy.name} poussé de ${pushedCases} case(s)`,
    });

    const sprite = this.enemySprites.get(enemy.id);

    // Kill la hit-reaction en cours (shake + flash alpha) AVANT le push :
    // sinon son onComplete force un setPosition sur l'ancien x/y capturé
    // au moment du hit, ce qui remet l'ennemi à sa position d'origine et
    // désynchronise état logique ↔ visuel.
    if (sprite) {
      this.tweens.killTweensOf(sprite);
      const oldScreen = gridToScreen(enemy.pos); // encore l'ancienne position
      sprite.setPosition(oldScreen.x, oldScreen.y);
      sprite.alpha = 1;
      sprite.syncHpBarPosition();
    }

    enemy.pos = finalPos;
    if (sprite) {
      const target = gridToScreen(finalPos);
      this.tweens.add({
        targets: sprite,
        x: target.x,
        y: target.y,
        duration: 220,
        ease: "Sine.easeOut",
        onUpdate: () => sprite.syncHpBarPosition(),
        onComplete: () => {
          sprite.gridPos = { ...finalPos };
          sprite.setDepth(100 + finalPos.y * 10);
          sprite.alpha = 1;
        },
      });
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
        // Face toward the player and play attack animation
        sprite.faceToward(this.state.character.pos);
        await sprite.playAttackAnimation(this);

        const { damage } = computeDamage(
          enemy,
          {
            resistances: this.state.character.resistances,
            resistBuffPercent: this.state.character.resistBuffPercent,
          },
          spell,
          this.state.character.hp,
          this.state.character.maxHp,
        );
        this.state.character.hp -= damage;

        // PS : +1 si le joueur subit des d\u00e9g\u00e2ts directs (1x / attaque)
        if (damage > 0) {
          this.fight.addPS(1, "take");
        }

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
      hoveredEnemyId: this.hoveredEnemyId,
    });
  }
}
